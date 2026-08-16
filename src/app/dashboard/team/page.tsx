'use client';
import { useState } from 'react';

export default function TeamPage() {
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Interviewer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);
    
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, roleName })
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setMessage(`Invitation sent successfully to ${email} as ${roleName}!`);
        setEmail('');
      } else {
        setMessage(data.error || 'Failed to send invite');
      }
    } catch (err) {
      setMessage('An unexpected error occurred while sending invite');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { name: 'Admin', desc: 'Full platform administration, team management & audit access' },
    { name: 'Recruiter', desc: 'Full ATS candidate screening, job posting & score overrides' },
    { name: 'Hiring Manager', desc: 'Scoped to departmental job requisitions & applicant reviews' },
    { name: 'Interviewer', desc: 'Conducts technical scorecards & candidate evaluations' },
    { name: 'Auditor', desc: 'Read-only compliance verification & tamper-proof audit trails' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Team & Role Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Invite colleagues to your organization and delegate role-based access permissions.
          </p>
        </div>

        {/* Invite Form Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <h2 className="text-base font-bold text-white">Invite New Team Member</h2>

          {message && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                isSuccess
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              <span>{isSuccess ? '✓' : '⚠️'}</span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              <div className="sm:col-span-7">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Colleague Email Address *
                </label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. sarah.engineer@company.com"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Assigned Platform Role *
                </label>
                <select 
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-indigo-400 font-bold focus:outline-none focus:border-indigo-500"
                >
                  {roles.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending Invitation...' : 'Send Role Invitation & Access Link ✉️'}
            </button>
          </form>
        </div>

        {/* Roles Reference Matrix */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Role Permission Reference Guide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map(r => (
              <div key={r.name} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">{r.name}</span>
                  <span className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded text-[10px] font-mono">RBAC</span>
                </div>
                <p className="text-[11px] text-slate-400">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}