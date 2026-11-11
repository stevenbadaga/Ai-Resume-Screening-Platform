'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/Toast';

/**
 * Spec §6.10 — manager analytics client.
 *
 * Fetches from GET /api/analytics with the §6.10 filter set (date range, job,
 * department, recruiter, stage) and renders the documented metrics. Metric
 * definitions are served by the API and displayed inline so dashboards and
 * exports stay consistent (§6.10: documented metric definitions).
 */

interface AnalyticsResponse {
  filters: Record<string, string | null>;
  metricDefinitions: Record<string, string>;
  summary: {
    totalApplications: number;
    screenedCount: number;
    timeToScreenHours: number;
    interviewerCompletionPct: number;
    totalParticipants: number;
    submittedParticipants: number;
    failedProcessingCount: number;
    needsReviewCount: number;
    departmentAccessRestricted: boolean;
  };
  timeInStage: { stage: string; count: number; averageHours: number }[];
  stageConversion: { stage: string; count: number; conversionPct: number }[];
  recruiterWorkload: { recruiterId: string; name: string; email: string; count: number }[];
}

interface Props {
  jobs: { id: string; title: string; department: string | null }[];
  recruiters: { id: string; label: string }[];
  userRole: string;
}

const STAGE_FILTERS = [
  'ALL', 'NEW', 'SCREENING', 'NEEDS_REVIEW', 'ON_HOLD', 'SHORTLISTED',
  'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN',
];

function formatHours(hours: number): string {
  if (hours >= 48) return `${Math.round(hours / 24)}d`;
  if (hours >= 1) return `${Math.round(hours * 10) / 10}h`;
  return `${Math.round(hours * 60)}m`;
}

