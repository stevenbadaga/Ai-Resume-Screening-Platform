/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import CandidatesClient from './CandidatesClient';

export const dynamic = 'force-dynamic';

export default async function CandidatesDashboard() {
  const session = await getServerSession();
  if (!session) redirect('/api/auth/signin');

  const role = (session.user as any)?.role || 'Recruiter';
  const userId = (session.user as any)?.id;

  const whereClause: any = {};
  
  if (role === 'HiringManager' && userId) {
    whereClause.job = { ownerId: userId };
  }

  const applicationsData = await prisma.application.findMany({
    where: whereClause,
    include: {
      candidate: true,
      job: true,
      resumeDocument: true,
      screeningRuns: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const duplicates = await prisma.candidate.findMany({
    where: { tags: { has: 'POTENTIAL_DUPLICATE' } }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Candidate Pipeline & ATS
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage incoming applications, review AI screening scorecards, and transition candidates across hiring stages.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/candidates/compare"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition"
            >
              ⚖️ Side-by-Side Compare
            </Link>
            <Link
              href="/jobs"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              + Post New Role
            </Link>
          </div>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicates.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-amber-400 text-xs font-medium">
              <span className="text-lg">⚠️</span>
              <span>
                <strong>{duplicates.length} potential duplicate candidate(s)</strong> detected across job requisitions.
              </span>
            </div>
            <Link
              href="/candidates/duplicates"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition"
            >
              Review & Merge &rarr;
            </Link>
          </div>
        )}

        {/* Client Kanban / Table Component */}
        <CandidatesClient
          initialApplications={JSON.parse(JSON.stringify(applicationsData))}
          userRole={role}
        />
      </div>
    </div>
  );
}