/* eslint-disable @typescript-eslint/no-explicit-any */
import CandidateProfileClient from './CandidateProfileClient';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export default async function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  const userId = (session.user as any)?.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true }
  });

  if (!user || user.accessStatus !== 'ACTIVE') redirect('/auth/signin');

  const userRole = user.roles[0]?.name || (session.user as any)?.role || 'Recruiter';

  // Strict RBAC: Candidates cannot inspect other candidate profiles
  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  const resolvedParams = await params;
  const application = await prisma.application.findUnique({
    where: { id: resolvedParams.id },
    include: {
      candidate: true,
      job: true,
      resumeDocument: true,
      parsedProfile: true,
      screeningRuns: {
        include: { assessments: { include: { criterion: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      interviews: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      decisions: {
        include: {
          actor: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!application || application.job.organizationId !== user.organizationId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Candidate application not found or access restricted to your organization.
      </div>
    );
  }

  return (
    <CandidateProfileClient
      application={JSON.parse(JSON.stringify(application))}
      userRole={userRole}
    />
  );
}