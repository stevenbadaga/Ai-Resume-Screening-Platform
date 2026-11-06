import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { teamRoleSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { permissionsForRoleName } from '@/lib/roleAccess';

export async function PATCH(req: Request) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input — enforces UUID format and whitelisted role names
    const { data, error } = validateBody(teamRoleSchema, body);
    if (error) return error;

    const { userId, newRole } = data;

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userId === auth.user.id) {
      return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 403 });
    }
    const callerPermissions = auth.user.permissions;
    const granteePermissions = permissionsForRoleName(newRole);
    if (granteePermissions.some((p) => !callerPermissions.includes(p as Permission))) {
      return NextResponse.json({ error: `Cannot assign role "${newRole}": it carries permissions not held by the caller.` }, { status: 403 });
    }

    // Find or create role in database — permission strings come from the RBAC
    // matrix via the single shared helper, never a local hardcoded list.
    let roleRecord = await prisma.role.findFirst({
      where: { name: newRole }
    });

    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: {
          name: newRole,
          permissions: permissionsForRoleName(newRole)
        }
      });
    } else {
      // Self-heal legacy rows whose stored strings predate the unified matrix.
      const canonical = permissionsForRoleName(newRole);
      if (JSON.stringify([...roleRecord.permissions].sort()) !== JSON.stringify([...canonical].sort())) {
        roleRecord = await prisma.role.update({
          where: { id: roleRecord.id },
          data: { permissions: canonical },
        });
      }
    }

    // Security: prevent self-escalation and protect the lastAdmin.
    // Only grant a role whose permission set is a subset of the caller's.
    // This prevents an Admin from accidentally (or deliberately) granting a role
    // with capabilities they do not themselves possess.
    // Protect the organization's last Admin from demotion.
    if (newRole !== 'Admin' && targetUser.roles.some((r) => r.name === 'Admin')) {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: auth.user.organizationId,
          roles: { some: { name: 'Admin' } },
        },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last Admin of the organization.' },
          { status: 403 }
        );
      }
    }

    // Update user's roles
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: [{ id: roleRecord.id }]
        }
      },
      include: { roles: true, organization: true }
    });

    await logAuditEvent({
      action: 'ROLE_MODIFIED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: userId,
      previousValues: { role: targetUser.roles?.[0]?.name },
      newValues: { role: newRole, granteeEmail: targetUser.email }
    });

    return NextResponse.json({
      success: true,
      message: `Updated role for ${targetUser.name || targetUser.email} to ${newRole}`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Role update error:', error);
    // SECURITY: Never leak internal error details
    return safeErrorResponse('Failed to update role');
  }
}
