import { ReactNode } from 'react';

/**
 * Spec §9 / §4.2 — the auth pages are client components, so they would
 * otherwise be statically prerendered at build time. A static HTML shell
 * cannot carry the per-request CSP nonce issued by src/proxy.ts, and the
 * production `script-src 'nonce-…' 'strict-dynamic'` policy would block
 * every script — leaving the sign-in form stuck on "Loading…" with no way
 * to reach the application. Forcing dynamic rendering makes Next.js stamp
 * the request nonce onto its <script> tags for every auth page.
 */
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
