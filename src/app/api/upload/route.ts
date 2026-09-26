import { NextRequest, NextResponse } from 'next/server';
import { submitApplication } from '@/lib/intakeService';
import { safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { requestIdOf } from '@/lib/observability';

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

    const data = await req.formData();
    const file = data.get('resume') as unknown as File | null;
    const firstName = data.get('firstName') as string;
    const lastName = data.get('lastName') as string;
    const email = data.get('email') as string;
    const jobId = data.get('jobId') as string;
    const consent = data.get('consent') === 'on';

    if (!file || !firstName || !lastName || !email || !jobId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await submitApplication({
      jobId,
      firstName,
      lastName,
      email,
      consentGiven: consent,
      file: { name: file.name, size: file.size, type: file.type, buffer },
      requestId: requestIdOf(req),
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, applicationId: result.applicationId },
        { status: result.status }
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
    console.error('Upload error:', error);
    return safeErrorResponse('Server error during upload');
  }
}
