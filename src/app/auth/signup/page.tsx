'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const WORKER_ROLES = [
  { role: 'Recruiter', title: 'Lead Recruiter', desc: 'Manage candidate pipeline, score overrides & offers', icon: '🎯', badge: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { role: 'HiringManager', title: 'Hiring Manager', desc: 'Departmental review, candidate benchmarks & hiring decisions', icon: '👔', badge: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  { role: 'Interviewer', title: 'Technical Interviewer', desc: 'Interview questions, evaluations & candidate scorecards', icon: '🎤', badge: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { role: 'ComplianceAuditor', title: 'Compliance Auditor', desc: 'Audit log inspection, bias monitoring & GDPR compliance', icon: '⚖️', badge: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { role: 'Admin', title: 'Workspace Admin', desc: 'Full organization management, team RBAC & system telemetry', icon: '👑', badge: 'border-rose-500/40 text-rose-400 bg-rose-500/10' }
];

export default function SignupPage() {
  const router = useRouter();

  // Account Type: 'candidate' (Applicant) vs 'worker' (Company Staff)
  const [accountType, setAccountType] = useState<'candidate' | 'worker'>('candidate');
  const [companyName, setCompanyName] = useState('Codafriqa Tech Corp');
  const [selectedRole, setSelectedRole] = useState('Recruiter');

  // Credentials
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          accountType,
          companyName: accountType === 'worker' ? companyName : undefined,
          role: accountType === 'worker' ? selectedRole : 'Candidate'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      // Auto sign-in
      const signInRes = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (signInRes?.error) {
        router.push('/auth/signin');
      } else {
        if (accountType === 'candidate') {
          router.push('/dashboard/my-applications');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-extrabold mx-auto shadow-md shadow-indigo-500/25">
          ⚡
        </div>
        <h1 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">
          Create Your RecruitAI Account
        </h1>
        <p className="text-xs dark:text-slate-400 text-slate-500 max-w-sm mx-auto">
          Choose your account classification below to receive tailored workspace tools and role-based clearance.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold text-center max-w-md mx-auto">
          ⚠️ {error}
        </div>
      )}

      {/* Account Type Classification Switcher */}
      <div className="max-w-md mx-auto grid grid-cols-2 p-1 dark:bg-slate-900 bg-slate-100 dark:border-slate-800 border-slate-200 border rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setAccountType('candidate')}
          className={`py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
            accountType === 'candidate'
              ? 'dark:bg-indigo-600 bg-white text-slate-900 dark:text-white shadow-xs'
              : 'dark:text-slate-400 text-slate-600 hover:dark:text-white'
          }`}
        >
          <span>🧑‍💼</span>
          <span>Job Applicant</span>
        </button>

        <button
          type="button"
          onClick={() => setAccountType('worker')}
          className={`py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
            accountType === 'worker'
              ? 'dark:bg-indigo-600 bg-white text-slate-900 dark:text-white shadow-xs'
              : 'dark:text-slate-400 text-slate-600 hover:dark:text-white'
          }`}
        >
          <span>🏢</span>
          <span>Company Worker</span>
        </button>
      </div>

      {/* Registration Card Form */}
      <div className="max-w-xl mx-auto dark:bg-[#0B0F19] bg-white dark:border-slate-800/80 border-slate-200 border rounded-2xl p-6 sm:p-7 shadow-xl space-y-4 text-xs">
        {/* Type Context Header */}
        <div className="p-3 rounded-xl dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border flex items-center gap-2.5">
          <span className="text-xl">{accountType === 'candidate' ? '📄' : '🏢'}</span>
          <div>
            <h3 className="font-bold dark:text-white text-slate-900 text-xs">
              {accountType === 'candidate' ? 'Job Seeker Portal Registration' : 'Enterprise Workspace Staff Registration'}
            </h3>
            <p className="text-[10px] dark:text-slate-400 text-slate-500">
              {accountType === 'candidate'
                ? 'Apply for open positions, upload your CV, and track your application status.'
                : 'Join or create your company workspace to evaluate candidates and manage requisitions.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Worker Specific Fields: Company Name and Staff Role */}
          {accountType === 'worker' && (
            <div className="space-y-3 p-3.5 dark:bg-slate-950/60 bg-indigo-50/40 dark:border-slate-800 border-indigo-100 border rounded-xl">
              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Codafriqa Tech Corp"
                  className="w-full dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-1">
                  Staff Role Assignment *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  {WORKER_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.icon} {r.title} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
              {accountType === 'worker' ? 'Work Email Address *' : 'Email Address *'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={accountType === 'worker' ? 'you@company.com' : 'you@example.com'}
              className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>✨</span>
            <span>
              {loading
                ? 'Creating Account...'
                : accountType === 'candidate'
                ? 'Register as Candidate'
                : `Register as ${selectedRole} at ${companyName || 'Company'}`}
            </span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs dark:text-slate-400 text-slate-500 border-t dark:border-slate-800 border-slate-100">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}