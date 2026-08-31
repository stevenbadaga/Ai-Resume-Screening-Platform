import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DuplicatesClient from './DuplicatesClient';

export const dynamic = 'force-dynamic';

export default async function DuplicatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  const isStaff = ['Admin', 'Recruiter', 'HiringManager'].includes(userRole);

  if (!isStaff) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="dark:bg-slate-900/60 bg-white dark:border-slate-800/80 border-slate-200/90 border rounded-3xl p-10 shadow-xl space-y-4 backdrop-blur-xl">
          <span className="text-4xl block">🔒</span>
          <h1 className="text-2xl font-extrabold dark:text-white text-slate-900">
            Access Restricted
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 max-w-md mx-auto">
            Deduplication tools are reserved for recruitment team members.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
            >
              Return to Dashboard &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allCandidates = await prisma.candidate.findMany({
    include: { applications: true }
  });

  const emailMap = new Map<string, any[]>();
  for (const c of allCandidates) {
    const list = emailMap.get(c.email) || [];
    list.push(c);
    emailMap.set(c.email, list);
  }

  const duplicates = Array.from(emailMap.entries())
    .filter(([_, list]) => list.length > 1)
    .map(([email, candidates]) => ({ email, candidates }));

  return <DuplicatesClient duplicates={JSON.parse(JSON.stringify(duplicates))} />;
}