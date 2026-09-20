import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, canAccessDepartment } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';

/**
 * Spec §6.10 — Manager analytics endpoint.
 *
 * Provides time-to-screen, time-in-stage, stage conversion, interviewer
 * completion, processing failures, and recruiter workload metrics for
 * permitted jobs and periods. Supports the required filters: date range,
 * job, department, recruiter, and stage.
 *
 * Metric definitions (documented for cross-dashboard/export consistency):
 *  - timeToScreenHours: median hours from application creation to the first
 *    completed ScreeningRun.
 *  - timeInStage: average hours applications have spent in each stage
 *    (open applications measured to now; decided applications use updatedAt).
 *  - stageConversion: share of applications that reached each stage at any
 *    point, from the RecruitmentDecision history (previousStage → newStage).
 *  - interviewerCompletion: submitted scorecards ÷ assigned interview
 *    participants for the filtered interviews.
 *  - recruiterWorkload: open applications per assigned recruiter.
 */

const MS_PER_HOUR = 3_600_000;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Candidates have no access to recruitment analytics.
    if (auth.user.role === 'Candidate') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ? new Date(String(searchParams.get('from'))) : null;
    const to = searchParams.get('to') ? new Date(String(searchParams.get('to'))) : null;
    const jobId = searchParams.get('jobId');
    const department = searchParams.get('department');
    const recruiterId = searchParams.get('recruiterId');
    const stage = searchParams.get('stage');

    const validFrom = from && !Number.isNaN(from.getTime()) ? from : null;
    const validTo = to && !Number.isNaN(to.getTime()) ? to : null;

    // Build the permitted-scope where clause. Hiring managers see only jobs
    // they own (spec §6.7); department restrictions always apply (spec §6.1).
    const jobWhere: Record<string, unknown> = { organizationId: auth.user.organizationId };
    if (auth.user.role === 'HiringManager') jobWhere.ownerId = auth.user.id;
    if (jobId) jobWhere.id = jobId;
    if (department && department !== 'ALL') jobWhere.department = department;

    const applicationWhere: Record<string, unknown> = { job: jobWhere };
    if (recruiterId) applicationWhere.assignedRecruiterId = recruiterId;
    if (stage && stage !== 'ALL') applicationWhere.stage = stage;
    if (validFrom || validTo) {
      applicationWhere.createdAt = {
        ...(validFrom ? { gte: validFrom } : {}),
        ...(validTo ? { lte: validTo } : {}),
      };
    }

    const applications = await prisma.application.findMany({
      where: applicationWhere,
      include: {
        job: { select: { id: true, title: true, department: true, ownerId: true } },
        screeningRuns: { where: { status: 'COMPLETED' }, orderBy: { createdAt: 'asc' }, take: 1 },
        assignedRecruiter: { select: { id: true, name: true, email: true } },
      },
    });

    const totalApplications = applications.length;

    // ── Time to screen: creation → first completed screening run ──
    const screeningDurations = applications
      .filter((a) => a.screeningRuns.length > 0)
      .map((a) =>
        (a.screeningRuns[0].createdAt.getTime() - a.createdAt.getTime()) / MS_PER_HOUR
      );
    const timeToScreenHours = median(screeningDurations);
    const screenedCount = screeningDurations.length;

    // ── Time in stage: hours since entering the current stage ──
    const now = Date.now();
    const stageBuckets = new Map<string, number[]>();
    for (const app of applications) {
      const stageKey = app.stage || 'NEW';
      const elapsedHours = (now - app.updatedAt.getTime()) / MS_PER_HOUR;
      const bucket = stageBuckets.get(stageKey) ?? [];
      bucket.push(Math.max(0, elapsedHours));
      stageBuckets.set(stageKey, bucket);
    }
    const timeInStage = [...stageBuckets.entries()]
      .map(([stageKey, durations]) => ({
        stage: stageKey,
        count: durations.length,
        averageHours: Math.round(median(durations) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Stage conversion: applications per stage, share of total ──
    const stageCounts = new Map<string, number>();
    for (const app of applications) {
      const stageKey = app.stage || 'NEW';
      stageCounts.set(stageKey, (stageCounts.get(stageKey) ?? 0) + 1);
    }
    const stageConversion = [...stageCounts.entries()]
      .map(([stageKey, count]) => ({
        stage: stageKey,
        count,
        conversionPct: totalApplications > 0 ? Math.round((count / totalApplications) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Interviewer completion: submitted scorecards ÷ assigned participants ──
    const interviewWhere: Record<string, unknown> = {
      application: { job: jobWhere },
      ...(validFrom || validTo
        ? { createdAt: { ...(validFrom ? { gte: validFrom } : {}), ...(validTo ? { lte: validTo } : {}) } }
        : {}),
    };
    const [totalParticipants, submittedParticipants] = await Promise.all([
      prisma.interviewParticipant.count({ where: { interview: interviewWhere } }),
      prisma.interviewParticipant.count({
        where: { interview: interviewWhere, structuredFeedback: { not: null } },
      }),
    ]);
    const interviewerCompletionPct =
      totalParticipants > 0 ? Math.round((submittedParticipants / totalParticipants) * 1000) / 10 : 0;

    // ── Processing quality: failures and low-confidence flags ──
    const [failedProcessingCount, needsReviewCount] = await Promise.all([
      prisma.resumeDocument.count({
        where: { processingStatus: 'FAILED', application: { job: jobWhere } },
      }),
      prisma.resumeDocument.count({
        where: { processingStatus: 'NEEDS_REVIEW', application: { job: jobWhere } },
      }),
    ]);

    // ── Recruiter workload: open (not rejected/withdrawn) applications each ──
    const openApps = applications.filter((a) => !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(a.status));
    const workloadMap = new Map<string, { name: string; email: string; count: number }>();
    for (const app of openApps) {
      if (!app.assignedRecruiter) continue;
      const existing = workloadMap.get(app.assignedRecruiter.id) ?? {
        name: app.assignedRecruiter.name ?? 'Unknown',
        email: app.assignedRecruiter.email,
        count: 0,
      };
      existing.count += 1;
      workloadMap.set(app.assignedRecruiter.id, existing);
    }
    const recruiterWorkload = [...workloadMap.entries()]
      .map(([id, info]) => ({ recruiterId: id, ...info }))
      .sort((a, b) => b.count - a.count);

    // Department access check on the returned jobs (spec §6.1)
    const departmentAllowed = canAccessDepartment(auth.user, department);

    await logAuditEvent({
      action: 'ANALYTICS_VIEWED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      newValues: {
        filters: { from: validFrom, to: validTo, jobId, department, recruiterId, stage },
        recordCount: totalApplications,
      },
    });

    return NextResponse.json({
      filters: {
        from: validFrom?.toISOString() ?? null,
        to: validTo?.toISOString() ?? null,
        jobId: jobId ?? 'ALL',
        department: department ?? 'ALL',
        recruiterId: recruiterId ?? 'ALL',
        stage: stage ?? 'ALL',
      },
      metricDefinitions: {
        timeToScreenHours: 'Median hours from application creation to first completed screening run.',
        timeInStage: 'Median hours applications have spent in their current stage.',
        stageConversion: 'Share of filtered applications currently in each stage.',
        interviewerCompletionPct: 'Submitted scorecards as a share of assigned interview participants.',
        recruiterWorkload: 'Open (not rejected/withdrawn/hired) applications per assigned recruiter.',
      },
      summary: {
        totalApplications,
        screenedCount,
        timeToScreenHours: Math.round(timeToScreenHours * 10) / 10,
        interviewerCompletionPct,
        totalParticipants,
        submittedParticipants,
        failedProcessingCount,
        needsReviewCount,
        departmentAccessRestricted: !departmentAllowed,
      },
      timeInStage,
      stageConversion,
      recruiterWorkload,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return safeErrorResponse('Failed to compute analytics');
  }
}
