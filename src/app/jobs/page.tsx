/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
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
  if (!session) redirect('/auth/signin');
  const userRole = (session?.user as any)?.role || 'Candidate';
  const organizationId = (session?.user as any)?.organizationId;

  const sp = await searchParams;
  const { page, pageSize, skip, take } = parsePagination(sp);
  const q = firstParam(sp, 'q');
  const status = firstParam(sp, 'status');
  const department = firstParam(sp, 'department');

  const whereClause: any =
    userRole === 'Candidate'
      ? { status: 'OPEN' }
      : { organizationId };

  // Department-restricted staff only see permitted departments (§6.1).
  if (userRole !== 'Candidate') {
    const departmentRestrictions = (session?.user as any)?.departmentRestrictions as string[] | undefined;
    if (departmentRestrictions?.length) {
      whereClause.department = { in: departmentRestrictions };
    }
  }

  if (status && status !== 'ALL') {
    whereClause.status = status;
  }
  if (department && department !== 'ALL') {
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

  const [jobs, total, departmentRows] = await Promise.all([
    prisma.jobRequisition.findMany({
      where: whereClause,
      include: {
        organization: { select: { id: true, name: true } },
        rubrics: { include: { criteria: true } },
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
  ]);

  // JobsClient cards read `job.applications.length`; map the count aggregate
  // onto that shape so the client component stays unchanged.
  const jobsWithCounts = jobs.map((job) => ({
    ...job,
    applications: Array.from({ length: job._count.applications }),
  }));

  return (
    <JobsClient
      initialJobs={JSON.parse(JSON.stringify(jobsWithCounts))}
      userRole={userRole}
      pagination={toPageInfo(page, pageSize, total)}
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
