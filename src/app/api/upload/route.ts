import { NextRequest, NextResponse } from 'next/server';
import { submitApplication, type IntakeInput } from '@/lib/intakeService';
import { safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { requestIdOf } from '@/lib/observability';
import { StorageError } from '@/lib/storage';

/**
 * Candidate self-service application intake (in-app form).
 *
 * Thin transport over the shared intake pipeline (src/lib/intakeService.ts):
 * rate limiting + form parsing only — validation, scanning, storage,
 * queueing, consent records, acknowledgement, audit, and notifications all
 * live in one place so `/api/upload` and `/api/jobs/apply` can never drift.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(req, 'upload');
    const rateCheck = await checkRateLimit(rateLimitKey, RATE_LIMITS.upload);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many upload attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid upload format — please submit the form again.' },
        { status: 400 }
      );
    }
    const data = formData;
    const file = data.get('resume') as unknown as File | null;
    let firstName = data.get('firstName') as string;
    let lastName = data.get('lastName') as string;
    let email = data.get('email') as string;
    let phone = (data.get('phone') as string | null) || null;
    const jobId = data.get('jobId') as string;
    const consent = data.get('consent') === 'on' || data.get('consent') === 'true' || data.get('consentGiven') === 'true';

    const wantsProfileResume =
      ((data.get('useProfileResume') as string | null) === 'true' ||
        (data.get('useSavedCv') as string | null) === 'yes' ||
        (data.get('useSavedCv') as string | null) === 'true') &&
      !file;

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Missing job requisition selection' }, { status: 400 });
    }

    if (!wantsProfileResume && (!file || !firstName || !lastName || !email)) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let fileInput: IntakeInput['file'] = file
      ? {
          name: file.name,
          size: file.size,
          type: file.type,
          buffer: Buffer.from(await file.arrayBuffer()),
        }
      : null;

    if (wantsProfileResume) {
      const { getServerSession } = await import('next-auth/next');
      const { authOptions } = await import('@/lib/authOptions');
      const prisma = (await import('@/lib/prisma')).default;
      const { getObject, contentTypeFromKey } = await import('@/lib/storage');

      const session = await getServerSession(authOptions);
      const sessionEmail = (session?.user as { email?: string | null } | null)?.email;
      const effectiveLookupEmail = email || sessionEmail;

      if (!effectiveLookupEmail) {
        return NextResponse.json(
          { success: false, error: 'Sign in to apply with your saved CV, or attach a resume file.' },
          { status: 401 }
        );
      }

      const candidate = await prisma.candidate.findFirst({ where: { email: effectiveLookupEmail } });
      if (!candidate?.profileResumeRef) {
        return NextResponse.json(
          {
            success: false,
            error: 'No CV saved on your profile yet — upload one on your profile page, or attach a file here.',
          },
          { status: 400 }
        );
      }

      let saved;
      try {
        saved = await getObject(candidate.profileResumeRef);
      } catch (storageErr: any) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Could not load your saved CV from storage (' +
              (storageErr?.message || 'document unavailable') +
              '). Please apply by uploading your resume document directly.',
          },
          { status: 400 }
        );
      }

      const savedName = candidate.profileResumeName ?? 'saved-resume';
      fileInput = {
        name: savedName,
        size: saved.bytes.length,
        type: saved.contentType || contentTypeFromKey(savedName),
        buffer: saved.bytes,
      };
      email = email || candidate.email || sessionEmail || '';
      firstName = firstName || candidate.firstName || '';
      lastName = lastName || candidate.lastName || '';
      phone = phone || candidate.phone || null;
    }

    const result = await submitApplication({
      jobId,
      firstName,
      lastName,
      email,
      phone,
      consentGiven: consent,
      file: fileInput,
      requestId: requestIdOf(req),
    });

    if (!result.ok) {
      const headers: Record<string, string> = {};
      if (result.status === 503) headers['Retry-After'] = '120';
      return NextResponse.json(
        { success: false, error: result.error, applicationId: result.applicationId },
        { status: result.status, headers }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.screeningQueued
        ? 'Application submitted successfully and processing has started'
        : 'Application saved. Screening will start automatically once our pipeline recovers.',
      applicationId: result.applicationId,
      screeningQueued: result.screeningQueued,
    });
  } catch (error) {
    if (error instanceof StorageError) {
      console.error('Upload blocked: storage backend unavailable:', error.message);
      return NextResponse.json(
        {
          success: false,
          error:
            'We could not store your document right now — our file service appears to be down. '
            + 'Nothing was submitted; please try again in a few minutes.',
        },
        { status: 503, headers: { 'Retry-After': '120' } }
      );
    }
    console.error('Upload error:', error);
    return safeErrorResponse('Server error during upload');
  }
}
