'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface MyApplicationsClientProps {
  applications: any[];
}

export default function MyApplicationsClient({ applications }: MyApplicationsClientProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('my_apps_title') || 'Candidate Application Portal'}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-indigo-950/60 bg-indigo-50 dark:text-indigo-300 text-indigo-700 border dark:border-indigo-800/50 border-indigo-200">
              {applications.length} SUBMISSIONS
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('my_apps_subtitle') || 'Track real-time candidate screening status, stages, and next steps for your submitted applications.'}
          </p>
        </div>

        <Link
          href="/jobs"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs self-start sm:self-auto"
        >
          <span>💼</span>
          <span>{t('nav_quick_apply') || 'Browse Open Roles'}</span>
        </Link>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800/80 border-slate-200 border rounded-xl p-8 text-center space-y-3">
          <p className="text-xs dark:text-slate-400 text-slate-500">
            {t('no_applications_yet') || 'You haven’t submitted any job applications yet.'}
          </p>
          <Link
            href="/jobs"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
          >
            {t('nav_quick_apply') || 'Browse Open Positions'} &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => {
            const latestRun = app.screeningRuns?.[0];
            const score = latestRun?.totalResult?.overallScore || 0;

            return (
              <div
                key={app.id}
                className="dark:bg-[#0B0F19] bg-white dark:border-slate-800/80 border-slate-200 border rounded-xl p-4.5 space-y-3 transition hover:border-indigo-500/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold dark:text-white text-slate-900">
                        {app.job?.title || 'General Application'}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium dark:bg-slate-900 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-800 border-slate-200">
                        {app.job?.department}
                      </span>
                    </div>
                    <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5 font-mono">
                      Applied on {new Date(app.createdAt).toLocaleDateString()} &bull; ID: {app.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold dark:bg-indigo-950/80 bg-indigo-50 dark:text-indigo-300 text-indigo-700 border dark:border-indigo-800/80 border-indigo-200">
                      {t('stage_col') || 'Stage'}: {app.status || 'INGESTED'}
                    </span>
                    {score > 0 && (
                      <span className="px-2 py-1 rounded-md text-xs font-mono font-bold text-emerald-500 dark:bg-emerald-950/50 bg-emerald-50 border dark:border-emerald-800/60 border-emerald-200">
                        {score}% {t('match_score') || 'Match'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg flex items-center justify-between text-xs dark:text-slate-300 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>
                      {app.status === 'SHORTLISTED'
                        ? (t('stage_shortlisted') + ' - Technical Evaluation Stage.')
                        : app.status === 'SCREENING'
                        ? (t('stage_screening') + ' - Automated Rubric Screening.')
                        : (t('stage_ingested') + ' - Queued for Review.')}
                    </span>
                  </div>
                  <Link
                    href={`/jobs/${app.job?.id}/apply`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold shrink-0 ml-2"
                  >
                    {t('view_details') || 'View Role'} &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}