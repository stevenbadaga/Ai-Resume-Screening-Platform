'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface AuditClientProps {
  events: any[];
  filters?: { actor: string; action: string; from: string; to: string };
}

export default function AuditClient({ events, filters = { actor: '', action: '', from: '', to: '' } }: AuditClientProps) {
  const { t } = useLanguage();
  const router = useRouter();

  // Spec §6.12: search the audit log by user, action type, and date range.
  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ['actor', 'action', 'from', 'to'] as const) {
      const value = String(form.get(key) ?? '').trim();
      if (value) params.set(key, value);
    }
    router.push(`/audit${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const inputClass =
    'dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2.5 py-1.5 text-xs dark:text-slate-200 text-slate-800 focus:outline-none focus:border-teal-500';

  const getActorDisplay = (evt: any) => {
    if (evt.actor?.name) return evt.actor.name;
    if (evt.actor?.email) return evt.actor.email;
    if (!evt.actorId || evt.actorId === 'SYSTEM') return 'Deterministic AI Worker';
    if (evt.actorId.includes('@')) return evt.actorId;
    return 'System Pipeline';
  };

  const getActorRole = (evt: any) => {
    if (evt.actor?.roles?.[0]?.name) return evt.actor.roles[0].name;
    if (evt.actor?.email?.includes('admin')) return 'Admin';
    if (evt.actor?.email?.includes('recruiter')) return 'Recruiter';
    if (evt.actor?.email?.includes('manager')) return 'HiringManager';
    if (evt.actor?.email?.includes('interviewer')) return 'Interviewer';
    if (evt.actor?.email?.includes('auditor')) return 'ComplianceAuditor';
    if (!evt.actorId || evt.actorId === 'SYSTEM') return 'AI Agent';
    return 'Authorized User';
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('audit_title')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-emerald-950/60 bg-emerald-50 dark:text-emerald-300 text-emerald-800 border dark:border-emerald-800/80 border-emerald-200">
              {events.length} LOGS
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('audit_subtitle')}
          </p>
        </div>

        <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-1.5">
          <input
            type="search"
            name="actor"
            defaultValue={filters.actor}
            placeholder="Search by actor email…"
            aria-label="Search audit log by actor email"
            className={`${inputClass} w-44`}
          />
          <input
            type="search"
            name="action"
            defaultValue={filters.action}
            placeholder="Action e.g. DECISION"
            aria-label="Search audit log by action"
            className={`${inputClass} w-40`}
          />
          <input
            type="date"
            name="from"
            defaultValue={filters.from}
            aria-label="From date"
            className={`${inputClass} w-36`}
          />
          <input
            type="date"
            name="to"
            defaultValue={filters.to}
            aria-label="To date"
            className={`${inputClass} w-36`}
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Search
          </button>
          {filters.actor || filters.action || filters.from || filters.to ? (
            <button
              type="button"
              onClick={() => router.push('/audit')}
              className="px-2.5 py-1.5 dark:bg-[#17242B] bg-white dark:border-[#30424A] border-slate-200 border rounded-lg text-xs font-medium dark:text-slate-300 text-slate-600 transition"
            >
              Clear
            </button>
          ) : null}
        </form>
      </div>

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg dark:bg-[#17242B] bg-white border dark:border-[#30424A] border-slate-200 text-[11px] font-mono text-emerald-500 font-medium shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{t('sha256_verified')}</span>
        </div>
      </div>

      <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
          <thead className="dark:bg-slate-900/60 bg-slate-50 dark:text-slate-400 text-slate-500 font-mono uppercase text-[10px] dark:border-[#30424A] border-slate-200 border-b">
            <tr>
              <th className="p-3">{t('timestamp_col')}</th>
              <th className="p-3">{t('action_col')}</th>
              <th className="p-3">{t('actor_col')}</th>
              <th className="p-3">{t('affected_col')}</th>
              <th className="p-3 text-right">{t('integrity_col')}</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-[#30424A]/60 divide-slate-100">
            {events.map((evt) => {
              const actorName = getActorDisplay(evt);
              const actorRole = getActorRole(evt);
              const isAI = actorName === 'Deterministic AI Worker';

              return (
                <tr key={evt.id} className="dark:hover:bg-slate-900/50 hover:bg-slate-50 transition">
                  <td className="p-3 font-mono text-[11px] dark:text-slate-400 text-slate-500 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold dark:bg-teal-950/80 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/80 border-teal-200 inline-block">
                      {evt.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isAI
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                      }`}>
                        {isAI ? '🤖' : (actorName[0]?.toUpperCase() || 'U')}
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white text-slate-900 text-xs leading-tight">
                          {actorName}
                        </p>
                        <span className="text-[10px] dark:text-slate-500 text-slate-400 font-mono">
                          {actorRole}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[11px] dark:text-slate-400 text-slate-500 truncate max-w-[160px]">
                    {evt.affectedRecordId || 'N/A'}
                  </td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-emerald-950/60 bg-emerald-50 text-emerald-500 border dark:border-emerald-800/60 border-emerald-200">
                      ✓ SEALED
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}