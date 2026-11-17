'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CheckItem {
  label: string;
  value: string;
  tone?: 'ok' | 'warn' | 'bad' | 'neutral';
}

interface SystemHealthClientProps {
  checks: any;
  timestamp: string;
}

export default function SystemHealthClient({ checks, timestamp }: SystemHealthClientProps) {
  const { t } = useLanguage();

  const card = (title: string, entries: CheckItem[]) => (
    <div className="panel p-4 space-y-2.5">
      <h2 className="text-xs font-mono uppercase tracking-wider font-bold dark:text-slate-300 text-slate-700">
        {title}
      </h2>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        {entries.map((e) => (
          <div key={e.label} className="p-2.5 rounded-lg dark:bg-[#111622] bg-slate-50 border dark:border-white/5 border-slate-200">
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
          <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
            {t('system_health_title')}
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Operational telemetry (§6.12) — counts and status only, never secrets. Snapshot: {timestamp}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-3 py-1.5 dark:bg-[#181E2C] bg-white dark:border-white/10 border-slate-200 border rounded-lg text-xs font-medium dark:text-slate-300 text-slate-600 transition"
        >
          &larr; {t('email_back').replace('← ', '')}
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
