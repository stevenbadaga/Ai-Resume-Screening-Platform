/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { computeAuditHash } from '@/lib/auditChain';

/**
 * Appends an event to the audit ledger. Every event is chained to its
 * predecessor with a SHA-256 hash (see src/lib/auditChain.ts) so the history
 * is tamper-evident per spec §6.1 — editing or deleting a historical event
 * breaks the chain and is reported by `scripts/verifyAuditChain.ts`.
 *
 * Chaining happens inside a serializable transaction that locks the latest
 * event row (SELECT ... FOR UPDATE), so concurrent writers append strictly
 * one-after-another instead of forking the chain.
 */
export async function logAuditEvent(params: {
  action: string;
  actorId?: any;
  affectedRecordId?: any;
  previousValues?: any;
  newValues?: any;
  organizationId?: string;
  requestContext?: any;
}) {
  try {
    const previousValues = params.previousValues ? JSON.stringify(params.previousValues) : undefined;
    const newValues = params.newValues ? JSON.stringify(params.newValues) : undefined;
    const requestContext = params.requestContext ? JSON.stringify(params.requestContext) : undefined;
    const actorId = params.actorId || undefined;

    await prisma.$transaction(
      async (tx) => {
        // Lock the newest row (if any) so parallel appends serialize on it.
        const latest: Array<{ hash: string | null }> = await tx.$queryRaw`
          SELECT "hash" FROM "AuditEvent"
          ORDER BY "timestamp" DESC, "id" DESC
          LIMIT 1
          FOR UPDATE
        `;
        const previousHash = latest[0]?.hash ?? null;
        const timestamp = new Date();

        const hash = computeAuditHash(previousHash, {
          action: params.action,
          actorId: actorId ?? null,
          affectedRecordId: params.affectedRecordId ?? null,
          previousValues: previousValues ?? null,
          newValues: newValues ?? null,
          organizationId: params.organizationId ?? null,
          requestContext: requestContext ?? null,
          timestamp: timestamp.toISOString(),
        });

        await tx.auditEvent.create({
          data: {
            action: params.action,
            actorId,
            affectedRecordId: params.affectedRecordId,
            previousValues,
            newValues,
            organizationId: params.organizationId,
            requestContext,
            previousHash,
            hash,
            timestamp,
          },
        });
      },
      { isolationLevel: 'Serializable' }
    );
  } catch (error) {
    // C7 FIX: Log to stderr AND re-throw so callers are aware of audit persistence failures.
    // In production, wire this to an external logging service (e.g. CloudWatch, Datadog).
    console.error('CRITICAL: Failed to write to audit log', error);
    throw new Error(`Audit log persistence failed for action "${params.action}": ${String(error)}`);
  }
}
