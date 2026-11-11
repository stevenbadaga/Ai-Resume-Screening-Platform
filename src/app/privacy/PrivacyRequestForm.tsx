'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

/**
 * §6.11 candidate rights form: correction, access, withdrawal, and deletion
 * requests are tracked (PrivacyRequest) and routed to the authorized privacy
 * staff for review — nothing executes automatically.
 */

const REQUEST_TYPES = [
  { value: 'CORRECTION', labelKey: 'privacy_request_correction', hintKey: 'privacy_request_correction_hint', needsChange: true },
  { value: 'ACCESS', labelKey: 'privacy_request_access', hintKey: 'privacy_request_access_hint', needsChange: false },
  { value: 'WITHDRAWAL', labelKey: 'privacy_request_withdrawal', hintKey: 'privacy_request_withdrawal_hint', needsChange: false },
  { value: 'DELETION', labelKey: 'privacy_request_deletion', hintKey: 'privacy_request_deletion_hint', needsChange: false },
] as const;

interface RequestRow {
  id: string;
  candidateRequest: string | null;
  decision: string | null;
  completionEvidence: string | null;
  createdAt: string | Date;
}

const inputClass =
  'w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)]';

export default function PrivacyRequestForm() {
  const { t } = useLanguage();
  const [requestType, setRequestType] = useState<string>('CORRECTION');
  const [details, setDetails] = useState('');
  const [requestedChange, setRequestedChange] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);

  const selected = REQUEST_TYPES.find((r) => r.value === requestType)!;

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/privacy/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/privacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          details: details.trim() || undefined,
          requestedChange: selected.needsChange ? requestedChange.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(data.message || t('privacy_request_recorded'));
        setDetails('');
        setRequestedChange('');
        void loadRequests();
      } else {
        setMessage(data.error || t('privacy_submit_failed'));
      }
    } catch {
      setMessage(t('privacy_network_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-bold dark:text-white text-slate-900 text-sm">
          {t('privacy_requests_title')}
        </h2>
        <p className="text-xs dark:text-slate-400 text-slate-600 mt-1 leading-relaxed">
          {t('privacy_requests_desc')}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REQUEST_TYPES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                requestType === r.value
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-ring)]'
                  : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-300 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="requestType"
                value={r.value}
                checked={requestType === r.value}
                onChange={() => setRequestType(r.value)}
                className="sr-only"
              />
              {t(r.labelKey)}
            </label>
          ))}
        </div>

        <p className="text-[11px] dark:text-slate-500 text-slate-500">{t(selected.hintKey)}</p>

        {selected.needsChange && (
          <textarea
            rows={2}
            required
            value={requestedChange}
            onChange={(e) => setRequestedChange(e.target.value)}
            placeholder={t('privacy_change_placeholder')}
            className={inputClass}
          />
        )}

        <textarea
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t('privacy_context_placeholder')}
          className={inputClass}
        />

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary text-xs font-bold disabled:opacity-50"
        >
          {submitting ? t('privacy_submitting') : t('privacy_submit_request')}
        </button>

        {message && (
          <p className="text-xs text-[var(--accent)] font-medium" role="status">
            {message}
          </p>
        )}
      </form>

      {requests.length > 0 && (
        <div className="pt-2 border-t dark:border-slate-800 border-slate-100">
          <h3 className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-2">
            {t('privacy_past_requests')}
          </h3>
          <ul className="space-y-1.5">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-xs">
                <code className="dark:bg-slate-900 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]">
                  {r.candidateRequest ?? 'REQUEST'}
                </code>
                <span className="dark:text-slate-400 text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    r.decision === 'APPROVED'
                      ? 'bg-emerald-950/60 text-emerald-300'
                      : r.decision === 'REJECTED'
                        ? 'bg-rose-950/60 text-rose-300'
                        : 'bg-slate-800/60 text-slate-300'
                  }`}
                >
                  {r.decision ?? 'PENDING'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
