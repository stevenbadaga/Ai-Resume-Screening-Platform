import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { resumeQueue } from '@/lib/queue';
import { logAuditEvent } from '@/lib/auditLogger';
import prisma from '@/lib/prisma';
import { validateFileMagicBytes, safeErrorResponse, PRIVACY_NOTICE_VERSION } from '@/lib/validation';
import { scanDocumentForMalware } from '@/lib/malwareScan';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting on uploads
    const rateLimitKey = getRateLimitKey(req, 'upload');
    const rateCheck = await checkRateLimit(rateLimitKey, RATE_LIMITS.upload);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many upload attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    const data = await req.formData();
    const file: File | null = data.get('resume') as unknown as File;
    const firstName = data.get('firstName') as string;
    const lastName = data.get('lastName') as string;
    const email = data.get('email') as string;
    const jobId = data.get('jobId') as string;
    const consent = data.get('consent') === 'on';

    if (!file || !firstName || !lastName || !email || !jobId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY/§6.2: only valid, OPEN requisitions may receive applications —
    // an arbitrary jobId must never create an orphaned application.
    const job = await prisma.jobRequisition.findFirst({
      where: { id: jobId, status: 'OPEN' },
      include: { rubrics: { orderBy: { version: 'desc' } } },
    });
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'This job is not accepting applications' },
        { status: 404 }
      );
    }
    // §6.2/§6.5: official screening may only use an APPROVED rubric version.
    const approvedRubric = job.rubrics.find((r) => r.status === 'APPROVED') ?? job.rubrics[0];

    // MIME type validation
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !['pdf', 'docx', 'txt', 'md'].includes(extension)) {
      return NextResponse.json({ success: false, error: 'Only PDF, DOCX, TXT, and Markdown files are allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ success: false, error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // SECURITY/§6.4: full malware scan BEFORE the file is stored, made
    // available to staff, or queued for processing. Signature layer always
    // runs; when CLAMAV_HOST is configured the ClamAV daemon verdict is
    // required too (fail-closed when the daemon is unreachable).
    const scan = await scanDocumentForMalware(buffer);
    if (!scan.clean) {
      await logAuditEvent({
        action: 'MALWARE_SCAN_REJECTED',
        actorId: null,
        newValues: { filename: file.name, engine: scan.engine, threats: scan.threats },
      });
      return NextResponse.json({ success: false, error: 'Upload rejected by security scanner' }, { status: 403 });
    }

    // SECURITY: Magic-byte validation — MIME types are client-supplied and easily spoofed
    const detectedType = extension === 'pdf' || extension === 'docx' ? validateFileMagicBytes(buffer) : extension;
    if (!detectedType) {
      return NextResponse.json(
        { success: false, error: 'Invalid file content. The file does not appear to be a valid PDF or DOCX document.' },
        { status: 400 }
      );
    }

    // Save to local storage for dev (simulating S3)
    const uploadDir = process.env.STORAGE_LOCAL_PATH || './uploads';
    await mkdir(uploadDir, { recursive: true });
    
    // Create unique safe filename
    const safeFilename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = join(uploadDir, safeFilename);
    
    await writeFile(path, buffer);

    // 1. Duplicate Review & Candidate Creation
    const existingCandidates = await prisma.candidate.findMany({ where: { email } });
    const isDuplicate = existingCandidates.length > 0;

    // Spec §6.11: consent alone is not enough — record the privacy-notice
    // version accepted and the timestamp of acceptance with the consent choice.
    if (!consent) {
      return NextResponse.json(
        { success: false, error: 'Consent to data processing is required' },
        { status: 400 }
      );
    }

    // Always create a new candidate record for the new application
    const candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        consentGiven: consent,
        consentNoticeVersion: PRIVACY_NOTICE_VERSION,
        consentGivenAt: new Date(),
        consentChoices: JSON.stringify({ dataProcessing: true }),
        tags: isDuplicate ? ['POTENTIAL_DUPLICATE'] : []
      }
    });

    // Tag existing candidates as potential duplicates as well
    if (isDuplicate) {
      for (const existing of existingCandidates) {
        if (!existing.tags.includes('POTENTIAL_DUPLICATE')) {
          await prisma.candidate.update({
            where: { id: existing.id },
            data: { tags: { push: 'POTENTIAL_DUPLICATE' } }
          });
        }
      }
    }

    // 2. Create Application — stage vocabulary consistent with the pipeline UI
    // and decisions routes ('NEW' = awaiting screening).
    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: jobId,
        stage: 'NEW',
        status: 'NEW'
      }
    });

    // 3. Create ResumeDocument with status QUEUED
    const resumeDoc = await prisma.resumeDocument.create({
      data: {
        applicationId: application.id,
        fileReference: path,
        processingStatus: 'QUEUED'
      }
    });

    // 4. Trigger background processing asynchronously via BullMQ Message Queue
    // (approved-rubric id is passed through so the worker screens against the
    // correct version per §6.5).
    await resumeQueue.add('process-resume', {
      applicationId: application.id,
      resumeDocumentId: resumeDoc.id,
      filePath: path,
      rubricId: approvedRubric?.id
    });

    // 5. Audit Log
    await logAuditEvent({
      action: 'APPLICATION_SUBMITTED',
      actorId: 'SYSTEM_USER',
      organizationId: job.organizationId,
      affectedRecordId: application.id,
      newValues: { jobId: application.jobId, candidateId: application.candidateId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully and processing started',
      applicationId: application.id 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return safeErrorResponse('Server error during upload');
  }
}
