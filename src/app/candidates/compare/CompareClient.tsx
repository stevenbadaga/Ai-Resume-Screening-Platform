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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold dark:bg-teal-950/80 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/80 border-teal-200">
              {t('compare_badge')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            {t('compare_title')}
          </h1>
          <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-500 mt-1">
            {t('compare_subtitle')}
          </p>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {applications.map((app) => {
          const run = app.screeningRuns?.[0];
          const totalResult = run?.totalResult && typeof run.totalResult === 'object' ? run.totalResult : {};
          const score = Number(run?.effectiveResult ?? (typeof run?.totalResult === 'number' ? run.totalResult : (totalResult as any)?.overallScore)) || 0;
          const criteriaScores = (totalResult as any)?.criteriaScores || run?.assessments?.map((a: any) => ({
            category: a.criterion?.category || 'Requirement',
            score: a.effectiveResult || a.result
          })) || [];

          return (
            <div
              key={app.id}
              className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold dark:text-white text-slate-900 text-sm">
                      {app.candidate?.firstName} {app.candidate?.lastName}
                    </h3>
                    <p className="text-[10px] dark:text-slate-400 text-slate-500 font-mono">{app.job?.title}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                    {score}%
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t dark:border-[#30424A] border-slate-100 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold dark:text-slate-500 text-slate-400">
                    {t('compare_criteria_breakdown')}
                  </span>
                  {criteriaScores.slice(0, 4).map((crit: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="dark:text-slate-400 text-slate-600 truncate max-w-[150px]">{crit.category}</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{crit.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t dark:border-[#30424A] border-slate-100">
                <Link
                  href={`/candidates/${app.id}`}
                  className="w-full block text-center py-2 dark:bg-[#0F171D] bg-slate-100 dark:hover:bg-teal-600 hover:bg-teal-700 hover:text-white border dark:border-[#30424A] border-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {t('compare_full_eval')} &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Evaluation Matrix Table */}
      {applications.length > 1 && (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold dark:text-white text-slate-900">
              Side-by-Side Candidate Benchmark Matrix
            </h2>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
              Direct comparison of weighted match scores, recruitment stages, and candidate qualifications.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
              <thead className="dark:bg-slate-900/60 bg-slate-50 dark:text-slate-400 text-slate-500 font-mono uppercase text-[10px] dark:border-[#30424A] border-slate-200 border-b">
                <tr>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Requisition</th>
                  <th className="p-3">Match Score</th>
                  <th className="p-3">Current Stage</th>
                  <th className="p-3">Top Skills</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-[#30424A]/60 divide-slate-100">
                {applications.map((app) => {
                  const run = app.screeningRuns?.[0];
                  const totalResult = run?.totalResult && typeof run.totalResult === 'object' ? run.totalResult : {};
                  const score = Number(run?.effectiveResult ?? (typeof run?.totalResult === 'number' ? run.totalResult : (totalResult as any)?.overallScore)) || 0;
                  const skills = app.parsedProfile?.skills || [];

                  return (
                    <tr key={app.id} className="dark:hover:bg-slate-900/50 hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold dark:text-white text-slate-900">
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </td>
                      <td className="p-3 font-mono text-[11px] dark:text-slate-400 text-slate-500">
                        {app.job?.title}
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {score}%
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-[#0F171D] bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-[#30424A] border-slate-200">
                          {app.stage || app.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {skills.slice(0, 3).map((sk: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/candidates/${app.id}`}
                          className="px-2.5 py-1 dark:bg-[#0F171D] bg-slate-100 hover:bg-teal-700 hover:text-white dark:border-[#30424A] border-slate-200 border rounded text-xs font-semibold transition"
                        >
                          View &rarr;
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
    </div>
  );
}