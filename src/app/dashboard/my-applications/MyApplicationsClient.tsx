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
              {t('my_apps_title')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-teal-950/60 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/50 border-teal-200">
              {applications.length} {t('my_apps_submissions')}
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('my_apps_subtitle')}
          </p>
        </div>

        <Link
          href="/jobs"
          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs self-start sm:self-auto"
        >
          <span>💼</span>
          <span>{t('nav_quick_apply')}</span>
        </Link>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-8 text-center space-y-3">
          <p className="text-xs dark:text-slate-400 text-slate-500">
            {t('my_apps_empty')}
          </p>
          <Link
            href="/jobs"
            className="inline-block px-4 py-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg text-xs transition"
          >
            {t('my_apps_browse_btn')} &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => {
            const latestRun = app.screeningRuns?.[0];
            const score = Number(latestRun?.effectiveResult ?? (typeof latestRun?.totalResult === 'number' ? latestRun.totalResult : latestRun?.totalResult?.overallScore)) || 0;

            return (
              <div
                key={app.id}
                className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4.5 space-y-3 transition hover:border-teal-500/50 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold dark:text-white text-slate-900">
                        {app.job?.title || t('my_apps_general_app')}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium dark:bg-slate-900 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-800 border-slate-200">
                        {app.job?.department}
                      </span>
                    </div>
                    <p className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5 font-mono">
                      {t('my_apps_applied_on')} {new Date(app.createdAt).toLocaleDateString()} &bull; ID: {app.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold dark:bg-teal-950/80 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/80 border-teal-200">
                      {t('stage_col')}: {app.status || 'INGESTED'}
                    </span>
                    {score > 0 && (
                      <span className="px-2 py-1 rounded-md text-xs font-mono font-bold text-emerald-500 dark:bg-emerald-950/50 bg-emerald-50 border dark:border-emerald-800/60 border-emerald-200">
                        {score}% {t('match_score')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A]/40 border-slate-200 border rounded-lg flex items-center justify-between text-xs dark:text-slate-300 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>
                      {app.status === 'SHORTLISTED'
                        ? t('stage_shortlisted')
                        : app.status === 'SCREENING'
                        ? t('stage_screening')
                        : t('stage_ingested')}
                    </span>
                  </div>
                  <Link
                    href={`/jobs/${app.job?.id}/apply`}
                    className="text-teal-700 dark:text-teal-400 hover:underline font-semibold shrink-0 ml-2"
                  >
                    {t('view_details')} &rarr;
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