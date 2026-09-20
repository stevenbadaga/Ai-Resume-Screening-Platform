import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendRecordedEmail } from '@/lib/emailService';
import { requirePermission } from '@/lib/auth';
import { Permission, ROLE_PERMISSIONS, permissionsForRoleName } from '@/lib/roleAccess';
import { teamInviteSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod — enforces email format and whitelisted role names
    const { data, error } = validateBody(teamInviteSchema, body);
    if (error) return error;

    const { email, roleName } = data;

    // Ensure the role exists — permissions come from the RBAC matrix
    // (src/lib/roleAccess.ts), NOT a hardcoded fallback like ['VIEW_JOBS'].
    // Validate the role name against the matrix keys (Candidate grants zero
    // permissions but is still a valid role name).
    if (!(roleName in ROLE_PERMISSIONS)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const permissions = permissionsForRoleName(roleName);

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
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create the invited user record
    const newUser = await prisma.user.create({
      data: {
        email,
        accessStatus: 'INVITED',
        organizationId: auth.user.organizationId,
        roles: {
          connect: { id: role.id }
        }
      }
    });

    // Send invite email and record the delivery outcome honestly.
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const delivery = await sendRecordedEmail({
      to: email,
      template: 'TEAM_INVITATION',
      data: {
        candidateName: 'there',
        joinLink: `${baseUrl}/auth/signup?invite=${newUser.id}`
      },
      senderId: auth.user.id
    });

    // SECURITY: return a safe subset — never the raw Prisma user record.
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        accessStatus: newUser.accessStatus,
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
