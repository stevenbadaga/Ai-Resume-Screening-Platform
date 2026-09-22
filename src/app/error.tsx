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
