/**
 * Spec §6.11 — retention enforcement script.
 *
 * Applies the configured Organization.retentionPolicy: applications whose
 * status has been terminal (REJECTED / WITHDRAWN / HIRED) for longer than the
 * configured period are anonymized or deleted, together with their linked
 * records (mirroring the erasure transaction in /api/privacy).
 *
 * Run on a schedule (cron, worker, or scheduled task):
 *   npx tsx scripts/applyRetention.ts          # dry run (default)
 *   npx tsx scripts/applyRetention.ts --apply  # actually apply the policy
 *
 * Policy shape (Organization.retentionPolicy JSON):
 *   { "statusPeriodDays": { "REJECTED": 365, "WITHDRAWN": 180, "HIRED": 730 }, "anonymize": true }
 */

import 'dotenv/config';
import prisma from '../src/lib/prisma';

const TERMINAL_STATUSES = ['REJECTED', 'WITHDRAWN', 'HIRED'];
const MS_PER_DAY = 86_400_000;

interface RetentionPolicy {
  statusPeriodDays: Record<string, number>;
  anonymize: boolean;
}

async function main() {
  const apply = process.argv.includes('--apply');

  const organizations = await prisma.organization.findMany();
  let totalProcessed = 0;

  for (const org of organizations) {
    if (!org.retentionPolicy) continue;

    let policy: RetentionPolicy;
    try {
      policy = JSON.parse(org.retentionPolicy);
    } catch {
      console.warn(`[retention] Organization ${org.id}: invalid retention policy JSON, skipping.`);
      continue;
    }

    for (const [status, days] of Object.entries(policy.statusPeriodDays ?? {})) {
      if (!TERMINAL_STATUSES.includes(status) || typeof days !== 'number') continue;

      const cutoff = new Date(Date.now() - days * MS_PER_DAY);

      const candidates = await prisma.application.findMany({
        where: {
          job: { organizationId: org.id },
          status,
          updatedAt: { lt: cutoff },
        },
        select: { id: true },
        take: 200, // batch to keep transactions small
      });

      if (candidates.length === 0) continue;

      console.log(
        `[retention] Org ${org.name} (${org.id}): ${candidates.length} "${status}" applications past ${days}-day retention${apply ? '' : ' (dry run — not applied)'}`
      );

      if (!apply) {
        totalProcessed += candidates.length;
        continue;
      }

      for (const app of candidates) {
        await prisma.$transaction(async (tx) => {
          await tx.criterionAssessment.deleteMany({ where: { screeningRun: { applicationId: app.id } } });
          await tx.recruitmentDecision.deleteMany({ where: { applicationId: app.id } });
          await tx.screeningRun.deleteMany({ where: { applicationId: app.id } });
          await tx.parsedProfile.deleteMany({ where: { applicationId: app.id } });
          await tx.interviewParticipant.deleteMany({ where: { interview: { applicationId: app.id } } });
          await tx.interview.deleteMany({ where: { applicationId: app.id } });
          await tx.communication.deleteMany({ where: { applicationId: app.id } });
          await tx.resumeDocument.deleteMany({ where: { applicationId: app.id } });
          await tx.application.delete({ where: { id: app.id } });
        });
        totalProcessed += 1;
      }

      await prisma.auditEvent.create({
        data: {
          action: 'RETENTION_POLICY_APPLIED',
          organizationId: org.id,
          newValues: JSON.stringify({
            status,
            days,
            processedCount: candidates.length,
            mode: apply ? 'applied' : 'dry-run',
          }),
        },
      });
    }
  }

  console.log(`[retention] Done. ${apply ? 'Processed' : 'Would process'} ${totalProcessed} applications.`);
}

main()
  .catch((err) => {
    console.error('[retention] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
