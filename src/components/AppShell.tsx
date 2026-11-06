'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import UserNav from '@/components/UserNav';
import NotificationBell from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeProvider';
import LanguageSelector from '@/components/LanguageSelector';

const SupportWidget = dynamic(() => import('@/components/SupportWidget'));
const CommandPalette = dynamic(() => import('@/components/CommandPalette'));

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalonePage = pathname === '/' || pathname.startsWith('/auth/');

  if (isStandalonePage) {
    if (pathname.startsWith('/auth/')) {
      return (
        <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
          <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 backdrop-blur-xl sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-extrabold text-sm shadow-sm group-hover:scale-105 transition-all">
                R
              </div>
              <span className="font-extrabold tracking-tight text-sm text-[var(--foreground)]">
                Recruit<span className="text-[var(--accent)]">AI</span>
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </header>
          <main id="main-content" className="flex-1 flex flex-col justify-center">
            {children}
          </main>
        </div>
      );
    }
    return <main id="main-content" className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-teal-600 focus:px-3 focus:py-2 focus:text-white focus:text-xs focus:font-bold"
      >
        Skip to main content
      </a>
      <div className="app-shell flex h-screen overflow-hidden">
        <Navigation />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="app-header z-20 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/75 px-3 backdrop-blur-xl backdrop-saturate-150 sm:px-5">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              aria-label="Open command palette"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] text-xs transition duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline font-medium text-[11px]">Search platform…</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-2.5">
              <LanguageSelector />
              <ThemeToggle />
              <NotificationBell />
              <div className="mx-0.5 h-4 w-px bg-[var(--border)]" />
              <UserNav />
            </div>
          </header>

          <main
            id="main-content"
            className="app-content flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-6 lg:p-8 [contain:content]"
          >
            {children}
          </main>
        </div>
      </div>

      <CommandPalette />
      <SupportWidget />
    </>
  );
}
