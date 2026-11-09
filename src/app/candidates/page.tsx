/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import CandidatesClient from './CandidatesClient';

export const dynamic = 'force-dynamic';

export const PAGE_SIZE = 50;

/**
 * Recruiter work queue (spec §6.7) — server-side filtering + pagination.
 *
 * Previously the page loaded EVERY application in the org (with candidate,
 * job, resume, and screening-run relations) and filtered client-side; that
 * does not scale and could not express the spec's filter contract. Filters
 * and pagination now run in the database via searchParams, so the same URL
 * is shareable and exports/dashboards can agree on totals.
 *
 * Supported filters (§6.7): q (name/skills/email), job, stage, recruiter,
 * minScore/maxScore (effective AI-human score), requiredStatus
 * (missing|uncertain — required-criterion status), processing (resume
 * processing status), tags, from/to (application date), sort.
 */

export interface CandidatesSearchParams {
  q?: string;
  job?: string;
  stage?: string;
  recruiter?: string;
  minScore?: string;
  maxScore?: string;
  requiredStatus?: string;
  processing?: string;
  tags?: string;
  from?: string;
  to?: string;
  // §6.3: archived applications default out of the pipeline; `archived=true`
  // flips the view to exactly the archived application records.
  archived?: string;
  page?: string;
  sort?: string;
}

function buildWhere(params: CandidatesSearchParams, organizationId: string, userId: string, role: string) {
  const where: any = { job: { organizationId } };

  // Hiring managers only see their own requisitions (§6.7).
  if (role === 'HiringManager') {
    where.job.ownerId = userId;
  }

  if (params.job) where.jobId = params.job;
  if (params.stage && params.stage !== 'ALL') where.stage = params.stage;
  if (params.recruiter) where.assignedRecruiterId = params.recruiter;

  // §6.3 archive lifecycle: default view is active records only; recruiters
  // can inspect exactly the archived set without losing the active totals.
  if (params.archived === 'true') {
    where.archivedAt = { not: null };
  } else {
    where.archivedAt = null;
  }

  if (params.from || params.to) {
    where.createdAt = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(params.to) } : {}),
    };
  }

  if (params.tags) {
    const tags = params.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length > 0) where.candidate = { ...(where.candidate ?? {}), tags: { hasSome: tags } };
  }

  if (params.q) {
    const q = params.q.trim();
    if (q) {
      where.OR = [
        { candidate: { firstName: { contains: q, mode: 'insensitive' } } },
        { candidate: { lastName: { contains: q, mode: 'insensitive' } } },
        { candidate: { email: { contains: q, mode: 'insensitive' } } },
        { parsedProfile: { skills: { contains: q, mode: 'insensitive' } } },
      ];
    }
  }

  if (params.processing && params.processing !== 'ALL') {
    where.resumeDocument = { processingStatus: params.processing };
  }

  // Score range / required-criterion status filter on the latest screening run.
  const hasScoreFilter =
    (params.minScore && !Number.isNaN(Number(params.minScore))) ||
    (params.maxScore && !Number.isNaN(Number(params.maxScore))) ||
    (params.requiredStatus && params.requiredStatus !== 'ALL');

  if (hasScoreFilter) {
    const scoreFilter: any = {};
    if (params.minScore && !Number.isNaN(Number(params.minScore))) {
      scoreFilter.gte = Number(params.minScore);
    }
    if (params.maxScore && !Number.isNaN(Number(params.maxScore))) {
      scoreFilter.lte = Number(params.maxScore);
    }

    const scoreExpr =
      // Effective (human-corrected) result drives ranking everywhere else.
      // Prisma lacks coalesce in filters; use raw SQL via OR of both fields.
      {
        OR: [
          { effectiveResult: Object.keys(scoreFilter).length ? scoreFilter : undefined },
          // runs without an effective value fall back to totalResult
          { AND: [{ effectiveResult: null }, { totalResult: scoreFilter }] },
        ].filter(Boolean),
      };

    const runFilter: any = { is: { status: 'COMPLETED', ...scoreExpr } };

    if (params.requiredStatus === 'missing') {
      // At least one required criterion assessed MISSING → run failed a requirement.
      runFilter.is = {
        ...runFilter.is,
        assessments: { some: { result: 'MISSING', criterion: { isRequired: true } } },
      };
    } else if (params.requiredStatus === 'uncertain') {
      runFilter.is = {
        ...runFilter.is,
        assessments: { some: { uncertainty: true } },
      };
    }

    where.screeningRuns = runFilter;
  }

  return where;
}

export default async function CandidatesDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const role = (session.user as any)?.role || 'Candidate';
  const userId = (session.user as any)?.id;
  const organizationId = (session.user as any)?.organizationId;

  // Strict RBAC: Candidates must never access the ATS pipeline
  if (role === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  const sp: CandidatesSearchParams = {};
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') sp[key as keyof CandidatesSearchParams] = value;
  }

  const page = Math.max(1, Number(sp.page) || 1);
  const where = buildWhere(sp, organizationId, userId, role);

  const orderBy =
    sp.sort === 'score'
      ? [{ screeningRuns: { _count: 'desc' as const } }, { createdAt: 'desc' as const }]
      : sp.sort === 'oldest'
        ? [{ createdAt: 'asc' as const }]
        : [{ createdAt: 'desc' as const }];

  const [applicationsData, totalMatching, jobs, recruiters, tagRows] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        candidate: true,
        job: true,
        resumeDocument: true,
        parsedProfile: true,
        screeningRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.application.count({ where }),
    // Facet data for filter dropdowns — org-scoped, cheap aggregate queries.
    prisma.jobRequisition.findMany({
      where: role === 'HiringManager' ? { organizationId, ownerId: userId } : { organizationId },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
    prisma.user.findMany({
      where: { organizationId, applicationsAssigned: { some: {} } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.candidate.findMany({
      where: { applications: { some: { job: { organizationId } } }, tags: { isEmpty: false } },
      select: { tags: true },
    }),
  ]);

  const allTags = Array.from(new Set(tagRows.flatMap((c) => c.tags))).sort();

  return (
    <CandidatesClient
      applications={JSON.parse(JSON.stringify(applicationsData))}
      userRole={role}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        total: totalMatching,
        totalPages: Math.max(1, Math.ceil(totalMatching / PAGE_SIZE)),
      }}
      filters={{
        jobs,
        recruiters,
        tags: allTags,
        current: sp as Record<string, string>,
      }}
    />
  );
}
