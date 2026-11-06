'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { roleCapabilities, roleHasPermission, Permission } from '@/lib/roleAccess';
import { FINAL_STAGES } from '@/lib/applicationStages';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();
  const sessionPermissions = (session?.user as any)?.permissions as string[] | undefined;
  const allows = (permission: Permission, fallback: boolean) => sessionPermissions ? sessionPermissions.includes(permission) : fallback;
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

  // §6.7: decision reasons come from the org's approved catalog (fetched from
  // the server) so the form always matches what the API will accept.
  const [reasonCatalog, setReasonCatalog] = useState<Array<{ code: string; label: string }>>([]);

  // §6.5: recruiter-triggered screening re-run (earlier runs stay for comparison).
  const [rerunningScreening, setRerunningScreening] = useState(false);

  // §6.3: archive/restore lifecycle with mandatory reason (captured client-side
  // via prompt, verified server-side).
  const [archiving, setArchiving] = useState(false);

  // §6.9: compose → preview → send candidate communications.
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('RECRUITER_MESSAGE');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messagePreview, setMessagePreview] = useState<{ subject: string; body: string } | null>(null);
  const [messageBusy, setMessageBusy] = useState(false);

  // Active highlighted snippet
  const [highlightedSnippet, setHighlightedSnippet] = useState<string | null>(null);

  const renderResumeWithHighlight = (text: string, snippet: string | null) => {
    if (!text) return t('cprofile_no_resume_text');
    if (!snippet || !snippet.trim()) return text;

    const trimmed = snippet.trim();
    const lowerText = text.toLowerCase();
    const lowerSnippet = trimmed.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerSnippet);

    if (matchIndex === -1) return text;

    const before = text.substring(0, matchIndex);
    const match = text.substring(matchIndex, matchIndex + trimmed.length);
    const after = text.substring(matchIndex + trimmed.length);

    return (
      <>
        {before}
        <mark id="evidence-quote-anchor" className="bg-teal-500/30 text-teal-300 dark:text-teal-200 px-1 py-0.5 rounded font-bold ring-2 ring-teal-500 animate-pulse">
          {match}
        </mark>
        {after}
      </>
    );
  };

  const { showToast } = useToast();

  const canMakeDecisions = allows(Permission.MakeHiringDecisions, roleCapabilities.canMakeDecisions(userRole));
  const canOverrideScores = allows(Permission.OverrideScores, roleCapabilities.canOverrideScores(userRole));
  const canScheduleInterviews = allows(Permission.ScheduleInterviews, roleCapabilities.canScheduleInterviews(userRole));
  const canGenerateInterviewQuestions = allows(Permission.GenerateInterviewQuestions, roleCapabilities.canGenerateInterviewQuestions(userRole));
  const canSubmitScorecards = allows(Permission.SubmitScorecards, roleCapabilities.canSubmitScorecards(userRole));
  const canRunScreening = allows(Permission.RunScreening, roleHasPermission(userRole, Permission.RunScreening));
  const canContactCandidates = allows(Permission.ContactCandidates, roleHasPermission(userRole, Permission.ContactCandidates));

  // Derived stage state, read from the canonical stage vocabulary so the UI
  // can never drift from what decision/stage routes write (single map, §8).
  const currentStage: string = app.stage || 'NEW';
  const isStage = (stage: string) => currentStage === stage;
  const isShortlisted = isStage('SHORTLISTED');
  const isInterviewing = isStage('INTERVIEW_SCHEDULED');
  const isOffered = isStage('OFFERED');
  const isHired = isStage('HIRED');
  const isRejected = isStage('REJECTED');
  const isWithdrawn = isStage('WITHDRAWN');
  const isTerminal = FINAL_STAGES.includes(currentStage);
  const isArchived = Boolean(app.archivedAt);

  // Load the approved decision-reason catalog once (§6.7). Falls back to the
  // built-in defaults rendered below if the request fails.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/decisions/reasons')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.reasons) && data.reasons.length > 0) {
          setReasonCatalog(data.reasons);
          // Keep the pre-selected default valid for the configured catalog.
          if (!data.reasons.some((r: { code: string }) => r.code === decisionReasonCode)) {
            setDecisionReasonCode(data.reasons[0].code);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const latestRun = app.screeningRuns?.[0] || (screeningResults ? { totalResult: screeningResults } : null);
  const storedResult = latestRun?.totalResult;
  const totalResult = storedResult && typeof storedResult === 'object' ? storedResult : {};
  const criteriaScores = totalResult.criteriaScores || latestRun?.assessments?.map((assessment: any) => ({
    category: assessment.criterion?.category || 'Requirement',
    criterionDescription: assessment.criterion?.description || '',
    score: assessment.effectiveResult || assessment.result,
    quotedEvidence: assessment.supportingEvidence,
    reasoning: assessment.uncertainty ? t('cprofile_uncertain_evidence') : '',
  })) || [];
  const score = Number(latestRun?.effectiveResult ?? (typeof storedResult === 'number' ? storedResult : totalResult.overallScore)) || 0;

  const candidateName = blindMode
    ? t('cprofile_candidate_code').replace('{code}', (app.id || 'ANON').substring(0, 8).toUpperCase())
    : `${app.candidate?.firstName || t('cprofile_applicant_fallback')} ${app.candidate?.lastName || ''}`;

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
        showToast(t('toast_score_recalibrated').replace('{score}', String(overrideScore)), 'success', t('toast_score_recalibrated_title'));
      } else {
        showToast(t('toast_score_recalibration_failed'), 'error', t('error'));
      }
    } catch (err) {
      showToast(t('toast_network_recalibration'), 'error', t('error'));
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
        showToast(t('toast_offer_sent').replace('{salary}', offerSalary), 'success', t('toast_offer_sent_title'));
      } else {
        showToast(t('toast_offer_failed'), 'error');
      }
    } catch {
      showToast(t('toast_network_offer'), 'error');
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
            interviewer: { name: t('cprofile_scorecard_you') },
            ratings: { techRating, commRating, problemRating },
            recommendation,
            comments: scorecardNotes,
            submittedAt: new Date().toISOString()
          },
          ...prev
        ]);
        setShowScorecardModal(false);
        setScorecardNotes('');
        showToast(t('toast_scorecard_recorded').replace('{recommendation}', recommendation), 'success', t('toast_scorecard_title'));
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || t('toast_scorecard_failed'), 'error');
      }
    } catch (err) {
      showToast(t('toast_network_scorecard'), 'error');
    } finally {
      setSubmittingScorecard(false);
    }
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionRationale.trim()) {
      showToast(t('toast_decision_rationale_required'), 'error');
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
        showToast(t('toast_decision_recorded').replace('{decision}', selectedDecision), 'success', t('toast_decision_title'));
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || t('toast_decision_failed'), 'error');
      }
    } catch (err) {
      showToast(t('toast_network_decision'), 'error');
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
    showToast(t('toast_question_copied'), 'info');
  };

  // §6.5: queue an AI screening re-run against the current APPROVED rubric.
  // Earlier runs remain untouched so results stay comparable.
  const handleToggleArchive = async () => {
    if (archiving || !app.candidate?.id) return;
    const archived = !isArchived;
    const defaultReason = archived ? 'Archiving inactive applicant — records kept for audit' : 'Restoring from archive for continued review';
    const reason = window.prompt(
      archived
        ? 'Archive this candidate and every application they hold? Records are preserved and the action is audited. Give a short reason:'
        : 'Restore this candidate from the archive? Give a short reason:',
      defaultReason
    );
    if (!reason || reason.trim().length < 3) return;

    setArchiving(true);
    try {
      const res = await fetch(`/api/candidates/${app.candidate.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Archive request failed');
      showToast(archived ? 'Candidate archived' : 'Candidate restored', 'success');
      // Refresh server-rendered state so the archivedAt badge stays truthful.
      window.location.reload();
    } catch (e: any) {
      showToast(e?.message || 'Archive request failed', 'error');
    } finally {
      setArchiving(false);
    }
  };

  const handleRerunScreening = async () => {
    if (rerunningScreening) return;
    setRerunningScreening(true);
    try {
      const res = await fetch(`/api/candidates/${app.id}/screening`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(t('toast_screening_queued'), 'success');
      } else {
        showToast(data.error || t('toast_screening_failed'), 'error');
      }
    } catch {
      showToast(t('toast_screening_failed'), 'error');
    } finally {
      setRerunningScreening(false);
    }
  };

  // §6.9: preview has no side effects; send enforces the confidentiality
  // guards server-side and records honest delivery state.
  const postMessage = async (mode: 'preview' | 'send') => {
    setMessageBusy(true);
    try {
      const res = await fetch(`/api/candidates/${app.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          template: messageTemplate,
          subject: messageSubject,
          body: messageBody,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (mode === 'preview') {
        if (res.ok) {
          setMessagePreview(data.preview);
          (data.issues || []).forEach((issue: { message: string }) =>
            showToast(issue.message, 'info')
          );
        } else {
          showToast(data.error || t('toast_message_failed'), 'error');
        }
        return data;
      }
      if (res.ok && data.delivered) {
        showToast(t('toast_message_sent'), 'success');
        setShowMessageModal(false);
        setMessagePreview(null);
      } else {
        showToast(data.error || t('toast_message_failed'), 'error');
      }
      return data;
    } catch {
      showToast(t('toast_message_failed'), 'error');
      return null;
    } finally {
      setMessageBusy(false);
    }
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
                showToast(next ? t('toast_blind_enabled') : t('toast_pii_revealed'), 'info');
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
          {canRunScreening && (
            <button
              onClick={handleRerunScreening}
              disabled={rerunningScreening}
              className="px-2.5 py-1.5 dark:bg-[#17242B] bg-white dark:hover:bg-[#1F2E37] hover:bg-slate-50 dark:border-[#30424A] border-slate-200 border dark:text-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1 shadow-xs disabled:opacity-60"
            >
              <span>🔁</span>
              <span>{rerunningScreening ? t('btn_screening_queued') : t('btn_rerun_screening')}</span>
            </button>
          )}

          {canContactCandidates && (
            <button
              onClick={() => {
                setMessagePreview(null);
                setShowMessageModal(true);
              }}
              className="px-2.5 py-1.5 dark:bg-[#17242B] bg-white dark:hover:bg-[#1F2E37] hover:bg-slate-50 dark:border-[#30424A] border-slate-200 border dark:text-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1 shadow-xs"
            >
              <span>✉</span>
              <span>{t('btn_message_candidate')}</span>
            </button>
          )}

          {/* Active Stage Indicator Badge */}
          <div className="flex items-center gap-1.5 self-center mr-1">
            <span className="chip !text-[10px] font-mono font-bold uppercase tracking-wider">
              {t('stage_col')}: {currentStage}
            </span>
            {isArchived ? (
              <span className="chip !text-[10px] font-mono font-bold uppercase tracking-wider !text-amber-600 dark:!text-amber-400">
                🗄 {t('cprofile_archived_badge')}
              </span>
            ) : null}
          </div>

          {/* 7. Archive/Restore (§6.3): lifecycle action with reason capture —
              keeps all records, removes nothing, fully audited server-side. */}
          {canMakeDecisions && (
            <button
              onClick={handleToggleArchive}
              disabled={archiving}
              className={`btn btn-secondary btn-sm !text-xs ${isArchived ? 'text-slate-600 dark:text-slate-300' : 'text-amber-700 dark:text-amber-300'}`}
              title={isArchived ? 'Restore the candidate and all their applications to the active pipeline' : 'Archive the candidate and all their applications (records stay intact)'}
            >
              <span>🗄</span>
              <span>{archiving ? '…' : isArchived ? t('cprofile_restore_btn') : t('cprofile_archive_btn')}</span>
            </button>
          )}

          {/* 1. Contact / Message: available whenever candidate is not withdrawn */}
          {canContactCandidates && !isWithdrawn && (
            <button
              onClick={() => {
                setMessagePreview(null);
                setShowMessageModal(true);
              }}
              className="btn btn-secondary btn-sm !text-xs"
              title="Compose and preview candidate communication"
            >
              <span>✉</span>
              <span>{t('btn_message_candidate')}</span>
            </button>
          )}

          {/* 2. AI Interview Questions: relevant during active evaluation */}
          {canGenerateInterviewQuestions && !isTerminal && (
            <button
              onClick={handleGenerateQuestions}
              className="btn btn-secondary btn-sm !text-xs"
              title="Generate customized behavioral and technical interview questions based on CV gaps"
            >
              <span>🤖</span>
              <span>{t('btn_ai_questions')}</span>
            </button>
          )}

          {/* 3. Submit Scorecard: relevant for interviewers during interview stages */}
          {canSubmitScorecards && (isShortlisted || isInterviewing) && (
            <button
              onClick={() => setShowScorecardModal(true)}
              className="btn btn-secondary btn-sm !text-xs font-bold text-teal-600 dark:text-teal-400"
              title="Submit structured scorecard evaluation"
            >
              <span>📝</span>
              <span>{t('btn_scorecard')}</span>
            </button>
          )}

          {/* 4. Schedule Interview: relevant when shortlisted or interviewing */}
          {canScheduleInterviews && !isTerminal && !isOffered && (
            <Link
              href={`/candidates/${app.id}/interview`}
              className="btn btn-secondary btn-sm !text-xs font-semibold"
              title="Schedule structured interview session with conflict check"
            >
              <span>📅</span>
              <span>{t('btn_schedule')}</span>
            </Link>
          )}

          {/* 5. Score Recalibration: available to decision-makers during review */}
          {canOverrideScores && !isTerminal && !isOffered && (
            <button
              onClick={() => setOverrideModalOpen(true)}
              className="btn btn-secondary btn-sm !text-xs text-amber-700 dark:text-amber-300"
              title="Override score with mandatory human rationale"
            >
              <span>✏</span>
              <span>{t('btn_recalibrate')}</span>
            </button>
          )}

          {/* 6. Human Decision Actions: context-aware based on current stage */}
          {canMakeDecisions && (
            <div className="flex items-center gap-1.5">
              {isRejected ? (
                <button
                  onClick={() => openDecisionDialog('REVIEW')}
                  className="btn btn-secondary btn-sm !text-xs font-bold text-amber-600"
                  title="Return application to review status"
                >
                  <span>↺</span>
                  <span>Return to Review</span>
                </button>
              ) : isOffered ? (
                <>
                  <button
                    onClick={() => openDecisionDialog('ADVANCE')}
                    className="btn btn-primary btn-sm !text-xs font-bold !bg-emerald-600 hover:!bg-emerald-500"
                    title="Confirm candidate acceptance and mark as Hired"
                  >
                    <span>✓</span>
                    <span>Mark as Hired</span>
                  </button>
                  <button
                    onClick={() => openDecisionDialog('REJECT')}
                    className="btn btn-danger btn-sm !text-xs"
                    title="Record candidate decline or rescission"
                  >
                    <span>✕</span>
                    <span>Decline / Rescind</span>
                  </button>
                </>
              ) : isHired ? (
                <span className="chip chip-success font-bold text-xs">
                  🎉 Hired
                </span>
              ) : isWithdrawn ? (
                <span className="chip font-bold text-xs text-[var(--muted)]">
                  Withdrawn
                </span>
              ) : isShortlisted || isInterviewing ? (
                <>
                  <button
                    onClick={() => openDecisionDialog('HOLD')}
                    className="btn btn-secondary btn-sm !text-xs"
                    title="Place candidate on temporary hold"
                  >
                    <span>⏸</span>
                    <span>Hold</span>
                  </button>
                  <button
                    onClick={() => openDecisionDialog('REJECT')}
                    className="btn btn-danger btn-sm !text-xs"
                    title="Record human rejection decision with rationale"
                  >
                    <span>✕</span>
                    <span>{t('decision_action_reject')}</span>
                  </button>
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="btn btn-primary btn-sm !text-xs font-bold !bg-emerald-600 hover:!bg-emerald-500"
                    title="Extend formal job offer"
                  >
                    <span>🚀</span>
                    <span>{t('btn_extend_offer')}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openDecisionDialog('HOLD')}
                    className="btn btn-secondary btn-sm !text-xs"
                    title="Place candidate on talent hold"
                  >
                    <span>⏸</span>
                    <span>Hold</span>
                  </button>
                  <button
                    onClick={() => openDecisionDialog('REJECT')}
                    className="btn btn-danger btn-sm !text-xs"
                    title="Reject application with documented reason"
                  >
                    <span>✕</span>
                    <span>{t('decision_action_reject')}</span>
                  </button>
                  <button
                    onClick={() => openDecisionDialog('SHORTLIST')}
                    className="btn btn-primary btn-sm !text-xs font-bold"
                    title="Shortlist candidate for interview progression"
                  >
                    <span>⭐</span>
                    <span>{t('decision_action_shortlist')}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: t('match_score'), value: `${score}%`, tone: 'text-teal-700 dark:text-teal-300' },
          { label: t('scored_criteria'), value: criteriaScores.length, tone: 'text-slate-900 dark:text-white' },
          { label: t('cprofile_status_label'), value: app.resumeDocument?.processingStatus || 'NOT_STARTED', tone: app.resumeDocument?.processingStatus === 'NEEDS_REVIEW' ? 'text-amber-600 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200' },
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
            {renderResumeWithHighlight(app.resumeDocument?.extractedText || app.resumeText || '', highlightedSnippet)}
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
              {totalResult.summary || t('cprofile_summary_fallback')}
            </p>
          </div>

          {/* §6.5: screening run history — earlier results are retained for
              comparison and audit after a re-run. */}
          <div className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-4 space-y-2.5">
            <h3 className="text-[11px] font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
              {t('screening_history_title')}
            </h3>
            {(app.screeningRuns?.length ?? 0) === 0 ? (
              <p className="text-[11px] dark:text-slate-400 text-slate-500">{t('screening_history_empty')}</p>
            ) : (
              <div className="space-y-1.5">
                {(app.screeningRuns || []).map((run: any, idx: number) => {
                  const runScore = Number(run.effectiveResult ?? run.totalResult);
                  const statusLabel =
                    run.status === 'COMPLETED'
                      ? t('processing_completed')
                      : run.status === 'FAILED'
                        ? t('processing_failed')
                        : t('processing_in_progress');
                  return (
                    <div
                      key={run.id || idx}
                      className="flex items-center justify-between gap-2 text-[11px] dark:bg-[#0F171D] bg-slate-50 dark:border-[#30424A]/40 border-slate-200 border rounded-lg px-2.5 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold dark:text-white text-slate-900 shrink-0">
                          {Number.isFinite(runScore) ? `${Math.round(runScore)}%` : '—'}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                            {t('screening_history_latest')}
                          </span>
                        )}
                        <span className="dark:text-slate-400 text-slate-500 truncate">
                          {t('screening_history_col_rubric')} v{run.rubricVersion ?? '?'} &bull;{' '}
                          {run.createdAt ? new Date(run.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                      <span className={`shrink-0 font-semibold ${
                        run.status === 'COMPLETED'
                          ? 'text-emerald-500'
                          : run.status === 'FAILED'
                            ? 'text-rose-500'
                            : 'text-amber-500'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
                      showToast(t('toast_evidence_located').replace('{evidence}', crit.quotedEvidence), 'info');
                      setTimeout(() => {
                        const el = document.getElementById('evidence-quote-anchor');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 50);
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
                <span className="text-[10px] font-mono text-teal-600 dark:text-teal-300 font-bold">● {t('cprofile_active_badge')}</span>
              </div>

              {scorecards.map((sc: any, idx: number) => (
                <div
                  key={sc.id || idx}
                  className="dark:bg-[#17242B]/90 bg-[#FFFDF8]/90 dark:border-[#30424A] border-[#D8D2C6] border rounded-xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold dark:text-white text-slate-900">
                      {sc.interviewer?.name || sc.interviewer?.email || t('cprofile_interviewer_fallback')}
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
                    <div>{t('cprofile_tech_short')}: <span className="font-bold text-teal-600 dark:text-teal-400">{sc.ratings?.techRating || 4}/5</span></div>
                    <div>{t('cprofile_comm_short')}: <span className="font-bold text-teal-600 dark:text-teal-400">{sc.ratings?.commRating || 4}/5</span></div>
                    <div>{t('cprofile_problem_short')}: <span className="font-bold text-teal-600 dark:text-teal-400">{sc.ratings?.problemRating || 5}/5</span></div>
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
                  <p className="text-[10px] dark:text-slate-400 text-slate-500">{t('cprofile_questions_targeting')}</p>
                </div>
              </div>
              <button onClick={() => setShowQuestionsModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {generatingQuestions ? (
              <div className="py-10 text-center text-xs text-teal-600 dark:text-teal-400 space-y-2">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>{t('cprofile_questions_analyzing')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedQuestions.map((item: any, i: number) => {
                  const isObj = typeof item === 'object' && item !== null;
                  const skill = isObj ? item.skill || t('cprofile_targeted_competency') : t('cprofile_question_n').replace('{count}', String(i + 1));
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
                          📋 {t('cprofile_copy_btn')}
                        </button>
                      </div>

                      <p className="text-xs dark:text-slate-100 text-slate-900 font-semibold leading-relaxed">
                        {questionText}
                      </p>

                      {expected && (
                        <div className="pt-2 border-t dark:border-[#30424A]/80 border-slate-200 text-[10px] dark:text-slate-400 text-slate-600">
                          <span className="font-semibold text-teal-600 dark:text-teal-400">{t('cprofile_what_to_look_for')} </span>
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
                  placeholder={t('cprofile_notes_placeholder')}
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
                  {reasonCatalog.length > 0
                    ? reasonCatalog.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.label}
                        </option>
                      ))
                    : (
                      <>
                        <option value="QUALIFICATIONS_MATCH">{t('cprofile_reason_qualifications_match')}</option>
                        <option value="EXCELLENT_TECHNICAL_FIT">{t('cprofile_reason_excellent_technical_fit')}</option>
                        <option value="EXPERIENCE_GAP">{t('cprofile_reason_experience_gap')}</option>
                        <option value="COMMUNICATION_FIT">{t('cprofile_reason_communication_fit')}</option>
                        <option value="COMPENSATION_MISMATCH">{t('cprofile_reason_compensation_mismatch')}</option>
                        <option value="TALENT_BENCH">{t('cprofile_reason_talent_bench')}</option>
                        <option value="CANDIDATE_WITHDREW">{t('cprofile_reason_candidate_withdrew')}</option>
                        <option value="OTHER">{t('cprofile_reason_other')}</option>
                      </>
                    )}
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
                  placeholder={t('cprofile_justification_placeholder')}
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

      {/* MESSAGE CANDIDATE MODAL (§6.9: preview & edit before send) */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-lg w-full shadow-xl space-y-3 text-xs dark:text-slate-200 text-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('message_modal_title')}</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-slate-400">✕</button>
            </div>

            <p className="text-[11px] dark:text-slate-400 text-slate-500">{t('message_modal_hint')}</p>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600">{t('message_template_label')}</label>
              <select
                value={messageTemplate}
                onChange={(e) => { setMessageTemplate(e.target.value); setMessagePreview(null); }}
                className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="RECRUITER_MESSAGE">{t('message_template_general')}</option>
                <option value="APPLICATION_CONFIRMATION">{t('message_template_ack')}</option>
                <option value="INTERVIEW_INVITATION">{t('message_template_invite')}</option>
                <option value="INTERVIEW_RESCHEDULED">{t('message_template_reschedule')}</option>
                <option value="REJECTION_FEEDBACK">{t('message_template_rejection')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600">{t('message_subject_label')} *</label>
              <input
                type="text"
                value={messageSubject}
                onChange={(e) => { setMessageSubject(e.target.value); setMessagePreview(null); }}
                placeholder={t('message_subject_placeholder')}
                className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold dark:text-slate-400 text-slate-600">{t('message_body_label')} *</label>
              <textarea
                rows={6}
                value={messageBody}
                onChange={(e) => { setMessageBody(e.target.value); setMessagePreview(null); }}
                placeholder={t('message_body_placeholder')}
                className="w-full dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-2"
              ></textarea>
              <p className="text-[10px] dark:text-slate-500 text-slate-400">{t('message_placeholders_hint')}</p>
            </div>

            {messagePreview && (
              <div className="dark:bg-[#0F171D] bg-slate-50 border dark:border-[#30424A] border-slate-200 rounded-lg p-3 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-300">{t('message_preview_label')}</span>
                <p className="font-semibold dark:text-white text-slate-900">{messagePreview.subject}</p>
                <div className="text-[11px] whitespace-pre-wrap dark:text-slate-300 text-slate-700 max-h-48 overflow-y-auto">{messagePreview.body}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                className="px-3 py-1.5 dark:bg-slate-800 bg-slate-100 rounded-lg font-medium"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={messageBusy || !messageSubject.trim() || !messageBody.trim()}
                onClick={() => postMessage('preview')}
                className="px-3 py-1.5 dark:bg-slate-700 bg-slate-200 rounded-lg font-medium disabled:opacity-50"
              >
                {t('message_preview_btn')}
              </button>
              <button
                type="button"
                disabled={messageBusy || !messageSubject.trim() || !messageBody.trim()}
                onClick={() => postMessage('send')}
                className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {messageBusy ? t('loading') : t('message_send_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE SCORE MODAL */}
      {overrideModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#17242B] bg-[#FFFDF8] dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 max-w-md w-full shadow-xl space-y-3 dark:text-slate-200 text-slate-800 text-xs">
            <h3 className="text-sm font-bold dark:text-white text-slate-900">{t('btn_recalibrate')}</h3>
            <p className="text-[11px] dark:text-slate-400 text-slate-500">
              {t('cprofile_override_warning')}
            </p>

            <form onSubmit={handleRecalibrateScore} className="space-y-3">
              <div>
                <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
                  {t('cprofile_adjusted_score')}
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
                  {t('cprofile_justification_label')} *
                </label>
                <textarea
                  id="overrideReason"
                  rows={2}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder={t('cprofile_override_placeholder')}
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
                  {t('cprofile_annual_compensation')} *
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
                  {t('cprofile_start_date')} *
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
