import 'dotenv/config';
import { Worker } from 'bullmq';
import { buildQueueConnection } from './queueConnection';
import { processResume } from './resumeProcessor'; // Assuming resumeProcessor is exported from lib
import prisma from './prisma';
import { scoreCandidateProfile } from './scoringEngine';
import { scanDocumentForMalware } from './malwareScan';
import { readForProcessing } from './storage';
import { sweepStaleScreeningRuns } from './screeningRecovery';
import { initErrorTracker, trackError } from './errorTracker';

// Initialize error tracking (no-op without SENTRY_DSN) so worker-side
// failures — queue outages, scoring crashes — surface in the tracker.
initErrorTracker();

const connection = buildQueueConnection('worker');

const worker = new Worker('ResumeProcessingQueue', async job => {
  console.log(`Processing job ${job.id} for application ${job.data.applicationId}`);
  const resume = await prisma.resumeDocument.findUnique({
    where: { id: job.data.resumeDocumentId },
    include: { application: { include: { job: { include: { rubrics: true } } } } }
  });

  if (!resume) throw new Error('Resume document not found');

  // Read the document through the storage abstraction (cloud bucket, or a
  // legacy local row) — the host filesystem is never the source of truth.
  const fileBytes = await readForProcessing(resume.fileReference);

  // §6.4 defense in depth: re-scan the stored document before it reaches the
  // extraction/AI services (covers files queued by older code paths or retry).
  const scan = await scanDocumentForMalware(fileBytes);
  if (!scan.clean) {
    await prisma.resumeDocument.update({
      where: { id: resume.id },
      data: {
        processingStatus: 'FAILED',
        safeMetadata: JSON.stringify({ error: 'Malware scan failed', threats: scan.threats }),
      },
    });
    throw new Error(`Malware scan failed: ${scan.threats.join(', ')}`);
  }

  await processResume(job.data.applicationId, job.data.resumeDocumentId, fileBytes, resume.fileReference);

  const processedResume = await prisma.resumeDocument.findUnique({ where: { id: resume.id } });
  const rubricId = job.data.rubricId || resume.application.job.rubrics.find((rubric) => rubric.status === 'APPROVED')?.id;
  if (processedResume?.processingStatus === 'COMPLETED' && rubricId) {
    await scoreCandidateProfile(job.data.applicationId, rubricId);
  }
  console.log(`Job ${job.id} completed successfully`);
}, { connection });

worker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error ${err.message}`);
    trackError('worker.jobFailed', err, {
      jobId: job.id,
      applicationId: String(job.data?.applicationId ?? ''),
      attempts: job.attemptsMade,
    });
  } else {
    console.error(`Job failed with error ${err.message}`);
    trackError('worker.jobFailed', err, {});
  }
});

console.log('BullMQ Resume Processing Worker started...');

// §9 reliability: recover runs abandoned by a previous crash while this
// worker is live. The sweep re-queues stuck resumes so no application hangs.
const SWEEP_INTERVAL_MS = 10 * 60_000;
const runRecoverySweep = async () => {
  try {
    const result = await sweepStaleScreeningRuns({ apply: true });
    if (result.stuckRuns > 0) {
      console.log(
        `Recovery sweep: marked ${result.stuckRuns} stale run(s) FAILED, re-queued ${result.requeued}.`
      );
    }
  } catch (err) {
    console.error('Recovery sweep failed:', err);
  }
};
void runRecoverySweep();
const sweepTimer = setInterval(runRecoverySweep, SWEEP_INTERVAL_MS);
sweepTimer.unref?.();
