import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CompareClient from './CompareClient';
import CompareRestricted from './CompareRestricted';

export const dynamic = 'force-dynamic';

export default async function ComparePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  const canCompare = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer'].includes(userRole);

  if (!canCompare) {
    return <CompareRestricted />;
  }

  const organizationId = (session.user as any)?.organizationId;
  const userId = (session.user as any)?.id;

  const whereClause: any = { job: { organizationId } };
  if (userRole === 'HiringManager' && userId) {
    whereClause.job = { organizationId, ownerId: userId };
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      candidate: true,
      job: true,
      screeningRuns: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    take: 4
  });

  return <CompareClient applications={JSON.parse(JSON.stringify(applications))} />;
}