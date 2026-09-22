/**
 * Staging email evidence probe (spec §6.9): performs ONE real transactional
 * send through the configured provider and records the outcome on a
 * Communication row (SENT or FAILED + failure info). Self-addressed to
 * EMAIL_FROM so no external recipient is involved.
 *
 * Usage: npx tsx scripts/emailEvidenceProbe.ts
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { sendRecordedEmail } from '../src/lib/emailService';

async function main() {
  const to = process.env.EMAIL_FROM;
  if (!to) {
    console.error('EMAIL_FROM is not set — cannot self-address the probe.');
    process.exit(1);
  }

  console.log(`Sending probe via configured provider to ${to} ...`);
  const result = await sendRecordedEmail({
    to,
    template: 'APPLICATION_CONFIRMATION',
    data: {
      candidateName: 'Staging Evidence Probe',
      jobTitle: '[EVIDENCE PROBE] Email delivery verification',
    },
  });

  const row = result.communicationId
    ? await prisma.communication.findUnique({ where: { id: result.communicationId } })
    : null;

  console.log('delivered:', result.delivered);
  if (row) {
    console.log('Communication row:', {
      id: row.id,
      template: row.template,
      deliveryState: row.deliveryState,
      failureInfo: row.failureInfo ? row.failureInfo.slice(0, 300) : null,
    });
  }
  process.exitCode = result.delivered ? 0 : 2;
}

main()
  .catch((e) => {
    console.error('Probe failed to run:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
