'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin workspace settings (spec §6.12): retention policy (§6.11), decision
 * reasons, recruitment stages, job categories, scoring boundaries, and
 * branding. Every save is audited server-side with old/new values.
 */

interface ReasonRow {
  code: string;
  label: string;
}

interface WorkflowConfig {
  decisionReasons?: ReasonRow[];
  stages?: string[];
  jobCategories?: string[];
  scoringBoundaries?: { strongMatchPct?: number; reviewPct?: number };
}

interface Branding {
  displayName?: string;
  logoUrl?: string;
  primaryColor?: string;
}

const inputClass =
  'w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500';

export default function SettingsClient({
  organizationName,
  initialRetention,
  initialWorkflow,
  initialBranding,
}: {
  organizationName: string;
  initialRetention: { statusPeriodDays?: Record<string, number>; anonymize?: boolean };
  initialWorkflow: WorkflowConfig;
  initialBranding: Branding;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'workflow' | 'retention' | 'branding'>('workflow');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ── Workflow config state ──
  const [reasons, setReasons] = useState<ReasonRow[]>(initialWorkflow.decisionReasons ?? []);
  const [newReasonCode, setNewReasonCode] = useState('');
  const [newReasonLabel, setNewReasonLabel] = useState('');
  const [stages, setStages] = useState<string[]>(initialWorkflow.stages ?? []);
  const [categories, setCategories] = useState<string[]>(initialWorkflow.jobCategories ?? []);
  const [newCategory, setNewCategory] = useState('');
  const [strongMatchPct, setStrongMatchPct] = useState(
    String(initialWorkflow.scoringBoundaries?.strongMatchPct ?? 80)
  );
  const [reviewPct, setReviewPct] = useState(
    String(initialWorkflow.scoringBoundaries?.reviewPct ?? 50)
  );

  // ── Retention state (§6.11) ──
  const statusKeys = ['NEW', 'ACTIVE', 'ON_HOLD', 'REJECTED', 'WITHDRAWN', 'HIRED'];
  const [retentionDays, setRetentionDays] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const key of statusKeys) {
      initial[key] = String(initialRetention.statusPeriodDays?.[key] ?? '');
    }
    return initial;
  });
  const [anonymize, setAnonymize] = useState(initialRetention.anonymize ?? true);

  // ── Branding state ──
  const [displayName, setDisplayName] = useState(organizationName);
  const [logoUrl, setLogoUrl] = useState(initialBranding.logoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(initialBranding.primaryColor ?? '#4f46e5');

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 4000);
  };

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/org/workflow-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionReasons: reasons,
          stages,
          jobCategories: categories,
          scoringBoundaries: {
            strongMatchPct: Number(strongMatchPct) || undefined,
            reviewPct: Number(reviewPct) || undefined,
          },
        }),
      });
      flash(res.ok ? 'Workflow configuration saved.' : 'Failed to save workflow configuration.');
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const saveBranding = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/org/workflow-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branding: { displayName, logoUrl, primaryColor },
        }),
      });
      flash(res.ok ? 'Branding saved.' : 'Failed to save branding.');
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const saveRetention = async () => {
    setSaving(true);
    try {
      const statusPeriodDays: Record<string, number> = {};
      for (const key of statusKeys) {
        const value = Number(retentionDays[key]);
        if (retentionDays[key] !== '' && !Number.isNaN(value)) statusPeriodDays[key] = value;
      }
      const res = await fetch('/api/org/retention', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusPeriodDays, anonymize }),
      });
      flash(res.ok ? 'Retention policy saved.' : 'Failed to save retention policy.');
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const addReason = () => {
    if (!newReasonCode.trim() || !newReasonLabel.trim()) return;
    setReasons((prev) => [...prev, { code: newReasonCode.trim(), label: newReasonLabel.trim() }]);
    setNewReasonCode('');
    setNewReasonLabel('');
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    setCategories((prev) => [...prev, newCategory.trim()]);
    setNewCategory('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div>
          <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
            Workspace Settings
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Configure the recruitment workflow, retention policy, and branding (spec §6.11/§6.12).
            Every change is recorded in the audit trail.
          </p>
        </div>
        <a
          href="/dashboard"
          className="self-start px-3 py-1.5 dark:bg-slate-900 bg-white dark:hover:bg-slate-800 hover:bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg text-xs font-semibold dark:text-slate-200 text-slate-700 transition"
        >
          &larr; Back to dashboard
        </a>
      </div>

      <div className="flex gap-2">
        {(
          [
            ['workflow', 'Workflow & Reasons'],
            ['retention', 'Retention Policy'],
            ['branding', 'Branding'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              tab === key
                ? 'dark:bg-teal-950/50 bg-teal-50 dark:text-teal-300 text-teal-700 dark:border-teal-800/60 border-teal-200'
                : 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 dark:text-slate-300 text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-lg px-3 py-2 text-xs dark:bg-teal-950/40 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/60 border-teal-200">
          {message}
        </div>
      )}

      {tab === 'workflow' && (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-4">
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700">
              Decision reason catalog (§6.7)
            </h2>
            <p className="text-[11px] dark:text-slate-500 text-slate-500">
              Configurable decision reasons offered to recruiters when recording a screening
              decision. Irrelevant or discriminatory categories must not be added.
            </p>
            <ul className="space-y-1">
              {reasons.map((r, i) => (
                <li key={`${r.code}-${i}`} className="flex items-center gap-2 text-xs">
                  <code className="dark:bg-slate-900 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]">
                    {r.code}
                  </code>
                  <span className="dark:text-slate-300 text-slate-700">{r.label}</span>
                  <button
                    onClick={() => setReasons((prev) => prev.filter((_, idx) => idx !== i))}
                    className="ml-auto text-rose-400 hover:text-rose-500"
                    aria-label={`Remove reason ${r.code}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
              {reasons.length === 0 && (
                <li className="text-xs dark:text-slate-500 text-slate-400">No custom reasons yet.</li>
              )}
            </ul>
            <div className="flex flex-wrap gap-2">
              <input
                value={newReasonCode}
                onChange={(e) => setNewReasonCode(e.target.value)}
                placeholder="CODE (e.g. LACKS_EXPERIENCE)"
                className={inputClass + ' flex-1 min-w-[140px] font-mono'}
              />
              <input
                value={newReasonLabel}
                onChange={(e) => setNewReasonLabel(e.target.value)}
                placeholder="Displayed label"
                className={inputClass + ' flex-1 min-w-[140px]'}
              />
              <button
                onClick={addReason}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:bg-teal-600 bg-teal-500 text-white hover:opacity-90"
              >
                Add reason
              </button>
            </div>
          </section>

          <section className="space-y-2 pt-2 border-t dark:border-slate-800 border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700">
              Job categories (§6.12)
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="px-2 py-0.5 rounded text-[10px] font-mono border dark:border-slate-700 border-slate-200 dark:text-slate-300 text-slate-600"
                >
                  {c}
                  <button
                    onClick={() => setCategories((prev) => prev.filter((_, idx) => idx !== i))}
                    className="ml-1.5 text-rose-400 hover:text-rose-500"
                    aria-label={`Remove category ${c}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {categories.length === 0 && (
                <span className="text-xs dark:text-slate-500 text-slate-400">
                  No custom categories yet.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category (e.g. Engineering)"
                className={inputClass + ' flex-1'}
              />
              <button
                onClick={addCategory}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:bg-teal-600 bg-teal-500 text-white hover:opacity-90"
              >
                Add
              </button>
            </div>
          </section>

          <section className="space-y-2 pt-2 border-t dark:border-slate-800 border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700">
              Scoring boundaries (§6.12)
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] dark:text-slate-400 text-slate-600 mb-1">
                  Strong match ≥ (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={strongMatchPct}
                  onChange={(e) => setStrongMatchPct(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] dark:text-slate-400 text-slate-600 mb-1">
                  Manual review ≤ (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={reviewPct}
                  onChange={(e) => setReviewPct(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-bold dark:bg-teal-600 bg-teal-500 text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save workflow configuration'}
          </button>
        </div>
      )}

      {tab === 'retention' && (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-4">
          <p className="text-[11px] dark:text-slate-500 text-slate-500">
            Retention periods per application status in days (spec §6.11). Empty = keep until
            manual action. Enforcement runs via <code>npx tsx scripts/applyRetention.ts</code> on a
            schedule (dry-run by default; add <code>--apply</code> to execute).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {statusKeys.map((key) => (
              <div key={key}>
                <label className="block text-[11px] dark:text-slate-400 text-slate-600 mb-1">
                  {key} (days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={retentionDays[key]}
                  onChange={(e) =>
                    setRetentionDays((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder="—"
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs dark:text-slate-300 text-slate-700">
            <input
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
            />
            Anonymize instead of hard-deleting expired applications
          </label>
          <button
            onClick={saveRetention}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-bold dark:bg-teal-600 bg-teal-500 text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save retention policy'}
          </button>
        </div>
      )}

      {tab === 'branding' && (
        <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-[11px] dark:text-slate-400 text-slate-600 mb-1">
              Workspace display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] dark:text-slate-400 text-slate-600 mb-1">
              Logo URL (optional)
            </label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] dark:text-slate-400 text-slate-600 mb-1">
              Primary color
            </label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-8 w-14 rounded cursor-pointer"
            />
          </div>
          <button
            onClick={saveBranding}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-bold dark:bg-teal-600 bg-teal-500 text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save branding'}
          </button>
        </div>
      )}
    </div>
  );
}
