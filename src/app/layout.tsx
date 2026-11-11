import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import Providers from '@/components/Providers';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

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
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased font-sans text-sm">
        {/* §9 Accessibility: keyboard users can jump past the navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-white focus:text-xs focus:font-bold"
        >
          Skip to main content
        </a>
        <Providers>
          <ThemeProvider>
            <LanguageProvider>
              <ToastProvider>
                <AppShell>{children}</AppShell>
              </ToastProvider>
            </LanguageProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}