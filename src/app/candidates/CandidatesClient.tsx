'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ApplicationItem {
  id: string;
  stage: string;
  status: string;
  createdAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    tags: string[];
  };
  job: {
    id: string;
    title: string;
    department: string;
  };
  resumeDocument?: {
    id: string;
    processingStatus: string;
  } | null;
  screeningRuns?: {
    totalResult: number;
    decision: string;
  }[];
}

const STAGES = [
  { key: 'RESUME_SCREENED', label: '📥 AI Screened', bg: 'border-slate-800' },
  { key: 'SHORTLISTED', label: '⭐ Shortlisted', bg: 'border-indigo-500/30' },
  { key: 'INTERVIEW_SCHEDULED', label: '🎯 Interviewing', bg: 'border-cyan-500/30' },
  { key: 'OFFERED', label: '🏆 Offered / Hired', bg: 'border-emerald-500/30' },
  { key: 'REJECTED', label: '❌ Rejected', bg: 'border-rose-500/30' }
];

export default function CandidatesClient({
  initialApplications,
  userRole
}: {
  initialApplications: ApplicationItem[];
  userRole: string;
}) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  const handleStageChange = async (applicationId: string, newStage: string) => {
    setUpdatingId(applicationId);
    try {
      // Optimistic update
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, stage: newStage } : app))
      );

      const res = await fetch('/api/candidates/stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, newStage })
      });

      if (!res.ok) {
        throw new Error('Failed to update stage');
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Error updating candidate stage');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    const name = `${app.candidate.firstName} ${app.candidate.lastName}`.toLowerCase();
    const email = app.candidate.email.toLowerCase();
    const jobTitle = app.job.title.toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = name.includes(q) || email.includes(q) || jobTitle.includes(q);
    const matchesDept = selectedDept === 'ALL' || app.job.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const getScoreBadge = (score?: number) => {
    if (score === undefined || score === null) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-400">
          Pending AI
        </span>
      );
    }
    if (score >= 85) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          {score}% Elite Match
        </span>
      );
    }
    if (score >= 70) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
          {score}% Strong
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40">
        {score}% Moderate
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Dept Filter, View Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search candidates by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute left-3 top-2 text-slate-500 text-xs">🔍</span>
          </div>

          {/* Dept Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Data & AI">Data & AI</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner self-end md:self-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'kanban'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📊</span>
            <span>Kanban Pipeline</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📋</span>
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const colApps = filtered.filter((app) => {
              if (col.key === 'RESUME_SCREENED') return !app.stage || app.stage === 'RESUME_SCREENED' || app.stage === 'APPLIED';
              if (col.key === 'OFFERED') return app.stage === 'OFFERED' || app.stage === 'HIRED';
              return app.stage === col.key;
            });

            return (
              <div
                key={col.key}
                className={`bg-slate-900/60 border ${col.bg} rounded-3xl p-4 flex flex-col min-h-[550px] backdrop-blur-xl`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {col.label}
                  </h2>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[11px] font-mono rounded-full">
                    {colApps.length}
                  </span>
                </div>

                {/* Column Candidate Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colApps.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border border-dashed border-slate-800/80 rounded-2xl text-[11px] text-slate-600">
                      No candidates in stage
                    </div>
                  ) : (
                    colApps.map((app) => {
                      const latestScore = app.screeningRuns?.[0]?.totalResult;
                      const hasDuplicate = app.candidate.tags?.includes('POTENTIAL_DUPLICATE');

                      return (
                        <div
                          key={app.id}
                          className="bg-slate-950/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 transition shadow-lg space-y-3 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <Link
                                href={`/candidates/${app.id}`}
                                className="text-xs font-bold text-white group-hover:text-indigo-400 transition line-clamp-1"
                              >
                                {app.candidate.firstName} {app.candidate.lastName}
                              </Link>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{app.job.title}</p>
                            </div>
                            <div className="shrink-0">{getScoreBadge(latestScore)}</div>
                          </div>

                          {hasDuplicate && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              ⚠️ Duplicate Detected
                            </span>
                          )}

                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                            {/* Quick Stage Mover */}
                            <select
                              disabled={updatingId === app.id}
                              value={app.stage || 'RESUME_SCREENED'}
                              onChange={(e) => handleStageChange(app.id, e.target.value)}
                              className="bg-slate-900 border border-slate-800 text-indigo-300 rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                            >
                              <option value="RESUME_SCREENED">📥 AI Screened</option>
                              <option value="SHORTLISTED">⭐ Shortlist</option>
                              <option value="INTERVIEW_SCHEDULED">🎯 Interview</option>
                              <option value="OFFERED">🏆 Offer / Hire</option>
                              <option value="REJECTED">❌ Reject</option>
                            </select>

                            <Link
                              href={`/candidates/${app.id}`}
                              className="text-slate-400 hover:text-white transition font-medium"
                            >
                              Profile &rarr;
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Role Requisition</th>
                <th className="py-3.5 px-4">AI Score</th>
                <th className="py-3.5 px-4">Pipeline Stage</th>
                <th className="py-3.5 px-4">Applied Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((app) => {
                const latestScore = app.screeningRuns?.[0]?.totalResult;
                return (
                  <tr key={app.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">
                        {app.candidate.firstName} {app.candidate.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{app.candidate.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{app.job.title}</div>
                      <div className="text-[11px] text-indigo-400">{app.job.department}</div>
                    </td>
                    <td className="py-3.5 px-4">{getScoreBadge(latestScore)}</td>
                    <td className="py-3.5 px-4">
                      <select
                        disabled={updatingId === app.id}
                        value={app.stage || 'RESUME_SCREENED'}
                        onChange={(e) => handleStageChange(app.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                      >
                        <option value="RESUME_SCREENED">📥 AI Screened</option>
                        <option value="SHORTLISTED">⭐ Shortlisted</option>
                        <option value="INTERVIEW_SCHEDULED">🎯 Interviewing</option>
                        <option value="OFFERED">🏆 Offered / Hired</option>
                        <option value="REJECTED">❌ Rejected</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/candidates/${app.id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700 font-semibold"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}