import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { verifyTOTP } from '@/lib/totp';

/**
 * POST /api/auth/mfa/disable  { password, code? }
 *
 * Spec §6: a staff member may disable their own 2FA. To prevent account takeover
 * via a stolen session, disabling requires re-entering the current password AND
 * (if 2FA is currently enabled) a fresh TOTP code from the enrolled device.
 *
 * This means an attacker with a stolen session cookie cannot silently turn off
 * the victim's 2FA — they would also need the password (and, if 2FA is live, a
 * valid code). The action is audited.
 *
 * Deny-by-default: only the account owner may disable their own 2FA. Admins
 * cannot disable another user's 2FA through this endpoint (that would be an
 * admin action captured separately if ever needed).
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
    const password = typeof body?.password === 'string' ? body.password : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!password) {
      return NextResponse.json(
        { error: 'Your password is required to disable two-factor authentication.' },
        { status: 400 }
      );
    }

    const rateKey = getRateLimitKey(req, `mfa-disable:${auth.user.id}`);
    const rateCheck = await checkRateLimit(rateKey, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds ?? 900) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, passwordHash: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // No 2FA to disable — idempotent success.
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({
        success: true,
        alreadyDisabled: true,
        message: 'Two-factor authentication is not enabled.',
      });
    }

    // Re-authenticate with the current password.
    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    // If 2FA is enabled, also require a fresh TOTP code from the enrolled device.
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { error: 'Two-factor authentication is enabled. Enter a 6-digit code from your authenticator app to confirm.' },
          { status: 400 }
        );
      }
      if (!verifyTOTP(user.twoFactorSecret, code)) {
        return NextResponse.json(
          { error: 'Invalid two-factor code. Check your authenticator app and try again.' },
          { status: 400 }
        );
      }
    }

    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
      select: { id: true, email: true, organizationId: true },
    });

    await logAuditEvent({
      action: 'MFA_DISABLED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: auth.user.id,
      newValues: { disabledAt: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      disabled: true,
      message: 'Two-factor authentication has been turned off.',
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    return safeErrorResponse('Failed to disable two-factor authentication');
  }
}
