import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

/**
 * Profile page for EVERY role (company side and candidates alike).
 *
 * Candidates additionally get their self-service profile: personal details,
 * declared skills/experience, and the saved default CV that powers one-click
 * applications. Staff see their account + workspace view.
 */
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const email = session.user?.email as string;
  const role = (session.user as any)?.role || 'Candidate';

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      name: true,
      email: true,
      createdAt: true,
      organization: { select: { name: true } },
      departmentRestrictions: true,
    },
  });

  let candidate = null;
  if (role === 'Candidate') {
    const c = await prisma.candidate.findFirst({
      where: { email },
      select: {
        firstName: true,
        lastName: true,
        skills: true,
        experience: true,
        profileResumeName: true,
        profileResumeSize: true,
        profileResumeUploadedAt: true,
        consentGiven: true,
        consentNoticeVersion: true,
        _count: { select: { applications: true } },
      },
    });
    candidate = c ? JSON.parse(JSON.stringify(c)) : null;
  }

  return (
    <ProfileClient
      account={{
        name: user?.name ?? null,
        email,
        role,
        organizationName: user?.organization?.name ?? null,
        memberSince: user?.createdAt ? user.createdAt.toISOString() : null,
        departmentRestrictions: user?.departmentRestrictions ?? [],
      }}
      candidate={candidate}
    />
  );
}
