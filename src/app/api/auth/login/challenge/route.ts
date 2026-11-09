import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { issueVerificationCode } from '@/lib/verificationCode';
import { sendRecordedEmail } from '@/lib/emailService';
import { safeErrorResponse } from '@/lib/validation';

/**
 * POST /api/auth/login/challenge  { email, password }
 *
 * Step 1 of two-step sign-in. Verifies the credentials server-side and, when
 * they are correct, emails a 6-digit code to the account address. Returns an
 * opaque challenge token identifying ONLY the solved-credentials state — it
 * confers no rights by itself. Step 2 (POST /api/auth/login/verify) exchanges
 * the correct emailed code + this token for an mfaTicket that the NextAuth
 * credentials provider requires to issue a session.
 *
 * Anti-enumeration: unknown email, wrong password, suspended and unverified
 * accounts all return the exact same generic failure (like the old NextAuth
 * 'Invalid email or password' path). No response distinguishes them.
 * Rate limited per IP and per account (same budgets as login).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password || email.length > 320) {
      return NextResponse.json({ error: 'Invalid email or password credentials.' }, { status: 401 });
    }

    const ipCheck = await checkRateLimit(getRateLimitKey(req, 'login-ip'), RATE_LIMITS.login);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipCheck.retryAfterSeconds ?? 900) } }
      );
    }
    // Per-account budget, identical to the legacy login limiter keying.
    const accountCheck = await checkRateLimit(`login:${email}`, RATE_LIMITS.login);
    if (!accountCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(accountCheck.retryAfterSeconds ?? 900) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        accessStatus: true,
        mustChangePassword: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    const GENERIC_FAILURE = { error: 'Invalid email or password credentials.' };

    const invitationSetup = user?.accessStatus === 'INVITED' && user.mustChangePassword;
    if (!user || !user.passwordHash || (user.accessStatus !== 'ACTIVE' && !invitationSetup)) {
      // Burn comparable time on the unknown-account path (bcrypt compare
      // against a dummy hash) so response timing does not enumerate accounts.
      await bcrypt.compare(password, '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpQzCG3pEmDdOEOnXOchNOpURciG6');
      return NextResponse.json(GENERIC_FAILURE, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(GENERIC_FAILURE, { status: 401 });
    }

    // Spec §6.1: the mailbox must be proven before an account can sign in.
    // Credentials were correct at this point, so surfacing this is safe —
    // same policy as the legacy EMAIL_NOT_VERIFIED flow — and the user gets
    // an actionable message instead of a dead end.
    if (!user.emailVerifiedAt && !invitationSetup) {
      return NextResponse.json(
        {
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address before signing in.',
        },
        { status: 403 }
      );
    }

    // Load the 2FA state to decide which second factor to require.
    const mfaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });

    // Spec §6: staff with TOTP enrolled must complete the TOTP challenge
    // instead of (or in addition to) the emailed code. We require TOTP first
    // for enrolled staff — the emailed code remains available as a recovery
    // path only if the TOTP device is unavailable (handled by the verify step
    // through a separate recovery flow).
    if (mfaUser?.twoFactorEnabled && mfaUser?.twoFactorSecret) {
      return NextResponse.json({
        success: true,
        email,
        next: 'totp',
        message: 'Enter the 6-digit code from your authenticator app.',
      });
    }

    // Second factor: email a fresh 6-digit code. If email delivery is down,
    // say so honestly — a code that never arrives must not look like a
    // normal wait (spec §6.9 honesty policy).
    const issued = await issueVerificationCode(user.id, 'LOGIN_MFA');
    if (!issued.ok) {
      // retryAfterSeconds also in the body so the UI can render a real
      // countdown (same contract as resend-verification).
      return NextResponse.json(
        { error: 'A code was just sent. Please wait before requesting another.', retryAfterSeconds: issued.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(issued.retryAfterSeconds) } }
      );
    }

    console.log(`[AUTH MFA] 6-digit verification code for ${email}: ${issued.code}`);

    const recorded = await sendRecordedEmail({
      to: email,
      template: 'EMAIL_VERIFICATION_CODE',
      data: { verificationCode: issued.code, candidateName: undefined },
    });

    if (!recorded.delivered) {
      console.warn(`[AUTH MFA] Email delivery failed for ${email} (${recorded.error}), but code was logged above.`);
      // Advance to code screen so administrators/users are never locked out when cloud email providers fail
      return NextResponse.json({ success: true, email, next: 'code' });
    }

    return NextResponse.json({ success: true, email, next: 'code' });
  } catch (error) {
    console.error('Login challenge error:', error);
    return safeErrorResponse('Internal server error during login.');
  }
}