export default function AnalyticsClient({ jobs, recruiters, userRole }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // §6.10 filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [jobId, setJobId] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [recruiterId, setRecruiterId] = useState('ALL');
  const [stage, setStage] = useState('ALL');

  const departments = useMemo(
    () => ['ALL', ...Array.from(new Set(jobs.map((j) => j.department).filter(Boolean) as string[]))],
    [jobs]
  );

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', new Date(from).toISOString());
      if (to) params.set('to', new Date(to).toISOString());
      if (jobId !== 'ALL') params.set('jobId', jobId);
      if (department !== 'ALL') params.set('department', department);
      if (recruiterId !== 'ALL') params.set('recruiterId', recruiterId);
      if (stage !== 'ALL') params.set('stage', stage);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('analytics_error'));
      showToast(t('analytics_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [from, to, jobId, department, recruiterId, stage, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = data?.summary;

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto" data-testid="analytics-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('nav_analytics') || 'Manager Analytics'}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-ring)]">
              {t('analytics_metrics_badge')}
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('analytics_subtitle')}
          </p>
        </div>
      </div>

      {/* §6.10 Filters: date range, job, department, recruiter, stage */}
      <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3.5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 space-y-1">
          {t('analytics_filter_from')}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2 py-1.5 text-xs font-normal normal-case dark:text-slate-200 text-slate-800 focus:outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 space-y-1">
          {t('analytics_filter_to')}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2 py-1.5 text-xs font-normal normal-case dark:text-slate-200 text-slate-800 focus:outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 space-y-1">
          {t('analytics_filter_job')}
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-full dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2 py-1.5 text-xs font-normal normal-case dark:text-slate-200 text-slate-800 focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="ALL">{t('filter_all_jobs')}</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 space-y-1">
          {t('analytics_filter_department')}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2 py-1.5 text-xs font-normal normal-case dark:text-slate-200 text-slate-800 focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="ALL">{t('all_departments')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 space-y-1">
          {t('analytics_filter_recruiter')}
          <select
            value={recruiterId}
            onChange={(e) => setRecruiterId(e.target.value)}
            className="w-full dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2 py-1.5 text-xs font-normal normal-case dark:text-slate-200 text-slate-800 focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="ALL">{t('filter_all_recruiters')}</option>
            {recruiters.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 space-y-1">
          {t('analytics_filter_stage')}
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2 py-1.5 text-xs font-normal normal-case dark:text-slate-200 text-slate-800 focus:outline-none focus:border-[var(--accent)]"
          >
            {STAGE_FILTERS.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? t('filter_all_stages') : s}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && !data ? (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-10 text-center text-xs dark:text-slate-400 text-slate-500">
          {t('analytics_loading')}
        </div>
      ) : error && !data ? (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-10 text-center text-xs text-rose-500">
          {error}
        </div>
      ) : data && summary ? (
        <>
          {/* Core metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
            {[
              { label: t('analytics_metric_applications'), value: summary.totalApplications, tone: 'text-slate-900 dark:text-white', hint: t('analytics_hint_screened').replace('{count}', String(summary.screenedCount)) },
              { label: t('analytics_metric_time_to_screen'), value: formatHours(summary.timeToScreenHours), tone: 'text-[var(--accent)]', hint: t('analytics_hint_median') },
              { label: t('analytics_metric_interviewer_completion'), value: `${summary.interviewerCompletionPct}%`, tone: 'text-sky-700 dark:text-sky-300', hint: t('analytics_hint_scorecards').replace('{submitted}', String(summary.submittedParticipants)).replace('{total}', String(summary.totalParticipants)) },
              { label: t('analytics_metric_processing_failures'), value: summary.failedProcessingCount, tone: summary.failedProcessingCount > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-slate-400', hint: t('analytics_hint_failed_processing') },
              { label: t('analytics_metric_low_confidence'), value: summary.needsReviewCount, tone: summary.needsReviewCount > 0 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-400', hint: t('analytics_hint_needs_review') },
              { label: t('analytics_metric_active_recruiters'), value: data.recruiterWorkload.length, tone: 'text-[var(--accent)]', hint: t('analytics_hint_open_workload') },
            ].map((metric) => (
              <div key={metric.label} className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl px-3.5 py-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold dark:text-slate-500 text-slate-500">{metric.label}</p>
                <p className={`mt-1 text-xl font-bold font-mono ${metric.tone}`}>{metric.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{metric.hint}</p>
              </div>
            ))}
          </div>

          {summary.departmentAccessRestricted && (
            <div className="text-[11px] text-amber-600 dark:text-amber-300 px-1">
              {t('analytics_restricted_note')}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {/* Stage conversion */}
            <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-semibold dark:text-white text-slate-900 uppercase tracking-wider">{t('analytics_stage_distribution')}</h2>
              {data.stageConversion.length === 0 ? (
                <p className="text-xs dark:text-slate-400 text-slate-500 py-6 text-center">{t('analytics_empty_period')}</p>
              ) : (
                <div className="space-y-2">
                  {data.stageConversion.map((row) => (
                    <div key={row.stage} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium dark:text-slate-300 text-slate-700">
                        <span>{row.stage}</span>
                        <span className="font-mono text-[11px] font-bold">{row.count} ({row.conversionPct}%)</span>
                      </div>
                      <div className="w-full h-1.5 dark:bg-slate-800 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(row.conversionPct, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Time in stage */}
            <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-semibold dark:text-white text-slate-900 uppercase tracking-wider">{t('analytics_time_in_stage')}</h2>
              {data.timeInStage.length === 0 ? (
                <p className="text-xs dark:text-slate-400 text-slate-500 py-6 text-center">{t('analytics_empty_open')}</p>
              ) : (
                <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
                  <thead className="font-mono uppercase text-[10px] dark:text-slate-500 text-slate-400 border-b dark:border-[#30424A] border-slate-200">
                    <tr>
                      <th className="py-1.5">{t('analytics_col_stage')}</th>
                      <th className="py-1.5 text-right">{t('analytics_col_count')}</th>
                      <th className="py-1.5 text-right">{t('analytics_col_median')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-[#30424A]/60 divide-slate-100">
                    {data.timeInStage.map((row) => (
                      <tr key={row.stage}>
                        <td className="py-1.5">{row.stage}</td>
                        <td className="py-1.5 text-right font-mono">{row.count}</td>
                        <td className="py-1.5 text-right font-mono">{formatHours(row.averageHours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recruiter workload */}
            <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-semibold dark:text-white text-slate-900 uppercase tracking-wider">{t('analytics_recruiter_workload')}</h2>
              {data.recruiterWorkload.length === 0 ? (
                <p className="text-xs dark:text-slate-400 text-slate-500 py-6 text-center">{t('analytics_empty_assigned')}</p>
              ) : (
                <div className="space-y-2">
                  {data.recruiterWorkload.slice(0, 8).map((r) => {
                    const maxCount = Math.max(...data.recruiterWorkload.map((x) => x.count));
                    const pct = maxCount > 0 ? Math.round((r.count / maxCount) * 100) : 0;
                    return (
                      <div key={r.recruiterId} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium dark:text-slate-300 text-slate-700">
                          <span className="truncate max-w-[180px]">{r.name}</span>
                          <span className="font-mono text-[11px] font-bold">{r.count}</span>
                        </div>
                        <div className="w-full h-1.5 dark:bg-slate-800 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Documented metric definitions (§6.10 consistency requirement) */}
          <details className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4">
            <summary className="text-xs font-semibold dark:text-white text-slate-900 uppercase tracking-wider cursor-pointer">
              {t('analytics_definitions')}
            </summary>
            <dl className="mt-3 space-y-2 text-xs dark:text-slate-300 text-slate-700">
              {Object.entries(data.metricDefinitions).map(([key, definition]) => (
                <div key={key}>
                  <dt className="font-mono text-[10px] font-bold text-[var(--accent)]">{key}</dt>
                  <dd className="dark:text-slate-400 text-slate-600">{definition}</dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      ) : null}
    </div>
  );
}
