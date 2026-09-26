import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { sweepStaleScreeningRuns } from '../src/lib/screeningRecovery';

/**
 * Scheduled recovery sweep (spec §9 reliability). Run from cron, e.g.:
 *
 *   # report only, every 10 minutes
 *   npx tsx scripts/sweepStaleRuns.ts
 *   # act every 10 minutes
 *   npx tsx scripts/sweepStaleRuns.ts --apply
 */

async function main() {
  const apply = process.argv.includes('--apply');
  const result = await sweepStaleScreeningRuns({ apply });

  if (result.stuckRuns === 0) {
    console.log('No stale PROCESSING screening runs found.');
  } else if (apply) {
    console.log(
      `Marked ${result.stuckRuns} stale run(s) FAILED; re-queued ${result.requeued} resume(s) for retry.`
    );
    for (const d of result.details) {
      console.log(`  - run ${d.screeningRunId} (application ${d.applicationId})`);
    }
  } else {
    console.log(
      `${result.stuckRuns} stale PROCESSING run(s) detected (dry run — pass --apply to mark FAILED and re-queue).`
    );
    for (const d of result.details) {
      console.log(`  - run ${d.screeningRunId} (application ${d.applicationId})`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Sweep failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
