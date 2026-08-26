/* eslint-disable @typescript-eslint/no-explicit-any */

import prisma from '@/lib/prisma';

export async function logAuditEvent(params: {
  action: string;
  actorId?: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any; // Optional for system actions
  affectedRecordId?: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any;
  previousValues?: any;
  newValues?: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any;
  organizationId?: string;
  requestContext?: any;
}) {
  try {
    await prisma.auditEvent.create({
      data: {
        action: params.action,
        actorId: params.actorId || undefined,
        affectedRecordId: params.affectedRecordId,
        previousValues: params.previousValues ? JSON.stringify(params.previousValues) : undefined,
        newValues: params.newValues ? JSON.stringify(params.newValues) : undefined,
        organizationId: params.organizationId,
        requestContext: params.requestContext ? JSON.stringify(params.requestContext) : undefined,
      }
    });
  } catch (error) {
    // In production, we'd log this to an external secure logging service if the DB fails
    console.error('CRITICAL: Failed to write to audit log', error);
  }
}
