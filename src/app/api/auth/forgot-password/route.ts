import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import {
  generateResetToken,
  buildResetEmailBody,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
} from '@/lib/passwordReset';
import { sendTransactionalEmail } from '@/lib/emailService';

/**
 * POST /api/auth/forgot-password (spec §6.1: password reset)
 *
 * Always returns 200 so the endpoint cannot be used to enumerate which
 * emails have accounts. If an account exists and email delivery is
 * configured, a single-use, hashed, 30-minute reset token is emailed.
 * The plain token is never stored server-side — only its SHA-256 hash.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    // Basic shape check — no schema error that would leak account existence.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return NextResponse.json({ success: true });
    }

    const rateKey = getRateLimitKey(req, `password-reset:${email}`);
    const rateCheck = await checkRateLimit(rateKey, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      // Rate limited — still return a generic success to avoid enumeration.
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.passwordHash) {
      const { token, tokenHash } = generateResetToken();
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000);

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const origin = process.env.NEXTAUTH_URL || new URL(req.url).origin;
      const resetUrl = `${origin}/auth/reset-password?token=${token}`;
      try {
        await sendTransactionalEmail({
          to: email,
          template: 'PASSWORD_RESET',
          data: {},
        }, buildResetEmailBody(resetUrl));
      } catch {
        // Delivery failure is intentionally silent here: responding differently
        // would leak account existence. The user can simply retry.
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Generic response — never confirm whether the account exists.
    return NextResponse.json({ success: true });
  }
}
