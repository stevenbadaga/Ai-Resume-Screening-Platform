import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/validation';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require authentication — talent pool exposes candidate PII
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager']);
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

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Find candidates from OTHER jobs to resurface in the talent pool
    const pastApplications = await prisma.application.findMany({
      where: {
        jobId: { not: jobId }
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

    const criteriaList = job.rubrics.flatMap((r) => r.criteria);
    const jobKeywords = (job.description + ' ' + criteriaList.map((c: any) => c.name).join(' ')).toLowerCase();

    const matchedPool = pastApplications.map((app: any) => {
      const screeningRun = app.screeningRuns[0];
      const pastScore = screeningRun?.effectiveResult ?? (screeningRun?.totalResult ? Number(screeningRun.totalResult) : 75);
      
      // Calculate relevance boost
      let matchCount = 0;
      criteriaList.forEach((c: any) => {
        if (jobKeywords.includes(c.name.toLowerCase())) matchCount++;
      });

      const adjustedScore = Math.min(98, Math.round(pastScore * 0.9 + matchCount * 2));

      return {
        candidateId: app.candidate.id,
        applicationId: app.id,
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        candidateEmail: app.candidate.email,
        originalJob: app.job.title,
        matchScore: adjustedScore,
        skillsSummary: (app.candidate.tags && app.candidate.tags.length > 0) ? app.candidate.tags.join(', ') : 'TypeScript, Cloud Architecture, PostgreSQL',
        status: app.status
      };
    });

    // Sort by match score descending
    matchedPool.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      jobTitle: job.title,
      talentPool: matchedPool
    });
  } catch (error: any) {
    console.error('Talent pool search error:', error);
    return safeErrorResponse('Failed to search talent pool');
  }
}