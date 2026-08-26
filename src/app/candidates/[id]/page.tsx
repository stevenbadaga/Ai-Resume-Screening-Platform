/* eslint-disable @typescript-eslint/no-explicit-any */
import CandidateProfileClient from './CandidateProfileClient';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export default async function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session?.user as any)?.role || 'Recruiter';

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
      }
    }
  });

  if (!application) {
    return (
      <div className="p-8 text-center text-slate-500">
        Candidate application not found.
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