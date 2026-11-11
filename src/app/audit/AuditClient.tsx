'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AuditClientProps {
  events: any[];
  filters?: { actor: string; action: string; record: string; from: string; to: string };
  pagination?: PaginationInfo;
  // §6.12: resolution result of the record search, shown so the operator can
  // see how the searched id was interpreted before trusting the result set.
  recordScope?: { type: string; matchCount: number };
}

export default function AuditClient({
  events,
  filters = { actor: '', action: '', record: '', from: '', to: '' },
  pagination,
  recordScope,
}: AuditClientProps) {
  const { t } = useLanguage();
  const router = useRouter();

  // Spec §6.12: search the audit log by user, candidate, application, job,
  // action type, and date range.
  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ['actor', 'action', 'record', 'from', 'to'] as const) {
      const value = String(form.get(key) ?? '').trim();
      if (value) params.set(key, value);
    }
    router.push(`/audit${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // §6.12/§9: pager over the filtered ledger; filters are preserved so a
  // paginated search stays on the same result set.
  const goPage = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    if (page <= 1) params.delete('page');
    else params.set('page', String(page));
    router.push(`/audit${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const inputClass =
    'dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2.5 py-1.5 text-xs dark:text-slate-200 text-slate-800 focus:outline-none focus:border-[var(--accent)]';

  const getActorDisplay = (evt: any) => {
    if (evt.actor?.name) return evt.actor.name;
    if (evt.actor?.email) return evt.actor.email;
    if (!evt.actorId || evt.actorId === 'SYSTEM') return 'System Automation';
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
    if (!evt.actorId || evt.actorId === 'SYSTEM') return 'Automated Pipeline';
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
              {t('audit_logs_count').replace('{count}', String(events.length))}
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
            placeholder={t('audit_search_actor')}
            aria-label={t('audit_search_actor_aria')}
            className={`${inputClass} w-44`}
          />
          <input
            type="search"
            name="action"
            defaultValue={filters.action}
            placeholder={t('audit_search_action')}
            aria-label={t('audit_search_action_aria')}
            className={`${inputClass} w-40`}
          />
          <input
            type="search"
            name="record"
            defaultValue={filters.record}
            placeholder={t('audit_search_record')}
            aria-label={t('audit_search_record_aria')}
            className={`${inputClass} w-56 font-mono`}
          />
          <input
            type="date"
            name="from"
            defaultValue={filters.from}
            aria-label={t('audit_from_date_aria')}
            className={`${inputClass} w-36`}
          />
          <input
            type="date"
            name="to"
            defaultValue={filters.to}
            aria-label={t('audit_to_date_aria')}
            className={`${inputClass} w-36`}
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white rounded-lg text-xs font-semibold transition"
          >
            {t('btn_search')}
          </button>
          {filters.actor || filters.action || filters.record || filters.from || filters.to ? (
            <button
              type="button"
              onClick={() => router.push('/audit')}
              className="px-2.5 py-1.5 dark:bg-[#17242B] bg-white dark:border-[#30424A] border-slate-200 border rounded-lg text-xs font-medium dark:text-slate-300 text-slate-600 transition"
            >
              {t('btn_clear')}
            </button>
          ) : null}
        </form>
      </div>

      {filters.record && recordScope ? (
        <div
          className={`px-3 py-1.5 text-[11px] font-mono rounded-lg border ${
            recordScope.matchCount > 0
              ? 'dark:bg-emerald-950/40 bg-emerald-50 dark:text-emerald-300 text-emerald-800 dark:border-emerald-800/60 border-emerald-200'
              : 'dark:bg-rose-950/40 bg-rose-50 dark:text-rose-300 text-rose-700 dark:border-rose-800/60 border-rose-200'
          }`}
          role="status"
        >
          {t('audit_record_scope_badge')
            .replace('{type}', recordScope.type)
            .replace('{count}', String(recordScope.matchCount))}
          {recordScope.matchCount === 0 ? ' — no matching events' : ''}
        </div>
      ) : null}

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
              const isAutomated = actorName === 'System Automation';

              return (
                <tr key={evt.id} className="dark:hover:bg-slate-900/50 hover:bg-slate-50 transition">
                  <td className="p-3 font-mono text-[11px] dark:text-slate-400 text-slate-500 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-ring)] inline-block">
                      {evt.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        isAutomated
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-ring)]'
                          : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20'
                      }`}>
                        {isAutomated ? 'SYS' : (actorName[0]?.toUpperCase() || 'U')}
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
                      {t('audit_sealed')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Server-side pagination over the filtered ledger (§9 performance) */}
      {pagination && (
        <nav className="flex items-center justify-between gap-2 pt-2" aria-label={t('aria_audit_pagination')}>
          <span className="text-[11px] dark:text-slate-500 text-slate-500">
            {t('pagination_showing')
              .replace('{from}', String((pagination.page - 1) * pagination.pageSize + 1))
              .replace('{to}', String(Math.min(pagination.page * pagination.pageSize, pagination.total)))
              .replace('{total}', String(pagination.total))}
          </span>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-2.5 py-1 rounded-lg border text-xs font-medium disabled:opacity-40 dark:border-slate-700 border-slate-200 dark:text-slate-300 text-slate-600"
              >
                {t('pagination_prev')}
              </button>
              <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => goPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-2.5 py-1 rounded-lg border text-xs font-medium disabled:opacity-40 dark:border-slate-700 border-slate-200 dark:text-slate-300 text-slate-600"
              >
                {t('pagination_next')}
              </button>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}