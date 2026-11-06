import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { verifyVerificationCode } from '@/lib/verificationCode';
import { verifyTOTP } from '@/lib/totp';
import { safeErrorResponse } from '@/lib/validation';

/**
 * POST /api/auth/login/verify  { email, code }
 *
 * Step 2 of two-step sign-in. Verifies the emailed 6-digit code for the
 * account and stamps NextAuth's short-lived MFA ticket (HTTP-only cookie):
 * verified:true proves the second factor passed.
 *
 * The NextAuth authorize() step (credentials + this ticket) is what actually
 * issues the session — passing only this endpoint grants nothing.
 *
 * Single-use codes: each code solves once; a re-login always emails a fresh
 * one. Wrong entries are bounded (5 per code) and rate limited per IP and
 * per account.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    const factor = typeof body?.factor === 'string' ? body.factor : 'code'; // 'code' | 'totp'

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      );
    }

    const ipCheck = await checkRateLimit(getRateLimitKey(req, 'login-verify-ip'), RATE_LIMITS.login);
    const accountCheck = await checkRateLimit(`login:${email}`, RATE_LIMITS.login);
    if (!ipCheck.allowed || !accountCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(accountCheck.retryAfterSeconds ?? ipCheck.retryAfterSeconds ?? 900) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, accessStatus: true, emailVerifiedAt: true, mustChangePassword: true },
    });

    const invitationSetup = user?.accessStatus === 'INVITED' && user.mustChangePassword;
    if (!user || (user.accessStatus !== 'ACTIVE' && !invitationSetup) || (!user.emailVerifiedAt && !invitationSetup)) {
      // Generic failure — never reveal whether the account exists.
      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      );
    }

    let verificationResult;
    if (factor === 'totp') {
      // TOTP second factor: verify against the enrolled secret.
      // Anti-enumeration: generic failure for missing/invalid secret too.
      const mfaUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
      });
      if (!mfaUser?.twoFactorSecret || !mfaUser?.twoFactorEnabled) {
        // The login challenge said TOTP was required but the state disagrees —
        // fall through to a generic failure to avoid leaking info.
        return NextResponse.json(
          { error: 'Invalid or expired code. Please request a new one.' },
          { status: 400 }
        );
      }
      const totpValid = verifyTOTP(mfaUser.twoFactorSecret, code);
      if (!totpValid) {
        return NextResponse.json(
          { error: 'Invalid or expired code. Please request a new one.' },
          { status: 400 }
        );
      }
      // Record the successful TOTP verification so authorize() can confirm the
      // second factor passed (mirrors the emailed-code proof path).
      // Record the successful TOTP verification as a short-lived proof so
      // authorize() can confirm the second factor passed. We use a dedicated
      // code row with a timestamp-based hash (not a real code) — the important
      // part is the verifiedAt timestamp, which is what hasRecentSolvedLoginCode
      // checks.
      const totpProofHash = Buffer.from(
        'totp:' + user.id + ':' + Date.now().toString(36)
      ).toString('base64');
      verificationResult = await prisma.verificationCode.create({
        data: {
          userId: user.id,
          purpose: 'LOGIN_MFA',
          codeHash: totpProofHash,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          verifiedAt: new Date(),
          maxAttempts: 1,
        },
      });
    } else {
      verificationResult = await verifyVerificationCode(user.id, 'LOGIN_MFA', code);
      if (!verificationResult.ok) {
        return NextResponse.json(
          { error: 'Invalid or expired code. Please request a new one.' },
          { status: 400 }
        );
      }
    }

    if (!user.emailVerifiedAt && factor !== 'totp') {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    }

    // The ticket identifies the solved second factor. It is returned in the
    // body (the code-prover needs it as the signIn credential marker) AND set
    // as an HTTP-only cookie (server-side defense-in-depth). It confers
    // nothing by itself: authorize() still requires the correct password.
    const mfaTicket = `v1:${user.id}:${Date.now()}`;
    const response = NextResponse.json({ success: true, verified: true, mfaTicket });

    // Short-lived (2 min): solve the code, then finish sign-in promptly.
    response.cookies.set('nextauth.mfa', mfaTicket, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 120,
    });

    return response;
  } catch (error) {
    console.error('Login verify error:', error);
    return safeErrorResponse('Failed to verify code');
  }
}
