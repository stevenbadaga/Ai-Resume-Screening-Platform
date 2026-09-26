import { NextRequest, NextResponse } from 'next/server';
import { submitApplication, type IntakeInput } from '@/lib/intakeService';
import { safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { requestIdOf } from '@/lib/observability';

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

    const formData = await req.formData();
    const jobId = formData.get('jobId') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const consentRaw =
      formData.get('consentGiven') ?? formData.get('consent') ?? formData.get('consentToDataProcessing');
    const consentGiven = consentRaw === 'true' || consentRaw === '1' || consentRaw === 'on';
    const file = formData.get('resume') as File | null;

    if (!jobId || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required candidate information' }, { status: 400 });
    }

    const buffer = file ? Buffer.from(await file.arrayBuffer()) : Buffer.alloc(0);
    const fileInput: IntakeInput['file'] = file
      ? { name: file.name, size: file.size, type: file.type, buffer }
      : null;
    const result = await submitApplication({
      jobId,
      firstName,
      lastName,
      email,
      consentGiven,
      file: fileInput,
      requestId: requestIdOf(req),
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, applicationId: result.applicationId },
        { status: result.status }
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
    console.error('In-app apply error:', error);
    // SECURITY: Never leak internal error details
    return safeErrorResponse('Failed to submit application');
  }
}
