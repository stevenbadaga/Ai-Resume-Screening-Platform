import prisma from '@/lib/prisma';
import { resumeQueue } from '@/lib/queue';

/**
 * Screening-run recovery sweeper (spec §9 Reliability: resume processing and
 * screening must handle retries and partial failures without losing
 * confirmed user actions).
 *
 * If the worker dies mid-scoring, a ScreeningRun can remain stuck in
 * PROCESSING forever and the application looks hung. `sweepStaleScreeningRuns`
 * finds such runs, marks them FAILED with an understandable error (§6.4:
 * "safe retry behavior and an understandable error message"), and re-queues
 * the resume so the run is retried against the same approved rubric.
 *
 * Intended to be scheduled (cron / repeated worker setInterval). Dry-run by
 * default: `sweepStaleScreeningRuns({ apply: true })` to execute.
 */

export interface SweepResult {
  stuckRuns: number;
  requeued: number;
  details: Array<{ screeningRunId: string; applicationId: string }>;
}

export async function sweepStaleScreeningRuns(options?: {
  /** Minutes after which a PROCESSING run is considered abandoned. Default 30. */
  staleAfterMinutes?: number;
  /** Actually mark failed + requeue when true; otherwise only report. */
  apply?: boolean;
  /** Cap per sweep to keep each batch small. Default 25. */
  limit?: number;
}): Promise<SweepResult> {
  const staleAfterMinutes = options?.staleAfterMinutes ?? 30;
  const apply = options?.apply ?? false;
  const limit = options?.limit ?? 25;
  const cutoff = new Date(Date.now() - staleAfterMinutes * 60_000);

  const stuck = await prisma.screeningRun.findMany({
    where: { status: 'PROCESSING', updatedAt: { lt: cutoff } },
    select: { id: true, applicationId: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  if (!apply || stuck.length === 0) {
    return { stuckRuns: stuck.length, requeued: 0, details: [] };
  }

  let requeued = 0;
  const details: Array<{ screeningRunId: string; applicationId: string }> = [];

  for (const run of stuck) {
    await prisma.screeningRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        errorInformation: `Screening run abandoned after ${staleAfterMinutes} minutes in PROCESSING state (worker restart or crash). Re-queued automatically.`,
      },
    });
    details.push({ screeningRunId: run.id, applicationId: run.applicationId });

    // Re-queue the resume so processing + screening run again. The worker
    // resolves the approved rubric when rubricId is not supplied.
    const resume = await prisma.resumeDocument.findUnique({
      where: { applicationId: run.applicationId },
      select: { id: true, processingStatus: true },
    });
    if (resume) {
      await prisma.resumeDocument.update({
        where: { id: resume.id },
        data: { processingStatus: 'QUEUED' },
      });
      try {
        await resumeQueue.add('process-resume', {
          applicationId: run.applicationId,
          resumeDocumentId: resume.id,
          rubricId: undefined,
        });
        requeued += 1;
      } catch (err) {
        // Queue unavailable: the resume stays QUEUED so the next sweep (or
        // the manual retry route) picks it up — no data is lost.
        console.error(`Sweeper could not re-enqueue application ${run.applicationId}:`, err);
      }
    }
  }

  return { stuckRuns: stuck.length, requeued, details };
}
