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
    <div className="animate-in" style={{ maxWidth: '600px', margin: '4rem auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>&larr; Back to Home</Link>
      </div>

      <div className="glass-panel" style={{ padding: '3rem' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Candidate Privacy Portal</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Under GDPR and relevant data protection laws, you have the "Right to be Forgotten".
          Submit your email address below to permanently delete your physical resume files and anonymize your personal data from our screening platform.
        </p>

        {status === 'SUCCESS' ? (
          <div style={{ padding: '2rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary)', borderRadius: '4px', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>Success!</h2>
            <p>Your privacy request has been processed. Your personal identifiers have been scrubbed and physical documents deleted.</p>
          </div>
        ) : (
          <form onSubmit={handleRequestDeletion} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Registered Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem' }}
              />
            </div>
            
            {status === 'ERROR' && (
              <div style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>
                Error: {errorMessage}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={status === 'SUBMITTING'}
              style={{ padding: '0.75rem', backgroundColor: 'var(--accent)', color: 'white', border: 'none' }}
            >
              {status === 'SUBMITTING' ? 'Processing...' : 'Permanently Delete My Data'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
