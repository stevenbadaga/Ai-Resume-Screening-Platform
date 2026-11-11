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
        return t('role_admin_desc');
      case 'Recruiter':
        return t('role_recruiter_desc');
      case 'HiringManager':
        return t('role_hiring_manager_desc');
      case 'Interviewer':
        return t('role_interviewer_desc');
      case 'ComplianceAuditor':
      case 'Auditor':
        return t('role_auditor_desc');
      case 'Candidate':
        return t('role_candidate_desc');
      default:
        return 'Authenticated User';
    }
  };

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className="btn btn-primary text-xs"
      >
        {t('sign_in')}
      </Link>
    );
  }

  const initials = (user.name || user.email || 'U')[0].toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[var(--surface-muted)] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--grad-accent)] text-white shadow-md shadow-rose-900/20 flex items-center justify-center text-xs font-extrabold font-mono group-hover:scale-105 transition-transform">
          {initials}
        </div>
        <div className="hidden sm:block text-left text-xs">
          <p className="font-bold text-[var(--foreground)] leading-tight truncate max-w-[110px] group-hover:text-[var(--accent)] transition-colors">
            {user.name?.split(' ')[0] || 'User'}
          </p>
          <p className="text-[10px] text-[var(--muted)] font-mono leading-none mt-0.5">
            {userRole}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-76 glass-card rounded-2xl border border-[var(--border)] p-4 space-y-3.5 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
          <div className="space-y-1.5 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[var(--foreground)]">{user.name}</p>
              <span className="chip chip-accent">
                {userRole}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] font-mono truncate">{user.email}</p>
            <div className="p-2.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[10.5px] text-[var(--muted)] leading-relaxed mt-2">
              {getRoleDescription(userRole)}
            </div>
          </div>

          {/* Session Security Indicator */}
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
            <div className="flex items-center gap-2 text-[10.5px] font-bold text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t('active_session')}</span>
            </div>
            <p className="text-[10px] text-[var(--muted)] pl-4">
              {t('session_enforced')}
            </p>
          </div>

          {/* Links and Sign Out */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <Link
              href="/privacy"
              onClick={() => setIsOpen(false)}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-semibold transition-colors"
            >
              {t('nav_privacy')}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            >
              {t('sign_out')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}