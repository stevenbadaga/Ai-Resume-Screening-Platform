import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import CompareClient from './CompareClient';
import CompareRestricted from './CompareRestricted';

export const dynamic = 'force-dynamic';

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<{ ids?: string; job?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  const canCompare = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer', 'ComplianceAuditor', 'Auditor'].includes(userRole);

  if (!canCompare) {
    return <CompareRestricted />;
  }

  const organizationId = (session.user as any)?.organizationId;
  const userId = (session.user as any)?.id;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const availableJobs = await prisma.jobRequisition.findMany({
    where: userRole === 'HiringManager' && userId
      ? { organizationId, ownerId: userId }
      : { organizationId },
    select: { id: true, title: true, department: true },
    orderBy: { title: 'asc' },
  });

  const whereClause: any = { job: { organizationId } };
  if (userRole === 'HiringManager' && userId) {
    whereClause.job = { organizationId, ownerId: userId };
  }

  if (resolvedSearchParams.ids) {
    const idList = resolvedSearchParams.ids.split(',').map((s) => s.trim()).filter(Boolean);
    if (idList.length > 0) {
      whereClause.id = { in: idList };
    }
  } else if (resolvedSearchParams.job) {
    whereClause.jobId = resolvedSearchParams.job;
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      candidate: true,
      job: {
        include: {
          rubrics: {
            where: { status: 'APPROVED' },
            orderBy: { version: 'desc' },
            take: 1,
            include: {
              criteria: {
                orderBy: [{ isRequired: 'desc' }, { weight: 'desc' }],
              },
            },
          },
        },
      },
      parsedProfile: true,
      screeningRuns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          assessments: {
            include: { criterion: true },
          },
        },
      },
    },
    take: 6,
  });

  return (
    <CompareClient
      applications={JSON.parse(JSON.stringify(applications))}
      availableJobs={JSON.parse(JSON.stringify(availableJobs))}
      selectedJobId={resolvedSearchParams.job || null}
      userRole={userRole}
    />
  );
}