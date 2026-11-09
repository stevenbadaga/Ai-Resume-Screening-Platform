'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function CompareRestricted() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
      <div className="dark:bg-slate-900/60 bg-white dark:border-slate-800/80 border-slate-200/90 border rounded-3xl p-10 shadow-xl space-y-4 backdrop-blur-xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold dark:bg-amber-950/80 bg-amber-50 dark:text-amber-300 text-amber-800 border dark:border-amber-800/80 border-amber-200">
          {t('compare_restricted_badge')}
        </span>
        <h1 className="text-2xl font-extrabold dark:text-white text-slate-900">
          {t('compare_restricted_title')}
        </h1>
        <p className="text-xs dark:text-slate-400 text-slate-500 max-w-md mx-auto leading-relaxed">
          {t('compare_restricted_desc')}
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
          >
            {t('compare_restricted_cta')} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
