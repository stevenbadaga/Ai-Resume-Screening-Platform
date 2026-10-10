import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { teamStatusSchema, validateBody, safeErrorResponse } from '@/lib/validation';

/**
 * Spec §6.1 — "…account activation or suspension" and administrators must be
 * able to "revoke access immediately."
 *
 * POST /api/team/status suspends or reactivates a staff account in the caller's
 * organization. Suspension takes effect immediately: requireAuth/requirePermission
 * reject any non-ACTIVE accessStatus on every protected request, so no new
 * session survives a suspension. Every change is written to the audit ledger
 * with previous/new values (§6.1, §6.12).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const { data, error } = validateBody(teamStatusSchema, await req.json());
    if (error) return error;

    const { targetUserId, action, reason } = data;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, organizationId: true, accessStatus: true },
    });
    if (!targetUser || targetUser.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUserId === auth.user.id) {
      return NextResponse.json(
        { error: 'You cannot suspend or reactivate your own account.' },
        { status: 400 }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.organizationId },
      select: { primaryOwnerId: true },
    });
    if (action === 'SUSPEND' && org?.primaryOwnerId === targetUserId) {
      return NextResponse.json(
        { error: 'The Primary Owner of the organization cannot be suspended.' },
        { status: 403 }
      );
    }

    const newStatus = action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
    if (targetUser.accessStatus === newStatus) {
      return NextResponse.json({
        success: true,
        unchanged: true,
        accessStatus: targetUser.accessStatus,
      });
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { accessStatus: newStatus },
    });

    await logAuditEvent({
      action: action === 'SUSPEND' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: targetUserId,
      previousValues: { accessStatus: targetUser.accessStatus },
      newValues: { accessStatus: newStatus, reason: reason ?? null },
    });

    return NextResponse.json({ success: true, accessStatus: newStatus });
  } catch (error) {
    console.error('Team status change error:', error);
    return safeErrorResponse('Failed to update account status');
  }
}
