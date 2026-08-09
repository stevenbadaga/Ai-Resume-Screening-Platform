import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logAuditEvent(params: {
  action: string;
  actorId?: string; // Optional for system actions
  affectedRecordId?: string;
  previousValues?: any;
  newValues?: any;
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
        requestContext: params.requestContext ? JSON.stringify(params.requestContext) : undefined,
      }
    });
  } catch (error) {
    // In production, we'd log this to an external secure logging service if the DB fails
    console.error('CRITICAL: Failed to write to audit log', error);
  }
}
