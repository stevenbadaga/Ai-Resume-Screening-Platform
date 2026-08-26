/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CandidatesClient from './CandidatesClient';

export const dynamic = 'force-dynamic';

export default async function CandidatesDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const role = (session.user as any)?.role || 'Candidate';
  const userId = (session.user as any)?.id;
  const organizationId = (session.user as any)?.organizationId;

  // Strict RBAC: Candidates must never access the ATS pipeline
  if (role === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  const whereClause: any = { job: { organizationId } };
  
  // Hiring Managers are scoped to jobs owned by them
  if (role === 'HiringManager' && userId) {
    whereClause.job = { organizationId, ownerId: userId };
  }

  const applicationsData = await prisma.application.findMany({
    where: whereClause,
    include: {
      candidate: true,
      job: true,
      resumeDocument: true,
      screeningRuns: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <CandidatesClient
      applications={JSON.parse(JSON.stringify(applicationsData))}
      userRole={role}
    />
  );
}