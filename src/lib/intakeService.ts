import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { resumeQueue } from '@/lib/queue';
import { logAuditEvent } from '@/lib/auditLogger';
import { validateFileMagicBytes, PRIVACY_NOTICE_VERSION } from '@/lib/validation';
import { scanDocumentForMalware } from '@/lib/malwareScan';
import { putObject, buildObjectKey, contentTypeFromKey } from '@/lib/storage';
import { sendRecordedEmail } from '@/lib/emailService';
import { logEvent } from '@/lib/observability';

/**
 * Single candidate-intake pipeline (spec §6.3/§6.4).
 *
 * Both intake routes (`/api/upload`, `/api/jobs/apply`) previously maintained
 * divergent copies of this flow: one stored bytes on the local filesystem,
 * ran only the signature malware subset, and extracted text inside the
 * request (which the worker then extracted again). This module is now the
 * one code path:
 *
 *   validate → full malware scan (fail-closed) → magic bytes → cloud storage
 *   → candidate + consent record → application → resume row (checksum)
 *   → queue (recoverable on outage) → acknowledgement email → audit + notify.
 *
 * Text extraction happens ONLY in the worker (`src/lib/resumeProcessor.ts`),
 * so there is exactly one extraction implementation and no duplicate CPU work
 * in the request path.
 */

export interface IntakeInput {
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  consentGiven: boolean;
  file: { name: string; size: number; type: string; buffer: Buffer } | null;
  /** Correlation id from the request for logs + audit context. */
  requestId?: string;
}

export type IntakeResult =
  | { ok: true; applicationId: string; screeningQueued: boolean; acknowledgementDelivered: boolean }
  | { ok: false; status: number; error: string; applicationId?: string };

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

