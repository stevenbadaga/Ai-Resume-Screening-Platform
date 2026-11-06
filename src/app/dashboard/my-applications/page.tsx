import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import MyApplicationsClient from './MyApplicationsClient';

export const dynamic = 'force-dynamic';

export default async function MyApplicationsPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  let candidate: any = null;
  if (userEmail) {
    candidate = await prisma.candidate.findFirst({
      where: { email: userEmail },
      include: {
        applications: {
          include: {
            job: true,
            screeningRuns: { orderBy: { createdAt: 'desc' }, take: 1 }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  const applications = candidate?.applications || [];

  // Personalization data: pass candidate name and application count for
  // a personalized welcome experience on the dashboard.
  const personalization = {
    firstName: candidate?.firstName || candidate?.lastName ?
      `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() :
      userEmail ? userEmail.split('@')[0] : 'Applicant',
    applicationsCount: applications.length,
    shortlistedCount: applications.filter((a: any) => a.status === 'SHORTLISTED').length,
    interviewingCount: applications.filter((a: any) =>
      ['INTERVIEW_SCHEDULED', 'INTERVIEWING'].includes(a.status)
    ).length,
    email: userEmail,
  };

  return (
    <MyApplicationsClient
      applications={JSON.parse(JSON.stringify(applications))}
      personalization={personalization}
    />
  );
}