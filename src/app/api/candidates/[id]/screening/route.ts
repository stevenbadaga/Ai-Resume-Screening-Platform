import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { resumeQueue } from '@/lib/queue';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse } from '@/lib/validation';

/**
 * Spec §6.5 — "Recruiters must be able to rerun screening after an approved
 * change while retaining earlier results for comparison and audit."
 *
 * POST /api/candidates/[id]/screening queues a screen-only re-run against the
 * job's current APPROVED rubric. Earlier ScreeningRun rows are never touched,
 * so the run history remains complete and comparable. Idempotent per active
 * run: if a run is already PROCESSING, the request is refused with 409 rather
 * than spawning a duplicate (§9 reliability — no duplicate records).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.RunScreening);
    if (auth.error) return auth.error;

    const { id } = await params;

    const application = await prisma.application.findFirst({
      where: { id, job: { organizationId: auth.user.organizationId } },
      include: {
        resumeDocument: true,
        job: { include: { rubrics: true } },
        screeningRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!application.resumeDocument) {
      return NextResponse.json(
        { error: 'This application has no resume document to screen.' },
        { status: 409 }
      );
    }

    if (application.resumeDocument.processingStatus !== 'COMPLETED') {
      return NextResponse.json(
        {
          error:
            `Resume processing is ${application.resumeDocument.processingStatus} — it must complete before screening can run. Use retry processing if it failed.`,
        },
        { status: 409 }
      );
    }

    // §6.2: only an APPROVED rubric version may drive official screening.
    const approvedRubric = application.job.rubrics.find((r) => r.status === 'APPROVED');
    if (!approvedRubric) {
      return NextResponse.json(
        { error: 'No APPROVED rubric version exists for this job yet (spec §6.2).' },
        { status: 409 }
      );
    }

    // §9 reliability: refuse to queue a duplicate while one is in flight.
    const activeRun = await prisma.screeningRun.findFirst({
      where: { applicationId: application.id, status: 'PROCESSING' },
      select: { id: true },
    });
    if (activeRun) {
      return NextResponse.json(
        { error: 'A screening run is already in progress for this application.' },
        { status: 409 }
      );
    }

    await resumeQueue.add('screen-candidate', {
      applicationId: application.id,
      resumeDocumentId: application.resumeDocument.id,
      rubricId: approvedRubric.id,
      screenOnly: true,
    });

    await logAuditEvent({
      action: 'SCREENING_RERUN_REQUESTED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: application.id,
      newValues: {
        rubricId: approvedRubric.id,
        rubricVersion: approvedRubric.version,
        previousRunId: application.screeningRuns[0]?.id ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      queued: true,
      rubricId: approvedRubric.id,
      rubricVersion: approvedRubric.version,
      previousRunId: application.screeningRuns[0]?.id ?? null,
    });
  } catch (error) {
    console.error('Screening rerun error:', error);
    return safeErrorResponse('Failed to queue screening run');
  }
}
