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

  const actions = [
    { name: t('nav_dashboard'), path: '/dashboard', icon: '📊', category: t('cmd_cat_navigation') },
    { name: t('nav_candidates'), path: '/candidates', icon: '👥', category: t('cmd_cat_navigation') },
    { name: t('nav_compare'), path: '/candidates/compare', icon: '⚖️', category: t('cmd_cat_analytics') },
    { name: t('nav_duplicates'), path: '/candidates/duplicates', icon: '🔍', category: t('cmd_cat_analytics') },
    { name: t('nav_jobs'), path: '/jobs', icon: '💼', category: t('cmd_cat_requisitions') },
    { name: t('nav_audit'), path: '/audit', icon: '🛡️', category: t('cmd_cat_compliance') },
    { name: t('nav_privacy'), path: '/privacy', icon: '🔒', category: t('cmd_cat_compliance') },
    { name: t('nav_team'), path: '/dashboard/team', icon: '🏢', category: t('cmd_cat_administration') },
    { name: t('nav_analytics'), path: '/dashboard/analytics', icon: '📈', category: t('cmd_cat_analytics') },
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