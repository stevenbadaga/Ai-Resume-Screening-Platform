import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { UnauthorizedPanel } from '@/components/UnauthorizedPanel';
import LanguageSelector from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeProvider';

// Force dynamic so the per-request session check runs (no static prerender).
export const dynamic = 'force-dynamic';

export default async function PublicLanding() {
  const session = await getServerSession(authOptions);

  // Authenticated users are routed directly to their dashboard.
  if (session?.user) {
    redirect('/dashboard');
  }

  // Unauthenticated visitors see the public landing page.
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navbar — public, only brand + sign-in/sign-up + language toggle. */}
      <header className="app-header sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white font-extrabold text-lg shadow-sm">
              R
            </div>
            <span className="font-extrabold tracking-tight text-sm sm:text-base">
              Recruit<span className="text-[var(--accent)]">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />
            <ThemeToggle />
            <div className="hidden sm:block h-4 w-px bg-[var(--border)] mx-0.5" />
            <UnauthorizedPanel />
          </div>
        </div>
      </header>

      {/* Hero — value proposition, CTA, proof points. */}
      <section className="relative overflow-hidden px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <span className="chip chip-accent !text-[9px] !tracking-[0.18em] uppercase mb-4 inline-block">
            Explainable AI recruitment
          </span>
          <h1 className="font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-5xl">
            Screen candidates with{' '}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
              transparent AI
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-[var(--muted)]">
            Evidence-based resume screening powered by structured rubrics — not black-box
            scores. See why a candidate matches, what is missing, and where the evidence
            comes from.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            >
              Start hiring free
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/auth/signin"
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            >
              Sign in to your account
            </Link>
          </div>
        </div>

        {/* Proof points */}
        <div className="mx-auto mt-12 max-w-4xl grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Explainable scores',
              description:
                'Every screening result shows which criteria matched, which are missing, and the evidence behind each decision.',
            },
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: 'Privacy-forward by default',
              description:
                'PII is redacted before AI processing. Candidates control their data, and access is scoped by role and organization.',
            },
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Fairness-tested screening',
              description:
                'CVs are evaluated against the job rubric only. Proxy signals such as name, school, and location are removed before scoring.',
            },
          ].map(({ icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-4 transition hover:bg-[var(--surface)]/80"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Candidate CTA */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]/40 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-bold text-lg">Looking for your next role?</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">
            Browse open positions, upload your CV, and see how your profile compares to
            each job's requirements — before you apply.
          </p>
          <div className="mt-4">
            <Link
              href="/auth/signup?accountType=candidate"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-bold transition hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            >
              Browse jobs as a candidate
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-[10px] text-[var(--muted)]">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} RecruitAI. Enterprise AI resume screening.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[var(--foreground)] hover:underline">
              Privacy
            </Link>
            <Link href="/auth/signin" className="hover:text-[var(--foreground)] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
