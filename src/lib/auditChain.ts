/**
 * Tamper-evident audit chaining (spec §6.1: sensitive actions must be written
 * to an immutable or tamper-evident audit history).
 *
 * Every AuditEvent stores:
 *  - previousHash: the `hash` of the event written immediately before it
 *  - hash: SHA-256 over the event's own content plus previousHash
 *
 * Because each event commits to its predecessor, silently editing or deleting
 * a historical event breaks the chain and is detected by verifyAuditChain().
 * (The database itself remains writable — tamper-evidence is detection, not
 * prevention, which is exactly what the spec asks for.)
 */

import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';

export interface AuditChainPayload {
  action: string;
  actorId?: string | null;
  affectedRecordId?: string | null;
  previousValues?: string | null;
  newValues?: string | null;
  organizationId?: string | null;
  requestContext?: string | null;
  timestamp: string; // ISO string — serialized form is what gets committed
}

/**
 * Computes the chain hash for an event. Deterministic: the same payload plus
 * the same previousHash always produces the same digest, which is what makes
 * independent re-verification possible.
 */
export function computeAuditHash(previousHash: string | null | undefined, event: AuditChainPayload): string {
  const canonical = JSON.stringify({
    previousHash: previousHash ?? null,
    action: event.action,
    actorId: event.actorId ?? null,
    affectedRecordId: event.affectedRecordId ?? null,
    previousValues: event.previousValues ?? null,
    newValues: event.newValues ?? null,
    organizationId: event.organizationId ?? null,
    requestContext: event.requestContext ?? null,
    timestamp: event.timestamp,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export interface AuditChainIssue {
  eventId: string;
  index: number;
  problem: 'HASH_MISMATCH' | 'BROKEN_LINK' | 'MISSING_HASH';
  detail: string;
}

export interface AuditChainReport {
  valid: boolean;
  eventsChecked: number;
  /** Rows written before hash chaining was enabled — informational, not tampering. */
  grandfathered: number;
  issues: AuditChainIssue[];
}

/**
 * Re-walks the audit ledger in chronological order and recomputes every hash.
 * Rows without a hash predate hash chaining and are reported as informational
 * (grandfathered), never as tampering. Returns the list of problems found
 * (empty = chain intact).
 */
export async function verifyAuditChain(prisma: PrismaClient): Promise<AuditChainReport> {
  const events = await prisma.auditEvent.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      action: true,
      actorId: true,
      affectedRecordId: true,
      previousValues: true,
      newValues: true,
      organizationId: true,
      requestContext: true,
      timestamp: true,
      previousHash: true,
      hash: true,
    },
  });

  const issues: AuditChainIssue[] = [];
  let grandfathered = 0;
  let expectedPreviousHash: string | null = null;

  for (let index = 0; index < events.length; index++) {
    const event = events[index];

    if (!event.hash) {
      // Written before hash chaining was enabled — can only be reported
      // informationally; the verifiable chain starts at the first hashed row.
      grandfathered++;
      expectedPreviousHash = null;
      continue;
    }

    if ((event.previousHash ?? null) !== expectedPreviousHash) {
      issues.push({
        eventId: event.id,
        index,
        problem: 'BROKEN_LINK',
        detail: `previousHash does not match the hash of the preceding event`,
      });
    }

    const recomputed = computeAuditHash(event.previousHash, {
      action: event.action,
      actorId: event.actorId,
      affectedRecordId: event.affectedRecordId,
      previousValues: event.previousValues,
      newValues: event.newValues,
      organizationId: event.organizationId,
      requestContext: event.requestContext,
      timestamp: event.timestamp.toISOString(),
    });

    if (recomputed !== event.hash) {
      issues.push({
        eventId: event.id,
        index,
        problem: 'HASH_MISMATCH',
        detail: 'Stored hash does not match the event content — the row was modified after write',
      });
    }

    expectedPreviousHash = event.hash;
  }

  return { valid: issues.length === 0, eventsChecked: events.length, grandfathered, issues };
}
