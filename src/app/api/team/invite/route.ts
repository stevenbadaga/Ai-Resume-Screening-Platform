import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMockEmail } from '@/lib/mockEmailService';
import { requireAuth } from '@/lib/auth';
import { teamInviteSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Fixed getServerSession() → requireAuth (uses authOptions)
    const auth = await requireAuth(['Admin']);
    if (auth.error) return auth.error;
    
    // Verify caller has the right permissions from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { roles: true }
    });

    if (!dbUser || !dbUser.roles.some(r => r.permissions.includes('ALL') || r.permissions.includes('MANAGE_TEAM'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Validate input with Zod — enforces email format and whitelisted role names
    const { data, error } = validateBody(teamInviteSchema, body);
    if (error) return error;

    const { email, roleName } = data;

    // Create the role if it doesn't exist
    let role = await prisma.role.findFirst({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({
        data: { name: roleName, permissions: ['VIEW_JOBS'] }
      });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create placeholder user
    const newUser = await prisma.user.create({
      data: {
        email,
        accessStatus: 'INVITED',
        organizationId: dbUser.organizationId,
        roles: {
          connect: { id: role.id }
        }
      }
    });

    // Send invite email — SECURITY: Use template literal properly
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    await sendMockEmail(email, 'TEAM_INVITATION', {
      inviterName: dbUser.name || 'Your Team',
      role: roleName,
      joinLink: `${baseUrl}/auth/signup?invite=${newUser.id}`
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Invite error:', error);
    return safeErrorResponse('Internal server error');
  }
}
