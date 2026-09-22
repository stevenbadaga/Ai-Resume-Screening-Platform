import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  generateVerificationToken,
  EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
} from '@/lib/emailVerification';
import { sendRecordedEmail } from '@/lib/emailService';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { safeErrorResponse } from '@/lib/validation';

/**
 * POST /api/auth/resend-verification  { email }
 *
 * Re-sends the verification link (spec §6.1). Anti-enumeration: always
 * returns success whether or not the account exists, is already verified,
 * or email delivery is configured. Rate limited per email address.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return NextResponse.json({ success: true });
    }

    const rateKey = getRateLimitKey(req, `verify-resend:${email}`);
    const rateCheck = await checkRateLimit(rateKey, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.passwordHash && !user.emailVerifiedAt) {
      const { token, tokenHash } = generateVerificationToken();
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MINUTES * 60_000);
      await prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const origin = process.env.NEXTAUTH_URL || new URL(req.url).origin;
      const verifyUrl = `${origin}/auth/verify-email?token=${token}`;
      // Recorded send (spec §6.9): even this anti-enumeration path records an
      // honest SENT/FAILED row — observability never leaks enumeration signals
      // because the API response stays generic regardless of outcome.
      await sendRecordedEmail({
        to: email,
        template: 'EMAIL_VERIFICATION',
        data: { joinLink: verifyUrl },
        senderId: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If that email address has an unverified account, a new verification link has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return safeErrorResponse('Failed to resend verification email');
  }
}
