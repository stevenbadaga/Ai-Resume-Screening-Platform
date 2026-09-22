'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function UserNav() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = session?.user;
  const userRole = (user as any)?.role || 'Admin';

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'Admin':
        return t('role_admin_desc') || 'Full System Administrator: System telemetry, candidate pipeline, and user governance.';
      case 'Recruiter':
        return t('role_recruiter_desc') || 'Lead Recruiter: ATS Pipeline ownership, score recalibration & offer extension.';
      case 'HiringManager':
        return t('role_hiring_manager_desc') || 'Hiring Manager: Departmental candidate review, benchmarks & interview scheduling.';
      case 'Interviewer':
        return t('role_interviewer_desc') || 'Technical Interviewer: Candidate evaluation, question viewer & scorecard submission.';
      case 'ComplianceAuditor':
      case 'Auditor':
        return t('role_auditor_desc') || 'Compliance Auditor: Read-only access to immutable audit trails & compliance metrics.';
      case 'Candidate':
        return t('role_candidate_desc') || 'Job Applicant: Application tracking, job directory & GDPR self-service privacy.';
      default:
        return 'Authenticated User';
    }
  };

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-xs"
      >
        {t('sign_in') || 'Sign In'}
      </Link>
    );
  }

  const initials = (user.name || user.email || 'U')[0].toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg dark:hover:bg-slate-800 hover:bg-slate-100 transition"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
          {initials}
        </div>
        <div className="hidden sm:block text-left text-xs">
          <p className="font-semibold dark:text-white text-slate-900 leading-tight truncate max-w-[100px]">
            {user.name?.split(' ')[0] || 'User'}
          </p>
          <p className="text-[10px] dark:text-slate-400 text-slate-500 font-mono leading-none">
            {userRole}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 dark:bg-[#0B0F19] bg-white dark:border-slate-800 border-slate-200 border rounded-xl shadow-xl p-3.5 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-1 pb-2 dark:border-slate-800 border-slate-100 border-b">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold dark:text-white text-slate-900">{user.name}</p>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold dark:bg-indigo-950/80 bg-indigo-50 dark:text-indigo-300 text-indigo-700 border dark:border-indigo-800/80 border-indigo-200">
                {userRole}
              </span>
            </div>
            <p className="text-[11px] dark:text-slate-400 text-slate-500 font-mono truncate">{user.email}</p>
            <div className="p-2 rounded-lg dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border text-[10px] dark:text-slate-400 text-slate-600 leading-relaxed">
              {getRoleDescription(userRole)}
            </div>
          </div>

          {/* Session Security Indicator */}
          <div className="p-2 rounded-lg dark:bg-slate-950 bg-emerald-50/50 dark:border-slate-800 border-emerald-200 border space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{t('active_session') || 'Active Session'}</span>
            </div>
            <p className="text-[10px] dark:text-slate-500 text-slate-500">
              {t('session_enforced') || 'Role permissions strictly enforced.'}
            </p>
          </div>

          {/* Links and Sign Out */}
          <div className="pt-2 dark:border-slate-800 border-slate-100 border-t flex items-center justify-between">
            <Link
              href="/privacy"
              onClick={() => setIsOpen(false)}
              className="text-xs dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 font-medium"
            >
              {t('nav_privacy') || 'Privacy'}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="px-2.5 py-1 rounded-md dark:bg-rose-950/40 bg-rose-50 dark:hover:bg-rose-900/60 hover:bg-rose-100 dark:text-rose-300 text-rose-700 border dark:border-rose-800/50 border-rose-200 text-xs font-semibold transition"
            >
              {t('sign_out') || 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}