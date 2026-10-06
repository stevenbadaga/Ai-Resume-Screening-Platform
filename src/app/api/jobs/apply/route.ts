import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { submitApplication, type IntakeInput } from '@/lib/intakeService';
import { safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { requestIdOf } from '@/lib/observability';
import { StorageError, getObject, contentTypeFromKey } from '@/lib/storage';

/**
 * Public job-board application intake.
 *
 * Thin transport over the shared intake pipeline (src/lib/intakeService.ts):
 * rate limiting + form parsing only. Field aliases (`consentGiven` /
 * `consentToDataProcessing`) are accepted for older embeds, then everything
 * follows the exact same path as `/api/upload` — same scan, same storage,
 * same consent record, same acknowledgement, same audit trail.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(req, 'apply');
    const rateCheck = await checkRateLimit(rateLimitKey, RATE_LIMITS.upload);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'Invalid submission format — please submit the application form again.' },
        { status: 400 }
      );
    }
    const jobId = formData.get('jobId') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const consentRaw =
      formData.get('consentGiven') ?? formData.get('consent') ?? formData.get('consentToDataProcessing');
    const consentGiven = consentRaw === 'true' || consentRaw === '1' || consentRaw === 'on';
    const file = formData.get('resume') as File | null;

    // One-click apply: identity comes from the session's candidate profile,
    // so form name/email fields are optional in that path.
    const wantsProfileResume =
      (formData.get('useProfileResume') as string | null) === 'true' && !file;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing job information' }, { status: 400 });
    }
    if (!wantsProfileResume && (!firstName || !lastName || !email)) {
      return NextResponse.json({ error: 'Missing required candidate information' }, { status: 400 });
    }

    const buffer = file ? Buffer.from(await file.arrayBuffer()) : Buffer.alloc(0);
    const fileInput: IntakeInput['file'] = file
      ? { name: file.name, size: file.size, type: file.type, buffer }
      : null;

    // One-click apply: reuse the CV saved on the candidate's profile instead
    // of a per-form upload. Identity comes from the SESSION (never from form
    // fields), and the saved document re-enters the standard intake pipeline
    // — same malware scan, same storage snapshot, same audit trail — so a
    // profile application is indistinguishable from a full-form one.
    let effectiveFile = fileInput;
    let effectiveEmail = email;
    let effectiveFirst = firstName;
    let effectiveLast = lastName;

    if (wantsProfileResume) {
      const session = await getServerSession(authOptions);
      const sessionEmail = (session?.user as { email?: string | null } | null)?.email;
      if (!sessionEmail) {
        return NextResponse.json(
          { error: 'Sign in to apply with your saved CV, or attach a resume file.' },
          { status: 401 }
        );
      }
      const candidate = await prisma.candidate.findFirst({ where: { email: sessionEmail } });
      if (!candidate?.profileResumeRef) {
        return NextResponse.json(
          { error: 'No CV saved on your profile yet — upload one on your profile page, or attach a file here.' },
          { status: 400 }
        );
      }
      const saved = await getObject(candidate.profileResumeRef);
      const savedName = candidate.profileResumeName ?? 'saved-resume';
      effectiveFile = {
        name: savedName,
        size: saved.bytes.length,
        type: saved.contentType || contentTypeFromKey(savedName),
        buffer: saved.bytes,
      };
      effectiveEmail = candidate.email || sessionEmail;
      effectiveFirst = candidate.firstName;
      effectiveLast = candidate.lastName;
    }

    const result = await submitApplication({
      jobId,
      firstName: effectiveFirst,
      lastName: effectiveLast,
      email: effectiveEmail,
      consentGiven,
      file: effectiveFile,
      requestId: requestIdOf(req),
    });

    if (!result.ok) {
      const headers: Record<string, string> = {};
      if (result.status === 503) headers['Retry-After'] = '120';
      return NextResponse.json(
        { error: result.error, applicationId: result.applicationId },
        { status: result.status, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        applicationId: result.applicationId,
        screeningQueued: result.screeningQueued,
        acknowledgementDelivered: result.acknowledgementDelivered,
        message: result.screeningQueued
          ? 'Application submitted successfully! Our AI screening pipeline is now processing your profile.'
          : 'Application received and saved. Screening will start automatically once our pipeline recovers.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof StorageError) {
      console.error('Apply blocked: storage backend unavailable:', error.message);
      return NextResponse.json(
        {
          error:
            'We could not store your document right now — our file service appears to be down. '
            + 'Nothing was submitted; please try again in a few minutes.',
        },
        { status: 503, headers: { 'Retry-After': '120' } }
     );
    }
    console.error('In-app apply error:', error);
    // SECURITY: Never leak internal error details
    return safeErrorResponse('Failed to submit application');
  }
}
