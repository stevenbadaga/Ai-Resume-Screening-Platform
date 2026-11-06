'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function UnauthorizedPanel() {
  const { data: session } = useSession();
  const { t } = useLanguage();

  // Only render for unauthenticated visitors.
  if (session?.user) return null;

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/signin"
        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      >
        {t('sign_in')}
      </Link>
      <Link
        href="/auth/signup"
        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      >
        {t('create_account')}
      </Link>
    </div>
  );
}
