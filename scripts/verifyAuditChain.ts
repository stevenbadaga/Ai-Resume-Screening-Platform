/**
 * Verifies the audit ledger's tamper-evidence hash chain (spec §6.1).
 *
 * Usage:
 *   npx tsx scripts/verifyAuditChain.ts
 *
 * Exit codes: 0 = chain intact, 1 = tampering/verification failure detected.
 * Safe to run as a scheduled job (cron) or before compliance reviews.
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { verifyAuditChain } from '../src/lib/auditChain';

async function main() {
  const report = await verifyAuditChain(prisma);

  console.log(`Audit chain verification: ${report.eventsChecked} event(s) checked.`);
  if (report.valid) {
    console.log('✅ Chain intact — no tampering detected.');
    return;
  }

  console.error(`❌ ${report.issues.length} issue(s) detected:`);
  for (const issue of report.issues) {
    console.error(
      `  [${issue.problem}] event ${issue.eventId} (position ${issue.index}): ${issue.detail}`
    );
  }
  process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('Audit chain verification failed to run:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
