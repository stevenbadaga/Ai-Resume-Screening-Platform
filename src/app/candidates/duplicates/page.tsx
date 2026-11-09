import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import DuplicatesClient from './DuplicatesClient';

export const dynamic = 'force-dynamic';

export default async function DuplicatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  // §6.3: duplicate review-before-merge is a recruiter/manager capability.
  const isStaff = ['Admin', 'Recruiter', 'HiringManager'].includes(userRole);

  if (!isStaff) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="dark:bg-slate-900/60 bg-white dark:border-slate-800/80 border-slate-200/90 border rounded-3xl p-10 shadow-xl space-y-4 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
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

  const organizationId = (session.user as any)?.organizationId;

  const orgCandidates = await prisma.candidate.findMany({
    where: {
      applications: {
        some: {
          job: { organizationId }
        }
      }
    },
    include: {
      applications: {
        where: {
          job: { organizationId }
        },
        include: { job: true }
      }
    }
  });

  const emailMap = new Map<string, any[]>();
  for (const c of orgCandidates) {
    const list = emailMap.get(c.email) || [];
    list.push(c);
    emailMap.set(c.email, list);
  }

  const duplicates = Array.from(emailMap.entries())
    .filter(([_, list]) => list.length > 1)
    .map(([email, candidates]) => ({ email, candidates }));

  return <DuplicatesClient duplicates={JSON.parse(JSON.stringify(duplicates))} userRole={userRole} />;
}