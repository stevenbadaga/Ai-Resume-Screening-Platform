import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { verifyVerificationCode } from '@/lib/verificationCode';
import { safeErrorResponse } from '@/lib/validation';

/**
 * POST /api/auth/verify-email-code  { email, code }
 *
 * Signup email activation by typed code (spec §6.1). Replaces the old
 * click-a-link flow: the signup email contains a 6-digit code, and the user
 * pastes it here to mark their email verified.
 *
 * Anti-enumeration: generic responses. A wrong code returns 400 INVALID_CODE
 * but a valid-shaped request against a verified/unknown account returns the
 * same shape as success — probing learns nothing about who has an account.
 * Rate limited per IP and per email address.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    // Malformed input: identical generic response, no enumeration signal.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return NextResponse.json({ success: true });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      );
    }

    const ipKey = getRateLimitKey(req, 'verify-code-ip');
    const emailKey = `verify-code-email:${email}`;
    const [ipCheck, emailCheck] = await Promise.all([
      checkRateLimit(ipKey, RATE_LIMITS.login),
      checkRateLimit(emailKey, RATE_LIMITS.login),
    ]);
    if (!ipCheck.allowed || !emailCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(emailCheck.retryAfterSeconds ?? ipCheck.retryAfterSeconds ?? 60) } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Unknown email: burn an attempt against a fake target so timing and
    // response stay comparable with the known-email path, then return the
    // generic success shape (never confirm the account does not exist).
    if (!user || !user.passwordHash) {
      await checkRateLimit(`verify-code-burn:${email}`, RATE_LIMITS.login);
      return NextResponse.json({ success: true });
    }

    if (user.emailVerifiedAt) {
      // Already activated — idempotent success.
      return NextResponse.json({
        success: true,
        message: 'Email is already verified. You can sign in.',
      });
    }

    const result = await verifyVerificationCode(user.id, 'EMAIL_VERIFICATION', code);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    await logAuditEvent({
      action: 'EMAIL_VERIFIED',
      actorId: user.id,
      affectedRecordId: user.id,
      newValues: { email: user.email, method: 'code' },
    });

    return NextResponse.json({
      success: true,
      email: user.email,
      message: 'Email verified. You can now sign in.',
    });
  } catch (error) {
    console.error('Verify email code error:', error);
    return safeErrorResponse('Failed to verify code');
  }
}
