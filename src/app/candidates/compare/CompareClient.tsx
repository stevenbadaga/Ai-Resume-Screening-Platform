'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { roleCapabilities } from '@/lib/roleAccess';
import { useSession } from 'next-auth/react';

interface CompareClientProps {
  applications: any[];
  availableJobs?: Array<{ id: string; title: string; department: string }>;
  selectedJobId?: string | null;
  userRole?: string;
}

interface CriterionItem {
  id: string;
  category: string;
  description: string;
  isRequired: boolean;
  weight: number;
  threshold?: string | null;
  evidenceRules?: string | null;
}

export default function CompareClient({
  applications: initialApplications,
  availableJobs = [],
  selectedJobId = null,
  userRole = 'Recruiter',
}: CompareClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
  const sessionPermissions = (session?.user as any)?.permissions as string[] | undefined;
  const canMakeDecisions = sessionPermissions ? sessionPermissions.includes('candidates:decide') : roleCapabilities.canMakeDecisions(userRole);

  const [applications, setApplications] = useState<any[]>(initialApplications);
  const [blindMode, setBlindMode] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<string>(selectedJobId || 'ALL');
  const [activeTab, setActiveTab] = useState<'criteria' | 'skills' | 'experience' | 'overview'>('criteria');

  // Filter or switch jobs
  const handleJobChange = (jobId: string) => {
    setSelectedJob(jobId);
    if (jobId === 'ALL') {
      router.push('/candidates/compare');
    } else {
      router.push(`/candidates/compare?job=${encodeURIComponent(jobId)}`);
    }
  };

  const handleRemoveCandidate = (appId: string) => {
    const updated = applications.filter((a) => a.id !== appId);
    setApplications(updated);
    if (updated.length > 0) {
      const ids = updated.map((a) => a.id).join(',');
      router.replace(`/candidates/compare?ids=${ids}${selectedJob !== 'ALL' ? `&job=${selectedJob}` : ''}`);
    } else {
      router.replace(`/candidates/compare${selectedJob !== 'ALL' ? `?job=${selectedJob}` : ''}`);
    }
  };

  // Compile the canonical, ordered list of approved criteria (§6.7: same criteria in same order)
  const canonicalCriteria: CriterionItem[] = (() => {
    const seen = new Map<string, CriterionItem>();

    // 1. First priority: criteria from the approved rubric of the first application's job
    for (const app of applications) {
      const rubrics = app.job?.rubrics || [];
      const approvedRubric = rubrics.find((r: any) => r.status === 'APPROVED') || rubrics[0];
      if (approvedRubric?.criteria) {
        for (const crit of approvedRubric.criteria) {
          if (!seen.has(crit.id)) {
            seen.set(crit.id, {
              id: crit.id,
              category: crit.category || 'Qualification',
              description: crit.description || 'Evaluation Criterion',
              isRequired: Boolean(crit.isRequired),
              weight: Number(crit.weight) || 1,
              threshold: crit.threshold,
              evidenceRules: crit.evidenceRules,
            });
          }
        }
      }
    }

    // 2. Also check assessments across screening runs in case custom criteria exist
    for (const app of applications) {
      const latestRun = app.screeningRuns?.[0];
      if (latestRun?.assessments) {
        for (const ass of latestRun.assessments) {
          const crit = ass.criterion;
          if (crit && !seen.has(crit.id)) {
            seen.set(crit.id, {
              id: crit.id,
              category: crit.category || 'Qualification',
              description: crit.description || 'Evaluation Criterion',
              isRequired: Boolean(crit.isRequired),
              weight: Number(crit.weight) || 1,
              threshold: crit.threshold,
              evidenceRules: crit.evidenceRules,
            });
          }
        }
      }
    }

    // Sort criteria: REQUIRED criteria first, then highest weight to lowest, then alphabetical description
    return Array.from(seen.values()).sort((a, b) => {
      if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.description.localeCompare(b.description);
    });
  })();

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-[1560px] mx-auto pb-12 print:p-0">
      {/* Top Header & Interactive Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="chip chip-accent font-mono text-[11px] font-bold">
              {t('compare_badge') || 'Side-by-Side Candidate Benchmark'}
            </span>
            <span className="chip text-[11px] font-mono">
              {applications.length} {t('compare_candidates_count') || 'Candidates Selected'}
            </span>
            {canonicalCriteria.length > 0 && (
              <span className="chip text-[11px] font-mono text-[var(--accent)] border-[var(--accent-ring)]">
                {canonicalCriteria.length} {t('compare_approved_criteria') || 'Approved Criteria'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            {t('compare_title') || 'Candidate Evaluation Benchmark'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
            {t('compare_subtitle') ||
              'Standardized criterion-level evaluation comparing applicants against the approved job rubric. Inspect verbatim evidence, score contributions, and uncertainty without relying solely on top-line percentages.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto print:hidden">
          {/* Requisition Switcher */}
          {availableJobs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label htmlFor="compare-job-select" className="text-xs font-semibold text-[var(--muted)] whitespace-nowrap">
                {t('filter_job') || 'Job'}:
              </label>
              <select
                id="compare-job-select"
                value={selectedJob}
                onChange={(e) => handleJobChange(e.target.value)}
                className="field !w-auto !py-1.5 !text-xs font-medium"
              >
                <option value="ALL">{t('filter_all_jobs') || 'All Open Requisitions'}</option>
                {availableJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Blind Screening Toggle (§7 Bias Mitigation) */}
          <button
            onClick={() => setBlindMode(!blindMode)}
            className={`btn btn-sm inline-flex items-center gap-1.5 ${
              blindMode
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30 font-bold'
                : 'btn-secondary'
            }`}
            title={t('blind_screening_hint') || 'Hide candidate names and personal identifiers to mitigate unconscious bias'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {blindMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
            <span>{blindMode ? (t('blind_mode_active') || 'Blind Mode: ON') : (t('blind_mode_off') || 'Blind Screening')}</span>
          </button>

          {/* Export / Print */}
          <button onClick={printReport} className="btn btn-secondary btn-sm inline-flex items-center gap-1.5" title="Print or export benchmark as PDF">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{t('btn_print_report') || 'Export / Print'}</span>
          </button>

          {/* Back to Pipeline */}
          <Link href="/candidates" className="btn btn-primary btn-sm">
            <span>&larr;</span>
            <span>{t('back_to_pipeline') || 'Candidate Pipeline'}</span>
          </Link>
        </div>
      </div>

      {/* Selected Candidates Bar (removable chips) */}
      {applications.length > 0 && (
        <div className="panel p-3 bg-[var(--surface-muted)]/40 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--muted)] uppercase tracking-wider text-[10px] font-mono">
              {t('comparing_pool') || 'Active Benchmark'}:
            </span>
            {applications.map((app, idx) => {
              const displayName = blindMode
                ? `Candidate #${idx + 1}`
                : `${app.candidate?.firstName} ${app.candidate?.lastName}`;
              return (
                <div
                  key={app.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-xs"
                >
                  <span className="font-bold text-[var(--foreground)]">{displayName}</span>
                  <span className="text-[10px] text-[var(--muted)] font-mono">({app.job?.title})</span>
                  <button
                    onClick={() => handleRemoveCandidate(app.id)}
                    className="text-[var(--muted)] hover:text-[var(--danger)] font-bold ml-1 transition"
                    title={`Remove ${displayName} from comparison`}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>

          <span className="text-[11px] text-[var(--muted)] font-mono">
            {t('compare_spec_note') || 'Complies with CODAFRIQA Spec §6.7 & §6.5 (Ordered Criteria, Evidence & Uncertainty)'}
          </span>
        </div>
      )}

      {/* Empty State */}
      {applications.length === 0 ? (
        <div className="panel p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {t('compare_no_candidates_title') || 'No Candidates Selected for Benchmark'}
          </h2>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            {t('compare_no_candidates_desc') ||
              'Select two or more candidates from the Candidate Pipeline work queue and click "Compare Selected" to perform an objective, side-by-side qualification audit against the approved rubric.'}
          </p>
          <div className="pt-2">
            <Link href="/candidates" className="btn btn-primary btn-sm">
              {t('browse_candidates_btn') || 'Go to Candidate Pipeline'} &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Candidate Overview Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {applications.map((app, idx) => {
              const run = app.screeningRuns?.[0];
              const score = Math.round(Number(run?.effectiveResult ?? run?.totalResult) || 0);
              const displayName = blindMode
                ? `Candidate #${idx + 1}`
                : `${app.candidate?.firstName} ${app.candidate?.lastName}`;
              const parsedProfile = app.parsedProfile || {};
              const skillsCount = Array.isArray(parsedProfile.skills) ? parsedProfile.skills.length : 0;

              return (
                <div
                  key={app.id}
                  className="panel p-4 flex flex-col justify-between space-y-4 hover:border-[var(--accent)]/50 transition-all duration-200"
                >
                  <div className="space-y-3">
                    {/* Header: Candidate Identity & Score Ring */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center font-mono font-bold text-xs text-[var(--accent)]">
                            #{idx + 1}
                          </span>
                          <h3 className="font-extrabold text-[var(--foreground)] text-sm truncate" title={displayName}>
                            {displayName}
                          </h3>
                        </div>
                        <p className="text-[11px] font-mono text-[var(--muted)] mt-1 truncate" title={app.job?.title}>
                          {app.job?.title}
                        </p>
                      </div>

                      {/* Match Score Badge */}
                      <div className="text-right shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-mono font-black text-sm border inline-block ${
                            score >= 80
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : score >= 60
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {score}%
                        </span>
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-[var(--muted)] mt-0.5">
                          {run?.effectiveResult !== undefined && run?.effectiveResult !== run?.totalResult
                            ? 'Adjusted Score'
                            : 'AI Match Score'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Metadata */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-[11px]">
                      <div>
                        <span className="text-[10px] font-mono text-[var(--muted)] uppercase">Stage:</span>
                        <p className="font-semibold text-[var(--foreground)] truncate">
                          {app.stage || app.status || 'NEW'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[var(--muted)] uppercase">Skills Identified:</span>
                        <p className="font-semibold font-mono text-[var(--accent)] truncate">
                          {skillsCount > 0 ? `${skillsCount} skills` : 'In profile'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[var(--border)] flex items-center gap-2">
                    <Link
                      href={`/candidates/${app.id}`}
                      className="btn btn-secondary btn-sm flex-1 text-center font-bold"
                    >
                      <span>{t('view_full_file') || 'Full File'}</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View Tab Selector */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('criteria')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'criteria'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{t('tab_criteria_matrix') || 'Criterion-by-Criterion Evaluation Matrix'}</span>
              <span className="chip chip-info !text-[9px] !py-0 !px-1.5">{canonicalCriteria.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'skills'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>{t('tab_skills_taxonomy') || 'Skills Normalization & Transferability'}</span>
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'experience'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span>{t('tab_exp_edu') || 'Experience & Education Audit'}</span>
            </button>
          </div>

          {/* TAB 1: Criterion-by-Criterion Side-by-Side Comparison Matrix (§6.7 & §6.5) */}
          {activeTab === 'criteria' && (
            <div className="panel p-5 space-y-4 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <span>{t('matrix_heading') || 'Structured Criteria Benchmark Matrix'}</span>
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {t('matrix_note') ||
                      'Criteria are rendered in authoritative order (Required qualifications first, ordered by weight). Every candidate cell presents the match rating, verbatim resume excerpt, score contribution, and uncertainty indicators.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> MATCH
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> PARTIAL
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> MISSING
                  </span>
                </div>
              </div>

              {canonicalCriteria.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--muted)]">
                  {t('no_criteria_configured') ||
                    'No criteria configured on the approved rubric for this requisition yet.'}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[75vh]">
                  <table className="table w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-30 bg-[var(--surface)] shadow-xs">
                      <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                        <th className="p-3 w-80 text-left uppercase font-mono tracking-wider text-[10px] text-[var(--muted)] sticky left-0 z-40 bg-[var(--surface)] border-r border-[var(--border)]">
                          {t('rubric_criterion_col') || 'Approved Rubric Criterion'}
                        </th>
                        {applications.map((app, idx) => {
                          const run = app.screeningRuns?.[0];
                          const score = Math.round(Number(run?.effectiveResult ?? run?.totalResult) || 0);
                          const displayName = blindMode
                            ? `Candidate #${idx + 1}`
                            : `${app.candidate?.firstName} ${app.candidate?.lastName}`;
                          return (
                            <th
                              key={app.id}
                              className="p-3 text-left font-mono uppercase tracking-wider text-[10px] text-[var(--foreground)] min-w-[280px] bg-[var(--surface)]"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold truncate">{displayName}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    score >= 80 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                    score >= 60 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' :
                                    'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {score}%
                                  </span>
                                  <span className="chip chip-info !py-0 !px-1.5 !text-[9px]">
                                    #{idx + 1}
                                  </span>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {canonicalCriteria.map((criterion) => {
                        return (
                          <tr
                            key={criterion.id}
                            className="hover:bg-[var(--surface-muted)]/30 transition-colors duration-150 align-top"
                          >
                            {/* Criterion Definition Column */}
                            <td className="p-3.5 space-y-2 sticky left-0 z-10 bg-[var(--surface)] border-r border-[var(--border)]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                                  {criterion.category}
                                </span>
                                {criterion.isRequired ? (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                    ★ REQUIRED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-medium text-[var(--muted)] border border-[var(--border)]">
                                    Preferred
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-[var(--muted)]">
                                  Weight: {criterion.weight}x
                                </span>
                              </div>

                              <p className="font-semibold text-xs text-[var(--foreground)] leading-snug">
                                {criterion.description}
                              </p>

                              {(criterion.threshold || criterion.evidenceRules) && (
                                <div className="space-y-1 pt-1 text-[10px] text-[var(--muted)] border-t border-[var(--border)]/60">
                                  {criterion.threshold && (
                                    <p>
                                      <strong className="text-[var(--foreground)]">Threshold:</strong> {criterion.threshold}
                                    </p>
                                  )}
                                  {criterion.evidenceRules && (
                                    <p>
                                      <strong className="text-[var(--foreground)]">Evidence rules:</strong> {criterion.evidenceRules}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Candidate Evaluation Cells */}
                            {applications.map((app) => {
                              const latestRun = app.screeningRuns?.[0];
                              const assessment = (latestRun?.assessments || []).find(
                                (a: any) =>
                                  a.criterionId === criterion.id ||
                                  a.criterion?.description?.toLowerCase() === criterion.description.toLowerCase()
                              );

                              const result = assessment?.result || 'MISSING';
                              const effectiveResult = assessment?.effectiveResult || result;
                              const scoreContrib = assessment?.scoreContribution;
                              const hasUncertainty = Boolean(assessment?.uncertainty);
                              const evidence = assessment?.supportingEvidence || assessment?.sourceLocation;
                              const interpretation = assessment?.interpretation;
                              const reviewerCorrection = assessment?.reviewerCorrection;

                              const isMatch = effectiveResult === 'MATCH';
                              const isPartial = effectiveResult === 'PARTIAL';
                              const isMissing = effectiveResult === 'MISSING';

                              return (
                                <td key={app.id} className="p-3.5 space-y-2 border-r border-[var(--border)]/60 last:border-r-0">
                                  {/* Result & Score Badge */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] border flex items-center gap-1 ${
                                        isMatch
                                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                          : isPartial
                                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                      }`}
                                    >
                                      <span className="inline-flex items-center">
                                        {isMatch ? (
                                          '✓'
                                        ) : isPartial ? (
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                        ) : (
                                          '✕'
                                        )}
                                      </span>
                                      <span>{effectiveResult}</span>
                                    </span>

                                    {scoreContrib !== undefined && scoreContrib !== null && (
                                      <span className="font-mono text-[10px] text-[var(--accent)] font-bold">
                                        +{Math.round(scoreContrib)} pts
                                      </span>
                                    )}
                                  </div>

                                  {/* Absence of Evidence vs Confirmed Absence (§6.5) */}
                                  {isMissing && (
                                    <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/20">
                                      {evidence ? '✕ Confirmed Absence of Qualification' : 'ℹ Unverified / Absence of Evidence in CV'}
                                    </div>
                                  )}

                                  {/* Uncertainty Warning (§6.5 & §7) */}
                                  {hasUncertainty && (
                                    <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md flex items-center gap-1.5">
                                      <svg className="w-3 h-3 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                      <span>Low Evidence Confidence (Human Review Flagged)</span>
                                    </div>
                                  )}

                                  {/* Verbatim Supporting Evidence Quote (§6.5 & §6.7) */}
                                  {evidence ? (
                                    <blockquote className="p-2 rounded-md bg-[var(--surface-muted)]/70 border-l-2 border-[var(--accent)] text-[11px] font-mono text-[var(--foreground)] italic leading-relaxed">
                                      &ldquo;{evidence}&rdquo;
                                    </blockquote>
                                  ) : (
                                    <p className="text-[10px] text-[var(--muted)] italic">
                                      No direct verbatim evidence cited in resume document.
                                    </p>
                                  )}

                                  {/* AI Interpretation */}
                                  {interpretation && (
                                    <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                                      <span className="font-semibold text-[var(--foreground)]">Analysis:</span> {interpretation}
                                    </p>
                                  )}

                                  {/* Reviewer Override / Correction (§6.5) */}
                                  {reviewerCorrection && (
                                    <div className="text-[10px] bg-[var(--accent-soft)] border border-[var(--accent-ring)] p-1.5 rounded text-[var(--accent)]">
                                      <strong>Recruiter Note:</strong> {reviewerCorrection}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Skills Taxonomy & Transferability Matrix (§6.6) */}
          {activeTab === 'skills' && (
            <div className="panel p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>{t('skills_taxonomy_heading') || 'Normalized Skills & Transferability Benchmark'}</span>
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {t('skills_taxonomy_desc') ||
                    'Spec §6.6 requires exact matches, related or transferable capabilities, and missing requirements to be distinguished clearly.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {applications.map((app, idx) => {
                  const displayName = blindMode
                    ? `Candidate #${idx + 1}`
                    : `${app.candidate?.firstName} ${app.candidate?.lastName}`;
                  const parsed = app.parsedProfile || {};
                  const skills: string[] = Array.isArray(parsed.skills) ? parsed.skills : [];

                  return (
                    <div key={app.id} className="panel p-4 space-y-3 bg-[var(--surface-muted)]/20">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span className="font-bold text-xs text-[var(--foreground)] truncate">{displayName}</span>
                        <span className="chip chip-info !py-0 !px-1.5 !text-[9px]">#{idx + 1}</span>
                      </div>

                      {/* Verified Extracted Skills */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                          Documented Skills ({skills.length})
                        </span>
                        {skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {skills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-ring)]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--muted)] italic">No normalized skills listed.</p>
                        )}
                      </div>

                      {/* Languages */}
                      {Array.isArray(parsed.languages) && parsed.languages.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                            Languages
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {parsed.languages.map((lang: string, lIdx: number) => (
                              <span
                                key={lIdx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Experience & Education Audit (§6.6) */}
          {activeTab === 'experience' && (
            <div className="panel p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>{t('exp_edu_heading') || 'Career History & Educational Credentials'}</span>
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {t('exp_edu_desc') ||
                    'Audited chronological employment history, accounting for gaps, internships, and educational degrees without fabricated precision.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {applications.map((app, idx) => {
                  const displayName = blindMode
                    ? `Candidate #${idx + 1}`
                    : `${app.candidate?.firstName} ${app.candidate?.lastName}`;
                  const parsed = app.parsedProfile || {};
                  const employment: any[] = Array.isArray(parsed.employment) ? parsed.employment : [];
                  const education: any[] = Array.isArray(parsed.education) ? parsed.education : [];

                  return (
                    <div key={app.id} className="panel p-4 space-y-3 bg-[var(--surface-muted)]/20">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span className="font-bold text-xs text-[var(--foreground)] truncate">{displayName}</span>
                        <span className="chip chip-info !py-0 !px-1.5 !text-[9px]">#{idx + 1}</span>
                      </div>

                      {/* Employment Positions */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                          Career Roles ({employment.length})
                        </span>
                        {employment.length > 0 ? (
                          <div className="space-y-2">
                            {employment.map((pos, pIdx) => (
                              <div
                                key={pIdx}
                                className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs space-y-0.5"
                              >
                                <p className="font-bold text-[var(--foreground)]">{pos.role || pos.title || 'Role'}</p>
                                <p className="text-[11px] text-[var(--muted)]">{pos.company || pos.employer || 'Company'}</p>
                                <p className="text-[10px] font-mono text-[var(--accent)]">
                                  {pos.startDate || pos.duration || 'Period'} &bull; {pos.endDate || 'Present'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--muted)] italic">No employment history extracted.</p>
                        )}
                      </div>

                      {/* Education Records */}
                      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                          Education & Degrees ({education.length})
                        </span>
                        {education.length > 0 ? (
                          <div className="space-y-1.5">
                            {education.map((edu, eIdx) => (
                              <div
                                key={eIdx}
                                className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs space-y-0.5"
                              >
                                <p className="font-bold text-[var(--foreground)]">{edu.degree || 'Degree'}</p>
                                <p className="text-[11px] text-[var(--muted)]">{edu.institution || 'Institution'}</p>
                                {edu.graduationYear && (
                                  <p className="text-[10px] font-mono text-[var(--muted)]">Graduated: {edu.graduationYear}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--muted)] italic">No education records extracted.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
