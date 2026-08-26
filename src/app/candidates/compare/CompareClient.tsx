'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CompareClientProps {
  applications: any[];
}

export default function CompareClient({ applications }: CompareClientProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold dark:bg-indigo-950/80 bg-blue-50 dark:text-indigo-300 text-blue-700 border dark:border-indigo-800/80 border-blue-200">
              EVALUATION MATRIX
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            {t('compare_title') || 'Side-by-Side Candidate Benchmark'}
          </h1>
          <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-500 mt-1">
            {t('compare_subtitle') || 'Compare top candidate scores, technical criteria breakdowns, and rubric evidence in a unified matrix.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {applications.map((app) => {
          const run = app.screeningRuns?.[0];
          const totalResult = run?.totalResult as any;
          const score = totalResult?.overallScore || 0;
          const criteriaScores = totalResult?.criteriaScores || [];

          return (
            <div
              key={app.id}
              className="dark:bg-slate-900/60 bg-white dark:border-slate-800/80 border-slate-200/90 border rounded-3xl p-6 shadow-xs space-y-4 backdrop-blur-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold dark:text-white text-slate-900 text-sm">
                      {app.candidate?.firstName} {app.candidate?.lastName}
                    </h3>
                    <p className="text-[10px] dark:text-slate-500 text-slate-400 font-mono">{app.job?.title}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {score}%
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t dark:border-slate-800 border-slate-100 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold dark:text-slate-500 text-slate-400">
                    {t('scored_criteria') || 'Criteria Breakdown'}
                  </span>
                  {criteriaScores.map((crit: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="dark:text-slate-400 text-slate-600 truncate max-w-[150px]">{crit.category}</span>
                      <span className="font-mono font-bold text-indigo-400">{crit.score}/5</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t dark:border-slate-800 border-slate-100">
                <Link
                  href={`/candidates/${app.id}`}
                  className="w-full block text-center py-2 dark:bg-slate-950 bg-slate-100 dark:hover:bg-indigo-600 hover:bg-indigo-600 hover:text-white border dark:border-slate-800 border-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {t('view_details') || 'Full Evaluation'} &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}