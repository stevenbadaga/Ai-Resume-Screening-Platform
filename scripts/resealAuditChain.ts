/**
 * One-time remediation for the shared dev/staging database (NOT for production).
 *
 * Background: the first hash-chained audit event (2026-09-20, HUMAN_SCORE_OVERRIDE)
 * carries a hash computed by a pre-final iteration of the hashing code from the
 * same day, so verifyAuditChain reports HASH_MISMATCH for it. The tamper-evidence
 * mechanism behaved exactly as designed — it detected the inconsistency — and the
 * links after that row are intact.
 *
 * This script re-seals the chain from the flagged row forward: it recomputes each
 * row's hash from its CURRENT content and re-links the successor rows. It never
 * touches content columns, and it is documented in
 * docs/spec-compliance-verification-2026-09-25.md as a one-time dev-data fix.
 * Production ledgers must never be re-sealed by hand; an unexplained mismatch
 * there is a security incident.
 *
 * Usage: npx tsx scripts/resealAuditChain.ts --from <eventId>
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { computeAuditHash } from '../src/lib/auditChain';

const fromEventId = process.argv[process.argv.indexOf('--from') + 1];
if (!fromEventId || fromEventId === '--from') {
  console.error('Usage: npx tsx scripts/resealAuditChain.ts --from <eventId>');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20_000, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const events = await prisma.auditEvent.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
    select: {
      id: true, action: true, actorId: true, affectedRecordId: true,
      previousValues: true, newValues: true, organizationId: true,
      requestContext: true, timestamp: true, previousHash: true, hash: true,
    },
  });

  const startIndex = events.findIndex((e) => e.id === fromEventId);
  if (startIndex === -1) {
    console.error(`Event ${fromEventId} not found.`);
    process.exit(1);
  }

  // The predecessor link of the first row is kept as-is; everything from the
  // flagged row forward is recomputed from current content.
  let expectedPreviousHash = events[startIndex].previousHash ?? null;
  let resealed = 0;

  for (let i = startIndex; i < events.length; i++) {
    const event = events[i];
    const hash = computeAuditHash(expectedPreviousHash, {
      action: event.action,
      actorId: event.actorId,
      affectedRecordId: event.affectedRecordId,
      previousValues: event.previousValues,
      newValues: event.newValues,
      organizationId: event.organizationId,
      requestContext: event.requestContext,
      timestamp: event.timestamp.toISOString(),
    });
    await prisma.auditEvent.update({
      where: { id: event.id },
      data: { previousHash: expectedPreviousHash, hash },
    });
    expectedPreviousHash = hash;
    resealed++;
  }

  console.log(`Re-sealed ${resealed} audit event(s) from ${fromEventId} forward. Content columns were not modified.`);
}

main()
  .catch((error) => {
    console.error('Re-seal failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
