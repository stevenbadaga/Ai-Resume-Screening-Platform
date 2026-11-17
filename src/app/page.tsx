import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import LandingClient from '@/components/LandingClient';

// Force dynamic so the per-request session check runs (no static prerender).
export const dynamic = 'force-dynamic';

export default async function PublicLanding() {
  const session = await getServerSession(authOptions);

  // Authenticated users are routed directly to their dashboard.
  if (session?.user) {
    redirect('/dashboard');
  }

  // Unauthenticated visitors see the localized public landing page.
  return <LandingClient />;
}
