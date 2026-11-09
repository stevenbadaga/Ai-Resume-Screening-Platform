import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendRecordedEmail } from '@/lib/emailService';
import { requirePermission } from '@/lib/auth';
import { Permission, ROLE_PERMISSIONS, isPermission, permissionsForRoleName } from '@/lib/roleAccess';
import { teamInviteSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod — enforces email format and whitelisted role names
    const { data, error } = validateBody(teamInviteSchema, body);
    if (error) return error;

    const { email, name, roleName } = data;

    // Ensure the role exists — permissions come from the RBAC matrix
    // (src/lib/roleAccess.ts), NOT a hardcoded fallback like ['VIEW_JOBS'].
    // Validate the role name against the matrix keys (Candidate grants zero
    // permissions but is still a valid role name).
    if (!(roleName in ROLE_PERMISSIONS)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const permissions = permissionsForRoleName(roleName);
    const requestedPermissions = [...new Set(data.permissions ?? [])];
    if (requestedPermissions.some((p) => !isPermission(p) || !auth.user.permissions.includes(p as any)) || permissions.some((p) => !auth.user.permissions.includes(p as any))) {
      return NextResponse.json({ error: 'You cannot grant permissions you do not hold.' }, { status: 403 });
    }

    let role = await prisma.role.findFirst({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({
        data: { name: roleName, permissions }
      });
    } else if (role.name !== 'Admin') {
      // Repair legacy rows created with incomplete permission lists.
      const missing = permissions.filter((p) => !role!.permissions.includes(p));
      if (missing.length > 0) {
        role = await prisma.role.update({
          where: { id: role.id },
          data: { permissions: [...role.permissions, ...missing] }
        });
      }
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { roles: true }
    });

    let userId: string;
    let userAccessStatus: string;
    let isResend = false;

    // Spec §5: create a cryptographically random temporary password for the
    // invited account. It is hashed immediately (never stored plaintext) and
    // delivered ONLY inside the invite email (single-use, short-lived path).
    const tempPassword = randomBytes(18).toString('base64url').slice(0, 16);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    if (existing) {
      const isCandidate = existing.roles.length === 0 || existing.roles.some((r) => r.name === 'Candidate');
      const isSameOrg = existing.organizationId === auth.user.organizationId;
      const isAlreadyActiveStaff = isSameOrg && existing.accessStatus === 'ACTIVE' && !isCandidate;

      if (isAlreadyActiveStaff) {
        return NextResponse.json(
          { error: 'This user is already an active staff member in your workspace.' },
          { status: 400 }
        );
      }

      // Existing user is either in INVITED status, or a candidate transitioning to staff.
      // Re-issue a fresh temporary password and re-send the invitation email.
      isResend = true;
      const updatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          passwordHash,
          accessStatus: 'INVITED',
          mustChangePassword: true,
          customPermissions: requestedPermissions,
          organizationId: auth.user.organizationId || existing.organizationId,
          roles: {
            set: [{ id: role.id }]
          }
        }
      });
      userId = updatedUser.id;
      userAccessStatus = updatedUser.accessStatus;
    } else {
      // Create the invited user record
      const newUser = await prisma.user.create({
        data: {
          email,
          name: name || null,
          passwordHash,
          accessStatus: 'INVITED',
          mustChangePassword: true,
          customPermissions: requestedPermissions,
          organizationId: auth.user.organizationId,
          roles: {
            connect: { id: role.id }
          }
        }
      });
      userId = newUser.id;
      userAccessStatus = newUser.accessStatus;
    }

    // Send invite email with the temporary credential and a first-login instruction.
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const organization = auth.user.organizationId
      ? await prisma.organization.findUnique({
          where: { id: auth.user.organizationId },
          select: { name: true },
        })
      : null;

    const delivery = await sendRecordedEmail({
      to: email,
      template: 'TEAM_INVITATION',
      data: {
        candidateName: name || email.split('@')[0],
        joinLink: `${baseUrl}/auth/signin`,
        tempPassword,
        newRole: role.name,
        organizationName: organization?.name ?? 'RecruitAI Workspace',
      },
      senderId: auth.user.id
    });

    // SECURITY: return a safe subset — never the raw Prisma user record.
    return NextResponse.json({
      success: true,
      resent: isResend,
      user: {
        id: userId,
        email,
        accessStatus: userAccessStatus,
        roleName: role.name
      },
      emailDelivered: delivery.delivered,
      emailError: delivery.delivered ? undefined : delivery.error
    });
  } catch (error) {
    console.error('Invite error:', error);
    return safeErrorResponse('Internal server error');
  }
}
