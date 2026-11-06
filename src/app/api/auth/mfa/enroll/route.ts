import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse } from '@/lib/validation';
import {
  generateTOTPSecret,
  buildTOTPURI,
  TOTP_INTERVAL_SECONDS,
} from '@/lib/totp';

/**
 * POST /api/auth/mfa/enroll
 *
 * Spec §6: staff (Admin, Recruiter, HiringManager, Interviewer, ComplianceAuditor)
 * may enroll a TOTP authenticator for their account. Returns a base32 secret and
 * an otpauth:// URI suitable for rendering as a QR code.
 *
 * The secret is stored on the user row; the account is NOT marked 2FA-enabled
 * until the user verifies a code from the secret (see /api/auth/mfa/verify).
 * This prevents a user from locking themselves out by enrolling a broken device.
 *
 * Deny-by-default: only authenticated staff may enroll. Candidates do not get 2FA.
 */
export async function POST(req: Request) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    // Candidates should never reach this — requirePermission already filters them,
    // but be explicit: 2FA is a staff feature.
    if (auth.user.role === 'Candidate') {
      return NextResponse.json(
        { error: 'Two-factor authentication is not available for applicant accounts.' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Already enrolled and verified: nothing to do (idempotent).
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return NextResponse.json({
        success: true,
        alreadyEnrolled: true,
        message: 'Two-factor authentication is already enabled for your account.',
      });
    }

    // Generate a fresh secret. If the user already has a pending (unverified)
    // secret, rotate it so a stalled enrollment does not stick.
    const secret = generateTOTPSecret();
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false,
      },
    });

    // Audit: enrollment initiated (not yet verified).
    await logAuditEvent({
      action: 'MFA_ENROLLMENT_INITIATED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: auth.user.id,
      newValues: { method: 'TOTP', provisionedAt: new Date().toISOString() },
    });

    const uri = buildTOTPURI(secret, auth.user.email, 'RecruitAI');

    return NextResponse.json({
      success: true,
      secret,
      uri,
      account: auth.user.email,
      issuer: 'RecruitAI',
      period: TOTP_INTERVAL_SECONDS,
      digits: 6,
      algorithm: 'SHA1',
      nextStep: 'verify',
    });
  } catch (error) {
    console.error('MFA enrollment error:', error);
    return safeErrorResponse('Failed to start two-factor enrollment');
  }
}
