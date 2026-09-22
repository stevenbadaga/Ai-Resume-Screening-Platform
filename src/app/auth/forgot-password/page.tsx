'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailSystemHealthy, setEmailSystemHealthy] = useState(true);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status !== 429) {
        setError('Something went wrong — please try again');
        return;
      }
      // The endpoint never reveals whether the email has an account
      // (anti-enumeration) — but it DOES report platform-wide email health.
      // A failing mail provider would otherwise make this flow a dead end
      // with an on-its-way message nobody received.
      const data = await res.json().catch(() => ({}));
      setEmailSystemHealthy(data?.emailSystemHealthy !== false);
      setSubmitted(true);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md dark:bg-slate-900/80 bg-white rounded-3xl shadow-2xl border dark:border-slate-800 border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-3 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white text-2xl font-extrabold mx-auto shadow-lg shadow-teal-900/20 ring-4 ring-teal-700/10">
            R
          </div>
          <h1 className="text-2xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            Reset your password
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500">
            Enter your account email and we&apos;ll send you a reset link.
          </p>
        </div>

        {submitted ? (
          <div role="status" className="space-y-4 text-xs">
            {emailSystemHealthy ? (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 font-bold text-center">
                ✅ If an account exists for that email, a reset link is on its way.
              </div>
            ) : (
              <div className="p-3.5 bg-amber-950/70 border border-amber-800 rounded-xl text-amber-200 font-bold text-center space-y-3">
                <p>
                  ⚠️ If an account exists for that email, a reset link was requested — but our email delivery is failing right now, so it may never arrive.
                </p>
                <p className="font-medium opacity-90">
                  Please try again shortly; if it keeps failing, contact support so delivery can be restored.
                </p>
              </div>
            )}
            <div className="text-center">
              <Link href="/auth/signin" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="forgot-email" className="block dark:text-slate-400 text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="forgot-email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@codafriqa.rw"
                className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-2.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
              />
            </div>

            {error && (
              <div role="alert" className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-bold text-center">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-teal-900/20 hover:-translate-y-0.5"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <div className="pt-2 text-center text-xs dark:text-slate-400 text-slate-500">
              <Link href="/auth/signin" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
