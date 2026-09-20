import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { hashVerificationToken } from '@/lib/emailVerification';
import { safeErrorResponse } from '@/lib/validation';

/**
 * GET /api/auth/verify-email?token=... (spec §6.1: email ownership proof)
 *
 * Consumes a single-use, hashed, 24-hour verification token and marks the
 * user's email as verified. Returns 200 for unknown/expired/used tokens
 * without distinguishing why, so the endpoint cannot be probed for which
 * tokens exist. Idempotent: verifying an already-verified account is OK.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';

    if (!token || token.length > 128) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link. Please request a new one from the sign-in page.' },
        { status: 400 }
      );
    }

    const tokenHash = hashVerificationToken(token);
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, emailVerifiedAt: true, accessStatus: true } } },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link. Please request a new one from the sign-in page.' },
        { status: 400 }
      );
    }

    if (record.expiresAt < new Date() || record.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This verification link has expired or was already used. Please request a new one from the sign-in page.' },
        { status: 400 }
      );
    }

    // Atomic consume + verify — prevents token reuse under a race.
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.emailVerificationToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (updated.count === 0) return null;

      return tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
        select: { id: true, email: true, emailVerifiedAt: true },
      });
    });

    if (!result) {
      // Lost a concurrent race — the token was already consumed.
      return NextResponse.json(
        { success: false, error: 'This verification link was already used. Please sign in.' },
        { status: 400 }
      );
    }

    await logAuditEvent({
      action: 'EMAIL_VERIFIED',
      actorId: result.id,
      affectedRecordId: result.id,
      newValues: { email: result.email },
    });

    return NextResponse.json({
      success: true,
      email: result.email,
      message: 'Email verified. You can now sign in.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return safeErrorResponse('Failed to verify email');
  }
}
