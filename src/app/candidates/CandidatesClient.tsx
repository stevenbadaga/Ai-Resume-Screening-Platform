'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { roleCapabilities } from '@/lib/roleAccess';

interface FilterFacets {
  jobs: Array<{ id: string; title: string }>;
  recruiters: Array<{ id: string; name: string | null; email: string }>;
  tags: string[];
  current: Record<string, string>;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CandidatesClientProps {
  applications: any[];
  userRole?: string;
  pagination?: PaginationInfo;
  filters?: FilterFacets;
}

// Localized labels for pipeline stage codes (filter options, row chips).
function buildStageLabels(t: (key: string) => string): Record<string, string> {
  return {
    INGESTED: t('stage_ingested'),
    NEW: t('stage_new'),
    SCREENING: t('stage_screening'),
    NEEDS_REVIEW: t('stage_needs_review'),
    SHORTLISTED: t('stage_shortlisted'),
    ON_HOLD: t('stage_on_hold'),
    INTERVIEW_SCHEDULED: t('stage_interview_scheduled'),
    INTERVIEWING: t('stage_interviewing'),
    OFFERED: t('stage_offered'),
    HIRED: t('stage_hired'),
    REJECTED: t('stage_rejected'),
    WITHDRAWN: t('stage_withdrawn'),
  };
}

function buildProcessingLabels(t: (key: string) => string): Record<string, string> {
  return {
    QUEUED: t('processing_queued'),
    PROCESSING: t('processing_in_progress'),
    COMPLETED: t('processing_completed'),
    NEEDS_REVIEW: t('stage_needs_review'),
    FAILED: t('processing_failed'),
  };
}

export default function CandidatesClient({
  applications,
  userRole = 'Recruiter',
  pagination,
  filters,
}: CandidatesClientProps) {
  const [activeTab, setActiveTab] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const { t } = useLanguage();
  const router = useRouter();
  const stageLabels = buildStageLabels(t);

  // ── Bulk actions (§6.3 / §6.12: confirmation + mandatory reason) ──
  const canMakeDecisions = roleCapabilities.canMakeDecisions(userRole);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'SHORTLIST' | 'ADVANCE' | 'HOLD' | 'REJECT' | 'WITHDRAW' | 'REVIEW'>('SHORTLIST');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === filteredCandidates.length
        ? new Set()
        : new Set(filteredCandidates.map((c) => c.id))
    );
  };

  const openBulkModal = (action: typeof bulkAction) => {
    setBulkAction(action);
    setBulkReason('');
    setBulkError('');
    setBulkModalOpen(true);
  };

  const submitBulkAction = async () => {
    if (!bulkReason.trim()) {
      setBulkError(t('bulk_error_required'));
      return;
    }
    setBulkSubmitting(true);
    setBulkError('');
    try {
      const res = await fetch('/api/candidates/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: Array.from(selectedIds),
          action: bulkAction,
          reason: bulkReason.trim(),
          confirm: 'true', // §6.12: explicit human confirmation for bulk decisions
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkError(data.error || t('bulk_error_failed'));
        return;
      }
      setBulkModalOpen(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      setBulkError(t('bulk_error_network'));
    } finally {
      setBulkSubmitting(false);
    }
  };

  // §6.7: the work queue must surface every configured workflow state —
  // new, processing/review-required, screened, shortlisted, rejected, interview,
  // offer — so no application can silently disappear from the board.
  const stages = [
    { key: 'NEW', label: t('stage_ingested'), tone: 'var(--info)' },
    { key: 'SCREENING', label: t('stage_screening'), tone: 'var(--warning)' },
    { key: 'NEEDS_REVIEW', label: t('stage_needs_review'), tone: 'var(--accent)' },
    { key: 'ON_HOLD', label: t('stage_on_hold'), tone: 'var(--muted)' },
    { key: 'SHORTLISTED', label: t('stage_shortlisted'), tone: 'var(--success)' },
    { key: 'INTERVIEW_SCHEDULED', label: t('stage_interviewing'), tone: 'var(--info)' },
    { key: 'OFFERED', label: t('stage_offered'), tone: 'var(--success)' },
    { key: 'REJECTED', label: t('metric_rejected'), tone: 'var(--danger)' },
  ];

  const departments = ['ALL', ...Array.from(new Set(applications.map((c) => c.job?.department).filter(Boolean)))];

  // With server-side filtering (§6.7), the page receives the already-filtered
  // page of results. Client-side text narrowing stays as an instant refine on
  // top of the current page only — the authoritative filter set lives in the
  // URL and is applied by the server.
  const filteredCandidates = applications.filter((c) => {
    if (!search) return true;
    if (selectedDept !== 'ALL' && c.job?.department !== selectedDept) return false;
    const fullName = `${c.candidate?.firstName} ${c.candidate?.lastName}`.toLowerCase();
    const skills = (c.parsedProfile?.skills || []).join(' ').toLowerCase();
    return fullName.includes(search.toLowerCase()) || skills.includes(search.toLowerCase());
  });

  const reviewCount = applications.filter((app) => app.resumeDocument?.processingStatus === 'NEEDS_REVIEW').length;
  const averageScore = applications.reduce((total, app) => total + (Number(app.screeningRuns?.[0]?.effectiveResult ?? app.screeningRuns?.[0]?.totalResult) || 0), 0) / Math.max(applications.length, 1);

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto">
      {/* Top Header & Search Controls */}
      <div className="page-header pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="h-page">{t('pipeline_title')}</h1>
            <span className="chip chip-accent">
              {t('applicants_count').replace('{count}', String(pagination ? pagination.total : filteredCandidates.length))}
            </span>
          </div>
          <p className="page-subtitle mt-0.5">{t('pipeline_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Search Input */}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)] pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_candidate_placeholder')}
              className="field !w-48 sm:!w-56 !pl-8"
              aria-label={t('search_candidate_placeholder')}
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="field !w-auto font-medium"
            aria-label={t('aria_filter_department')}
          >
            {departments.map((dept: any) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? t('all_departments') : dept}
              </option>
            ))}
          </select>

          {/* Advanced Filters button (server-side §6.7 filter set) */}
          {filters && <FilterBar filters={filters} />}

          {/* View Switcher (Kanban / Table) */}
          <div className="segmented" role="tablist" aria-label={t('aria_pipeline_view')}>
            <button
              role="tab"
              aria-selected={activeTab === 'kanban'}
              onClick={() => setActiveTab('kanban')}
              className={activeTab === 'kanban' ? 'active' : ''}
            >
              {t('view_kanban')}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'table'}
              onClick={() => setActiveTab('table')}
              className={activeTab === 'table' ? 'active' : ''}
            >
              {t('view_table')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {[
          { label: t('metric_visible_apps'), value: filteredCandidates.length, tone: 'text-[var(--foreground)]' },
          { label: t('metric_needs_review'), value: reviewCount, tone: 'text-[var(--warning)]' },
          { label: t('metric_avg_match'), value: `${Math.round(averageScore)}%`, tone: 'text-[var(--accent)]' },
          { label: t('metric_shortlisted'), value: applications.filter((app) => app.stage === 'SHORTLISTED').length, tone: 'text-[var(--success)]' },
          { label: t('metric_rejected'), value: applications.filter((app) => app.stage === 'REJECTED').length, tone: 'text-[var(--danger)]' },
        ].map((metric) => (
          <div key={metric.label} className="stat-card">
            <p className="stat-label">{metric.label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${metric.tone}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* KANBAN VIEW */}
      {activeTab === 'kanban' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {stages.map((stage) => {
            const stageCandidates = filteredCandidates.filter((c) => (c.stage || 'INGESTED') === stage.key);

            return (
              <div
                key={stage.key}
                className="bg-[var(--surface-muted)]/60 border border-[var(--border)] rounded-xl p-3 flex flex-col min-h-[430px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--foreground)]">{stage.label}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                    style={{
                      color: stage.tone,
                      borderColor: `color-mix(in srgb, ${stage.tone} 35%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${stage.tone} 7%, transparent)`,
                    }}
                  >
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards Column */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {stageCandidates.length === 0 ? (
                    <div className="py-12 text-center text-[var(--muted)] text-[11px]">{t('no_candidates_stage')}</div>
                  ) : (
                    stageCandidates.map((app) => {
                      const latestRun = app.screeningRuns?.[0];
                      const score = Number(latestRun?.effectiveResult ?? latestRun?.totalResult) || 0;

                      return (
                        <Link
                          key={app.id}
                          href={`/candidates/${app.id}`}
                          className="block bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 panel-hover space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h3 className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition leading-tight">
                                {app.candidate?.firstName} {app.candidate?.lastName}
                              </h3>
                              <p className="text-[10px] text-[var(--muted)] truncate max-w-[130px]">{app.job?.title}</p>
                            </div>
                            <span className="chip chip-accent shrink-0">
                              {score}% {t('match_score')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-mono pt-1.5 border-t border-[var(--border)]">
                            <span>{app.job?.department}</span>
                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="space-y-2">
          {/* Bulk action bar (§6.3: bulk actions with confirmation + audit) */}
          {canMakeDecisions && selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-[var(--foreground)] mr-1">{t('bulk_selected').replace('{count}', String(selectedIds.size))}</span>
              {([
                ['SHORTLIST', t('bulk_shortlist'), 'chip-success'],
                ['ADVANCE', t('bulk_advance'), 'chip-info'],
                ['HOLD', t('bulk_hold'), 'chip'],
                ['REVIEW', t('bulk_review'), 'chip-accent'],
                ['REJECT', t('bulk_reject'), 'chip-danger'],
                ['WITHDRAW', t('bulk_withdraw'), 'chip'],
              ] as const).map(([action, label, chipClass]) => (
                <button
                  key={action}
                  onClick={() => openBulkModal(action)}
                  className={`chip ${chipClass} !cursor-pointer hover:brightness-95 transition`}
                >
                  {label}
                </button>
              ))}
              <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-[var(--muted)] hover:underline">
                {t('bulk_clear_selection')}
              </button>
            </div>
          )}

          <div className="panel overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  {canMakeDecisions && (
                    <th className="w-8">
                      <input
                        type="checkbox"
                        aria-label={t('aria_select_all')}
                        checked={selectedIds.size > 0 && selectedIds.size === filteredCandidates.length}
                        onChange={toggleSelectAll}
                        className="accent-[var(--accent)]"
                      />
                    </th>
                  )}
                  <th>{t('candidate_name_col')}</th>
                  <th>{t('position_applied_col')}</th>
                  <th>{t('department_col')}</th>
                  <th>{t('stage_col')}</th>
                  <th>{t('score_col')}</th>
                  <th className="!text-right">{t('actions_col')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((app) => {
                  const latestRun = app.screeningRuns?.[0];
                  const score = Number(latestRun?.effectiveResult ?? latestRun?.totalResult) || 0;

                  return (
                    <tr key={app.id}>
                      {canMakeDecisions && (
                        <td className="w-8">
                          <input
                            type="checkbox"
                            aria-label={`Select application for ${app.candidate?.firstName} ${app.candidate?.lastName}`}
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelected(app.id)}
                            className="accent-[var(--accent)]"
                          />
                        </td>
                      )}
                      <td className="font-semibold text-[var(--foreground)]">
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </td>
                      <td className="text-[var(--foreground)]">{app.job?.title}</td>
                      <td className="font-mono text-[11px] text-[var(--muted)]">{app.job?.department}</td>
                      <td>
                        <span className="chip">{stageLabels[app.stage || 'INGESTED'] || app.stage || 'INGESTED'}</span>
                      </td>
                      <td className="font-mono font-bold text-[var(--accent)] text-xs tabular-nums">{score}%</td>
                      <td className="text-right">
                        <Link href={`/candidates/${app.id}`} className="btn btn-secondary btn-sm">
                          {t('view_details')} <span aria-hidden="true">&rarr;</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Server-side pagination (§9 performance) */}
      {pagination && <PaginationControls pagination={pagination} />}

      {/* Bulk decision confirmation modal (§6.12) */}
      {bulkModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('bulk_confirm_aria')}>
          <div className="modal max-w-md p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              {t('bulk_confirm_title').replace('{action}', bulkAction).replace('{count}', String(selectedIds.size))}
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {t('bulk_confirm_desc')}
            </p>
            <label htmlFor="bulk-reason" className="field-label">
              {t('bulk_reason_label')}
            </label>
            <textarea
              id="bulk-reason"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder={t('bulk_reason_placeholder')}
              className="field"
            />
            {bulkError && (
              <p className="text-xs text-[var(--danger)] font-medium" role="alert">
                {bulkError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setBulkModalOpen(false)} className="btn btn-secondary">
                {t('cancel')}
              </button>
              <button onClick={submitBulkAction} disabled={bulkSubmitting} className="btn btn-primary">
                {bulkSubmitting ? t('bulk_applying') : t('bulk_confirm_action').replace('{action}', bulkAction.toLowerCase())}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Server-driven filter bar (spec §6.7): job, stage, recruiter, score range,
 * required-criterion status, processing status, tags, and application date
 * range. Filters live in the URL (searchParams) so views are shareable and
 * the pipeline agrees with exports and dashboards on totals.
 */
function FilterBar({ filters }: { filters: FilterFacets }) {
  const router = useRouter();
  const { t } = useLanguage();
  const current = filters.current;

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(current);
    if (!value || value === 'ALL') params.delete(key);
    else params.set(key, value);
    params.delete('page'); // filters reset pagination
    router.push(`/candidates?${params.toString()}`);
  };

  const stageOptions = [
    'NEW', 'SCREENING', 'NEEDS_REVIEW', 'SHORTLISTED', 'ON_HOLD',
    'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN',
  ];
  const processingOptions = ['QUEUED', 'PROCESSING', 'COMPLETED', 'NEEDS_REVIEW', 'FAILED'];
  const stageLabels = buildStageLabels(t);
  const processingLabels = buildProcessingLabels(t);

  const activeCount = [
    'job', 'stage', 'recruiter', 'minScore', 'maxScore', 'requiredStatus', 'processing', 'tags', 'from', 'to',
  ].filter((k) => current[k]).length;

  return (
    <details className="relative">
      <summary
        className={`cursor-pointer list-none btn btn-secondary ${activeCount > 0 ? '!border-[var(--accent)] !text-[var(--accent)]' : ''}`}
      >
        {t('filters')}{activeCount > 0 ? ` (${activeCount})` : ''}
      </summary>
      <div className="absolute right-0 mt-2 z-40 w-[min(92vw,640px)] p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label className="col-span-2 sm:col-span-1 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_job')}
          <select value={current.job ?? 'ALL'} onChange={(e) => setParam('job', e.target.value)} className="field">
            <option value="ALL">{t('filter_all_jobs')}</option>
            {filters.jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_stage')}
          <select value={current.stage ?? 'ALL'} onChange={(e) => setParam('stage', e.target.value)} className="field">
            <option value="ALL">{t('filter_all_stages')}</option>
            {stageOptions.map((s) => (
              <option key={s} value={s}>{stageLabels[s] || s}</option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_recruiter')}
          <select value={current.recruiter ?? 'ALL'} onChange={(e) => setParam('recruiter', e.target.value)} className="field">
            <option value="ALL">{t('filter_all_recruiters')}</option>
            {filters.recruiters.map((r) => (
              <option key={r.id} value={r.id}>{r.name ?? r.email}</option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_min_score')}
          <input
            type="number" min={0} max={100} defaultValue={current.minScore ?? ''}
            onBlur={(e) => setParam('minScore', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setParam('minScore', (e.target as HTMLInputElement).value)}
            placeholder="e.g. 60" className="field"
          />
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_max_score')}
          <input
            type="number" min={0} max={100} defaultValue={current.maxScore ?? ''}
            onBlur={(e) => setParam('maxScore', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setParam('maxScore', (e.target as HTMLInputElement).value)}
            placeholder="e.g. 100" className="field"
          />
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_required_criteria')}
          <select value={current.requiredStatus ?? 'ALL'} onChange={(e) => setParam('requiredStatus', e.target.value)} className="field">
            <option value="ALL">{t('filter_any_status')}</option>
            <option value="missing">{t('filter_missing_required')}</option>
            <option value="uncertain">{t('filter_uncertain_evidence')}</option>
          </select>
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_processing')}
          <select value={current.processing ?? 'ALL'} onChange={(e) => setParam('processing', e.target.value)} className="field">
            <option value="ALL">{t('filter_any_status')}</option>
            {processingOptions.map((p) => (
              <option key={p} value={p}>{processingLabels[p] || p}</option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_tag')}
          <select value={current.tags ?? 'ALL'} onChange={(e) => setParam('tags', e.target.value)} className="field">
            <option value="ALL">{t('filter_any_tag')}</option>
            {filters.tags.map((tg) => (
              <option key={tg} value={tg}>{tg}</option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_applied_from')}
          <input type="date" defaultValue={current.from ?? ''} onChange={(e) => setParam('from', e.target.value)} className="field" />
        </label>

        <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] space-y-1 block">
          {t('filter_applied_to')}
          <input type="date" defaultValue={current.to ?? ''} onChange={(e) => setParam('to', e.target.value)} className="field" />
        </label>

        {activeCount > 0 && (
          <button
            onClick={() => router.push('/candidates')}
            className="col-span-2 sm:col-span-3 justify-self-start btn btn-ghost !text-[var(--accent)]"
          >
            {t('filter_clear_all')}
          </button>
        )}
      </div>
    </details>
  );
}

/**
 * Pagination controls — server-side paging over the filtered set (§9
 * performance: pages respond within the target under review load).
 */
function PaginationControls({ pagination }: { pagination: PaginationInfo }) {
  const router = useRouter();
  const { t } = useLanguage();
  if (pagination.totalPages <= 1) return null;

  const go = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(page));
    router.push(`/candidates?${params.toString()}`);
  };

  return (
    <nav className="flex items-center justify-between gap-2 pt-2" aria-label={t('aria_pipeline_pagination')}>
      <span className="text-[11px] text-[var(--muted)]">
        {t('pagination_showing')
          .replace('{from}', String((pagination.page - 1) * pagination.pageSize + 1))
          .replace('{to}', String(Math.min(pagination.page * pagination.pageSize, pagination.total)))
          .replace('{total}', String(pagination.total))}
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => go(pagination.page - 1)} disabled={pagination.page <= 1} className="btn btn-secondary btn-sm disabled:opacity-40">
          {t('pagination_prev')}
        </button>
        <span className="text-[11px] font-mono text-[var(--muted)]">
          {pagination.page} / {pagination.totalPages}
        </span>
        <button onClick={() => go(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="btn btn-secondary btn-sm disabled:opacity-40">
          {t('pagination_next')}
        </button>
      </div>
    </nav>
  );
}
