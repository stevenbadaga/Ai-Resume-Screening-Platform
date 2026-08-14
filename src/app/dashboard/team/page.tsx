'use client';
import { useState } from 'react';

export default function TeamPage() {
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Interviewer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, roleName })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Invite sent successfully!');
        setEmail('');
      } else {
        setMessage(data.error || 'Failed to send invite');
      }
    } catch (err) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-[var(--text)]">Team Management</h1>
      
      <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] mb-8">
        <h2 className="text-xl mb-4 text-[var(--text)]">Invite New Member</h2>
        <form onSubmit={handleInvite} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-2 text-[var(--text-muted)]">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-4 py-2 text-[var(--text)]"
              placeholder="colleague@company.com"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm mb-2 text-[var(--text-muted)]">Role</label>
            <select 
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-4 py-2 text-[var(--text)]"
            >
              <option value="Admin">Admin</option>
              <option value="Hiring Manager">Hiring Manager</option>
              <option value="Interviewer">Interviewer</option>
              <option value="Recruiter">Recruiter</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary px-6 py-2"
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-[var(--accent)]">{message}</p>}
      </div>
    </div>
  );
}
