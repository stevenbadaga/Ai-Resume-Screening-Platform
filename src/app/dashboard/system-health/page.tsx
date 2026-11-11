import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/authOptions';
import { roleHasPermission, Permission } from '@/lib/roleAccess';
import { collectHealthChecks } from '@/lib/healthChecks';

/**
 * System health dashboard (spec §6.12).
 *
 * Administrators must be able to view processing health, failed background
 * tasks, notification failures, storage status, and integration status without
 * exposing secrets. This is the human-readable surface; /api/health returns the
 * same checks in machine-readable form for uptime probes and support tooling.
 */

export const dynamic = 'force-dynamic';

export default async function SystemHealthPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  // The checks report counts and booleans only — the same restriction as the
  // /api/health detail payload (ViewAuditLog), so the page mirrors that grant.
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

  const card = (
    title: string,
    entries: Array<{ label: string; value: string; tone?: 'ok' | 'warn' | 'bad' | 'neutral' }>
  ) => (
    <div key={title} className="dark:bg-[#11141D] bg-white dark:border-white/10 border-slate-200 border rounded-xl p-4 space-y-2">
      <h2 className="text-sm font-bold dark:text-white text-slate-900">{title}</h2>
      <dl className="space-y-1">
        {entries.map((e) => (
          <div key={e.label} className="flex items-center justify-between gap-3 text-xs">
            <dt className="dark:text-slate-400 text-slate-500">{e.label}</dt>
            <dd
              className={`font-mono font-semibold ${
                e.tone === 'ok'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : e.tone === 'warn'
                    ? 'text-amber-600 dark:text-amber-400'
                    : e.tone === 'bad'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'dark:text-slate-200 text-slate-800'
              }`}
            >
              {e.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const yesNo = (b: boolean | null | undefined, warnFalse = true) =>
    b === true ? 'yes' : b === false && warnFalse ? 'no' : 'unavailable';
  const toneOf = (b: boolean | null | undefined): 'ok' | 'bad' | 'neutral' =>
    b === true ? 'ok' : b === false ? 'bad' : 'neutral';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">System Health</h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Operational telemetry (spec §6.12) — counts and status only, never secrets. Snapshot: {timestamp}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-3 py-1.5 dark:bg-[#181E2C] bg-white dark:border-white/10 border-slate-200 border rounded-lg text-xs font-medium dark:text-slate-300 text-slate-600 transition"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {card('Database', [
          { label: 'Reachable', value: checks.database.reachable ? 'yes' : 'no', tone: toneOf(checks.database.reachable) },
          { label: 'Latency', value: checks.database.latencyMs != null ? `${checks.database.latencyMs} ms` : '—' },
        ])}

        {card('Background queue', [
          { label: 'Redis queue reachable', value: yesNo(checks.queue.reachable), tone: toneOf(checks.queue.reachable) },
          { label: 'Waiting jobs', value: String(checks.queue.waiting ?? '—') },
          { label: 'Active jobs', value: String(checks.queue.active ?? '—') },
          {
            label: 'Failed jobs',
            value: String(checks.queue.failed ?? '—'),
            tone: (checks.queue.failed ?? 0) > 0 ? 'warn' : 'ok',
          },
          { label: 'Completed jobs', value: String(checks.queue.completed ?? '—') },
        ])}

        {card('Resume processing', [
          { label: 'Pipeline available', value: yesNo(checks.processing.available), tone: toneOf(checks.processing.available) },
          ...Object.entries(checks.processing.resumesByStatus ?? {}).map(([status, count]) => ({
            label: `Resumes · ${status.toLowerCase()}`,
            value: String(count),
            tone: status === 'FAILED' || status === 'NEEDS_REVIEW' ? ('warn' as const) : ('neutral' as const),
          })),
        ])}

        {card('Communications', [
          { label: 'Delivery status available', value: yesNo(checks.communications.available), tone: toneOf(checks.communications.available) },
          {
            label: 'Sent',
            value: String(checks.communications.sent ?? '—'),
          },
          {
            label: 'Failed',
            value: String(checks.communications.failed ?? '—'),
            tone: (checks.communications.failed ?? 0) > 0 ? 'bad' : 'ok',
          },
          { label: 'Pending', value: String(checks.communications.pending ?? '—') },
        ])}

        {card('Storage', [
          { label: 'Backend', value: checks.storage.backend },
          { label: 'Writable', value: yesNo(checks.storage.writable), tone: toneOf(checks.storage.writable) },
          ...(checks.storage.backend === 'supabase'
            ? [{ label: 'Bucket', value: String(checks.storage.bucket ?? '—') }]
            : [{ label: 'Path', value: String(checks.storage.path ?? '—') }]),
        ])}

        {card('Integrations', [
          { label: 'AI screening provider', value: checks.integrations.openaiConfigured ? 'configured' : 'deterministic fallback', tone: checks.integrations.openaiConfigured ? 'ok' : 'warn' },
          { label: 'Email provider', value: checks.integrations.emailProviderConfigured ? 'configured' : 'not configured', tone: checks.integrations.emailProviderConfigured ? 'ok' : 'warn' },
          { label: 'Redis', value: checks.integrations.redisConfigured ? 'configured' : 'fallback limiter', tone: checks.integrations.redisConfigured ? 'ok' : 'warn' },
          { label: 'Malware scanning', value: checks.integrations.malwareScanner },
        ])}
      </div>
    </div>
  );
}
