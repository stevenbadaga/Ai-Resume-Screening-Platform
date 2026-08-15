'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CandidateProfileClient({
  profile,
  screeningResults
}: {
  profile: any;
  screeningResults: any;
}) {
  const [resumeSearch, setResumeSearch] = useState('');
  const [activeLeftTab, setActiveLeftTab] = useState<'DOCUMENT' | 'SKILLS' | 'EXPERIENCE'>('DOCUMENT');
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideScore, setOverrideScore] = useState(screeningResults?.totalScore || 85);
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const router = useRouter();

  const handleStageAction = async (newStage: string, newStatus?: string) => {
    setSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/candidates/stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: profile.id, newStage, newStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update stage');
      }

      setActionMessage(`Candidate stage advanced to ${newStage}!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error updating stage');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('Please provide a mandatory justification for overriding AI score.');
      return;
    }

    setSubmittingOverride(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: profile.id,
          decisionType: 'OVERRIDE',
          reason: overrideReason,
          newScore: Number(overrideScore)
        })
      });

      if (!res.ok) throw new Error('Failed to record override decision');

      alert('Human override saved and logged to audit trail!');
      setIsOverriding(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save override');
    } finally {
      setSubmittingOverride(false);
    }
  };

  // Function to highlight search terms in the resume text
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const totalScore = screeningResults?.totalScore || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/candidates"
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              &larr; Back to Pipeline
            </Link>
            <span className="text-slate-600">•</span>
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[11px] font-bold">
              {profile.job}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{profile.name}</h1>
        </div>

        {/* Quick Action Decision Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleStageAction('SHORTLISTED')}
            disabled={submittingAction}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            ⭐ Shortlist
          </button>
          <Link
            href={`/candidates/${profile.id}/interview`}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
          >
            <span>🎯</span>
            <span>Schedule Interview</span>
          </Link>
          <button
            onClick={() => handleStageAction('OFFERED', 'OFFER')}
            disabled={submittingAction}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/30"
          >
            🏆 Extend Offer
          </button>
          <button
            onClick={() => handleStageAction('REJECTED', 'REJECTED')}
            disabled={submittingAction}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition"
          >
            ❌ Reject
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Split-Screen 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Document Reader & Extracted CV (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          {/* Sub-Header / Tabs / Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveLeftTab('DOCUMENT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeLeftTab === 'DOCUMENT'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                📄 Resume Document
              </button>
              <button
                onClick={() => setActiveLeftTab('SKILLS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeLeftTab === 'SKILLS'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Parsed Skills ({profile.skills.length})
              </button>
              <button
                onClick={() => setActiveLeftTab('EXPERIENCE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeLeftTab === 'EXPERIENCE'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                💼 Experience
              </button>
            </div>

            {/* In-Doc Search */}
            {activeLeftTab === 'DOCUMENT' && (
              <div className="relative w-full sm:w-48">
                <input
                  type="text"
                  placeholder="Find in CV..."
                  value={resumeSearch}
                  onChange={(e) => setResumeSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">🔍</span>
              </div>
            )}
          </div>

          {/* Left Content View */}
          {activeLeftTab === 'DOCUMENT' && (
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 max-h-[680px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
              {renderHighlightedText(profile.rawText, resumeSearch)}
            </div>
          )}

          {activeLeftTab === 'SKILLS' && (
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 min-h-[300px] space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Extracted Competencies & Tools
              </h3>
              <div className="flex flex-wrap gap-2 pt-2">
                {profile.skills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeLeftTab === 'EXPERIENCE' && (
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 min-h-[300px] space-y-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
              {profile.experience}
            </div>
          )}
        </div>

        {/* RIGHT PANE: AI Rubric Evidence & Evaluation (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Score Header Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  AI Fit Assessment
                </p>
                <h2 className="text-xl font-extrabold text-white mt-0.5">Weighted Match Score</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono">
                  {totalScore}%
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Deterministic Rubric
                </span>
              </div>
            </div>

            {/* Recruiter Override Button */}
            <button
              onClick={() => setIsOverriding(!isOverriding)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <span>⚖️</span>
              <span>{isOverriding ? 'Close Override Form' : 'Recalibrate / Override Score'}</span>
            </button>

            {/* Override Form */}
            {isOverriding && (
              <form onSubmit={handleSaveOverride} className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200">Human Recalibration Form</h3>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">New Match Score (0 - 100)%</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Mandatory Recruiter Justification</label>
                  <textarea
                    rows={2}
                    required
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Candidate demonstrated deep Kafka experience in interview not reflected in initial parse."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
                >
                  {submittingOverride ? 'Saving to Audit Log...' : 'Confirm Score Recalibration'}
                </button>
              </form>
            )}
          </div>

          {/* Detailed Criteria Citations List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Explainability & Quoted Evidence
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {screeningResults?.assessments?.map((a: any, i: number) => {
                const isMatch = a.result === 'MATCH';
                const isPartial = a.result === 'PARTIAL';

                return (
                  <div
                    key={i}
                    className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-200 flex-1">{a.criterion}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          isMatch
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isPartial
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {a.result}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900/90 border border-slate-800/80 rounded-xl text-[11px] text-slate-300 italic">
                      &ldquo;{a.evidence}&rdquo;
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}