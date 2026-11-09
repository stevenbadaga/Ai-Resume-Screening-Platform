import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import { roleHasPermission, Permission } from '@/lib/roleAccess';
import EmailDeliveryClient from './EmailDeliveryClient';

export const dynamic = 'force-dynamic';

// Keep this window in sync with the dashboard tile (page.tsx): both measure
// "failed transactional deliveries, last 7 days".
const EMAIL_TELEMETRY_WINDOW_START = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// Field list surfaced to the Admin. failureInfo is provider error detail
// (spec §6.9) — e.g. the Brevo authorized-IPs hint — and is the whole point
// of this screen.
const DELIVERY_SELECT = {
  id: true,
  recipient: true,
  template: true,
  deliveryState: true,
  failureInfo: true,
  createdAt: true,
} as const;

export default async function EmailDeliveryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';
  const organizationId = (session.user as any)?.organizationId;

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  if (!roleHasPermission(userRole, Permission.ViewEmailDelivery)) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-2xl p-8 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-rose-950/80 bg-rose-50 dark:text-rose-300 text-rose-700 border dark:border-rose-800/80 border-rose-200">
            RESTRICTED OPERATIONS VIEW
          </span>
          <h1 className="text-lg font-bold dark:text-white text-slate-900">
            Email Delivery Telemetry is Admin-only
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 max-w-sm mx-auto leading-relaxed">
            Failed-delivery records contain recipient addresses across workflows and provider
            error details. Ask your workspace Admin if you need access.
          </p>
        </div>
      </div>
    );
  }

  // Organization-scoped: only deliveries attributed to this workspace via the
  // job's org (application notifications) or the sender user's org (auth
  // emails and team invitations, which set senderId).
  const failedDeliveries = await prisma.communication.findMany({
    where: {
      deliveryState: 'FAILED',
      createdAt: { gte: EMAIL_TELEMETRY_WINDOW_START },
      OR: [{ job: { organizationId } }, { sender: { organizationId } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: DELIVERY_SELECT,
  });

  return (
    <EmailDeliveryClient
      deliveries={JSON.parse(JSON.stringify(failedDeliveries))}
      total={failedDeliveries.length}
    />
  );
}
