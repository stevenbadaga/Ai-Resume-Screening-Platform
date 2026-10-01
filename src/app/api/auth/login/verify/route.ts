import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { verifyVerificationCode } from '@/lib/verificationCode';
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
      select: { id: true, accessStatus: true, emailVerifiedAt: true },
    });

    if (!user || user.accessStatus !== 'ACTIVE' || !user.emailVerifiedAt) {
      // Generic failure — never reveal whether the account exists.
      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      );
    }

    const result = await verifyVerificationCode(user.id, 'LOGIN_MFA', code);
    if (!result.ok) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      );
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
