'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CandidatesClientProps {
  applications: any[];
  userRole?: string;
}

export default function CandidatesClient({ applications, userRole = 'Recruiter' }: CandidatesClientProps) {
  const [activeTab, setActiveTab] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const { t } = useLanguage();

  const stages = [
    { key: 'INGESTED', label: t('stage_ingested'), count: 0, color: 'border-slate-500/40 text-slate-400 bg-slate-500/5' },
    { key: 'SCREENING', label: t('stage_screening'), count: 0, color: 'border-amber-500/40 text-amber-400 bg-amber-500/5' },
    { key: 'SHORTLISTED', label: t('stage_shortlisted'), count: 0, color: 'border-blue-500/40 text-blue-400 bg-blue-500/5' },
    { key: 'INTERVIEWING', label: t('stage_interviewing'), count: 0, color: 'border-purple-500/40 text-purple-400 bg-purple-500/5' },
    { key: 'OFFERED', label: t('stage_offered'), count: 0, color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5' }
  ];

  const departments = ['ALL', ...Array.from(new Set(applications.map((c) => c.job?.department).filter(Boolean)))];

  const filteredCandidates = applications.filter((c) => {
    const fullName = `${c.candidate?.firstName} ${c.candidate?.lastName}`.toLowerCase();
    const skills = (c.parsedProfile?.skills || []).join(' ').toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || skills.includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || c.job?.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('pipeline_title')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold dark:bg-indigo-950/60 bg-indigo-50 dark:text-indigo-300 text-indigo-700 border dark:border-indigo-800/50 border-indigo-200">
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
              className="dark:bg-[#0B0F19] bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-3 py-1.5 pl-8 text-xs dark:text-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="dark:bg-[#0B0F19] bg-white border dark:border-slate-800 border-slate-200 rounded-lg px-2.5 py-1.5 text-xs dark:text-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
          >
            {departments.map((dept: any) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? t('all_departments') : dept}
              </option>
            ))}
          </select>

          {/* View Switcher (Kanban / Table) */}
          <div className="flex p-0.5 rounded-lg dark:bg-[#0B0F19] bg-slate-100 border dark:border-slate-800 border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                activeTab === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('view_kanban')}
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('view_table')}
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {activeTab === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((stage) => {
            const stageCandidates = filteredCandidates.filter((c) => (c.status || 'INGESTED') === stage.key);

            return (
              <div
                key={stage.key}
                className="dark:bg-[#0B0F19]/60 bg-slate-50/50 dark:border-slate-800/80 border-slate-200 border rounded-xl p-3 flex flex-col min-h-[580px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b dark:border-slate-800/60 border-slate-200/60">
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
                      const score = latestRun?.totalResult?.overallScore || 0;

                      return (
                        <Link
                          key={app.id}
                          href={`/candidates/${app.id}`}
                          className="block dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200/90 border rounded-lg p-3 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition shadow-xs space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h3 className="text-xs font-bold dark:text-white text-slate-900 group-hover:text-indigo-400 transition leading-tight">
                                {app.candidate?.firstName} {app.candidate?.lastName}
                              </h3>
                              <p className="text-[10px] dark:text-slate-400 text-slate-500 truncate max-w-[130px]">
                                {app.job?.title}
                              </p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-500 dark:bg-emerald-950/60 bg-emerald-50 border dark:border-emerald-800/60 border-emerald-200 shrink-0">
                              {score}% {t('match_score')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] dark:text-slate-500 text-slate-400 font-mono pt-1.5 border-t dark:border-slate-800/60 border-slate-100">
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
        <div className="dark:bg-[#0B0F19] bg-white dark:border-slate-800/80 border-slate-200 border rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
            <thead className="dark:bg-slate-900/60 bg-slate-50 dark:text-slate-400 text-slate-500 font-mono uppercase text-[10px] dark:border-slate-800 border-slate-200 border-b">
              <tr>
                <th className="p-3">{t('candidate_name_col')}</th>
                <th className="p-3">{t('position_applied_col')}</th>
                <th className="p-3">{t('department_col')}</th>
                <th className="p-3">{t('stage_col')}</th>
                <th className="p-3">{t('score_col')}</th>
                <th className="p-3 text-right">{t('actions_col')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800/60 divide-slate-100">
              {filteredCandidates.map((app) => {
                const latestRun = app.screeningRuns?.[0];
                const score = latestRun?.totalResult?.overallScore || 0;

                return (
                  <tr key={app.id} className="dark:hover:bg-slate-900/50 hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold dark:text-white text-slate-900">
                      {app.candidate?.firstName} {app.candidate?.lastName}
                    </td>
                    <td className="p-3 dark:text-slate-300 text-slate-700">{app.job?.title}</td>
                    <td className="p-3 font-mono text-[11px] dark:text-slate-400 text-slate-500">{app.job?.department}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold dark:bg-slate-900 bg-slate-100 border dark:border-slate-800 border-slate-200">
                        {app.status || 'INGESTED'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-500 text-xs">
                      {score}%
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/candidates/${app.id}`}
                        className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
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
      )}
    </div>
  );
}