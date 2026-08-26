import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import AuditClient from './AuditClient';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  const isAuditorOrAdmin = ['Admin', 'ComplianceAuditor', 'Auditor'].includes(userRole);

  if (!isAuditorOrAdmin) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl p-8 shadow-xl space-y-3">
          <span className="text-3xl block">🛡️</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-rose-950/80 bg-rose-50 dark:text-rose-300 text-rose-700 border dark:border-rose-800/80 border-rose-200">
            RESTRICTED AUDIT CLEARANCE
          </span>
          <h1 className="text-lg font-bold dark:text-white text-slate-900">
            Access Restricted to Compliance Officers
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 max-w-sm mx-auto leading-relaxed">
            The immutable audit ledger contains cryptographic timeline signatures and model recalibration traces.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition"
            >
              Return to Dashboard &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const events = await prisma.auditEvent.findMany({
    include: {
      actor: {
        select: {
          name: true,
          email: true,
          roles: { select: { name: true } }
        }
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 50
  });

  return <AuditClient events={JSON.parse(JSON.stringify(events))} />;
}