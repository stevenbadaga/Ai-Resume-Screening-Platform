'use client';

import { useEffect, useState } from 'react';

/**
 * §6.11 candidate rights form: correction, access, withdrawal, and deletion
 * requests are tracked (PrivacyRequest) and routed to the authorized privacy
 * staff for review — nothing executes automatically.
 */

const REQUEST_TYPES = [
  {
    value: 'CORRECTION',
    label: 'Correct my data',
    hint: 'Tell us what is inaccurate and what it should say (e.g. wrong phone number, misspelled name).',
    needsChange: true,
  },
  {
    value: 'ACCESS',
    label: 'Get a copy of my data',
    hint: 'We will prepare and send you the personal data we hold about you.',
    needsChange: false,
  },
  {
    value: 'WITHDRAWAL',
    label: 'Withdraw my consent',
    hint: 'Ask us to stop processing your application. Ongoing recruitment will stop.',
    needsChange: false,
  },
  {
    value: 'DELETION',
    label: 'Request deletion review',
    hint: 'For full immediate erasure, use the Right to be Forgotten control above — this asks the privacy team to review deletion of specific records.',
    needsChange: false,
  },
] as const;

interface RequestRow {
  id: string;
  candidateRequest: string | null;
  decision: string | null;
  completionEvidence: string | null;
  createdAt: string | Date;
}

const inputClass =
  'w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500';

export default function PrivacyRequestForm() {
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
        setMessage(data.message || 'Your request has been recorded.');
        setDetails('');
        setRequestedChange('');
        void loadRequests();
      } else {
        setMessage(data.error || 'Failed to submit request.');
      }
    } catch {
      setMessage('Network error — the request was not submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-bold dark:text-white text-slate-900 text-sm">
          Data requests (correction, access, withdrawal)
        </h2>
        <p className="text-xs dark:text-slate-400 text-slate-600 mt-1 leading-relaxed">
          Submit a formal data request. It is recorded, tracked, and routed to our privacy team for
          review — you will be contacted with the outcome.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REQUEST_TYPES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                requestType === r.value
                  ? 'dark:bg-teal-950/50 bg-teal-50 dark:text-teal-300 text-teal-700 dark:border-teal-800/60 border-teal-200'
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
              {r.label}
            </label>
          ))}
        </div>

        <p className="text-[11px] dark:text-slate-500 text-slate-500">{selected.hint}</p>

        {selected.needsChange && (
          <textarea
            rows={2}
            required
            value={requestedChange}
            onChange={(e) => setRequestedChange(e.target.value)}
            placeholder="What should your data say instead?"
            className={inputClass}
          />
        )}

        <textarea
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Additional context (optional)"
          className={inputClass}
        />

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-xs font-bold dark:bg-teal-600 bg-teal-500 text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit request'}
        </button>

        {message && (
          <p className="text-xs dark:text-teal-300 text-teal-700" role="status">
            {message}
          </p>
        )}
      </form>

      {requests.length > 0 && (
        <div className="pt-2 border-t dark:border-slate-800 border-slate-100">
          <h3 className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-2">
            Your past requests
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
