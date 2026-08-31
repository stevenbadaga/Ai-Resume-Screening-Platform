import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import PrivacyClient from './PrivacyClient';

export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  return <PrivacyClient />;
}