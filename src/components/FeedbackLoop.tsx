'use client';
import { useState } from 'react';

export default function FeedbackLoop({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [comment, setComment] = useState('');

  const submitFeedback = async (correct: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/decisions/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, decision: correct ? 'APPROVED' : 'REJECTED', reason: comment })
      });
      if (res.ok) setSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (success) return <div className="text-sm text-green-500">Thank you for your feedback! This helps train the AI.</div>;

  return (
    <div className="bg-[var(--card)] p-4 rounded border border-[var(--border)] mt-4">
      <h3 className="text-sm font-semibold mb-2">Was the AI's score accurate?</h3>
      <input 
        type="text" 
        value={comment} 
        onChange={e => setComment(e.target.value)}
        placeholder="Optional comment..."
        className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-1 text-sm mb-3 text-[var(--text)]"
      />
      <div className="flex gap-2">
        <button onClick={() => submitFeedback(true)} disabled={loading} className="btn-secondary text-sm py-1 px-3">Yes, Accurate</button>
        <button onClick={() => submitFeedback(false)} disabled={loading} className="btn-secondary text-sm py-1 px-3 text-red-500">No, Override Decision</button>
      </div>
    </div>
  );
}
