import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import JobsClient from './JobsClient';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');
  const userRole = (session?.user as any)?.role || 'Candidate';
  const organizationId = (session?.user as any)?.organizationId;

  const whereClause: any = userRole === 'Candidate'
    ? { status: 'OPEN' }
    : { organizationId };

  const jobs = await prisma.jobRequisition.findMany({
    where: whereClause,
    include: {
      organization: { select: { id: true, name: true } },
      rubrics: {
        include: { criteria: true }
      },
      applications: true,
      owner: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <JobsClient
      initialJobs={JSON.parse(JSON.stringify(jobs))}
      userRole={userRole}
    />
  );
}