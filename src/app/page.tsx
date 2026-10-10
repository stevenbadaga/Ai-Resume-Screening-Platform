import { redirect } from 'next/navigation';

// Dynamic so the per-request CSP nonce from src/proxy.ts applies (a static
// prerender cannot carry it) — this page only issues a redirect anyway.
export const dynamic = 'force-dynamic';

export default function Home() {
  redirect('/dashboard');
  return null;
}
