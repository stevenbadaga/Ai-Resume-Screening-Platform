import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resumeQueue } from '@/lib/queue';
import { logAuditEvent } from '@/lib/auditLogger';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { containsKnownMalwareSignature, validateFileMagicBytes, safeErrorResponse, PRIVACY_NOTICE_VERSION } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    // Rate limiting on application submissions
    const rateLimitKey = getRateLimitKey(req, 'apply');
    const rateCheck = await checkRateLimit(rateLimitKey, RATE_LIMITS.upload);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    const formData = await req.formData();
    const jobId = formData.get('jobId') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const consentRaw = formData.get('consentGiven') ?? formData.get('consent') ?? formData.get('consentToDataProcessing');
    const consentGiven = consentRaw === 'true' || consentRaw === '1' || consentRaw === 'on';
    const file = formData.get('resume') as File | null;

    if (!jobId || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required candidate information' }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!consentGiven) {
      return NextResponse.json({ error: 'Consent to data processing is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }

    // File size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Verify Job exists and get organization details
    const job = await prisma.jobRequisition.findUnique({
      where: { id: jobId },
      include: {
        organization: true,
        rubrics: { include: { criteria: true }, orderBy: { version: 'desc' } }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job position not found' }, { status: 404 });
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json({ error: 'This job is not accepting applications' }, { status: 409 });
    }

    // §6.2: only an approved rubric version may be used for official screening.
    const approvedRubric = job.rubrics.find((r) => r.status === 'APPROVED');
    if (!approvedRubric) {
      return NextResponse.json(
        { error: 'This position is not yet open for screening' },
        { status: 409 }
      );
    }

    // Process file and save to uploads/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (containsKnownMalwareSignature(buffer)) {
      await logAuditEvent({
        action: 'MALWARE_SIGNATURE_DETECTED',
        actorId: null,
        affectedRecordId: jobId,
        newValues: { filename: file.name },
      });
      return NextResponse.json({ error: 'Upload rejected by security scanner' }, { status: 403 });
    }

    // SECURITY: Validate the advertised format and do not trust client MIME types.
    const fileExt = path.extname(file.name).toLowerCase();
    if (!['.pdf', '.docx', '.txt', '.md'].includes(fileExt)) {
      return NextResponse.json({ error: 'Only PDF, DOCX, TXT, and Markdown resumes are allowed' }, { status: 400 });
    }
    if (fileExt === '.pdf' || fileExt === '.docx') {
      const detectedType = validateFileMagicBytes(buffer);
      if (!detectedType) {
        return NextResponse.json(
          { error: 'Invalid file content. The file does not appear to be a valid PDF or DOCX document.' },
          { status: 400 }
        );
      }
    }

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    const uploadDir = path.resolve(process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'uploads'));
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    // Extract text content from file
    let extractedText = '';
    
    if (fileExt === '.txt' || fileExt === '.md') {
      extractedText = buffer.toString('utf-8');
    } else if (fileExt === '.pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || '';
      } catch (e) {
        // SECURITY/DATA-INTEGRITY: do NOT fall back to raw binary bytes as text.
        // Garbage input poisons AI screening silently; fail loudly instead.
        console.error('PDF parse failed:', e);
        return NextResponse.json(
          { error: 'We could not read your PDF. Please re-export it as a text-based PDF (not scanned) and try again.' },
          { status: 422 }
        );
      }
    } else {
      // Text formats only — never treat arbitrary binary as extracted text.
      const decoded = buffer.toString('utf-8');
      const replacementCharCount = (decoded.match(/\uFFFD/g) || []).length;
      if (replacementCharCount > decoded.length * 0.05) {
        return NextResponse.json(
          { error: 'The uploaded file does not contain readable text content.' },
          { status: 422 }
        );
      }
      extractedText = decoded;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      // Do NOT fabricate a synthetic resume. Tell the applicant honestly.
      return NextResponse.json(
        { error: 'Your resume appears to be empty or image-only. Please upload a text-based resume (PDF, DOCX, TXT, or Markdown).' },
        { status: 422 }
      );
    }

    // Find or create Candidate
    let candidate = await prisma.candidate.findFirst({ where: { email } });
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          firstName,
          lastName,
          email,
          consentGiven: true,
          // Spec §6.11: record the notice version accepted and the timestamp
          // of acceptance — a bare boolean is not an auditable consent record.
          consentNoticeVersion: PRIVACY_NOTICE_VERSION,
          consentGivenAt: new Date(),
          consentChoices: JSON.stringify({ dataProcessing: true })
        }
      });
    } else if (!candidate.consentGiven) {
      // Returning candidate previously withheld or lost consent — refresh the
      // record with the current notice version rather than silently reusing it.
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          consentGiven: true,
          consentNoticeVersion: PRIVACY_NOTICE_VERSION,
          consentGivenAt: new Date(),
          consentChoices: JSON.stringify({ dataProcessing: true })
        }
      });
    }

    // Check for existing application for this job
    const existingApp = await prisma.application.findFirst({
      where: {
        jobId,
        candidateId: candidate.id
      }
    });

    if (existingApp) {
      return NextResponse.json({
        error: 'You have already submitted an application for this position.',
        applicationId: existingApp.id
      }, { status: 409 });
    }

    // Create Application — stage/status vocabulary consistent with the pipeline
    // ('NEW' until the worker completes screening; §6.4 processing status lives
    // on the ResumeDocument, not on the application stage).
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        status: 'NEW',
        stage: 'NEW'
      }
    });

    // Create ResumeDocument
    const resumeDoc = await prisma.resumeDocument.create({
      data: {
        applicationId: application.id,
        fileReference: filePath,
        checksum,
        extractedText,
        processingStatus: 'PENDING'
      }
    });

    // Enqueue BullMQ Background Screening Job.
    // If the queue is unavailable, say so — a silently never-screened application
    // is worse than an honest 503 the applicant can retry.
    try {
      await resumeQueue.add('process-resume', {
        applicationId: application.id,
        resumeDocumentId: resumeDoc.id,
        extractedText,
        rubricId: approvedRubric.id
      });
    } catch (queueErr) {
      console.error('BullMQ enqueue failed for application:', application.id, queueErr);
      return NextResponse.json(
        {
          error: 'Your application was saved but our screening pipeline is temporarily unavailable. Please try again shortly or contact support.',
          applicationId: application.id
        },
        { status: 503, headers: { 'Retry-After': '60' } }
      );
    }

    // Broadcast In-App Notification to hiring team
    const orgUsers = await prisma.user.findMany({
      where: { organizationId: job.organizationId },
      select: { id: true }
    });

    if (orgUsers.length > 0) {
      await prisma.notification.createMany({
        data: orgUsers.map((u: any) => ({
          userId: u.id,
          title: `📄 New Applicant: ${firstName} ${lastName}`,
          message: `${firstName} ${lastName} has submitted an in-app application for ${job.title}. AI screening is running automatically.`,
          type: 'APPLICATION_STATUS',
          link: `/candidates`
        }))
      });
    }

    // Log Audit Trail
    await logAuditEvent({
      action: 'CANDIDATE_APPLIED_IN_APP',
      actorId: null,
      affectedRecordId: application.id,
      newValues: { candidateName: `${firstName} ${lastName}`, email, jobTitle: job.title, organizationId: job.organizationId }
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: 'Application submitted successfully! Our AI screening pipeline is now processing your profile.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('In-app apply error:', error);
    // SECURITY: Never leak internal error details
    return safeErrorResponse('Failed to submit application');
  }
}