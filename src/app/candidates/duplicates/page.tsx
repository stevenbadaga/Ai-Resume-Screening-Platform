import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DuplicatesPage() {
  const duplicates = await prisma.candidate.findMany({
    where: {
      tags: { has: 'POTENTIAL_DUPLICATE' }
    },
    include: {
      applications: {
        include: { job: true }
      }
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Duplicate Candidate Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Cross-requisition duplicate detection and profile identity consolidation.
            </p>
          </div>
          <Link
            href="/candidates"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition"
          >
            &larr; Back to Pipeline
          </Link>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
          {duplicates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <span className="text-3xl block mb-2">🎉</span>
              No potential duplicate candidate profiles detected across active requisitions.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Candidate Name</th>
                  <th className="py-4 px-6">Email Identifier</th>
                  <th className="py-4 px-6">Active Applications</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {duplicates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-6 font-bold text-white">
                      {cand.firstName} {cand.lastName}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">
                      {cand.email}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {cand.applications.map((app) => (
                          <span
                            key={app.id}
                            className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 text-indigo-300 rounded-md text-[11px]"
                          >
                            {app.job.title}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition">
                        Consolidate Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}