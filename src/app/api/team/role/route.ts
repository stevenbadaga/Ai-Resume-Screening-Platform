import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requireAuth } from '@/lib/auth';
import { teamRoleSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(['Admin']);
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

    // Find or create role in database
    let roleRecord = await prisma.role.findFirst({
      where: { name: newRole }
    });

    if (!roleRecord) {
      const getPermissionsForRole = (r: string) => {
        switch (r) {
          case 'Admin': return ['ALL'];
          case 'Recruiter': return ['MANAGE_CANDIDATES', 'OVERRIDE_SCORES', 'EXTEND_OFFERS'];
          case 'HiringManager': return ['VIEW_DEPARTMENT_CANDIDATES', 'OVERRIDE_SCORES'];
          case 'Interviewer': return ['EVALUATE_CANDIDATES', 'SUBMIT_SCORECARDS'];
          case 'ComplianceAuditor': return ['VIEW_AUDIT_LOGS', 'INSPECT_MODELS'];
          case 'Candidate': return ['VIEW_OWN_APPLICATIONS'];
          default: return ['READ_ONLY'];
        }
      };

      roleRecord = await prisma.role.create({
        data: {
          name: newRole,
          permissions: getPermissionsForRole(newRole)
        }
      });
    }

    // Update user's roles
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: [{ id: roleRecord.id }]
        }
      },
      include: { roles: true }
    });

    await logAuditEvent({
      action: 'ROLE_MODIFIED',
      actorId: auth.user.id,
      affectedRecordId: userId,
      previousValues: { role: targetUser.roles?.[0]?.name },
      newValues: { role: newRole }
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