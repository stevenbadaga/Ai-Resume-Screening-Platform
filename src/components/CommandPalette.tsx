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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const actions = [
    { name: t('nav_dashboard'), path: '/dashboard', icon: '📊', category: 'Navigation' },
    { name: t('nav_candidates'), path: '/candidates', icon: '👥', category: 'Navigation' },
    { name: t('nav_compare'), path: '/candidates/compare', icon: '⚖️', category: 'Analytics' },
    { name: t('nav_duplicates'), path: '/candidates/duplicates', icon: '🔍', category: 'Analytics' },
    { name: t('nav_jobs'), path: '/jobs', icon: '💼', category: 'Requisitions' },
    { name: t('nav_audit'), path: '/audit', icon: '🛡️', category: 'Compliance' },
    { name: t('nav_privacy'), path: '/privacy', icon: '🔒', category: 'Compliance' },
    { name: t('nav_team'), path: '/dashboard/team', icon: '🏢', category: 'Administration' }
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-200">
      <div className="dark:bg-[#0B0F19] bg-white border dark:border-slate-800 border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="p-3 border-b dark:border-slate-800 border-slate-100 flex items-center gap-2">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder={t('search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs dark:text-white text-slate-900 focus:outline-none placeholder-slate-400"
          />
          <kbd className="text-[10px] font-mono dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-500 px-1.5 py-0.5 rounded border dark:border-slate-700 border-slate-200">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No matching routes found.</div>
          ) : (
            filtered.map((action) => (
              <button
                key={action.path}
                onClick={() => handleSelect(action.path)}
                className="w-full flex items-center justify-between p-2 rounded-lg dark:hover:bg-slate-900 hover:bg-slate-50 transition text-left text-xs group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{action.icon}</span>
                  <span className="font-semibold dark:text-white text-slate-900 group-hover:text-indigo-400 transition">
                    {action.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:group-hover:text-slate-300">
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