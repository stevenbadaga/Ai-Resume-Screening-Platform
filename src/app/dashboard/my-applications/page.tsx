import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

export default async function MyApplicationsPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  // Find candidate by email or fetch latest applications
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

  const getActiveStep = (stage: string, status: string) => {
    if (status === 'HIRED' || stage === 'OFFERED') return 4;
    if (status === 'INTERVIEW' || stage === 'INTERVIEW_SCHEDULED') return 3;
    if (stage === 'SHORTLISTED') return 2;
    if (stage === 'RESUME_SCREENED') return 1;
    return 0;
  };

  const steps = [
    { title: 'Submitted', desc: 'Application received' },
    { title: 'AI Screened', desc: 'Criteria evaluated' },
    { title: 'Shortlisted', desc: 'Hiring team review' },
    { title: 'Interview Stage', desc: 'Scorecard & discussion' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">My Job Applications</h1>
            <p className="text-sm text-slate-400 mt-1">
              Live status milestones and AI assessment progress for all your submitted applications.
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
          <div className="space-y-6">
            {applications.map((app: any) => {
              const latestRun = app.screeningRuns?.[0];
              const activeStep = getActiveStep(app.stage, app.status);
              const isRejected = app.status === 'REJECTED';

              return (
                <div
                  key={app.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 transition hover:border-slate-700/80 shadow-xl backdrop-blur-xl space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-indigo-400 border border-slate-700 rounded-md text-[11px] font-bold">
                          {app.job?.department || 'General'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          🏢 {app.job?.organization?.name || 'RecruitAI Corp'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          • Submitted {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-white">
                        {app.job?.title || 'Position'}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      {latestRun && (
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 text-xs font-mono">
                          AI Fit Score: {latestRun.totalResult}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Milestone Stepper */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                      Application Progress Milestone
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {steps.map((step, idx) => {
                        const isCompleted = activeStep >= idx;
                        const isCurrent = activeStep === idx;

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border transition ${
                              isRejected && isCurrent
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                : isCompleted
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isCompleted
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {isCompleted ? '✓' : idx + 1}
                              </span>
                              <h3 className="text-xs font-bold">{step.title}</h3>
                            </div>
                            <p className="text-[10px] text-slate-400 pl-7">{step.desc}</p>
                          </div>
                        );
                      })}
                    </div>
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