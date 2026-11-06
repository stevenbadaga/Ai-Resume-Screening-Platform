import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import {
  generateResetToken,
  buildResetEmailBody,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
} from '@/lib/passwordReset';
import { sendRecordedEmail } from '@/lib/emailService';

/**
 * How far back to look when deciding whether email delivery is currently
 * healthy (see withEmailHealth). Matches the reset-token TTL window: a link
 * sent into a broken mail provider within the last half hour is still a
 * dead end for whoever is waiting on it.
 */
const EMAIL_HEALTH_WINDOW_MINUTES = PASSWORD_RESET_TOKEN_TTL_MINUTES;

/**
 * Platform-wide email delivery health: did any password-reset send FAIL in
 * the recent window (provider down, IP not allowlisted, unverified sender…)?
 *
 * Deliberately NOT per-address: a flag tied to the requested email would
 * turn this anti-enumeration endpoint into an account-existence oracle.
 * A global "is email delivery working at all" signal leaks nothing about
 * any account while still letting the UI warn honestly instead of showing
 * a dead-end "check your inbox".
 */
async function isEmailDeliveryHealthy(): Promise<boolean> {
  const windowStart = new Date(Date.now() - EMAIL_HEALTH_WINDOW_MINUTES * 60_000);
  try {
    const recentFailures = await prisma.communication.count({
      where: {
        template: 'PASSWORD_RESET',
        deliveryState: 'FAILED',
        createdAt: { gte: windowStart },
      },
    });
    return recentFailures === 0;
  } catch {
    // Fail OPEN (report healthy): this endpoint must always return its
    // generic response — a health-check failure must never turn into a
    // 500 that behaves differently from the success path.
    return true;
  }
}

/**
 * Wraps the always-generic response with the email health signal.
 * The response body stays identical regardless of whether the requested
 * email has an account (anti-enumeration preserved).
 */
async function withEmailHealth(payload: Record<string, unknown>): Promise<NextResponse> {
  return NextResponse.json({
    ...payload,
    emailSystemHealthy: await isEmailDeliveryHealthy(),
  });
}

/**
 * POST /api/auth/forgot-password (spec §6.1: password reset)
 *
 * Always returns 200 so the endpoint cannot be used to enumerate which
 * emails have accounts. If an account exists, a single-use, hashed,
 * 30-minute reset token is emailed — the plain token is never stored
 * server-side, only its SHA-256 hash.
 *
 * The send is RECORDED (spec §6.9): a delivery failure lands in the
 * Communication table as FAILED with failureInfo (e.g. the Brevo
 * authorized-IPs hint). The API response stays generic per-address but
 * includes the platform-wide `emailSystemHealthy` flag so the UI can warn
 * honestly when delivery is broken without revealing anything about the
 * specific address.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    // Basic shape check — no schema error that would leak account existence.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return withEmailHealth({ success: true });
    }

    const rateKey = getRateLimitKey(req, `password-reset:${email}`);
    const rateCheck = await checkRateLimit(rateKey, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      // Rate limited — still return a generic success to avoid enumeration.
      return withEmailHealth({ success: true });
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
      // Recorded send (spec §6.9): failures are persisted on the
      // Communication row (FAILED + failureInfo) instead of vanishing —
      // previously a broken provider made this endpoint a silent dead end.
      await sendRecordedEmail(
        {
          to: email,
          template: 'PASSWORD_RESET',
          data: {},
          // Attribute the send to the account holder so org-scoped delivery
          // views (admin dashboard) can include password-reset failures.
          senderId: user.id,
        },
        buildResetEmailBody(resetUrl)
      );
    }

    return withEmailHealth({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Generic response — never confirm whether the account exists.
    return withEmailHealth({ success: true });
  }
}
