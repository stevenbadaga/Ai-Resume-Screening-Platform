import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";

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

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target User ID is required' }, { status: 400 });
    }

    // Check if target user is the Primary Owner
    const org = await prisma.organization.findUnique({ where: { id: dbUser.organizationId } });
    if (org?.primaryOwnerId === targetUserId) {
      return NextResponse.json({ error: 'Cannot delete the Primary Owner of the organization.' }, { status: 403 });
    }

    // Safely delete the user
    await prisma.user.delete({ where: { id: targetUserId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
