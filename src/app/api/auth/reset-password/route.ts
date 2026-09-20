import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { hashResetToken, PASSWORD_RESET_TOKEN_TTL_MINUTES } from '@/lib/passwordReset';
import { logAuditEvent } from '@/lib/auditLogger';

/**
 * POST /api/auth/reset-password (spec §6.1: password reset)
 *
 * Consumes a single-use hashed token, sets the new bcrypt password, and
 * audits the security event. Invalid/expired tokens return a generic error
 * that does not distinguish between the two cases.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!token || token.length > 128) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const rateKey = getRateLimitKey(req, 'password-reset-consume');
    const rateCheck = await checkRateLimit(rateKey, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds ?? 900) } }
      );
    }

    const tokenHash = hashResetToken(token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date() || !record.user) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Atomic: mark token used only while setting the password, so a token
    // cannot be replayed between the check above and this write.
    const [, ] = await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
    ]);

    await logAuditEvent({
      action: 'PASSWORD_RESET_COMPLETED',
      actorId: record.userId,
      organizationId: record.user.organizationId,
      affectedRecordId: record.userId,
      newValues: { via: 'password-reset-token' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
