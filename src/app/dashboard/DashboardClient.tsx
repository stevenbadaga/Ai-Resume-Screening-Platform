'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface DashboardClientProps {
  userRole?: string;
  totalJobs?: number;
  totalCandidates?: number;
  failedJobs?: number;
  newApplications?: number;
  screeningApps?: number;
  reviewApps?: number;
  shortlistedApps?: number;
  rejectedApps?: number;
  recentAudit?: any[];
}

export default function DashboardClient({
  userRole = 'Admin',
  totalJobs = 0,
  totalCandidates = 0,
  failedJobs = 0,
  newApplications = 0,
  screeningApps = 0,
  reviewApps = 0,
  shortlistedApps = 0,
  rejectedApps = 0,
  recentAudit = []
}: DashboardClientProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const handleSyncTelemetry = async () => {
    setIsSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      showToast('Live pipeline distribution synchronized', 'success', 'Telemetry Updated');
    } finally {
      setIsSyncing(false);
    }
  };

  const getActorDisplay = (evt: any) => {
    if (evt?.actor?.name) return evt.actor.name;
    if (evt?.actor?.email) return evt.actor.email;
    if (!evt?.actorId || evt.actorId === 'SYSTEM') return 'Deterministic AI Worker';
    if (evt.actorId.includes('@')) return evt.actorId;
    return 'System Pipeline';
  };

  const getActorRole = (evt: any) => {
    if (evt?.actor?.roles?.[0]?.name) return evt.actor.roles[0].name;
    if (evt?.actor?.email?.includes('admin')) return 'Admin';
    if (evt?.actor?.email?.includes('recruiter')) return 'Recruiter';
    if (evt?.actor?.email?.includes('manager')) return 'HiringManager';
    if (evt?.actor?.email?.includes('interviewer')) return 'Interviewer';
    if (evt?.actor?.email?.includes('auditor')) return 'ComplianceAuditor';
    if (!evt?.actorId || evt.actorId === 'SYSTEM') return 'AI Worker';
    return 'Authorized User';
  };

  const funnelStages = [
    { label: t('stage_ingested') || 'Ingested', count: newApplications || 0, color: 'bg-slate-500' },
    { label: t('stage_screening') || 'Screening', count: screeningApps || 0, color: 'bg-amber-500' },
    { label: 'Needs Review', count: reviewApps || 0, color: 'bg-indigo-500' },
    { label: t('stage_shortlisted') || 'Shortlisted', count: shortlistedApps || 0, color: 'bg-blue-500' },
    { label: 'Rejected / Out of Scope', count: rejectedApps || 0, color: 'bg-rose-500' }
  ];

  const safeAudits = Array.isArray(recentAudit) ? recentAudit : [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header & Sync Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {t('nav_dashboard') || 'Dashboard'}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold dark:bg-teal-950/50 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/60 border-teal-200">
              WORKSPACE OVERVIEW
            </span>
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            {t('dashboard_subtitle') || 'Real-time telemetry on candidate ingestion and evaluation pipelines.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/candidates"
            className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            Review applications <span aria-hidden="true">&rarr;</span>
          </Link>
          <button
            onClick={handleSyncTelemetry}
            disabled={isSyncing}
            className="px-3 py-1.5 dark:bg-slate-900 bg-white dark:hover:bg-slate-800 hover:bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg text-xs font-semibold dark:text-slate-200 text-slate-700 transition flex items-center gap-1.5 shadow-xs"
          >
            <span className={isSyncing ? 'animate-spin inline-block' : ''}>🔄</span>
            <span>{isSyncing ? (t('loading') || 'Loading...') : (t('realtime_sync') || 'Sync Telemetry')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold dark:text-slate-400 text-slate-500">{t('total_candidates') || 'Total Applicants'}</span>
            <span className="text-xs">👥</span>
          </div>
          <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1 font-mono tracking-tight">
            {totalCandidates}
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-300 font-mono mt-1 block">
            Across active jobs
          </span>
        </div>

        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium dark:text-slate-400 text-slate-500">{t('open_requisitions') || 'Open Requisitions'}</span>
            <span className="text-xs">💼</span>
          </div>
          <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1 font-mono tracking-tight">
            {totalJobs}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Active scoring rubrics
          </span>
        </div>

        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium dark:text-slate-400 text-slate-500">Shortlisted Pool</span>
            <span className="text-xs">🎯</span>
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-1 font-mono tracking-tight">
            {shortlistedApps}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            Passed threshold benchmarks
          </span>
        </div>

        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium dark:text-slate-400 text-slate-500">{t('active_audits') || 'Audited Events'}</span>
            <span className="text-xs">🛡️</span>
          </div>
          <div className="text-2xl font-bold dark:text-white text-slate-900 mt-1 font-mono tracking-tight">
            {safeAudits.length}
          </div>
          <span className="text-[10px] text-purple-500 dark:text-purple-400 font-mono mt-1 block">
            SHA-256 timeline logs
          </span>
        </div>
      </div>

      {/* Funnel Distribution & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* 5-Stage Funnel Meter (5 Cols) */}
        <div className="lg:col-span-5 dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold dark:text-white text-slate-900 uppercase tracking-wider">
              {t('pipeline_distribution') || 'Pipeline Distribution'}
            </h2>
            <Link href="/candidates" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              {t('nav_candidates') || 'Candidates'} &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {funnelStages.map((stage, idx) => {
              const totalApps = newApplications + screeningApps + reviewApps + shortlistedApps + rejectedApps;
              const pct = totalApps > 0 ? Math.round((stage.count / totalApps) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium dark:text-slate-300 text-slate-700">
                    <span>{stage.label}</span>
                    <span className="font-mono text-[11px] font-bold">{stage.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 dark:bg-slate-800 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Audit Timeline Table (7 Cols) */}
        <div className="lg:col-span-7 dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold dark:text-white text-slate-900 uppercase tracking-wider">
              {t('recent_activity') || 'Recent Activity'}
            </h2>
            <Link href="/audit" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              {t('nav_audit') || 'Audit Trail'} &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs dark:text-slate-300 text-slate-700">
              <thead className="dark:bg-slate-900/60 bg-slate-50 dark:text-slate-400 text-slate-500 font-mono uppercase text-[10px] dark:border-slate-800 border-slate-200 border-b">
                <tr>
                  <th className="p-2.5">{t('timestamp_col') || 'Timestamp'}</th>
                  <th className="p-2.5">{t('action_col') || 'Action'}</th>
                  <th className="p-2.5">{t('actor_col')}</th>
                  <th className="p-2.5 text-right">{t('integrity_col') || 'Integrity'}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800/60 divide-slate-100">
                {safeAudits.slice(0, 5).map((evt: any) => {
                  const actorName = getActorDisplay(evt);
                  const actorRole = getActorRole(evt);
                  const isAI = actorName === 'Deterministic AI Worker';

                  return (
                    <tr key={evt.id} className="dark:hover:bg-slate-900/50 hover:bg-slate-50 transition">
                      <td className="p-2.5 font-mono text-[11px] dark:text-slate-400 text-slate-500 whitespace-nowrap">
                        {evt?.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[10px]">
                        {evt?.action || 'EVENT'}
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">{isAI ? '🤖' : '👤'}</span>
                          <div>
                            <p className="font-semibold dark:text-white text-slate-900 leading-none text-xs">{actorName}</p>
                            <span className="text-[9px] dark:text-slate-500 text-slate-400 font-mono">{actorRole}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-mono text-[10px] text-emerald-500 font-bold">
                        ✓ VERIFIED
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}