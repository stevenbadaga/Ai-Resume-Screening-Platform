'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PrivacyPortal() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('SUBMITTING');
    try {
      const res = await fetch('/api/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process privacy request');
      }

      setStatus('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('ERROR');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        <div>
          <Link
            href="/jobs"
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
          >
            &larr; Back to Job Board
          </Link>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl">
              🛡️
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              Candidate Privacy & GDPR Portal
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Under GDPR, CCPA, and global data sovereignty regulations, you retain full ownership of your data and the <strong>Right to be Forgotten</strong>.
            </p>
          </div>

          {status === 'SUCCESS' ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
              <span className="text-3xl block">✓</span>
              <h2 className="text-base font-bold text-emerald-400">Data Deletion Complete</h2>
              <p className="text-xs text-slate-300">
                Your personal identifiers have been scrubbed from candidate records and uploaded resume documents have been permanently purged from our servers.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestDeletion} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Your Registered Candidate Email *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {status === 'ERROR' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'SUBMITTING'}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                {status === 'SUBMITTING' ? 'Purging Personal Records...' : 'Execute Permanent Data Erasure 🗑️'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}