'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface FailedDeliveryRow {
  id: string;
  recipient: string;
  template: string;
  deliveryState: string;
  failureInfo?: string | null;
  createdAt: string | Date;
}

interface DashboardClientProps {
  userRole?: string;
  totalJobs?: number;
  totalCandidates?: number;
  newApplications?: number;
  screeningApps?: number;
  reviewApps?: number;
  shortlistedApps?: number;
  rejectedApps?: number;
  recentAudit?: any[];
  lowConfidenceCount?: number;
  failedProcessingCount?: number;
  manualCorrectionsCount?: number;
  scoreOverridesCount?: number;
  upcomingInterviewsCount?: number;
  failedEmailDeliveriesCount?: number;
  recentFailedEmailDeliveries?: FailedDeliveryRow[];
}

export default function DashboardClient({
  userRole = 'Admin',
  totalJobs = 0,
  totalCandidates = 0,
  newApplications = 0,
  screeningApps = 0,
  reviewApps = 0,
  shortlistedApps = 0,
  rejectedApps = 0,
  recentAudit = [],
  lowConfidenceCount = 0,
  failedProcessingCount = 0,
  manualCorrectionsCount = 0,
  scoreOverridesCount = 0,
  upcomingInterviewsCount = 0,
  failedEmailDeliveriesCount = 0,
  recentFailedEmailDeliveries = [],
}: DashboardClientProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Ops telemetry (spec §6.9) is Admin-only — mirrors the ViewEmailDelivery
  // permission in the RBAC matrix (src/lib/roleAccess.ts).
  const isAdmin = userRole === 'Admin';

  // Re-fetches the server-rendered telemetry via the Next.js router so the
  // numbers on screen are real data, not a simulated refresh.
  const handleSyncTelemetry = async () => {
    setIsSyncing(true);
    try {
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 400));
      showToast(t('toast_telemetry_refreshed'), 'success', t('toast_telemetry_title'));
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
    { label: t('stage_ingested'), count: newApplications || 0, color: 'var(--info)' },
    { label: t('stage_screening'), count: screeningApps || 0, color: 'var(--warning)' },
    { label: t('stage_needs_review'), count: reviewApps || 0, color: 'var(--accent)' },
    { label: t('stage_shortlisted'), count: shortlistedApps || 0, color: 'var(--success)' },
    { label: t('stage_rejected'), count: rejectedApps || 0, color: 'var(--danger)' },
  ];

  const safeAudits = Array.isArray(recentAudit) ? recentAudit : [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header & Sync Action */}
      <div className="page-header pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="h-page">{t('nav_dashboard')}</h1>
            <span className="chip chip-accent">{t('workspace_overview')}</span>
          </div>
          <p className="page-subtitle mt-0.5">
            {t('dashboard_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/candidates" className="btn btn-primary">
            {t('btn_review_applications')} <span aria-hidden="true">&rarr;</span>
          </Link>
          <button onClick={handleSyncTelemetry} disabled={isSyncing} className="btn btn-secondary">
            <svg
              className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isSyncing ? t('loading') : t('realtime_sync')}</span>
          </button>
        </div>
      </div>

      {/* KPI stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-card rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 group">
          <div className="flex items-center justify-between">
            <span className="stat-label text-xs font-semibold text-[var(--muted)]">{t('total_candidates')}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value text-2xl font-extrabold tracking-tight mt-2 text-[var(--foreground)]">{totalCandidates}</div>
          <span className="stat-hint text-[11px] text-[var(--muted)] mt-1 block font-medium">{t('kpi_across_jobs')}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 group">
          <div className="flex items-center justify-between">
            <span className="stat-label text-xs font-semibold text-[var(--muted)]">{t('open_requisitions')}</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="stat-value text-2xl font-extrabold tracking-tight mt-2 text-[var(--foreground)]">{totalJobs}</div>
          <span className="stat-hint text-[11px] text-[var(--muted)] mt-1 block font-medium">{t('kpi_active_rubrics')}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 group">
          <div className="flex items-center justify-between">
            <span className="stat-label text-xs font-semibold text-[var(--muted)]">{t('kpi_shortlisted_pool')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value text-2xl font-extrabold tracking-tight mt-2 text-emerald-500">{shortlistedApps}</div>
          <span className="stat-hint text-[11px] text-[var(--muted)] mt-1 block font-medium">{t('kpi_passed_threshold')}</span>
        </div>

        <div className="glass-card rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 group">
          <div className="flex items-center justify-between">
            <span className="stat-label text-xs font-semibold text-[var(--muted)]">{t('active_audits')}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="stat-value text-2xl font-extrabold tracking-tight mt-2 text-[var(--foreground)]">{safeAudits.length}</div>
          <span className="stat-hint text-[11px] text-[var(--muted)] mt-1 block font-medium">{t('kpi_sha_logs')}</span>
        </div>
      </div>

      {/* Ops alert (spec §6.9): failed transactional-email deliveries — Admin only */}
      {isAdmin && failedEmailDeliveriesCount > 0 && (
        <Link
          href="/dashboard/email-delivery"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition hover:opacity-90"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--danger) 7%, var(--surface))',
            borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)',
            color: 'var(--danger)',
          }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="flex-1">
            {failedEmailDeliveriesCount === 1
              ? t('telemetry_email_banner_one')
              : t('telemetry_email_banner').replace('{count}', String(failedEmailDeliveriesCount))}
          </span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      )}

      {/* Spec §6.10: Screening Quality & Reliability Indicators */}
      <div className="panel p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[var(--border)] pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="panel-section-title">{t('telemetry_quality_title')}</h2>
            <span className="chip chip-accent">{t('telemetry_quality_chip')}</span>
          </div>
          <span className="text-[11px] text-[var(--muted)]">
            {t('telemetry_quality_hint')}
          </span>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 ${isAdmin ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-2.5 pt-1`}>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
              <span>{t('metric_low_confidence')}</span>
              <span aria-hidden="true">⚠️</span>
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[var(--warning)]">{lowConfidenceCount}</div>
            <span className="text-[10px] text-[var(--muted)] mt-0.5 block">{t('metric_low_confidence_hint')}</span>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
              <span>{t('metric_manual_corrections')}</span>
              <span aria-hidden="true">✏️</span>
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[var(--accent)]">{manualCorrectionsCount}</div>
            <span className="text-[10px] text-[var(--muted)] mt-0.5 block">{t('metric_manual_corrections_hint')}</span>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
              <span>{t('metric_score_overrides')}</span>
              <span aria-hidden="true">⚖️</span>
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[var(--info)]">{scoreOverridesCount}</div>
            <span className="text-[10px] text-[var(--muted)] mt-0.5 block">{t('metric_score_overrides_hint')}</span>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
              <span>{t('metric_processing_failures')}</span>
              <span aria-hidden="true">🔴</span>
            </div>
            <div
              className={`mt-1 text-xl font-bold tabular-nums ${failedProcessingCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}
            >
              {failedProcessingCount}
            </div>
            <span className="text-[10px] text-[var(--muted)] mt-0.5 block">{t('metric_processing_failures_hint')}</span>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
              <span>{t('metric_upcoming_interviews')}</span>
              <span aria-hidden="true">📅</span>
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[var(--success)]">{upcomingInterviewsCount}</div>
            <span className="text-[10px] text-[var(--muted)] mt-0.5 block">{t('metric_upcoming_interviews_hint')}</span>
          </div>

          {/* Admin-only ops tile (spec §6.9): failed email deliveries */}
          <Link
            href="/dashboard/email-delivery"
            className={`p-3 rounded-lg border block transition hover:opacity-90 ${
              failedEmailDeliveriesCount > 0
                ? 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border-[color-mix(in_srgb,var(--danger)_35%,transparent)]'
                : 'bg-[var(--surface-muted)] border-[var(--border)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
              <span>{t('metric_failed_emails')}</span>
              <span aria-hidden="true">📧</span>
            </div>
            <div
              className={`mt-1 text-xl font-bold tabular-nums ${failedEmailDeliveriesCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}
            >
              {failedEmailDeliveriesCount}
            </div>
            <span className="text-[10px] text-[var(--muted)] mt-0.5 block">
              {recentFailedEmailDeliveries.length > 0
                ? t('metric_failed_emails_latest').replace('{template}', recentFailedEmailDeliveries[0].template.replace(/_/g, ' ').toLowerCase())
                : t('metric_failed_emails_hint')}
            </span>
          </Link>
        </div>
      </div>

      {/* Funnel Distribution & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* 5-Stage Funnel Meter (5 Cols) */}
        <div className="lg:col-span-5 panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="panel-section-title">{t('pipeline_distribution')}</h2>
            <Link href="/candidates" className="link text-[11px]">
              {t('nav_candidates')} &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {funnelStages.map((stage, idx) => {
              const totalApps = newApplications + screeningApps + reviewApps + shortlistedApps + rejectedApps;
              const pct = totalApps > 0 ? Math.round((stage.count / totalApps) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-[var(--foreground)]">
                    <span>{stage.label}</span>
                    <span className="font-mono text-[11px] font-bold tabular-nums">
                      {stage.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--surface-muted)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Audit Timeline Table (7 Cols) */}
        <div className="lg:col-span-7 panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="panel-section-title">{t('recent_activity')}</h2>
            <Link href="/audit" className="link text-[11px]">
              {t('nav_audit')} &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('timestamp_col')}</th>
                  <th>{t('action_col')}</th>
                  <th>{t('actor_col')}</th>
                  <th className="!text-right">{t('integrity_col')}</th>
                </tr>
              </thead>
              <tbody>
                {safeAudits.slice(0, 5).map((evt: any) => {
                  const actorName = getActorDisplay(evt);
                  const actorRole = getActorRole(evt);
                  const isAI = actorName === 'Deterministic AI Worker';

                  return (
                    <tr key={evt.id}>
                      <td className="font-mono text-[11px] text-[var(--muted)] whitespace-nowrap">
                        {evt?.timestamp
                          ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : t('audit_just_now')}
                      </td>
                      <td className="font-mono font-bold text-[var(--accent)] text-[10px]">{evt?.action || 'EVENT'}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0 border"
                            style={{
                              backgroundColor: isAI ? 'var(--accent-soft)' : 'var(--surface-muted)',
                              borderColor: 'var(--border)',
                            }}
                            aria-hidden="true"
                          >
                            {isAI ? '🤖' : '👤'}
                          </span>
                          <div>
                            <p className="font-semibold text-[var(--foreground)] leading-none text-xs">{actorName}</p>
                            <span className="text-[9px] text-[var(--muted)] font-mono">{actorRole}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-mono text-[10px] text-[var(--success)] font-bold whitespace-nowrap">
                        {t('audit_verified')}
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
