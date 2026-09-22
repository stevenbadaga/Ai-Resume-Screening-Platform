import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse, validateBody } from '@/lib/validation';
import { z } from 'zod/v4';

/**
 * Spec §6.11 — retention configuration.
 *
 * Authorized administrators configure retention periods per application
 * status. Enforcement is performed by `scripts/applyRetention.ts` (run
 * on a schedule, e.g. cron/worker); this endpoint stores the policy and
 * records old/new values for the auditable configuration history (§6.12).
 *
 * Policy shape (stored as JSON on Organization.retentionPolicy):
 * {
 *   "statusPeriodDays": { "REJECTED": 365, "WITHDRAWN": 180, "HIRED": 730 },
 *   "anonymize": true          // anonymize rather than hard-delete applications
 * }
 */
const retentionSchema = z.object({
  statusPeriodDays: z.record(z.string().min(1).max(100), z.coerce.number().int().min(0).max(36500)),
  anonymize: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.organizationId },
      select: { retentionPolicy: true },
    });

    return NextResponse.json({
      retentionPolicy: org?.retentionPolicy ? JSON.parse(org.retentionPolicy) : null,
    });
  } catch (error) {
    console.error('Retention GET error:', error);
    return safeErrorResponse('Failed to load retention policy');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const { data, error } = validateBody(retentionSchema, await req.json());
    if (error) return error;

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.organizationId },
      select: { retentionPolicy: true },
    });

    const previousPolicy = org?.retentionPolicy ? JSON.parse(org.retentionPolicy) : null;
    const newPolicy = { statusPeriodDays: data.statusPeriodDays, anonymize: data.anonymize };

    await prisma.organization.update({
      where: { id: auth.user.organizationId },
      data: { retentionPolicy: JSON.stringify(newPolicy) },
    });

    // §6.12: configuration changes that can affect data handling must record
    // old value, new value, actor, and time (timestamp is set by the logger).
    await logAuditEvent({
      action: 'RETENTION_POLICY_UPDATED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      previousValues: previousPolicy,
      newValues: newPolicy,
    });

    return NextResponse.json({ success: true, retentionPolicy: newPolicy });
  } catch (error) {
    console.error('Retention PUT error:', error);
    return safeErrorResponse('Failed to save retention policy');
  }
}
