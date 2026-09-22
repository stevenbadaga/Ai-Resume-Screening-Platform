import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { safeErrorResponse } from '@/lib/validation';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require authentication — talent pool exposes candidate PII
    const auth = await requirePermission(Permission.ViewTalentPool);
    if (auth.error) return auth.error;

    const resolvedParams = await params;
    const jobId = resolvedParams.id;

    const job = await prisma.jobRequisition.findUnique({
      where: { id: jobId },
      include: {
        rubrics: {
          include: { criteria: true }
        }
      }
    });

    if (!job || job.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Find candidates from OTHER jobs within the SAME organization to resurface in the talent pool
    const pastApplications = await prisma.application.findMany({
      where: {
        jobId: { not: jobId },
        job: { organizationId: auth.user.organizationId },
        // §6.1: department-restricted users only see permitted departments.
        ...(auth.user.departmentRestrictions.length > 0
          ? { job: { organizationId: auth.user.organizationId, department: { in: auth.user.departmentRestrictions } } }
          : {}),
      },
      include: {
        candidate: true,
        job: true,
        screeningRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      take: 20
    });

    const matchedPool = pastApplications.map((app: any) => {
      const screeningRun = app.screeningRuns[0];
      // §9 data integrity: no fabricated defaults — an unscreened candidate is
      // reported as not yet screened (null), never as a made-up score.
      const pastScore =
        screeningRun?.effectiveResult != null
          ? Number(screeningRun.effectiveResult)
          : screeningRun?.totalResult != null
            ? Number(screeningRun.totalResult)
            : null;

      return {
        candidateId: app.candidate.id,
        applicationId: app.id,
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        candidateEmail: app.candidate.email,
        originalJob: app.job.title,
        matchScore: pastScore,
        // Real extraction output only — fabricated skill strings would mislead
        // recruiters (§7 candidate transparency).
        skillsSummary: app.candidate.tags.length > 0 ? app.candidate.tags.join(', ') : '',
        status: app.status
      };
    });

    // Unscreened candidates sort last; scored candidates by score descending.
    matchedPool.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

    return NextResponse.json({
      jobTitle: job.title,
      talentPool: matchedPool
    });
  } catch (error: any) {
    console.error('Talent pool search error:', error);
    return safeErrorResponse('Failed to search talent pool');
  }
}