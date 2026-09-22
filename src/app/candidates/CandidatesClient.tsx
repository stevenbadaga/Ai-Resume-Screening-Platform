'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { roleCapabilities } from '@/lib/roleAccess';

interface CandidatesClientProps {
  applications: any[];
  userRole?: string;
}

export default function CandidatesClient({ applications, userRole = 'Recruiter' }: CandidatesClientProps) {
  const [activeTab, setActiveTab] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const { t } = useLanguage();
  const router = useRouter();

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
      setBulkError('A mandatory reason is required for bulk decisions.');
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
        setBulkError(data.error || 'Bulk action failed.');
        return;
      }
      setBulkModalOpen(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      setBulkError('Network error — the bulk action was not applied.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // §6.7: the work queue must surface every configured workflow state —
  // new, processing/review-required, screened, shortlisted, rejected, interview,
  // offer — so no application can silently disappear from the board.
  const stages = [
    { key: 'NEW', label: t('stage_ingested'), color: 'border-slate-500/40 text-slate-400 bg-slate-500/5' },
    { key: 'SCREENING', label: t('stage_screening'), color: 'border-amber-500/40 text-amber-400 bg-amber-500/5' },
    { key: 'NEEDS_REVIEW', label: 'Needs Review', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/5' },
    { key: 'ON_HOLD', label: 'On Hold', color: 'border-violet-500/40 text-violet-400 bg-violet-500/5' },
    { key: 'SHORTLISTED', label: t('stage_shortlisted'), color: 'border-teal-500/40 text-teal-500 bg-teal-500/5' },
    { key: 'INTERVIEW_SCHEDULED', label: t('stage_interviewing'), color: 'border-sky-500/40 text-sky-500 bg-sky-500/5' },
    { key: 'OFFERED', label: t('stage_offered'), color: 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5' },
    { key: 'REJECTED', label: 'Rejected', color: 'border-rose-500/40 text-rose-400 bg-rose-500/5' }
  ];

  const departments = ['ALL', ...Array.from(new Set(applications.map((c) => c.job?.department).filter(Boolean)))];

  const filteredCandidates = applications.filter((c) => {
    const fullName = `${c.candidate?.firstName} ${c.candidate?.lastName}`.toLowerCase();
    const skills = (c.parsedProfile?.skills || []).join(' ').toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || skills.includes(search.toLowerCase()) || c.job?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || c.job?.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const reviewCount = applications.filter((app) => app.resumeDocument?.processingStatus === 'NEEDS_REVIEW').length;
  const averageScore = applications.reduce((total, app) => total + (Number(app.screeningRuns?.[0]?.effectiveResult ?? app.screeningRuns?.[0]?.totalResult) || 0), 0) / Math.max(applications.length, 1);

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('pipeline_title')}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold dark:bg-teal-950/50 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/50 border-teal-200">
              {filteredCandidates.length} APPLICANTS
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('pipeline_subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_candidate_placeholder')}
              className="dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-3 py-1.5 pl-8 text-xs dark:text-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 w-48 sm:w-56"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-2.5 py-1.5 text-xs dark:text-slate-200 text-slate-800 focus:outline-none focus:border-teal-500 font-medium"
          >
            {departments.map((dept: any) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? t('all_departments') : dept}
              </option>
            ))}
          </select>

          {/* View Switcher (Kanban / Table) */}
          <div className="flex p-0.5 rounded-lg dark:bg-[#0F171D] bg-slate-100 border dark:border-[#30424A] border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                activeTab === 'kanban'
                  ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-xs'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('view_kanban')}
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                activeTab === 'table'
                  ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-xs'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('view_table')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: 'Visible applications', value: filteredCandidates.length, tone: 'text-slate-900 dark:text-white' },
          { label: 'Needs review', value: reviewCount, tone: 'text-amber-600 dark:text-amber-300' },
          { label: 'Average match', value: `${Math.round(averageScore)}%`, tone: 'text-teal-700 dark:text-teal-300' },
          { label: 'Shortlisted', value: applications.filter((app) => app.stage === 'SHORTLISTED').length, tone: 'text-sky-700 dark:text-sky-300' },
          { label: 'Rejected', value: applications.filter((app) => app.stage === 'REJECTED').length, tone: 'text-rose-600 dark:text-rose-300' }
        ].map((metric) => (
          <div key={metric.label} className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold dark:text-slate-500 text-slate-500">{metric.label}</p>
            <p className={`mt-1 text-xl font-bold font-mono ${metric.tone}`}>{metric.value}</p>
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
                className="dark:bg-[#17242B]/65 bg-[#F8F5EE]/80 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3 flex flex-col min-h-[430px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b dark:border-[#30424A] border-slate-200/60">
                  <span className="text-xs font-bold dark:text-slate-200 text-slate-800">
                    {stage.label}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${stage.color}`}>
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards Column */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {stageCandidates.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-[11px]">
                      {t('no_candidates_stage')}
                    </div>
                  ) : (
                    stageCandidates.map((app) => {
                      const latestRun = app.screeningRuns?.[0];
                      const score = Number(latestRun?.effectiveResult ?? latestRun?.totalResult) || 0;

                      return (
                        <Link
                          key={app.id}
                          href={`/candidates/${app.id}`}
                          className="block dark:bg-[#18242C] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-lg p-3 hover:border-teal-500/60 transition shadow-xs space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h3 className="text-xs font-bold dark:text-white text-slate-900 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition leading-tight">
                                {app.candidate?.firstName} {app.candidate?.lastName}
                              </h3>
                              <p className="text-[10px] dark:text-slate-400 text-slate-500 truncate max-w-[130px]">
                                {app.job?.title}
                              </p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-teal-700 dark:text-teal-300 dark:bg-teal-950/60 bg-teal-50 border dark:border-teal-800/60 border-teal-200 shrink-0">
                              {score}% {t('match_score')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] dark:text-slate-500 text-slate-400 font-mono pt-1.5 border-t dark:border-[#30424A]/60 border-slate-100">
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
            <div className="flex flex-wrap items-center gap-2 dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-xl px-3.5 py-2.5">
              <span className="text-xs font-semibold dark:text-white text-slate-900 mr-1">
                {selectedIds.size} selected:
              </span>
              {([
                ['SHORTLIST', 'Shortlist', 'border-teal-500/40 text-teal-600 dark:text-teal-300 hover:bg-teal-500/10'],
                ['ADVANCE', 'Advance', 'border-sky-500/40 text-sky-600 dark:text-sky-300 hover:bg-sky-500/10'],
                ['HOLD', 'Hold', 'border-violet-500/40 text-violet-600 dark:text-violet-300 hover:bg-violet-500/10'],
                ['REVIEW', 'Return to review', 'border-indigo-500/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10'],
                ['REJECT', 'Reject', 'border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500/10'],
                ['WITHDRAW', 'Withdraw', 'border-slate-500/40 text-slate-600 dark:text-slate-300 hover:bg-slate-500/10'],
              ] as const).map(([action, label, classes]) => (
                <button
                  key={action}
                  onClick={() => openBulkModal(action)}
                  className={`px-2.5 py-1 rounded-md border text-xs font-medium transition ${classes}`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-xs dark:text-slate-400 text-slate-500 hover:underline"
              >
                Clear selection
              </button>
            </div>
          )}

          <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
            <thead className="dark:bg-slate-900/60 bg-slate-50 dark:text-slate-400 text-slate-500 font-mono uppercase text-[10px] dark:border-[#30424A] border-slate-200 border-b">
              <tr>
                {canMakeDecisions && (
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all visible applications"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredCandidates.length}
                      onChange={toggleSelectAll}
                      className="accent-teal-600"
                    />
                  </th>
                )}
                <th className="p-3">{t('candidate_name_col')}</th>
                <th className="p-3">{t('position_applied_col')}</th>
                <th className="p-3">{t('department_col')}</th>
                <th className="p-3">{t('stage_col')}</th>
                <th className="p-3">{t('score_col')}</th>
                <th className="p-3 text-right">{t('actions_col')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-[#30424A]/60 divide-slate-100">
              {filteredCandidates.map((app) => {
                const latestRun = app.screeningRuns?.[0];
                const score = Number(latestRun?.effectiveResult ?? latestRun?.totalResult) || 0;

                return (
                  <tr key={app.id} className="dark:hover:bg-slate-900/50 hover:bg-slate-50 transition">
                    {canMakeDecisions && (
                      <td className="p-3 w-8">
                        <input
                          type="checkbox"
                          aria-label={`Select application for ${app.candidate?.firstName} ${app.candidate?.lastName}`}
                          checked={selectedIds.has(app.id)}
                          onChange={() => toggleSelected(app.id)}
                          className="accent-teal-600"
                        />
                      </td>
                    )}
                    <td className="p-3 font-semibold dark:text-white text-slate-900">
                      {app.candidate?.firstName} {app.candidate?.lastName}
                    </td>
                    <td className="p-3 dark:text-slate-300 text-slate-700">{app.job?.title}</td>
                    <td className="p-3 font-mono text-[11px] dark:text-slate-400 text-slate-500">{app.job?.department}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold dark:bg-[#0F171D] bg-slate-100 border dark:border-[#30424A] border-slate-200">
                        {app.stage || 'INGESTED'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400 text-xs">
                      {score}%
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/candidates/${app.id}`}
                        className="px-2.5 py-1 rounded-md bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-xs transition"
                      >
                        {t('view_details')} &rarr;
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

      {/* Bulk decision confirmation modal (§6.12) */}
      {bulkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm bulk decision"
        >
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-xl w-full max-w-md p-5 space-y-3">
            <h2 className="text-sm font-bold dark:text-white text-slate-900">
              Confirm bulk “{bulkAction}” on {selectedIds.size} application(s)
            </h2>
            <p className="text-xs dark:text-slate-400 text-slate-500">
              This records a decision on every selected application under your account and is
              written to the audit trail. It cannot be undone silently.
            </p>
            <label htmlFor="bulk-reason" className="block text-xs font-semibold dark:text-slate-200 text-slate-800">
              Reason (required)
            </label>
            <textarea
              id="bulk-reason"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Why is this bulk decision being applied?"
              className="w-full dark:bg-[#0F171D] bg-white border dark:border-[#30424A] border-slate-200 rounded-lg px-3 py-2 text-xs dark:text-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
            />
            {bulkError && <p className="text-xs text-rose-500">{bulkError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setBulkModalOpen(false)}
                className="px-3 py-1.5 rounded-md border dark:border-[#30424A] border-slate-200 text-xs dark:text-slate-300 text-slate-700 hover:bg-slate-500/10"
              >
                Cancel
              </button>
              <button
                onClick={submitBulkAction}
                disabled={bulkSubmitting}
                className="px-3 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-60"
              >
                {bulkSubmitting ? 'Applying…' : `Confirm ${bulkAction.toLowerCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}