'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  application?: any;
  profile?: any;
  screeningResults?: any;
  userRole?: string;
}

export default function CandidateProfileClient({
  application,
  profile,
  screeningResults,
  userRole = 'Recruiter'
}: Props) {
  const { t } = useLanguage();
  const initialApp = application || profile || {};
  const [app, setApp] = useState(initialApp);

  // Score Recalibration Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState(85);
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [blindMode, setBlindMode] = useState(true);

  // Interview Questions Generation State
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerSalary, setOfferSalary] = useState('$140,000');
  const [offerStartDate, setOfferStartDate] = useState('2026-09-01');
  const [sendingOffer, setSendingOffer] = useState(false);

  // Interview Scorecard Modal & Persistence State
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [techRating, setTechRating] = useState(4);
  const [commRating, setCommRating] = useState(4);
  const [problemRating, setProblemRating] = useState(5);
  const [recommendation, setRecommendation] = useState('HIRE');
  const [scorecardNotes, setScorecardNotes] = useState('');
  const [submittingScorecard, setSubmittingScorecard] = useState(false);

  // Extract initial scorecards from interviews
  const initialScorecards = (initialApp.interviews || []).flatMap((inv: any) =>
    (inv.participants || [])
      .filter((p: any) => p.structuredFeedback || p.recommendation || p.comments)
      .map((p: any) => {
        let ratings: any = {};
        try {
          ratings = p.structuredFeedback ? JSON.parse(p.structuredFeedback) : {};
        } catch {
          ratings = {};
        }
        return {
          id: p.id,
          interviewer: p.user || { name: 'Interviewer' },
          ratings,
          recommendation: p.recommendation,
          comments: p.comments,
          submittedAt: p.updatedAt
        };
      })
  );
  const [scorecards, setScorecards] = useState<any[]>(initialScorecards);

  // Decision Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<'SHORTLIST' | 'ADVANCE' | 'HOLD' | 'REJECT' | 'WITHDRAW' | 'REVIEW'>('SHORTLIST');
  const [decisionReasonCode, setDecisionReasonCode] = useState('QUALIFICATIONS_MATCH');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Active highlighted snippet
  const [highlightedSnippet, setHighlightedSnippet] = useState<string | null>(null);

  const { showToast } = useToast();

  const isInterviewer = userRole === 'Interviewer';
  const isAuditor = userRole === 'ComplianceAuditor' || userRole === 'Auditor';
  const isRecruiterOrAdmin = ['Admin', 'Recruiter', 'HiringManager'].includes(userRole);

  const latestRun = app.screeningRuns?.[0] || (screeningResults ? { totalResult: screeningResults } : null);
  const storedResult = latestRun?.totalResult;
  const totalResult = storedResult && typeof storedResult === 'object' ? storedResult : {};
  const criteriaScores = totalResult.criteriaScores || latestRun?.assessments?.map((assessment: any) => ({
    category: assessment.criterion?.category || 'Requirement',
    criterionDescription: assessment.criterion?.description || '',
    score: assessment.effectiveResult || assessment.result,
    quotedEvidence: assessment.supportingEvidence,
    reasoning: assessment.uncertainty ? 'This result requires human review because the evidence is uncertain.' : '',
  })) || [];
  const score = Number(latestRun?.effectiveResult ?? (typeof storedResult === 'number' ? storedResult : totalResult.overallScore)) || 0;

  const candidateName = blindMode
    ? `Candidate #${(app.id || 'ANON').substring(0, 8).toUpperCase()}`
    : `${app.candidate?.firstName || 'Applicant'} ${app.candidate?.lastName || ''}`;

  const candidateEmail = blindMode ? '••••••@protected.id' : app.candidate?.email;

  const handleRecalibrateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;

    setSubmittingOverride(true);
    try {
      const res = await fetch(`/api/decisions/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app.id,
          newScore: Number(overrideScore),
          reason: overrideReason
        })
      });

      if (res.ok) {
        setApp((prev: any) => ({
          ...prev,
          screeningRuns: [
            {
              ...prev.screeningRuns?.[0],
              effectiveResult: Number(overrideScore),
              totalResult: {
                ...prev.screeningRuns?.[0]?.totalResult,
                overallScore: Number(overrideScore),
                isOverridden: true
              }
            }
          ]
        }));
        setOverrideModalOpen(false);
        setOverrideReason('');
        showToast(`Match score recalibrated to ${overrideScore}%`, 'success', 'Score Recalibrated');
      } else {
        showToast('Failed to record score recalibration', 'error', 'Error');
      }
    } catch (err) {
      showToast('Network error during recalibration', 'error', 'Error');
    } finally {
      setSubmittingOverride(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    setShowQuestionsModal(true);
    try {
      const res = await fetch(`/api/candidates/${app.id}/generate-questions`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.questions) {
        setGeneratedQuestions(data.questions);
      } else {
        setGeneratedQuestions([
          { skill: 'Distributed State', question: 'Explain how you design atomic workflows across microservices.', expectedAnswer: 'Saga pattern, two-phase commits, idempotency keys.' },
          { skill: 'Concurrency', question: 'How do you handle race conditions during high-volume message queues?', expectedAnswer: 'Distributed locks, Redis mutexes, dead-letter queues.' }
        ]);
      }
    } catch {
      setGeneratedQuestions([
        { skill: 'Distributed State', question: 'Explain how you design atomic workflows across microservices.', expectedAnswer: 'Saga pattern, two-phase commits, idempotency keys.' },
        { skill: 'Concurrency', question: 'How do you handle race conditions during high-volume message queues?', expectedAnswer: 'Distributed locks, Redis mutexes, dead-letter queues.' }
      ]);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingOffer(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app.id,
          decision: 'ADVANCE',
          reasonCode: 'EXTENDED_OFFER',
          rationale: `Formal Offer extended: ${offerSalary} starting on ${offerStartDate}`
        })
      });

      if (res.ok) {
        setApp((prev: any) => ({ ...prev, stage: 'OFFERED', status: 'ACTIVE' }));
        setShowOfferModal(false);
        showToast(`Offer of ${offerSalary} extended to candidate`, 'success', 'Offer Sent');
      } else {
        showToast('Failed to extend formal offer', 'error');
      }
    } catch {
      showToast('Network error while sending offer', 'error');
    } finally {
      setSendingOffer(false);
    }
  };

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingScorecard(true);
    try {
      const res = await fetch(`/api/candidates/${app.id}/scorecard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          techRating,
          commRating,
          problemRating,
          recommendation,
          comments: scorecardNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        setScorecards((prev) => [
          {
            id: data.participant?.id || Date.now().toString(),
            interviewer: { name: 'You (Current User)' },
            ratings: { techRating, commRating, problemRating },
            recommendation,
            comments: scorecardNotes,
            submittedAt: new Date().toISOString()
          },
          ...prev
        ]);
        setShowScorecardModal(false);
        setScorecardNotes('');
        showToast(`Interview scorecard (${recommendation}) recorded successfully`, 'success', 'Scorecard Saved');
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'Failed to submit scorecard', 'error');
      }
    } catch (err) {
      showToast('Network error while saving scorecard', 'error');
    } finally {
      setSubmittingScorecard(false);
    }
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionRationale.trim()) {
      showToast('Decision justification rationale is required', 'error');
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app.id,
          decision: selectedDecision,
          reasonCode: decisionReasonCode,
          rationale: decisionRationale
        })
      });

      if (res.ok) {
        const data = await res.json();
        setApp((prev: any) => ({
          ...prev,
          stage: data.stage || selectedDecision,
          status: data.status || 'ACTIVE'
        }));
        setShowDecisionModal(false);
        setDecisionRationale('');
        showToast(`Decision "${selectedDecision}" recorded in audit trail`, 'success', 'Decision Finalized');
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'Failed to record decision', 'error');
      }
    } catch (err) {
      showToast('Network error while recording decision', 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const openDecisionDialog = (decision: 'SHORTLIST' | 'ADVANCE' | 'HOLD' | 'REJECT' | 'WITHDRAW' | 'REVIEW') => {
    setSelectedDecision(decision);
    if (decision === 'SHORTLIST') setDecisionReasonCode('QUALIFICATIONS_MATCH');
    else if (decision === 'ADVANCE') setDecisionReasonCode('EXCELLENT_TECHNICAL_FIT');
    else if (decision === 'REJECT') setDecisionReasonCode('EXPERIENCE_GAP');
    else if (decision === 'HOLD') setDecisionReasonCode('TALENT_BENCH');
    else setDecisionReasonCode('OTHER');
    setShowDecisionModal(true);
  };

  const handleCopyQuestion = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Question copied to clipboard', 'info');
  };

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b dark:border-slate-800/80 border-slate-200">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs">
            <Link
              href="/candidates"
              className="dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 font-medium transition"
            >
              &larr; {t('nav_candidates')}
            </Link>
            <span className="dark:text-slate-600 text-slate-300">/</span>
            <span className="font-mono text-[10px] text-teal-600 dark:text-teal-300 font-semibold">{t('eval_title')}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
              {candidateName}
            </h1>
            <button
              onClick={() => {
                const next = !blindMode;
                setBlindMode(next);
                showToast(next ? 'Blind Screening enabled: PII hidden' : 'PII revealed', 'info');
              }}
              className="text-[11px] px-2 py-0.5 rounded-md dark:bg-slate-900 bg-slate-100 dark:hover:bg-slate-800 hover:bg-slate-200 dark:border-slate-800 border-slate-200 border dark:text-slate-300 text-slate-700 font-mono transition"
            >
              {blindMode ? t('btn_reveal_pii') : t('btn_blind_mode')}
            </button>
          </div>
          <p className="text-[11px] dark:text-slate-400 text-slate-500 font-mono">
            {app.job?.title} &bull; {app.job?.department} &bull; {candidateEmail}
          </p>
        </div>

        {/* Action Buttons Suite */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateQuestions}
            className="px-2.5 py-1.5 dark:bg-[#17242B] bg-white dark:hover:bg-[#1F2E37] hover:bg-slate-50 dark:border-[#30424A] border-slate-200 border dark:text-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1 shadow-xs"
          >
            <span>🤖</span>
            <span>{t('btn_ai_questions')}</span>
          </button>

          <button
            onClick={() => setShowScorecardModal(true)}
            className="px-2.5 py-1.5 dark:bg-[#17242B] bg-white dark:hover:bg-[#1F2E37] hover:bg-slate-50 dark:border-[#30424A] border-slate-200 border dark:text-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1 shadow-xs"
          >
            <span>📝</span>
            <span>{t('btn_scorecard')}</span>
          </button>

          <Link
            href={`/candidates/${app.id}/interview`}
            className="px-2.5 py-1.5 dark:bg-[#17242B] bg-white dark:hover:bg-[#1F2E37] hover:bg-slate-50 dark:border-[#30424A] border-slate-200 border dark:text-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1 shadow-xs"
          >
            <span>📅</span>
            <span>{t('btn_schedule')}</span>
          </Link>

          {isRecruiterOrAdmin && (
            <>
              <button
                onClick={() => setOverrideModalOpen(true)}
                className="px-2.5 py-1.5 dark:bg-amber-950/40 bg-amber-50 dark:hover:bg-amber-900/60 hover:bg-amber-100 border dark:border-amber-800/50 border-amber-200 dark:text-amber-300 text-amber-800 text-xs font-medium rounded-lg transition flex items-center gap-1"
              >
                <span>✏</span>
                <span>{t('btn_recalibrate')}</span>
              </button>

              <button
                onClick={() => openDecisionDialog('SHORTLIST')}
                className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs"
              >
                <span>⭐</span>
                <span>{t('decision_action_shortlist')}</span>
              </button>

              <button
                onClick={() => openDecisionDialog('REJECT')}
                className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs"
              >
                <span>✕</span>
                <span>{t('decision_action_reject')}</span>
              </button>

              <button
                onClick={() => setShowOfferModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-xs"
              >
                <span>🚀</span>
                <span>{t('btn_extend_offer')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: t('match_score'), value: `${score}%`, tone: 'text-teal-700 dark:text-teal-300' },
          { label: t('scored_criteria'), value: criteriaScores.length, tone: 'text-slate-900 dark:text-white' },
          { label: 'Status', value: app.resumeDocument?.processingStatus || 'COMPLETED', tone: app.resumeDocument?.processingStatus === 'NEEDS_REVIEW' ? 'text-amber-600 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200' },
          { label: t('stage_col'), value: app.stage || app.status || t('stage_ingested'), tone: 'text-sky-700 dark:text-sky-300' }
        ].map((metric) => (
          <div key={metric.label} className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider font-semibold dark:text-slate-500 text-slate-500">{metric.label}</p>
            <p className={`mt-1 text-sm font-bold font-mono truncate ${metric.tone}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* SPLIT-SCREEN RESUME & RUBRIC VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Parsed Resume (7 Cols) */}
        <div className="lg:col-span-7 dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 dark:border-[#30424A] border-[#D8D2C6] border-b">
            <h2 className="text-sm font-semibold dark:text-white text-slate-900 flex items-center gap-1.5">
              <span>📄</span>
              <span>{t('parsed_resume_doc')}</span>
            </h2>
            <span className="text-[10px] font-mono dark:text-slate-400 text-slate-500">{t('ocr_stream')}</span>
          </div>

          <div className="dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A]/40 border-slate-200 border rounded-lg p-4 font-mono text-xs dark:text-slate-300 text-slate-800 leading-relaxed max-h-[560px] overflow-y-auto whitespace-pre-wrap selection:bg-teal-500/20">
            {highlightedSnippet && (
              <div className="mb-3 p-2.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 font-sans text-xs flex items-center justify-between">
                <span>🎯 {t('locate_evidence')}: <em>"{highlightedSnippet}"</em></span>
                <button onClick={() => setHighlightedSnippet(null)} className="text-teal-400 hover:text-white font-bold ml-2">✕</button>
              </div>
            )}
            {app.resumeDocument?.extractedText || app.resumeText || 'No plain text resume parsed for this application.'}
          </div>
        </div>

        {/* Right Column: AI Rubric Breakdown & Interview Scorecards (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Overall Match Score Card */}
          <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                {t('explainable_score')}
              </span>
              {totalResult.isOverridden && (
                <span className="px-1.5 py-0.5 dark:bg-amber-950/80 bg-amber-50 dark:text-amber-300 text-amber-800 border dark:border-amber-800/80 border-amber-200 rounded text-[9px] font-mono font-bold">
                  {t('overridden_badge')}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-3xl font-bold dark:text-white text-slate-900 font-mono">{score}%</div>
                <p className="text-[11px] dark:text-slate-400 text-slate-500">{t('deterministic_match')}</p>
              </div>

              {/* Circular Gauge */}
              <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    className="dark:stroke-[#0F171D] stroke-slate-200"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    stroke={score >= 80 ? '#0D9488' : score >= 60 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute text-xs font-mono font-bold dark:text-white text-slate-900">{score}%</span>
              </div>
            </div>

            <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-relaxed pt-2 border-t dark:border-[#30424A] border-slate-100">
              {totalResult.summary || 'AI-assisted evaluation mapped against approved vacancy screening criteria.'}
            </p>
          </div>

          {/* Criteria Cards */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
              {t('scored_criteria')} ({criteriaScores.length})
            </h3>

            {criteriaScores.map((crit: any, idx: number) => (
              <div
                key={idx}
                className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold dark:text-white text-slate-900">{crit.category}</h4>
                    <p className="text-[10px] dark:text-slate-400 text-slate-500">{crit.criterionDescription}</p>
                  </div>
                  <span className={`text-xs font-bold font-mono shrink-0 px-2 py-0.5 rounded-md ${
                    crit.score === 'MATCH' || Number(crit.score) >= 4 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                    crit.score === 'PARTIAL' || Number(crit.score) >= 2 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                    'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                  }`}>
                    {crit.score}
                  </span>
                </div>

                {crit.quotedEvidence && (
                  <button
                    onClick={() => {
                      setHighlightedSnippet(crit.quotedEvidence);
                      showToast(`Located evidence: "${crit.quotedEvidence}"`, 'info');
                    }}
                    className="w-full text-left p-2 dark:bg-[#0F171D] bg-slate-50 border-l-2 border-teal-500 rounded-r-md text-[10px] dark:text-slate-300 text-slate-700 font-mono italic hover:bg-teal-500/10 transition"
                  >
                    "{crit.quotedEvidence}"
                    <span className="block text-[9px] text-teal-600 dark:text-teal-400 mt-0.5 not-italic font-sans font-semibold">
                      🔍 {t('locate_evidence')} &rarr;
                    </span>
                  </button>
                )}

                <p className="text-[10px] dark:text-slate-400 text-slate-600 leading-snug">{crit.reasoning}</p>
              </div>
            ))}
          </div>

          {/* INTERVIEW SCORECARDS SECTION */}
          {scorecards.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  {t('scorecards_submitted_heading')} ({scorecards.length})
                </h3>
                <span className="text-[10px] font-mono text-teal-600 dark:text-teal-300 font-bold">● ACTIVE</span>
              </div>

              {scorecards.map((sc: any, idx: number) => (
                <div
                  key={sc.id || idx}
                  className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold dark:text-white text-slate-900">
                      {sc.interviewer?.name || sc.interviewer?.email || 'Interviewer'}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      sc.recommendation === 'STRONG_HIRE' || sc.recommendation === 'HIRE'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : sc.recommendation === 'LEAN_HIRE'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    }`}>
                      {sc.recommendation}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-y dark:border-[#30424A] border-slate-100 text-[10px] font-mono">
                    <div>Tech: <span className="font-bold text-teal-600 dark:text-teal-400">{sc.ratings?.techRating || 4}/5</span></div>
                    <div>Comm: <span className="font-bold text-teal-600 dark:text-teal-400">{sc.ratings?.commRating || 4}/5</span></div>
                    <div>Problem: <span className="font-bold text-teal-600 dark:text-teal-400">{sc.ratings?.problemRating || 5}/5</span></div>
                  </div>

                  {sc.comments && (
                    <p className="text-[11px] dark:text-slate-300 text-slate-700 italic">
                      "{sc.comments}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GENERATED QUESTIONS MODAL */}
      {showQuestionsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-xl w-full shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b dark:border-[#30424A] border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <div>
                  <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('qp_questions')}</h3>
                  <p className="text-[10px] dark:text-slate-400 text-slate-500">Targeting candidate criteria gaps & evaluation signals</p>
                </div>
              </div>
              <button onClick={() => setShowQuestionsModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {generatingQuestions ? (
              <div className="py-10 text-center text-xs text-teal-600 dark:text-teal-400 space-y-2">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Analyzing candidate skill gaps and synthesizing targeted questions...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedQuestions.map((item: any, i: number) => {
                  const isObj = typeof item === 'object' && item !== null;
                  const skill = isObj ? item.skill || 'Targeted Competency' : `Question ${i + 1}`;
                  const questionText = isObj ? item.question || JSON.stringify(item) : String(item);
                  const expected = isObj ? item.expectedAnswer : null;

                  return (
                    <div key={i} className="p-3.5 dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A]/40 border-slate-200 border rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold dark:bg-teal-950 bg-teal-50 dark:text-teal-300 text-teal-700 border dark:border-teal-800/80 border-teal-200">
                          {skill}
                        </span>
                        <button
                          onClick={() => handleCopyQuestion(questionText)}
                          className="text-[10px] text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 font-mono font-semibold"
                        >
                          📋 Copy
                        </button>
                      </div>

                      <p className="text-xs dark:text-slate-100 text-slate-900 font-semibold leading-relaxed">
                        {questionText}
                      </p>

                      {expected && (
                        <div className="pt-2 border-t dark:border-[#30424A]/80 border-slate-200 text-[10px] dark:text-slate-400 text-slate-600">
                          <span className="font-semibold text-teal-600 dark:text-teal-400">What to look for: </span>
                          <span>{expected}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCORECARD MODAL */}
      {showScorecardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-md w-full shadow-xl space-y-3 dark:text-slate-200 text-slate-800 text-xs">
            <div className="flex items-center justify-between pb-2 dark:border-[#30424A] border-slate-100 border-b">
              <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('scorecard_modal_title')}</h3>
              <button onClick={() => setShowScorecardModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitScorecard} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600 mb-1">{t('scorecard_tech_rating')}</label>
                  <select
                    value={techRating}
                    onChange={(e) => setTechRating(Number(e.target.value))}
                    className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-1.5 font-mono"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600 mb-1">{t('scorecard_comm_rating')}</label>
                  <select
                    value={commRating}
                    onChange={(e) => setCommRating(Number(e.target.value))}
                    className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-1.5 font-mono"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600 mb-1">{t('scorecard_problem_rating')}</label>
                  <select
                    value={problemRating}
                    onChange={(e) => setProblemRating(Number(e.target.value))}
                    className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-1.5 font-mono"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600 mb-1">{t('scorecard_recommendation')} *</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="STRONG_HIRE">{t('scorecard_rec_strong_hire')}</option>
                  <option value="HIRE">{t('scorecard_rec_hire')}</option>
                  <option value="LEAN_HIRE">{t('scorecard_rec_lean_hire')}</option>
                  <option value="NO_HIRE">{t('scorecard_rec_no_hire')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600 mb-1">{t('scorecard_notes')}</label>
                <textarea
                  rows={2}
                  value={scorecardNotes}
                  onChange={(e) => setScorecardNotes(e.target.value)}
                  placeholder="Notes..."
                  className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-2"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowScorecardModal(false)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingScorecard}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {submittingScorecard ? t('loading') : t('scorecard_submit_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECISION RECORDING MODAL */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-md w-full shadow-xl space-y-3 dark:text-slate-200 text-slate-800 text-xs">
            <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('decision_modal_title')}</h3>
            <p className="text-[11px] dark:text-slate-400 text-slate-500">
              {t('decision_modal_subtitle')}
            </p>

            <form onSubmit={handleRecordDecision} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600 mb-1">{t('decision_action_label')} *</label>
                <select
                  value={selectedDecision}
                  onChange={(e) => setSelectedDecision(e.target.value as any)}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="SHORTLIST">⭐ {t('decision_action_shortlist')}</option>
                  <option value="ADVANCE">📅 {t('decision_action_advance')}</option>
                  <option value="HOLD">⏸ {t('decision_action_hold')}</option>
                  <option value="REJECT">✕ {t('decision_action_reject')}</option>
                  <option value="WITHDRAW">↩ {t('decision_action_withdraw')}</option>
                  <option value="REVIEW">🔍 {t('decision_action_review')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600 mb-1">{t('decision_reason_label')} *</label>
                <select
                  value={decisionReasonCode}
                  onChange={(e) => setDecisionReasonCode(e.target.value)}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="QUALIFICATIONS_MATCH">Qualifications & Skills Match</option>
                  <option value="EXCELLENT_TECHNICAL_FIT">Excellent Technical Fit</option>
                  <option value="EXPERIENCE_GAP">Experience / Skill Gap</option>
                  <option value="COMMUNICATION_FIT">Communication & Team Fit</option>
                  <option value="COMPENSATION_MISMATCH">Compensation / Schedule Mismatch</option>
                  <option value="TALENT_BENCH">Retained for Future Vacancy</option>
                  <option value="CANDIDATE_WITHDREW">Candidate Withdrew Request</option>
                  <option value="OTHER">Other Job-Related Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600 mb-1">
                  {t('decision_rationale_label')} *
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  placeholder="Justification..."
                  className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-2"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {submittingDecision ? t('loading') : t('decision_submit_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERRIDE SCORE MODAL */}
      {overrideModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-md w-full shadow-xl space-y-3 dark:text-slate-200 text-slate-800 text-xs">
            <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('btn_recalibrate')}</h3>
            <p className="text-[11px] dark:text-slate-400 text-slate-500">
              Score recalibrations are permanently recorded in the immutable audit ledger.
            </p>

            <form onSubmit={handleRecalibrateScore} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
                  Adjusted Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(Number(e.target.value))}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A] border-slate-200 border rounded-lg px-3 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
                  Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Demonstrated strong system architecture skills..."
                  className="w-full dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A] border-slate-200 border rounded-lg px-3 py-1.5"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {submittingOverride ? t('loading') : t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND OFFER MODAL */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-md w-full shadow-xl space-y-3 text-xs">
            <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('btn_extend_offer')}</h3>

            <form onSubmit={handleSendOffer} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
                  Annual Compensation Package *
                </label>
                <input
                  type="text"
                  required
                  value={offerSalary}
                  onChange={(e) => setOfferSalary(e.target.value)}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A] border-slate-200 border rounded-lg px-3 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={offerStartDate}
                  onChange={(e) => setOfferStartDate(e.target.value)}
                  className="w-full dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A] border-slate-200 border rounded-lg px-3 py-1.5 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={sendingOffer}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {sendingOffer ? t('loading') : t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}