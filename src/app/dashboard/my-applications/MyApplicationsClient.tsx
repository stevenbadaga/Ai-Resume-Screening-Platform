'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/Toast';

interface MyApplicationsClientProps {
  applications: any[];
  personalization?: {
    firstName?: string;
    applicationsCount?: number;
    shortlistedCount?: number;
    interviewingCount?: number;
    email?: string | null;
  };
}

export default function MyApplicationsClient({
  applications: initialApplications,
  personalization = {},
}: MyApplicationsClientProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const firstName = personalization.firstName || '';
  const shortlistedCount = personalization.shortlistedCount || 0;
  const interviewingCount = personalization.interviewingCount || 0;

  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('ALL');
  const [withdrawModalApp, setWithdrawModalApp] = useState<any | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Honest AI-score banding (§6.3/§6.5)
  const matchBand = (s: number) =>
    s >= 75
      ? { label: t('match_band_strong') || 'Strong Fit', cls: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10' }
      : s >= 50
      ? { label: t('match_band_good') || 'Good Alignment', cls: 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10' }
      : { label: t('match_band_building') || 'Developing Profile', cls: 'text-rose-600 dark:text-rose-400 border-rose-500/40 bg-rose-500/10' };

  const getStageMilestone = (stageStr?: string) => {
    const s = (stageStr || 'NEW').toUpperCase();
    if (s === 'REJECTED') return { step: 0, label: 'Not Selected', tone: 'text-rose-500', isTerminal: true };
    if (s === 'WITHDRAWN') return { step: 0, label: 'Withdrawn', tone: 'text-slate-400', isTerminal: true };
    if (s === 'OFFERED' || s === 'HIRED') return { step: 4, label: 'Offer Received', tone: 'text-emerald-500' };
    if (s.includes('INTERVIEW')) return { step: 3, label: 'Interview Scheduled', tone: 'text-sky-500' };
    if (s === 'SHORTLISTED') return { step: 2, label: 'Shortlisted by Recruiter', tone: 'text-[var(--accent)]' };
    if (s === 'SCREENING' || s === 'NEEDS_REVIEW') return { step: 1, label: 'Under AI & Staff Review', tone: 'text-amber-500' };
    return { step: 0, label: 'Application Received', tone: 'text-[var(--accent)]' };
  };

  const filteredApplications = initialApplications.filter((app) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = app.job?.title?.toLowerCase().includes(q);
      const deptMatch = app.job?.department?.toLowerCase().includes(q);
      const idMatch = app.id.toLowerCase().includes(q);
      if (!titleMatch && !deptMatch && !idMatch) return false;
    }

    if (filterStage !== 'ALL') {
      const s = (app.stage || app.status || 'NEW').toUpperCase();
      if (filterStage === 'ACTIVE' && (s === 'REJECTED' || s === 'WITHDRAWN' || s === 'HIRED')) return false;
      if (filterStage === 'INTERVIEWING' && !s.includes('INTERVIEW')) return false;
      if (filterStage === 'SHORTLISTED' && s !== 'SHORTLISTED') return false;
      if (filterStage === 'OFFERED' && s !== 'OFFERED' && s !== 'HIRED') return false;
      if (filterStage === 'CLOSED' && s !== 'REJECTED' && s !== 'WITHDRAWN') return false;
    }

    return true;
  });

  const handleWithdrawRequest = async () => {
    if (!withdrawModalApp) return;
    setSubmittingWithdraw(true);
    try {
      const res = await fetch('/api/privacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'WITHDRAWAL',
          details: `Candidate requested withdrawal for application ${withdrawModalApp.id} (${withdrawModalApp.job?.title}): ${withdrawReason.trim() || 'No specific reason provided.'}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Failed to submit withdrawal request', 'error');
        return;
      }
      showToast('Your withdrawal request has been submitted to the recruitment team', 'success', 'Request Received');
      setWithdrawModalApp(null);
      setWithdrawReason('');
    } catch {
      showToast('Network error submitting withdrawal request', 'error');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          {/* Personalized Welcome Banner */}
          {firstName && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="chip chip-success font-semibold text-xs">
                {t('personalized_welcome')?.replace('{name}', firstName.split(' ')[0]) || `Welcome back, ${firstName.split(' ')[0]}`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="h-page">{t('my_apps_title') || 'My Job Applications'}</h1>
            <span className="chip chip-accent">
              {initialApplications.length} {t('my_apps_submissions') || 'Total Submissions'}
            </span>
          </div>

          <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
            {t('my_apps_subtitle') ||
              'Track your active submissions, review evidence-based screening match indicators, and monitor interview schedules in real time.'}
          </p>

          {/* Quick Stats Badges */}
          {(shortlistedCount > 0 || interviewingCount > 0) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {shortlistedCount > 0 && (
                <span className="chip chip-success !text-[10px] font-bold">
                  {shortlistedCount} {t('personalized_shortlisted') || 'Applications Shortlisted'}
                </span>
              )}
              {interviewingCount > 0 && (
                <span className="chip chip-info !text-[10px] font-bold">
                  {interviewingCount} {t('personalized_interviewing') || 'Interviews in Progress'}
                </span>
              )}
            </div>
          )}
        </div>

        <Link href="/jobs" className="btn btn-primary self-start sm:self-auto font-bold shadow-xs">
          <span>{t('nav_quick_apply') || 'Browse Open Roles'}</span>
        </Link>
      </div>

      {/* Search & Filter Bar - only rendered when the applicant has submissions */}
      {initialApplications.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-muted)]/50 p-3 rounded-xl border border-[var(--border)]">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)] pointer-events-none"
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
              placeholder="Search by job title or department..."
              className="field !pl-8 !py-1.5 text-xs w-full"
              aria-label="Search applications"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              ['ALL', 'All Submissions'],
              ['ACTIVE', 'Active'],
              ['SHORTLISTED', 'Shortlisted'],
              ['INTERVIEWING', 'Interviews'],
              ['CLOSED', 'Concluded'],
            ].map(([code, label]) => (
              <button
                key={code}
                onClick={() => setFilterStage(code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  filterStage === code
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Applications List */}
      {initialApplications.length === 0 ? (
        <div className="panel p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-[var(--foreground)] text-base">
            {t('my_apps_empty') || 'No Applications Submitted Yet'}
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
            {t('my_apps_empty_tip') || 'You haven\'t applied to any job requisitions yet. Upload your default CV to your profile for instant one-click applications, or browse active listings.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/dashboard/profile" className="btn btn-secondary btn-sm">
              Complete Profile &amp; Save CV
            </Link>
            <Link href="/jobs" className="btn btn-primary btn-sm">
              {t('my_apps_browse_btn') || 'Browse Open Positions'} &rarr;
            </Link>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="panel p-8 text-center space-y-2">
          <p className="text-xs text-[var(--muted)]">No applications match your current filters.</p>
          <button onClick={() => { setSearch(''); setFilterStage('ALL'); }} className="btn btn-secondary btn-sm">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app: any) => {
            const latestRun = app.screeningRuns?.[0];
            const score = Math.round(Number(latestRun?.effectiveResult ?? latestRun?.totalResult) || 0);
            const milestone = getStageMilestone(app.stage || app.status);

            return (
              <article
                key={app.id}
                className="panel p-5 space-y-4 hover:border-[var(--accent)]/40 transition-all duration-200"
              >
                {/* Requisition Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-[var(--foreground)]">
                        {app.job?.title || 'General Requisition'}
                      </h2>
                      {app.job?.department && (
                        <span className="chip chip-info !text-[10px]">
                          {app.job.department}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-[var(--muted)] mt-1">
                      Submitted on {new Date(app.createdAt).toLocaleDateString()} &bull; Application Ref: #{app.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Status & Match Pill */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {score > 0 && (
                      <span className={`chip font-mono font-bold text-xs ${matchBand(score).cls}`}>
                        {score}% Alignment &bull; {matchBand(score).label}
                      </span>
                    )}
                    <span className="chip font-mono text-xs font-semibold">
                      {milestone.label}
                    </span>
                  </div>
                </div>

                {/* Visual Pipeline Progression Stepper */}
                {!milestone.isTerminal ? (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="uppercase tracking-wider text-[var(--muted)] font-bold">
                        Pipeline Progression
                      </span>
                      <span className="font-semibold text-[var(--foreground)]">
                        Status: <span className={milestone.tone}>{milestone.label}</span>
                      </span>
                    </div>

                    <div className="relative">
                      {/* Background connecting track */}
                      <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-[var(--border)] rounded-full -z-0" />
                      {/* Active progress fill */}
                      <div
                        className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-[var(--grad-accent)] rounded-full transition-all duration-500 -z-0"
                        style={{
                          width: `${Math.min(100, Math.max(15, (milestone.step / 4) * 100))}%`,
                        }}
                      />

                      <div className="grid grid-cols-4 gap-2 relative z-10">
                        {[
                          { step: 1, label: 'Applied', desc: 'Received' },
                          { step: 2, label: 'Screening', desc: 'AI & Staff' },
                          { step: 3, label: 'Interview', desc: 'Scheduled' },
                          { step: 4, label: 'Outcome', desc: 'Decision' },
                        ].map((s) => {
                          const isDone = milestone.step >= s.step;
                          const isCurrent = milestone.step === s.step - 1;
                          return (
                            <div
                              key={s.step}
                              className={`flex flex-col items-center text-center p-2 rounded-xl border backdrop-blur-sm transition-all ${
                                isDone
                                  ? 'bg-[var(--surface)] border-[var(--accent-ring)] text-[var(--accent)] font-bold shadow-xs'
                                  : isCurrent
                                  ? 'bg-[var(--surface)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30 text-[var(--foreground)] font-bold shadow-sm'
                                  : 'bg-[var(--surface-muted)]/60 border-[var(--border)] text-[var(--muted)] opacity-70'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  isDone
                                    ? 'bg-[var(--accent)] text-white'
                                    : isCurrent
                                    ? 'bg-[var(--accent)] text-white animate-pulse'
                                    : 'bg-[var(--border)] text-[var(--muted)]'
                                }`}>
                                  {isDone ? '✓' : s.step}
                                </span>
                                <span className="text-[11px] font-bold">{s.label}</span>
                              </div>
                              <span className="text-[9px] font-mono text-[var(--muted)] hidden sm:block">
                                {s.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-3 rounded-xl border text-xs font-medium ${
                    app.stage === 'REJECTED'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                      : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--muted)]'
                  }`}>
                    {app.stage === 'REJECTED'
                      ? 'Thank you for your interest. While this specific requisition has concluded, your profile remains safely retained according to policy for future opportunities.'
                      : 'This application has been formally withdrawn upon candidate request.'}
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    {app.job?.location && (
                      <span className="text-[11px] text-[var(--muted)]">
                        {app.job.location}
                      </span>
                    )}
                    {app.job?.employmentType && (
                      <span className="text-[11px] text-[var(--muted)]">
                        {app.job.employmentType}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!milestone.isTerminal && (
                      <button
                        onClick={() => setWithdrawModalApp(app)}
                        className="text-[11px] text-[var(--muted)] hover:text-rose-500 transition underline font-medium"
                      >
                        Request Withdrawal
                      </button>
                    )}
                    {app.job?.id && (
                      <Link
                        href={`/jobs`}
                        className="btn btn-secondary btn-sm !text-xs font-semibold"
                      >
                        View Job Listing &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Withdrawal Confirmation Dialog (§6.11) */}
      {withdrawModalApp && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="withdraw-modal-title">
          <div className="modal max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 id="withdraw-modal-title" className="text-base font-bold text-[var(--foreground)]">
                Withdraw Application
              </h2>
              <button
                onClick={() => setWithdrawModalApp(null)}
                className="text-lg text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--foreground)] leading-relaxed">
              <p>
                Are you sure you wish to withdraw your application for{' '}
                <strong>{withdrawModalApp.job?.title}</strong>?
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                Withdrawing stops active evaluation for this position. This action is routed to the recruitment team and logged under your privacy preferences (§6.11).
              </p>

              <div>
                <label htmlFor="withdraw-reason" className="field-label">
                  Reason for withdrawal (optional):
                </label>
                <textarea
                  id="withdraw-reason"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="e.g., Accepted another offer, relocation, no longer available..."
                  rows={3}
                  className="field w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setWithdrawModalApp(null)}
                className="btn btn-secondary"
                disabled={submittingWithdraw}
              >
                Keep Application
              </button>
              <button
                onClick={handleWithdrawRequest}
                disabled={submittingWithdraw}
                className="btn btn-danger font-bold"
              >
                {submittingWithdraw ? 'Submitting...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