/** Normalizes a person name for duplicate comparison: case, spacing, punctuation. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function submitApplication(input: IntakeInput): Promise<IntakeResult> {
  const { jobId, firstName, lastName, email, consentGiven, file } = input;

  if (!consentGiven) {
    return { ok: false, status: 400, error: 'Consent to data processing is required' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: 'Invalid email format' };
  }
  if (!file) {
    return { ok: false, status: 400, error: 'Resume file is required' };
  }

  // §6.2: only valid, OPEN requisitions with an APPROVED rubric may receive
  // applications — never an arbitrary jobId, never a DRAFT rubric.
  const job = await prisma.jobRequisition.findFirst({
    where: { id: jobId, status: 'OPEN' },
    include: { rubrics: { orderBy: { version: 'desc' } } },
  });
  if (!job) {
    return { ok: false, status: 404, error: 'This job is not accepting applications' };
  }

  const now = new Date();
  if ((job.opensAt && now < job.opensAt) || (job.closesAt && now > job.closesAt)) {
    return { ok: false, status: 409, error: 'The application window for this position is closed' };
  }

  const approvedRubric = job.rubrics.find((r) => r.status === 'APPROVED');
  if (!approvedRubric) {
    return { ok: false, status: 409, error: 'This position is not yet open for screening' };
  }

  // Format + size validation. Extension is checked against an allow-list;
  // client MIME types are never trusted.
  const extension = file.name.toLowerCase().split('.').pop() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { ok: false, status: 400, error: 'Only PDF, DOCX, TXT, and Markdown resumes are allowed' };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return { ok: false, status: 400, error: 'File size exceeds 5MB limit' };
  }

  // §6.4: full layered malware scan BEFORE storage/processing. Signature layer
  // always runs; with CLAMAV_HOST configured the ClamAV verdict is required
  // too (fail-closed when unreachable).
  const scan = await scanDocumentForMalware(file.buffer);
  if (!scan.clean) {
    await logAuditEvent({
      action: 'MALWARE_SCAN_REJECTED',
      actorId: null,
      organizationId: job.organizationId,
      newValues: { filename: file.name, engine: scan.engine, threats: scan.threats },
    });
    return { ok: false, status: 403, error: 'Upload rejected by security scanner' };
  }

  // Magic-byte validation for container formats — extension is spoofable.
  if (extension === 'pdf' || extension === 'docx') {
    const detectedType = validateFileMagicBytes(file.buffer);
    if (!detectedType) {
      return {
        ok: false,
        status: 400,
        error: 'Invalid file content. The file does not appear to be a valid PDF or DOCX document.',
      };
    }
  }

  // Cloud object storage (private bucket) — resume bytes never persist on the
  // host machine. Unique, sanitized object key (§6.4).
  const stored = await putObject(file.buffer, buildObjectKey(file.name), file.type || contentTypeFromKey(file.name));
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

  // §6.3 duplicate detection: controlled matching rules — exact email plus a
  // normalized name match (cheap DB pre-filter, then precise compare) —
  // surface potential duplicates for HUMAN review. Merging is always a
  // separate, human-confirmed decision.
  const normalizedNewName = normalizeName(`${firstName} ${lastName}`);
  const [exactEmail, nameMatches] = await Promise.all([
    prisma.candidate.findMany({ where: { email } }),
    prisma.candidate.findMany({
      where: {
        email: { not: email },
        OR: [
          { firstName: { equals: firstName, mode: 'insensitive' } },
          { lastName: { equals: lastName, mode: 'insensitive' } },
        ],
      },
      take: 25,
    }),
  ]);
  const existingCandidates = [...exactEmail, ...nameMatches];
  const isDuplicate =
    exactEmail.length > 0 ||
    nameMatches.some(
      (c) => normalizeName(`${c.firstName} ${c.lastName}`) === normalizedNewName
    );

  // §6.11: a bare consent boolean is not an auditable consent record — store
  // the notice version, acceptance timestamp, and the captured choice.
  let candidate = existingCandidates[0];
  if (!candidate) {
    candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        consentGiven: true,
        consentNoticeVersion: PRIVACY_NOTICE_VERSION,
        consentGivenAt: new Date(),
        consentChoices: JSON.stringify({ dataProcessing: true }),
        tags: isDuplicate ? ['POTENTIAL_DUPLICATE'] : [],
      },
    });
  } else {
    // Returning candidate: refresh consent if previously withheld, tag the
    // new record set for duplicate review.
    const updateData: Record<string, unknown> = {};
    if (!candidate.consentGiven) {
      updateData.consentGiven = true;
      updateData.consentNoticeVersion = PRIVACY_NOTICE_VERSION;
      updateData.consentGivenAt = new Date();
      updateData.consentChoices = JSON.stringify({ dataProcessing: true });
    }
    if (isDuplicate && !candidate.tags.includes('POTENTIAL_DUPLICATE')) {
      updateData.tags = { push: 'POTENTIAL_DUPLICATE' };
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.candidate.update({ where: { id: candidate.id }, data: updateData });
    }
    for (const existing of existingCandidates.slice(1)) {
      if (!existing.tags.includes('POTENTIAL_DUPLICATE')) {
        await prisma.candidate.update({
          where: { id: existing.id },
          data: { tags: { push: 'POTENTIAL_DUPLICATE' } },
        });
      }
    }
  }

  // One application per candidate per requisition.
  const existingApp = await prisma.application.findFirst({
    where: { jobId, candidateId: candidate.id },
  });
  if (existingApp) {
    return {
      ok: false,
      status: 409,
      error: 'You have already submitted an application for this position.',
      applicationId: existingApp.id,
    };
  }

  const application = await prisma.application.create({
    data: { jobId, candidateId: candidate.id, stage: 'NEW', status: 'NEW' },
  });

  // QUEUED (not PENDING): the worker owns the full QUEUED→PROCESSING→
  // COMPLETED/NEEDS_REVIEW/FAILED lifecycle from this point.
  const resumeDoc = await prisma.resumeDocument.create({
    data: {
      applicationId: application.id,
      fileReference: stored.reference,
      checksum,
      processingStatus: 'QUEUED',
    },
  });

  // §9 reliability: a queue outage must not deadlock the applicant. The
  // application stays recoverable — staff retry exists
  // (`POST /api/upload/retry`), and the response states what happened
  // instead of a generic 503 that a resubmit would turn into a 409.
  let screeningQueued = true;
  try {
    await resumeQueue.add('process-resume', {
      applicationId: application.id,
      resumeDocumentId: resumeDoc.id,
      rubricId: approvedRubric.id,
    });
  } catch (queueErr) {
    screeningQueued = false;
    console.error('BullMQ enqueue failed for application:', application.id, queueErr);
  }

  // §6.9: application acknowledgement. Delivery failure is recorded on the
  // Communication row — it never fails the application itself.
  const ack = await sendRecordedEmail({
    to: email,
    template: 'APPLICATION_CONFIRMATION',
    data: { candidateName: `${firstName} ${lastName}`.trim(), jobTitle: job.title },
    applicationId: application.id,
    jobId: job.id,
  });

  // Notify the hiring team.
  const orgUsers = await prisma.user.findMany({
    where: { organizationId: job.organizationId },
    select: { id: true },
  });
  if (orgUsers.length > 0) {
    await prisma.notification.createMany({
      data: orgUsers.map((u) => ({
        userId: u.id,
        title: `📄 New Applicant: ${firstName} ${lastName}`,
        message: `${firstName} ${lastName} has submitted an application for ${job.title}.${screeningQueued ? ' AI screening is running automatically.' : ' Screening is queued for retry — the pipeline was temporarily unavailable.'}`,
        type: 'APPLICATION_STATUS',
        link: `/candidates`,
      })),
    });
  }

  // Audit: actorId must reference a real User row (FK); unattended candidate
  // submissions are attributed to the receiving job's owner. requestContext
  // carries the correlation id (never the resume content).
  await logAuditEvent({
    action: 'APPLICATION_SUBMITTED',
    actorId: job.ownerId,
    organizationId: job.organizationId,
    affectedRecordId: application.id,
    requestContext: input.requestId ? { requestId: input.requestId } : undefined,
    newValues: {
      jobId: application.jobId,
      candidateId: application.candidateId,
      submittedBy: 'candidate',
      screeningQueued,
      duplicateSuspected: isDuplicate,
    },
  });

  logEvent('info', 'intake.completed', {
    requestId: input.requestId,
    applicationId: application.id,
    jobId: job.id,
    screeningQueued,
    duplicateSuspected: isDuplicate,
    ackDelivered: ack.delivered,
  });

  return {
    ok: true,
    applicationId: application.id,
    screeningQueued,
    acknowledgementDelivered: ack.delivered,
  };
}
