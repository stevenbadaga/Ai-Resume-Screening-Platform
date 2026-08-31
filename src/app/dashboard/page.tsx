import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Admin';
  const organizationId = (session.user as any)?.organizationId;

  // Strict role enforcement redirect for candidates
  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  // Exact Core Requirements & Schema Metrics
  const [
    totalJobs,
    totalCandidates,
    failedJobs,
    newApplications,
    screeningApps,
    reviewApps,
    shortlistedApps,
    rejectedApps,
    recentAudit
  ] = await Promise.all([
    prisma.jobRequisition.count({ where: { organizationId } }),
    prisma.candidate.count({ where: { applications: { some: { job: { organizationId } } } } }),
    prisma.application.count({ where: { status: 'FAILED', job: { organizationId } } }),
    prisma.application.count({ where: { status: 'NEW', job: { organizationId } } }),
    prisma.application.count({ where: { status: 'SCREENING', job: { organizationId } } }),
    prisma.application.count({ where: { status: 'NEEDS_REVIEW', job: { organizationId } } }),
    prisma.application.count({ where: { status: 'SHORTLISTED', job: { organizationId } } }),
    prisma.application.count({ where: { status: 'REJECTED', job: { organizationId } } }),
    prisma.auditEvent.findMany({
      where: { organizationId },
      include: {
        actor: {
          select: { name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    })
  ]);

  return (
    <DashboardClient
      userRole={userRole}
      totalJobs={totalJobs}
      totalCandidates={totalCandidates}
      failedJobs={failedJobs}
      newApplications={newApplications}
      screeningApps={screeningApps}
      reviewApps={reviewApps}
      shortlistedApps={shortlistedApps}
      rejectedApps={rejectedApps}
      recentAudit={JSON.parse(JSON.stringify(recentAudit))}
    />
  );
}