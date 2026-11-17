import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/authOptions';
import { roleHasPermission, Permission } from '@/lib/roleAccess';
import { collectHealthChecks } from '@/lib/healthChecks';
import SystemHealthClient from './SystemHealthClient';

export const dynamic = 'force-dynamic';

export default async function SystemHealthPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  if (!roleHasPermission(userRole, Permission.ViewAuditLog)) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="dark:bg-[#11141D] bg-white dark:border-white/10 border-slate-200 border rounded-2xl p-8 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-ring)] text-[var(--accent)] flex items-center justify-center mx-auto shadow-xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-rose-950/80 bg-rose-50 dark:text-rose-300 text-rose-700 border dark:border-rose-800/80 border-rose-200">
            RESTRICTED OPERATIONS VIEW
          </span>
          <h1 className="text-lg font-bold dark:text-white text-slate-900">
            System Health is restricted to Admin and Compliance roles
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 max-w-sm mx-auto leading-relaxed">
            Processing queues, storage status, and integration state are operational
            telemetry. Ask your workspace Admin if you need access.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="btn btn-primary px-4 py-1.5 font-medium rounded-lg text-xs transition shadow-sm"
            >
              Return to Dashboard &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const checks = await collectHealthChecks();
  const timestamp = new Date().toISOString();

  return <SystemHealthClient checks={checks} timestamp={timestamp} />;
}
