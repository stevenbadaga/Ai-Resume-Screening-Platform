'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 3000);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-xs">
        <div role="alert" className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 font-bold text-center">
          ⚠️ Missing reset token — use the link from your email
        </div>
        <div className="text-center">
          <Link href="/auth/signin" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-xs">
        <div role="status" className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 font-bold text-center">
          ✅ Password updated — redirecting you to sign in…
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label htmlFor="reset-password" className="block dark:text-slate-400 text-slate-600 font-bold uppercase tracking-wider mb-1.5">
          New password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="reset-password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-2.5 pr-16 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded-md text-[10px] font-bold dark:text-slate-400 text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="reset-confirm" className="block dark:text-slate-400 text-slate-600 font-bold uppercase tracking-wider mb-1.5">
          Confirm new password
        </label>
        <input
          type="password"
          id="reset-confirm"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••"
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
        {loading ? 'Updating…' : 'Reset password'}
      </button>

      <div className="pt-2 text-center text-xs dark:text-slate-400 text-slate-500">
        <Link href="/auth/signin" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md dark:bg-slate-900/80 bg-white rounded-3xl shadow-2xl border dark:border-slate-800 border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-3 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white text-2xl font-extrabold mx-auto shadow-lg shadow-teal-900/20 ring-4 ring-teal-700/10">
            R
          </div>
          <h1 className="text-2xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            Choose a new password
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500">
            Your reset link is valid for 30 minutes and can only be used once.
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-xs dark:text-slate-400 text-slate-500">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
