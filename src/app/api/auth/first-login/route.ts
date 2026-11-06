import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * POST /api/auth/first-login  { userId, currentPassword, newPassword, confirmPassword }
 *
 * Spec §5 first-login flow: an invited (INVITED) staff member signs in with
 * their temporary credential, is detected as needing first-time setup, and
 * MUST choose a new password before accessing protected features.
 *
 * The temporary credential is the account's initial passwordHash (set by the
 * admin create path). This endpoint verifies it, validates the new password
 * against policy, swaps to the new hash, stamps passwordChangedAt so the old
 * temporary credential is invalidated, clears mustChangePassword, and audits
 * the event.
 *
 * Deny-by-default: only INVITED accounts with mustChangePassword=true may use
 * this endpoint. After success the account is ACTIVE and mustChangePassword is
 * cleared — there is no permanent "keep the temp password" escape hatch.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, currentPassword, newPassword, confirmPassword } = body as {
      userId?: string;
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.id !== userId || !(session?.user as any)?.mustChangePassword) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 }
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match.' },
        { status: 400 }
      );
    }

    const rateKey = getRateLimitKey(req, `first-login:${userId}`);
    const rateCheck = await checkRateLimit(rateKey, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds ?? 900) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, passwordHash: true, accessStatus: true, mustChangePassword: true, organizationId: true },
    });

    if (!user) {
      // Generic — never confirm whether the account exists.
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Only invited accounts that still require a first password may use this flow.
    if (user.accessStatus !== 'INVITED' || !user.mustChangePassword) {
      return NextResponse.json(
        { error: 'This account does not require first-login setup.' },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          passwordChangedAt: new Date(),
          mustChangePassword: false,
          accessStatus: 'ACTIVE',
        },
      });
    });

    await logAuditEvent({
      action: 'FIRST_LOGIN_PASSWORD_SET',
      actorId: userId,
      organizationId: user.organizationId,
      affectedRecordId: userId,
      newValues: { email: user.email, name: user.name ?? null },
    });

    return NextResponse.json({
      success: true,
      message: 'Password set. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('First-login password set error:', error);
    return safeErrorResponse('Failed to set password');
  }
}
