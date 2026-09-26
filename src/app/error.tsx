'use client';
import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Report to the error tracker via the server-side telemetry endpoint —
    // the Sentry Node SDK must not run in the browser bundle.
    void fetch('/api/telemetry/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest ?? null,
        stack: error.stack?.slice(0, 2000),
      }),
    }).catch(() => undefined); // never block the error UI on telemetry
  }, [error]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text)' }}>
      <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Something went wrong!</h2>
      <button className="btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
