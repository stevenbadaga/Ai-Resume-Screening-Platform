'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface MyApplicationsClientProps {
  applications: any[];
}

export default function MyApplicationsClient({ applications }: MyApplicationsClientProps) {
  const { t } = useLanguage();

  // Honest AI-score banding (§6.3/§6.5 — scores are evidence-based, never a
  // hiring promise): how the candidate's latest screening run compares to the
  // job's rubric. Bands mirror what staff see on the pipeline.
  const matchBand = (s: number) =>
    s >= 75
      ? { label: t('match_band_strong'), cls: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40' }
      : s >= 50
      ? { label: t('match_band_good'), cls: 'text-[var(--amber)] border-[color-mix(in_srgb,var(--amber)_40%,transparent)]' }
      : { label: t('match_band_building'), cls: 'text-[var(--coral)] border-[color-mix(in_srgb,var(--coral)_40%,transparent)]' };

  const statusChip = (status?: string) => {
    switch ((status || 'NEW').toUpperCase()) {
      case 'SHORTLISTED':
        return 'chip chip-accent';
      case 'REJECTED':
      case 'WITHDRAWN':
        return 'chip text-[var(--coral)] border-[color-mix(in_srgb,var(--coral)_40%,transparent)]';
      case 'SCREENING':
      case 'INGESTED':
        return 'chip text-[var(--amber)] border-[color-mix(in_srgb,var(--amber)_40%,transparent)]';
      default:
        return 'chip';
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="h-page">{t('my_apps_title')}</h1>
            <span className="chip chip-accent">
              {applications.length} {t('my_apps_submissions')}
            </span>
          </div>
          <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mt-0.5">
            {t('my_apps_subtitle')}
          </p>
          <p className="text-[11px] text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] mt-1">
            {t('my_apps_score_hint')}
          </p>
        </div>

        <Link href="/jobs" className="btn btn-primary self-start sm:self-auto">
          <span aria-hidden="true">💼</span>
          <span>{t('nav_quick_apply')}</span>
        </Link>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="panel p-10 text-center space-y-3">
          <span className="text-3xl block" aria-hidden="true">📮</span>
          <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)]">
            {t('my_apps_empty')}
          </p>
          <p className="text-[11px] text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] max-w-sm mx-auto">
            {t('my_apps_empty_tip')}{' '}
            <Link href="/dashboard/profile" className="text-[var(--accent)] font-semibold hover:underline">
              {t('my_apps_profile_link')}
            </Link>
          </p>
          <Link href="/jobs" className="btn btn-primary">
            {t('my_apps_browse_btn')} &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => {
            const latestRun = app.screeningRuns?.[0];
            const score = Number(latestRun?.effectiveResult ?? (typeof latestRun?.totalResult === 'number' ? latestRun.totalResult : latestRun?.totalResult?.overallScore)) || 0;

            return (
              <article
                key={app.id}
                className="panel panel-hover p-4.5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-semibold text-[var(--foreground)]">
                        {app.job?.title || t('my_apps_general_app')}
                      </h2>
                      <span className="chip">{app.job?.department}</span>
                    </div>
                    <p className="text-[11px] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] mt-0.5 font-mono">
                      {t('my_apps_applied_on')} {new Date(app.createdAt).toLocaleDateString()} &bull; ID: {app.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">                      <span className={statusChip(app.status)}>
                      {t('stage_col')}: {app.status || 'NEW'}
                    </span>
                    {score > 0 && (
                      <span
                        className={`chip ${matchBand(score).cls}`}
                        title={t('aria_app_score')}
                      >
                        {Math.round(score)}% · {matchBand(score).label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3 flex items-center justify-between text-xs text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" aria-hidden="true"></span>
                    <span>
                      {app.status === 'SHORTLISTED'
                        ? t('stage_shortlisted')
                        : app.status === 'SCREENING'
                        ? t('stage_screening')
                        : t('stage_ingested')}
                    </span>
                  </div>
                  <Link
                    href={app.job?.id ? `/jobs/${app.job.id}/apply` : '/jobs'}
                    className="text-[var(--accent)] hover:underline font-semibold shrink-0 ml-2"
                  >
                    {t('view_details')} &rarr;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
