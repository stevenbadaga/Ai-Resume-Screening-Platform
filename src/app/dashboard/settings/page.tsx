import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const role = (session.user as any)?.role || 'Candidate';
  if (role !== 'Admin') redirect('/dashboard');

  const organizationId = (session.user as any)?.organizationId;
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, retentionPolicy: true, workflowConfig: true, branding: true },
  });

  const parse = (raw: string | null | undefined) => {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  return (
    <SettingsClient
      organizationName={org?.name ?? ''}
      initialRetention={parse(org?.retentionPolicy)}
      initialWorkflow={parse(org?.workflowConfig)}
      initialBranding={parse(org?.branding)}
    />
  );
}
