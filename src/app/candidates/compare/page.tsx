/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CompareCandidatesPage({ searchParams }: { searchParams: Promise<{ ids?: string | string[] }> }) {
  const session = await getServerSession();
  if (!session) redirect('/api/auth/signin');

  const resolvedParams = await searchParams;
  const idsParam = resolvedParams.ids;
  let applicationIds: string[] = [];
  if (Array.isArray(idsParam)) {
    applicationIds = idsParam;
  } else if (typeof idsParam === 'string') {
    applicationIds = idsParam.split(',');
  }

  // Fetch all applications
  const allApps = await prisma.application.findMany({
    include: { candidate: true, job: true },
    orderBy: { createdAt: 'desc' }
  });

  // If IDs are provided, fetch the full details for the matrix
  let compareData: any[] = [];
  if (applicationIds.length > 0) {
    compareData = await prisma.application.findMany({
      where: { id: { in: applicationIds } },
      include: {
        candidate: true,
        job: true,
        parsedProfile: true,
        screeningRuns: {
          include: { assessments: { include: { criterion: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Candidate Comparison Matrix
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Side-by-side comparative analysis of AI rubric criteria and candidate qualifications.
            </p>
          </div>
          <Link
            href="/candidates"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition"
          >
            &larr; Back to Pipeline
          </Link>
        </div>

        {/* Selection Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-sm font-bold text-white mb-2">Select Candidates to Compare</h2>
          <form method="GET" action="/candidates/compare" className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <select
              name="ids"
              multiple
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-xs w-full sm:w-96 h-28 focus:outline-none focus:border-indigo-500"
            >
              {allApps.map((app) => (
                <option key={app.id} value={app.id} className="py-1">
                  {app.candidate.firstName} {app.candidate.lastName} — {app.job.title}
                </option>
              ))}
            </select>
            <div className="space-y-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30"
              >
                Compare Selected &rarr;
              </button>
              <p className="text-[11px] text-slate-500">
                (Hold Ctrl / Cmd to select 2 or more candidates)
              </p>
            </div>
          </form>
        </div>

        {/* Comparison Matrix Table */}
        {compareData.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800">
                  <th className="py-4 px-6 w-1/4 text-slate-400 font-bold uppercase tracking-wider">
                    Evaluation Criterion
                  </th>
                  {compareData.map((app) => (
                    <th key={app.id} className="py-4 px-6 font-bold text-white">
                      <div className="text-base">{app.candidate.firstName} {app.candidate.lastName}</div>
                      <div className="text-xs text-indigo-400 font-medium">{app.job.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* Overall Score */}
                <tr className="hover:bg-slate-800/20">
                  <td className="py-4 px-6 font-bold text-slate-300">Overall Match Score</td>
                  {compareData.map((app) => {
                    const score = app.screeningRuns[0]?.totalResult;
                    return (
                      <td key={app.id} className="py-4 px-6">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono">
                          {score !== undefined ? `${score}%` : 'Pending'}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Skills */}
                <tr className="hover:bg-slate-800/20">
                  <td className="py-4 px-6 font-bold text-slate-300">Top Parsed Skills</td>
                  {compareData.map((app) => {
                    const skills = app.parsedProfile?.skills ? JSON.parse(app.parsedProfile.skills) : [];
                    return (
                      <td key={app.id} className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {skills.slice(0, 5).map((s: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg text-[11px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Unique Criteria */}
                {Array.from(
                  new Set(
                    compareData.flatMap((app) =>
                      app.screeningRuns[0]?.assessments.map((a: any) => a.criterion.description) || []
                    )
                  )
                ).map((criterionDesc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="py-4 px-6 font-semibold text-slate-300">
                      {criterionDesc as string}
                    </td>
                    {compareData.map((app) => {
                      const assessment = app.screeningRuns[0]?.assessments.find(
                        (a: any) => a.criterion.description === criterionDesc
                      );
                      if (!assessment) return <td key={app.id} className="py-4 px-6 text-slate-600">N/A</td>;

                      const isMatch = assessment.result === 'MATCH';
                      const isPartial = assessment.result === 'PARTIAL';

                      return (
                        <td key={app.id} className="py-4 px-6 space-y-1.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isMatch
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isPartial
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {assessment.result}
                          </span>
                          <p className="text-[11px] text-slate-400 italic leading-relaxed">
                            &ldquo;{assessment.supportingEvidence || 'No evidence provided.'}&rdquo;
                          </p>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}