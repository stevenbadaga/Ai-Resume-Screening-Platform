'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpen);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  const actions: Array<{ name: string; path: string; icon: React.ReactNode; category: string }> = [
    {
      name: t('nav_dashboard'),
      path: '/dashboard',
      category: t('cmd_cat_navigation'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: t('nav_candidates'),
      path: '/candidates',
      category: t('cmd_cat_navigation'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: t('nav_compare'),
      path: '/candidates/compare',
      category: t('cmd_cat_analytics'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
    {
      name: t('nav_duplicates'),
      path: '/candidates/duplicates',
      category: t('cmd_cat_analytics'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      name: t('nav_jobs'),
      path: '/jobs',
      category: t('cmd_cat_requisitions'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: t('nav_audit'),
      path: '/audit',
      category: t('cmd_cat_compliance'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: t('nav_privacy'),
      path: '/privacy',
      category: t('cmd_cat_compliance'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      name: t('nav_team'),
      path: '/dashboard/team',
      category: t('cmd_cat_administration'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: t('nav_analytics'),
      path: '/dashboard/analytics',
      category: t('cmd_cat_analytics'),
      icon: (
        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  const filtered = actions.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start justify-center pt-24 p-4 animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="glass-card rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 border-b border-[var(--border)] flex items-center gap-2.5">
          <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            placeholder={t('search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs font-semibold text-[var(--foreground)] focus:outline-none placeholder-[var(--muted)]"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-mono bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--foreground)] px-2 py-1 rounded-lg border border-[var(--border)] transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-[var(--muted)] text-xs font-medium">{t('cmd_palette_no_results')}</div>
          ) : (
            filtered.map((action) => (
              <button
                key={action.path}
                onClick={() => handleSelect(action.path)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--accent-soft)] transition-all text-left text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{action.icon}</span>
                  <span className="font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                    {action.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--muted)] group-hover:text-[var(--foreground)]">
                  {action.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}