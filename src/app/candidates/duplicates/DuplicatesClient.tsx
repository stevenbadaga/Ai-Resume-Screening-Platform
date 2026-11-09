'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/Toast';

interface DuplicatesClientProps {
  duplicates: any[];
  userRole?: string;
}

export default function DuplicatesClient({
  duplicates: initialDuplicates,
  userRole = 'Recruiter',
}: DuplicatesClientProps) {
  const [duplicates, setDuplicates] = useState(initialDuplicates);
  const [search, setSearch] = useState('');
  const [mergingEmail, setMergingEmail] = useState<string | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<any | null>(null);
  const { t } = useLanguage();
  const { showToast } = useToast();

  const canMerge = ['Admin', 'Recruiter'].includes(userRole);

  const filteredDuplicates = duplicates.filter((dup) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const emailMatch = dup.email.toLowerCase().includes(q);
    const nameMatch = dup.candidates.some(
      (c: any) =>
        c.firstName?.toLowerCase().includes(q) || c.lastName?.toLowerCase().includes(q)
    );
    return emailMatch || nameMatch;
  });

  const handleMerge = async (email: string) => {
    if (mergingEmail) return;
    setMergingEmail(email);
    try {
      const res = await fetch('/api/candidates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, confirm: 'true' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || t('dup_merge_failed'), 'error', t('dup_merge_error_title'));
        return;
      }
      setDuplicates((prev) => prev.filter((d) => d.email !== email));
      setConfirmModalData(null);
      showToast(t('dup_merged_toast').replace('{email}', email), 'success', t('dup_merged_title'));
    } catch (e) {
      console.error(e);
      showToast(t('dup_merge_failed'), 'error', t('dup_merge_error_title'));
    } finally {
      setMergingEmail(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="chip chip-accent font-mono text-[11px] font-bold">
              {t('duplicates_potential_matches') || 'Duplicate Resolution Center'}
            </span>
            <span className="chip text-[11px] font-mono">
              {duplicates.length} {duplicates.length === 1 ? 'Cluster' : 'Clusters Detected'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            {t('duplicates_title') || 'Candidate Record Deduplication'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
            {t('duplicates_subtitle') ||
              'Identifies multi-submission candidate profiles sharing verified email addresses. Human recruiters review and consolidate application histories into a single profile without losing audit traceability.'}
          </p>
        </div>

        {/* Back Link */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/candidates" className="btn btn-secondary btn-sm">
            <span>&larr;</span>
            <span>{t('back_to_pipeline') || 'Candidate Pipeline'}</span>
          </Link>
        </div>
      </div>

      {/* Search Bar - only shown when there are duplicates to search through! */}
      {duplicates.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-muted)]/50 p-3 rounded-xl border border-[var(--border)]">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] pointer-events-none">
              <svg className="w-3.5 h-3.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search duplicates by email or candidate name..."
              className="field !pl-8 !py-1.5 text-xs w-full"
              aria-label="Search duplicates"
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

          <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
            <span>Showing {filteredDuplicates.length} of {duplicates.length} clusters</span>
          </div>
        </div>
      )}

      {/* Duplicates List */}
      {duplicates.length === 0 ? (
        <div className="panel p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-bold text-[var(--foreground)] text-sm">
            {t('duplicates_no_found') || 'No Duplicate Candidate Records Found'}
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
            All candidate profiles in this workspace currently maintain unique email identifiers. Controlled matching will flag future overlapping submissions here for review.
          </p>
          <div className="pt-2">
            <Link href="/candidates" className="btn btn-primary btn-sm">
              View Active Pipeline &rarr;
            </Link>
          </div>
        </div>
      ) : filteredDuplicates.length === 0 ? (
        <div className="panel p-8 text-center space-y-2">
          <p className="text-xs text-[var(--muted)]">No duplicate clusters match your search query "{search}".</p>
          <button onClick={() => setSearch('')} className="btn btn-secondary btn-sm">
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDuplicates.map((dup, idx) => {
            const candidateList = dup.candidates || [];
            const primaryCandidate = candidateList[0];
            const totalApps = candidateList.reduce(
              (acc: number, c: any) => acc + (c.applications?.length || 0),
              0
            );

            return (
              <div
                key={idx}
                className="panel p-5 space-y-4 hover:border-[var(--accent)]/40 transition-all duration-200"
              >
                {/* Cluster Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 font-mono text-[10px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h3 className="font-bold text-[var(--foreground)] text-sm">{dup.email}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="chip chip-info !text-[10px]">
                        {candidateList.length} Profile Records
                      </span>
                      <span className="chip !text-[10px]">
                        {totalApps} Total Applications
                      </span>
                    </div>
                  </div>

                  {canMerge ? (
                    <button
                      onClick={() => setConfirmModalData(dup)}
                      disabled={mergingEmail === dup.email}
                      className="btn btn-primary btn-sm !text-xs font-bold shrink-0"
                    >
                      {mergingEmail === dup.email ? (
                        <span>Merging...</span>
                      ) : (
                        <span>Review &amp; Merge &rarr;</span>
                      )}
                    </button>
                  ) : (
                    <span className="chip !text-[10px] text-[var(--muted)]" title="Merging requires Recruiter or Admin privileges">
                      Read Only
                    </span>
                  )}
                </div>

                {/* Candidate Records within Cluster */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                    Associated Profile Versions:
                  </span>
                  <div className="space-y-2">
                    {candidateList.map((c: any, cIdx: number) => {
                      const isPrimary = cIdx === 0;
                      return (
                        <div
                          key={c.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[var(--surface-muted)]/50 border border-[var(--border)] text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[var(--foreground)]">
                                {c.firstName} {c.lastName}
                              </p>
                              {isPrimary && (
                                <span className="chip chip-success !text-[9px] !py-0">
                                  Primary Record
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--muted)] font-mono">
                              ID: {c.id.substring(0, 8)} &bull; Registered: {new Date(c.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[11px] font-mono font-bold text-[var(--accent)]">
                              {c.applications?.length || 0} application{c.applications?.length === 1 ? '' : 's'}
                            </span>
                            {c.applications?.[0]?.job?.title && (
                              <p className="text-[10px] text-[var(--muted)] truncate max-w-[200px]">
                                Last applied: {c.applications[0].job.title}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Human Merge Confirmation Dialog (§6.3 & §6.12) */}
      {confirmModalData && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="merge-modal-title">
          <div className="modal max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <h2 id="merge-modal-title" className="text-base font-bold text-[var(--foreground)]">
                  Confirm Candidate Consolidation
                </h2>
              </div>
              <button
                onClick={() => setConfirmModalData(null)}
                className="text-lg text-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[var(--foreground)]">
              <p>
                You are about to consolidate <strong>{confirmModalData.candidates?.length} duplicate records</strong> for verified email address:
              </p>
              <div className="p-2.5 rounded-lg bg-[var(--surface-muted)] font-mono font-bold text-center text-[var(--accent)]">
                {confirmModalData.email}
              </div>

              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 space-y-2">
                <h4 className="font-bold text-[var(--foreground)] text-[11px] uppercase tracking-wider font-mono">
                  Consolidation Impact:
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-[11px] text-[var(--muted)]">
                  <li>
                    Primary profile retained:{' '}
                    <strong>
                      {confirmModalData.candidates[0]?.firstName} {confirmModalData.candidates[0]?.lastName}
                    </strong>
                  </li>
                  <li>
                    All {confirmModalData.candidates.reduce((a: number, c: any) => a + (c.applications?.length || 0), 0)} application histories, screening runs, and scorecards will be re-linked to the primary profile.
                  </li>
                  <li>
                    Duplicate candidate identity rows will be cleanly removed, and an audited event (<code className="font-mono text-teal-600">CANDIDATES_MERGED</code>) will be recorded.
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Per recruitment governance (§6.3), record merges require explicit human confirmation.</span>
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setConfirmModalData(null)}
                className="btn btn-secondary"
                disabled={mergingEmail === confirmModalData.email}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => handleMerge(confirmModalData.email)}
                disabled={mergingEmail === confirmModalData.email}
                className="btn btn-primary font-bold"
              >
                {mergingEmail === confirmModalData.email ? 'Merging Records...' : 'Confirm & Merge Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}