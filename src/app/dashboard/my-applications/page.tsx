import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

  return <MyApplicationsClient applications={JSON.parse(JSON.stringify(applications))} />;
}