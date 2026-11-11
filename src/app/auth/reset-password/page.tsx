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
        <div role="alert" className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 font-bold text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Missing reset token — use the link from your email</span>
        </div>
        <div className="text-center">
          <Link href="/auth/signin" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-xs">
        <div role="status" className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 font-bold text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Password updated — redirecting you to sign in…</span>
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
            className="w-full dark:bg-[#0D1017] bg-slate-50 dark:border-white/10 border-slate-200 border rounded-xl px-4 py-2.5 pr-16 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[11px] font-semibold dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white focus:outline-none"
          >
            {showPassword ? 'Hide' : 'Show'}
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
          className="w-full dark:bg-[#0D1017] bg-slate-50 dark:border-white/10 border-slate-200 border rounded-xl px-4 py-2.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition"
        />
      </div>

      {error && (
        <div role="alert" className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-bold text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-rose-900/20 hover:-translate-y-0.5"
      >
        {loading ? 'Updating…' : 'Reset password'}
      </button>

      <div className="pt-2 text-center text-xs dark:text-slate-400 text-slate-500">
        <Link href="/auth/signin" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#11141D] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 p-8 space-y-6">
        <div className="text-center space-y-3 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E11D48] via-[#F43F5E] to-[#FB7185] flex items-center justify-center text-white text-2xl font-extrabold mx-auto shadow-lg shadow-rose-900/20 ring-4 ring-rose-500/20">
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
