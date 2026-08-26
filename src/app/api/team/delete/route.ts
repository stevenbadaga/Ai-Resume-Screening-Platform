import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { teamDeleteSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Fixed getServerSession() → requireAuth (uses authOptions)
    const auth = await requireAuth(['Admin']);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input
    const { data, error } = validateBody(teamDeleteSchema, body);
    if (error) return error;

    const { targetUserId } = data;
    
    // Verify caller has the right permissions from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { roles: true }
    });

    if (!dbUser || !dbUser.roles.some(r => r.permissions.includes('ALL') || r.permissions.includes('MANAGE_TEAM'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser || targetUser.organizationId !== dbUser.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (targetUserId === auth.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
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
    return safeErrorResponse('Internal server error');
  }
}
