import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission, isPermission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';

export async function PATCH(req: Request) {
  const auth = await requirePermission(Permission.ManageTeam);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  if (typeof body.userId !== 'string' || !Array.isArray(body.permissions) || body.permissions.some((p: unknown) => typeof p !== 'string' || !isPermission(p))) {
    return NextResponse.json({ error: 'Invalid permission assignment.' }, { status: 400 });
  }
  const permissions = [...new Set(body.permissions as string[])];
  if (permissions.some((p) => !auth.user.permissions.includes(p as any))) {
    return NextResponse.json({ error: 'You cannot grant permissions you do not hold.' }, { status: 403 });
  }
  if (body.userId === auth.user.id) {
    return NextResponse.json({ error: 'You cannot edit your own permission overrides.' }, { status: 403 });
  }

  const target = await prisma.user.findFirst({
    where: { id: body.userId, organizationId: auth.user.organizationId },
    select: { id: true, email: true, customPermissions: true },
  });
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  await prisma.user.update({ where: { id: target.id }, data: { customPermissions: permissions } });
  await logAuditEvent({
    action: 'USER_PERMISSIONS_MODIFIED', actorId: auth.user.id,
    organizationId: auth.user.organizationId, affectedRecordId: target.id,
    previousValues: { customPermissions: target.customPermissions },
    newValues: { customPermissions: permissions, granteeEmail: target.email },
  });
  return NextResponse.json({ success: true, permissions });
}
