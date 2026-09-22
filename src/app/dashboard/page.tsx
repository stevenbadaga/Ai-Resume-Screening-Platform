import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

// Ops telemetry window for failed-email counters: 7 days. Deliberately a
// module constant so the tile and its detail view (/dashboard/email-delivery)
// measure the same period.
const EMAIL_TELEMETRY_WINDOW_START = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// Shared field list for failed-delivery rows surfaced to the Admin.
const DELIVERY_SELECT = {
  id: true,
  recipient: true,
  template: true,
  deliveryState: true,
  failureInfo: true,
  createdAt: true,
} as const;

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
    upcomingInterviewsCount,
    failedEmailDeliveriesCount,
    recentFailedEmailDeliveries
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
    }),

    // Ops telemetry (spec §6.9): failed transactional-email deliveries in the
    // last 7 days, scoped to the workspace. Every recorded send attributes to
    // the org either through the job (application notifications) or through
    // the sender user (auth emails like PASSWORD_RESET / EMAIL_VERIFICATION
    // and team invitations set senderId to the acting account).
    prisma.communication.count({
      where: {
        deliveryState: 'FAILED',
        createdAt: { gte: EMAIL_TELEMETRY_WINDOW_START },
        OR: [
          { job: { organizationId } },
          { sender: { organizationId } },
        ],
      },
    }),
    prisma.communication.findMany({
      where: {
        deliveryState: 'FAILED',
        createdAt: { gte: EMAIL_TELEMETRY_WINDOW_START },
        OR: [
          { job: { organizationId } },
          { sender: { organizationId } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: DELIVERY_SELECT,
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
      failedEmailDeliveriesCount={failedEmailDeliveriesCount}
      recentFailedEmailDeliveries={JSON.parse(JSON.stringify(recentFailedEmailDeliveries))}
    />
  );
}