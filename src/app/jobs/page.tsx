/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import JobsClient from './JobsClient';
import { firstParam, parsePagination, toPageInfo } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

/**
 * Job requisition board (§6.2) — server-side filtering + pagination.
 *
 * Previously loaded every requisition in the org with all rubrics, criteria,
 * and applications attached, then rendered them client-side. Now filters and
 * paging run in the database via searchParams (shareable URLs, consistent
 * totals with exports and dashboards):
 *
 *   q (title/description/department), status, department, page.
 *
 * Candidates keep the org-wide OPEN listing (public board volume is bounded
 * by open requisitions) but still get paged + searchable results.
 */
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'Candidate';
  const organizationId = (session?.user as any)?.organizationId;

  const sp = await searchParams;
  const { page, pageSize, skip, take } = parsePagination(sp);
  const q = firstParam(sp, 'q');
  const status = firstParam(sp, 'status');
  const department = firstParam(sp, 'department');

  const isPublicListing = userRole === 'Candidate';
  const whereClause: any =
    isPublicListing
      ? { status: 'OPEN', AND: [{ OR: [{ opensAt: null }, { opensAt: { lte: new Date() } }] }, { OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }] }] }
      : { organizationId };

  // Department-restricted staff only see permitted departments (§6.1).
  if (userRole !== 'Candidate') {
    const departmentRestrictions = (session?.user as any)?.departmentRestrictions as string[] | undefined;
    if (departmentRestrictions?.length) {
      whereClause.department = { in: departmentRestrictions };
    }
  }

  if (!isPublicListing && status && status !== 'ALL') {
    whereClause.status = status;
  }
  if (!isPublicListing && department && department !== 'ALL') {
    // Composes with department restrictions (restrictions win via AND).
    whereClause.department = whereClause.department
      ? { in: [department] }
      : department;
    if (userRole !== 'Candidate' && (session?.user as any)?.departmentRestrictions?.length) {
      whereClause.department = { in: [department] };
    }
  }
  if (q) {
    whereClause.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { department: { contains: q, mode: 'insensitive' } },
    ];
  }

  const candidateEmail = (session?.user as any)?.email as string | undefined;

  const [jobs, total, departmentRows, cand] = await Promise.all([
    isPublicListing ? prisma.jobRequisition.findMany({
      where: whereClause,
      select: {
        id: true, title: true, department: true, location: true, employmentType: true,
        description: true, opensAt: true, closesAt: true, status: true, createdAt: true,
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }, skip, take,
    }) : prisma.jobRequisition.findMany({
      where: whereClause,
      include: {
        organization: { select: { id: true, name: true } },
        rubrics: { orderBy: { version: 'desc' }, take: 1, include: { criteria: true } },
        // Count aggregates instead of pulling every application row —
        // the card only displays the number.
        _count: { select: { applications: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.jobRequisition.count({ where: whereClause }),
    // Department facet for the filter dropdown (staff only).
    userRole === 'Candidate'
      ? Promise.resolve([])
      : prisma.jobRequisition.findMany({
          where: { organizationId },
          select: { department: true },
          distinct: ['department'],
        }),
    // Candidate context fetched in parallel with jobs board
    userRole === 'Candidate' && candidateEmail
      ? prisma.candidate.findFirst({
          where: { email: candidateEmail },
          select: {
            profileResumeRef: true,
            applications: {
              select: {
                id: true,
                jobId: true,
                status: true,
                stage: true,
                createdAt: true,
                screeningRuns: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { totalResult: true, effectiveResult: true },
                },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  // JobsClient cards read `job.applications.length`; map the count aggregate
  // onto that shape so the client component stays unchanged.
  const jobsWithCounts = jobs.map((job) => ({
    ...job,
    applications: Array.from({ length: (job as any)._count?.applications ?? 0 }),
  }));

  // Candidate context (§6.3 explainability): where the candidate stands on
  // each position — application stage + latest AI screening score — plus
  // whether they have a saved CV for one-click apply.
  let myApplications: Record<
    string,
    { applicationId: string; status: string; stage: string; score: number | null; appliedAt: string }
  > = {};
  let hasSavedResume = false;
  if (userRole === 'Candidate' && cand) {
    hasSavedResume = Boolean(cand.profileResumeRef);
    myApplications = Object.fromEntries(
      (cand.applications ?? []).map((a) => {
        const run = a.screeningRuns[0];
        const raw = run?.effectiveResult ?? run?.totalResult ?? null;
        const score = raw === null ? null : Number(raw);
        return [
          a.jobId,
          {
            applicationId: a.id,
            status: a.status,
            stage: a.stage,
            score: score !== null && Number.isFinite(score) ? score : null,
            appliedAt: a.createdAt.toISOString(),
          },
        ];
      })
    );
  }

  return (
    <JobsClient
      initialJobs={JSON.parse(JSON.stringify(jobsWithCounts))}
      userRole={userRole}
      pagination={toPageInfo(page, pageSize, total)}
      myApplications={myApplications}
      hasSavedResume={hasSavedResume}
      isAuthenticated={Boolean(session)}
      permissions={(session?.user as any)?.permissions || []}
      filters={{
        q: q ?? '',
        status: status ?? 'ALL',
        department: department ?? 'ALL',
        departments: departmentRows
          .map((r) => r.department)
          .filter((d): d is string => Boolean(d))
          .sort(),
      }}
    />
  );
}
