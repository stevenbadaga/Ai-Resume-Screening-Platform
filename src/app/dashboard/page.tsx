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

  // Exact Core Requirements & Schema Metrics (including spec §6.10 Quality Indicators).
  // §6.10: metric definitions must be consistent — pipeline counts use the
  // `stage` field, which is the field every decision route actually writes
  // (status is a secondary lifecycle field and diverges, e.g. SHORTLISTED
  // applications keep status='ACTIVE').
  const [
    totalJobs,
    totalCandidates,
    newApplications,
    screeningApps,
    reviewApps,
    shortlistedApps,
    rejectedApps,
    recentAudit,
    lowConfidenceCount,
    failedProcessingCount,
    manualCorrectionsCount,
    scoreOverridesCount,
    upcomingInterviewsCount
  ] = await Promise.all([
    prisma.jobRequisition.count({ where: { organizationId } }),
    prisma.candidate.count({ where: { applications: { some: { job: { organizationId } } } } }),
    prisma.application.count({ where: { stage: 'NEW', job: { organizationId } } }),
    prisma.application.count({ where: { stage: 'SCREENING', job: { organizationId } } }),
    prisma.application.count({ where: { stage: 'NEEDS_REVIEW', job: { organizationId } } }),
    prisma.application.count({ where: { stage: 'SHORTLISTED', job: { organizationId } } }),
    prisma.application.count({ where: { stage: 'REJECTED', job: { organizationId } } }),
    prisma.auditEvent.findMany({
      where: { organizationId },
      include: {
        actor: {
          select: { name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    }),
    prisma.resumeDocument.count({
      where: { processingStatus: 'NEEDS_REVIEW', application: { job: { organizationId } } }
    }),
    prisma.resumeDocument.count({
      where: { processingStatus: 'FAILED', application: { job: { organizationId } } }
    }),
    prisma.parsedProfile.count({
      where: { manualCorrections: { not: null }, application: { job: { organizationId } } }
    }),
    prisma.auditEvent.count({
      where: {
        organizationId,
        action: { in: ['SCORE_OVERRIDDEN', 'CRITERION_OVERRIDDEN'] }
      }
    }),
    prisma.interview.count({
      where: {
        application: { job: { organizationId } },
        status: 'SCHEDULED',
        schedule: { gte: new Date() }
      }
    })
  ]);

  return (
    <DashboardClient
      userRole={userRole}
      totalJobs={totalJobs}
      totalCandidates={totalCandidates}
      newApplications={newApplications}
      screeningApps={screeningApps}
      reviewApps={reviewApps}
      shortlistedApps={shortlistedApps}
      rejectedApps={rejectedApps}
      recentAudit={JSON.parse(JSON.stringify(recentAudit))}
      lowConfidenceCount={lowConfidenceCount}
      failedProcessingCount={failedProcessingCount}
      manualCorrectionsCount={manualCorrectionsCount}
      scoreOverridesCount={scoreOverridesCount}
      upcomingInterviewsCount={upcomingInterviewsCount}
    />
  );
}