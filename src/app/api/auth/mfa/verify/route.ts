import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { verifyTOTP } from '@/lib/totp';

/**
 * POST /api/auth/mfa/verify  { code }
 *
 * Spec §6: complete TOTP enrollment by verifying a code from the enrolled
 * authenticator. On success the account is marked twoFactorEnabled and the
 * enrollment is audit-captured.
 *
 * Rate limited per account (30 attempts / 15 min) to bound online guessing.
 * A failed verification does NOT invalidate the pending secret — the user can
 * retry with the same device.
 */
export async function POST(req: Request) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    if (auth.user.role === 'Candidate') {
      return NextResponse.json(
        { error: 'Two-factor authentication is not available for applicant accounts.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Enter a 6-digit code from your authenticator app.' },
        { status: 400 }
      );
    }

    const rateKey = getRateLimitKey(req, `mfa-verify:${auth.user.id}`);
    const rateCheck = await checkRateLimit(rateKey, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds ?? 900) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({
        success: true,
        alreadyEnabled: true,
        message: 'Two-factor authentication is already enabled.',
      });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'No authenticator is enrolled. Start enrollment first.' },
        { status: 400 }
      );
    }

    const valid = verifyTOTP(user.twoFactorSecret, code);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid code. Check your authenticator app and try again.' },
        { status: 400 }
      );
    }

    // Enable 2FA — the secret is now verified and the account requires it on
    // future logins (enforced in the login flow).
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { twoFactorEnabled: true },
    });

    await logAuditEvent({
      action: 'MFA_ENROLLMENT_VERIFIED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: auth.user.id,
      newValues: { method: 'TOTP', enabledAt: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      enabled: true,
      message: 'Two-factor authentication is now enabled for your account.',
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    return safeErrorResponse('Failed to verify two-factor code');
  }
}

/** GET returns the current 2FA state for the signed-in staff member. */
export async function GET() {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    if (auth.user.role === 'Candidate') {
      return NextResponse.json(
        { enrolled: false, enabled: false, message: 'Not applicable.' },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    return NextResponse.json({
      enrolled: Boolean(user?.twoFactorSecret),
      enabled: Boolean(user?.twoFactorEnabled),
    });
  } catch (error) {
    console.error('MFA state error:', error);
    return safeErrorResponse('Failed to load two-factor status');
  }
}
