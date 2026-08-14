import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

export default async function MyApplicationsPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  // Find candidate by email or fetch latest applications for demo
  let candidate = null;
  if (userEmail) {
    candidate = await prisma.candidate.findFirst({
      where: { email: userEmail }
    });
  }

  // Fetch applications
  let applications: any[] = [];
  if (candidate) {
    applications = await prisma.application.findMany({
      where: { candidateId: candidate.id },
      include: {
        job: { include: { organization: true } },
        screeningRuns: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Fallback: If no candidate applications found, show all recent platform applications
  if (applications.length === 0) {
    applications = await prisma.application.findMany({
      include: {
        candidate: true,
        job: { include: { organization: true } },
        screeningRuns: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  const getStatusBadge = (status: string, stage: string) => {
    if (status === 'INTERVIEW') {
      return (
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interview Stage
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          Not Selected
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
        AI Screening Complete
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">My Job Applications</h1>
            <p className="text-sm text-slate-400 mt-1">
              Live status tracking for your in-app candidate submissions and AI screening assessments.
            </p>
          </div>
          <Link
            href="/jobs"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 self-start sm:self-auto"
          >
            Explore Open Jobs &rarr;
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              📄
            </div>
            <h2 className="text-lg font-bold text-slate-200">No applications submitted yet</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Browse our live open job requisitions and submit an in-app application in 1 click.
            </p>
            <Link
              href="/jobs"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              Browse Open Positions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app: any) => {
              const latestRun = app.screeningRuns?.[0];
              return (
                <div
                  key={app.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 transition hover:border-slate-700/80 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 bg-slate-800 text-indigo-400 border border-slate-700 rounded-md text-[11px] font-bold">
                        {app.job?.department || 'General'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        🏢 {app.job?.organization?.name || 'RecruitAI Corp'}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white">
                      {app.job?.title || 'Position'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Submitted: {new Date(app.createdAt).toLocaleDateString()}</span>
                      {app.candidate && (
                        <span>Applicant: <strong className="text-slate-200">{app.candidate.firstName} {app.candidate.lastName}</strong></span>
                      )}
                      {latestRun && (
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          AI Match Score: {latestRun.totalResult}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 justify-between md:justify-end">
                    {getStatusBadge(app.status, app.stage)}
                    <Link
                      href={`/candidates/${app.id}`}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
                    >
                      View Profile &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}