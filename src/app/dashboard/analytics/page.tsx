import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

/**
 * Spec §6.10 — manager analytics page.
 *
 * Renders the documented §6.10 metrics (time-to-screen, time-in-stage, stage
 * conversion, interviewer completion, processing quality, recruiter workload)
 * from `GET /api/analytics`, with the same filter set. Access is limited to
 * the roles that hold decision authority; candidates and interviewers are
 * redirected.
 */
export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';
  const organizationId = (session.user as any)?.organizationId;

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  // §6.10: role-based dashboards. Interviewers see their assigned interviews,
  // not organizational analytics; auditors can view the audit trail instead.
  const canViewAnalytics = ['Admin', 'Recruiter', 'HiringManager'].includes(userRole);
  if (!canViewAnalytics) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl p-8 shadow-xl space-y-3">
          <span className="text-3xl block">📈</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-amber-950/80 bg-amber-50 dark:text-amber-300 text-amber-700 border dark:border-amber-800/80 border-amber-200">
            MANAGER CLEARANCE REQUIRED
          </span>
          <h1 className="text-lg font-bold dark:text-white text-slate-900">
            Analytics Reserved for Hiring Leadership
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 max-w-sm mx-auto leading-relaxed">
            Pipeline conversion, workload, and quality metrics are restricted to Admins, Recruiters, and Hiring Managers.
          </p>
        </div>
      </div>
    );
  }

  // Filter dropdown options come from permitted-scope data (§6.10 filters:
  // job, department, recruiter — Hiring managers see only their own jobs).
  const jobWhere: Record<string, unknown> = { organizationId };
  if (userRole === 'HiringManager') jobWhere.ownerId = (session.user as any)?.id;

  const [jobs, recruiters] = await Promise.all([
    prisma.jobRequisition.findMany({
      where: jobWhere,
      select: { id: true, title: true, department: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.user.findMany({
      where: { organizationId, accessStatus: 'ACTIVE' },
      select: { id: true, name: true, email: true, roles: { select: { name: true } } },
      take: 100,
    }),
  ]);

  const recruiterOptions = recruiters
    .filter((u) => u.roles.some((r) => ['Recruiter', 'HiringManager', 'Admin'].includes(r.name)))
    .map((u) => ({ id: u.id, label: u.name || u.email }));

  return (
    <AnalyticsClient
      jobs={jobs}
      recruiters={recruiterOptions}
      userRole={userRole}
    />
  );
}
