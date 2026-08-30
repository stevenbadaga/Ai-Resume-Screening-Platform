import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import UserNav from '@/components/UserNav';
import NotificationBell from '@/components/NotificationBell';
import Providers from '@/components/Providers';
import { ThemeProvider, ThemeToggle } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
const SupportWidget = dynamic(() => import('@/components/SupportWidget'));
const CommandPalette = dynamic(() => import('@/components/CommandPalette'));

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta'
});

export const metadata: Metadata = {
  title: 'RecruitAI | Enterprise AI Resume Screening Platform',
  description: 'Evidence-based recruitment and candidate screening powered by explainable AI rubrics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} dark`}>
      <body className="min-h-screen dark:bg-[#070A11] bg-[#F8FAFC] dark:text-slate-100 text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-300 font-sans text-xs">
        <Providers>
          <ThemeProvider>
            <LanguageProvider>
              <ToastProvider>
                <div className="flex h-screen overflow-hidden dark:bg-[#070A11] bg-[#F8FAFC]">
                  {/* Sidebar Navigation */}
                  <Navigation />

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Top Application Header */}
                    <header className="h-13 shrink-0 dark:bg-[#0B0F19]/90 bg-white/90 backdrop-blur-md dark:border-slate-800/80 border-slate-200 border-b flex items-center justify-between px-4 z-20">
                      {/* Global Search & Command Trigger */}
                      <div className="flex-1 max-w-sm mx-4 hidden md:block">
                        <CommandPalette />
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2">
                        <LanguageSelector />
                        <ThemeToggle />
                        <NotificationBell />
                        <div className="h-4 w-px dark:bg-slate-800 bg-slate-200 mx-0.5" />
                        <UserNav />
                      </div>
                    </header>

                    {/* Scrollable Page Body */}
                    <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-6 lg:p-7 [contain:content]">
                      {children}
                    </main>
                  </div>
                </div>

                {/* Floating AI Copilot & Help Widget */}
                <SupportWidget />
              </ToastProvider>
            </LanguageProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}