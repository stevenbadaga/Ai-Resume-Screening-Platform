import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { sendMockEmail } from '@/lib/mockEmailService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    
    // Check if current user is an Admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: true }
    });

    if (!dbUser || !dbUser.roles.some(r => r.permissions.includes('ALL') || r.permissions.includes('MANAGE_TEAM'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, roleName } = await req.json();

    if (!email || !roleName) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

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

    // Send invite email
    await sendMockEmail(email, 'TEAM_INVITATION', {
      inviterName: dbUser.name || 'Your Team',
      role: roleName,
      joinLink: "http://localhost:3000/auth/signup?invite=${newUser.id}"
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
