import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CompareClient from './CompareClient';

export const dynamic = 'force-dynamic';

export default async function ComparePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const userRole = (session.user as any)?.role || 'Candidate';

  if (userRole === 'Candidate') {
    redirect('/dashboard/my-applications');
  }

  const canCompare = ['Admin', 'Recruiter', 'HiringManager', 'Interviewer'].includes(userRole);

  if (!canCompare) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="dark:bg-slate-900/60 bg-white dark:border-slate-800/80 border-slate-200/90 border rounded-3xl p-10 shadow-xl space-y-4 backdrop-blur-xl">
          <span className="text-4xl block">⚖️</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold dark:bg-amber-950/80 bg-amber-50 dark:text-amber-300 text-amber-800 border dark:border-amber-800/80 border-amber-200">
            EVALUATION CLEARANCE REQUIRED
          </span>
          <h1 className="text-2xl font-extrabold dark:text-white text-slate-900">
            Benchmark Tool Reserved for Evaluation Team
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 max-w-md mx-auto leading-relaxed">
            Side-by-side benchmark comparison is reserved for <strong>Recruiters</strong>, <strong>Hiring Managers</strong>, and <strong>Interviewers</strong>.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
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

  const applications = await prisma.application.findMany({
    include: {
      candidate: true,
      job: true,
      screeningRuns: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    take: 4
  });

  return <CompareClient applications={JSON.parse(JSON.stringify(applications))} />;
}