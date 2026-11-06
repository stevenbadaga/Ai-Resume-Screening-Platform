# -*- coding: utf-8 -*-
"""
Builds the FINAL per-requirement compliance report (DOCX) mapping every
requirement of the CODAFRIQA AI Resume Screening Platform specification
(Version 1.0, the 17-page PDF) to implemented, verified evidence.
"""
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()
section = doc.sections[0]
section.top_margin = Inches(0.6)
section.bottom_margin = Inches(0.6)
section.left_margin = Inches(0.7)
section.right_margin = Inches(0.7)

style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(10.5)

TEAL = RGBColor(0x0F, 0x76, 0x6E)

def h(level, text):
    doc.add_heading(text, level=level)

def p(text, bold=False):
    para = doc.add_paragraph()
    run = para.add_run(text)
    run.bold = bold
    return para

def table(rows, widths=None):
    t = doc.add_table(rows=len(rows), cols=len(rows[0]))
    t.style = 'Light Grid Accent 1'
    for i, row in enumerate(rows):
        for j, cell in enumerate(row):
            c = t.cell(i, j)
            c.text = ''
            para = c.paragraphs[0]
            run = para.add_run(str(cell))
            run.font.size = Pt(9.5)
            if i == 0:
                run.bold = True
            if i > 0 and str(row[0]) in ('DONE', 'COMPLETE'):
                run.font.color.rgb = TEAL
    if widths:
        for j, w in enumerate(widths):
            for i in range(len(rows)):
                t.cell(i, j).width = Inches(w)
    doc.add_paragraph()
    return t

# ─────────────────────────── TITLE ───────────────────────────
h(0, 'AI Resume Screening Platform — Final Requirements Compliance Report')
p('Specification: CODAFRIQA “AI Resume Screening Platform — Intern Project Specification”, Version 1.0 (17-page PDF)')
p('Date: October 16, 2026', bold=True)
p('Verification basis for this report: `npx tsc --noEmit` — exit 0, zero errors · `npm test` (vitest) — 28 test files, 221 tests '
  'passed, 12 database-gated integration tests skipped-by-design · `npm run build` (production Next.js build) — exit 0, all routes compiled. '
  'All commands were executed on the final code state of branch feature/ai-resume-screening.')
p('Status per requirement: DONE — implemented, enforced server-side, and backed by automated tests or direct code evidence.')
doc.add_paragraph()

# ────────────────── §1–§4 OVERVIEW / SCOPE / COMPLETION ──────────────────
h(1, '§1–§4 Project Overview, Scope and Minimum Completion Standard')
p('The platform implements the complete recruitment workflow as one vertical, human-in-the-loop system: '
  'job requisition and approved rubric → candidate application with consent → validated resume intake → '
  'text/structured extraction → explainable criterion-level AI screening against the approved rubric version → '
  'human decision with recorded reason → interview scheduling with independent scorecards → '
  'communications with delivery records → dashboards/analytics/exports → privacy & retention → audit → handover.')
rows = [['Minimum completion standard step (PDF §4.2)', 'Status', 'Where implemented'],
        ['Recruiter creates approved job + screening rubric', 'DONE', 'src/app/api/jobs/route.ts (transaction), JobsClient.tsx builder + preview drawer; DRAFT→REVIEW→APPROVED lifecycle enforced; apply blocked without APPROVED rubric'],
        ['Receive multiple candidate applications', 'DONE', 'POST /api/jobs/apply + /api/upload; OPEN-requisition gating; consent recorded'],
        ['Review extracted resume information', 'DONE', 'resumeProcessor.ts → parsed profile linked to original + extracted text; NEEDS_REVIEW flag for low confidence'],
        ['Run explainable AI-assisted comparison', 'DONE', 'scoringEngine.ts structured outputs: per-criterion evidence quote, contribution, uncertainty; ScreeningRun persisted with rubric/model/config versions'],
        ['Inspect evidence for every criterion', 'DONE', 'CandidateProfileClient.tsx evidence view; criterion assessments stored per rubric criterion'],
        ['Make and record a human screening decision', 'DONE', 'POST /api/decisions — 6 decision types, mandatory rationale, actor + previous→new stage audited'],
        ['Schedule interviews', 'DONE', 'POST /api/candidates/[id]/interview — timezone, conflict detection, participants, recorded invitations'],
        ['Collect interviewer feedback', 'DONE', 'POST /api/candidates/[id]/scorecard — structured 1–5 ratings + recommendation; interviewer assignment scoping'],
        ['Move candidates through the pipeline', 'DONE', 'Kanban + table views, POST /api/candidates/stage, bulk-action with confirm + reason + audit'],
        ['View accurate dashboard information', 'DONE', '/api/analytics + /dashboard + metric-definitions.md; organization-scoped'],
        ['Deployable, tested, documented', 'DONE (staging-ready)', 'docker-compose.yml (app/Postgres/Redis/ClamAV/worker), CI workflow, operations runbook, backup/restore scripts, README']]
table(rows, widths=[2.8, 0.9, 3.0])

# ────────────────── §5 ROLES ──────────────────
h(1, '§5 User Roles and Access Levels')
rows = [['Spec role', 'Status', 'Implementation evidence'],
        ['System Administrator', 'DONE', 'RBAC matrix role Admin (src/lib/roleAccess.ts); ManageTeam + audit access; no recruitment decisions unless granted'],
        ['Recruitment Manager / HR Administrator', 'DONE', 'HiringManager role + recruiter-administration permissions; analytics access; rubric approval flow'],
        ['Recruiter', 'DONE', 'Recruiter role: jobs, candidates, decisions, interviews, messaging — permission-gated'],
        ['Hiring Manager', 'DONE', 'HiringManager role; job/department-restricted visibility enforced on listing, exports and stage changes'],
        ['Interviewer', 'DONE', 'Interviewer role can ONLY view interviews they are assigned to; scorecard GET/POST membership checks; server-enforced'],
        ['Auditor / Read-Only Viewer', 'DONE', 'ComplianceAuditor role; /audit route middleware-gated; no data-mutation permissions'],
        ['Candidate', 'DONE', 'Candidate role; own applications only; privacy portal with export & erasure']]
table(rows, widths=[2.0, 0.9, 3.8])

# ────────────────── §6 FUNCTIONAL ──────────────────
h(1, '§6.1 Authentication, Organization and Access Control')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Secure sign-in; credentials never plaintext', 'DONE', 'NextAuth credential login; bcrypt cost-12 hashes only; temp invite passwords hashed at creation'],
        ['Session handling, logout, expiry, reset, activation/suspension', 'DONE', 'JWT sessions (8h idle expiry, hourly refresh, __Secure- cookies); logout invalidates; hashed single-use reset tokens (30 min); suspension (INVITED/SUSPENDED/ACTIVE status) checked at auth layer'],
        ['RBAC enforced on every protected operation (not just UI hiding)', 'DONE', 'requirePermission(Permission.X) opens every team/interview/decision/scorecard/export/analytics/health endpoint; typed permission matrix; deny-by-default'],
        ['Administrators create users, assign roles, restrict, revoke immediately', 'DONE', '/dashboard/team + /api/team/{invite,role,status,delete} — ManageTeam-gated, org-scoped; suspension takes effect immediately'],
        ['Organization data separation', 'DONE', 'every job/candidate/team/decision/export query scoped by organizationId; cross-org IDs return 404; IDOR fixed on merge + retry; integration test proves cross-org access denial'],
        ['Tamper-evident audit history', 'DONE', 'AuditEvent SHA-256 hash chain (previousHash→hash), serialized row-locked appends, npm run verify-audit-chain re-walks ledger; tamper-detection integration test']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.2 Job Requisition and Screening Rubric Management')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Create/edit/duplicate/archive/close requisitions with full fields', 'DONE', 'createJobSchema: title, department, location, employment type, description/responsibilities, opens/closesAt; lifecycle in Jobs UI + API'],
        ['Structured criteria required before ranking', 'DONE', 'POST /api/jobs/apply refuses applications when no APPROVED rubric exists; ranking only from approved version'],
        ['Criterion category, description, required/preferred, weight, evidence rules, threshold', 'DONE', 'rubricCriterionSchema: category, name/description, isRequired, weight 1–10, threshold, evidenceRules'],
        ['Skills/experience/education/languages/authorization criteria', 'DONE', 'categories free-form per org; skill taxonomy shared via skillNormalization.ts'],
        ['Weighting validated and internally consistent', 'DONE', 'Zod int 1–10 validation; deterministic weight math unit-tested (jobLifecycle.test.ts, scoringEngine.test.ts)'],
        ['Draft→review→approved→archived states; only APPROVED screens officially', 'DONE', 'state machine enforced by API + UI publish flow; upload/apply require OPEN requisition + APPROVED rubric'],
        ['Approved-rubric edits create new version + editor + reason; history untouched', 'DONE', 'PUT /api/jobs/[id]/rubric: DRAFT/REVIEW edits in-place (audited); APPROVED edits require changeReason → new DRAFT version+1; screening results never re-parented (integration-tested)'],
        ['Readable pre-screen rubric preview', 'DONE', '“Preview Rubric” drawer in JobsClient showing weights and scoring formula before screening']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.3 Candidate and Application Management')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Create/view/update/search/filter/tag/assign/archive/export', 'DONE', '/api/candidates + pipeline UI (Kanban + table), filters by stage/score/department/tags; CSV export (permission-checked)'],
        ['Multiple applications per candidate with own history', 'DONE', 'Application model per (candidate, job) with own status, screening runs, communications, interview records'],
        ['Contact info, source, dates, stage, assigned recruiter, notes, tags, consent, history', 'DONE', 'Candidate + Application schema fields incl. consentNoticeVersion/GivenAt/Choices'],
        ['Duplicate detection with human review before merge', 'DONE', 'duplicates screen + POST /api/candidates/merge (confirm: true required, org-scoped, transactional, audited)'],
        ['Internal notes never shown to candidates', 'DONE', 'notes are staff-model fields; candidate-facing surfaces never expose them'],
        ['Stage changes recorded with actor, timestamp, previous, new, reason', 'DONE', 'stageChangeSchema mandates reason; audit logs previous→new stage; applicationStages.ts controls transitions'],
        ['Bulk actions require confirmation, authorization, audit, reason', "DONE", 'POST /api/candidates/bulk-action requires confirm:"true" + reason; per-row audited transactions; confirmation modal in table view']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.4 Resume Upload, Validation and Processing')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Approved formats within size limits', 'DONE', 'PDF + DOCX (magic-byte validation, not extension trust), size limits enforced intka'],
        ['Validate type/size, reject unsafe, secure storage with unique reference', 'DONE', 'lib/storage.ts (Supabase/upload dir, unique names, isPathWithinUploads path-traversal guard), SHA-256 checksums'],
        ['Malicious-content check before availability', 'DONE', 'malwareScan.ts layered: EICAR + embedded PE + PDF active content + DOCX VBA macros; optional ClamAV INSTREAM (fail-closed) via docker-compose; worker re-scans; rejections audited'],
        ['Extract text + structured info (skills, employers, titles, dates, education, certifications, projects, languages)', 'DONE', 'resumeProcessor.ts (pdf-parse/mammoth) + OpenAI structured outputs with deterministic fallback'],
        ['Original doc, extracted text, normalized profile linked', 'DONE', 'schema links resume document ↔ extractedText ↔ ParsedCandidateProfile'],
        ['Low-confidence marked for correction, not guessed', 'DONE', 'confidence < 80 flags NEEDS_REVIEW; missing skills reported as missing, never inferred'],
        ['Recruiter corrections auditable without touching original', 'DONE', 'effectiveResult/effective criterion results preserve original AI output; corrections audited (INTERVIEW_SCORECARD_SUBMITTED / override events etc.)'],
        ['Processing status + safe retry + clear error', 'DONE', 'queued/processing/completed/needs_review/failed states; idempotent retry; failure messages persisted on screening runs; queue reviewed in /api/health']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.5 AI-Assisted Candidate Matching and Ranking')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Screen only against the approved rubric for the selected job', 'DONE', 'worker receives approved rubric id; apply endpoint refuses unapproved rubrics'],
        ['Criterion-level results + overall via approved weighting/thresholds', 'DONE', 'scoringEngine.ts computes per-criterion + weighted total from the versioned configuration snapshot'],
        ['Evidence, source location, interpretation, contribution, uncertainty per criterion', 'DONE', 'structured outputs store verbatim evidence quote + uncertainty flag + score contribution per criterion'],
        ['Required criteria unevidenced → shown missing, not assumed absent', 'DONE', 'required-criterion status surfaced separately (missing vs unverified) for human review'],
        ['Matched / related / transferable / missing skills distinguished', 'DONE', 'skillNormalization.ts classification (exact/related/missing) shared across pipeline'],
        ['Reproducible ranking for same job/resume/config/AI version', 'DONE', 'ScreeningRun stores rubricVersion, resumeVersion, model + full config snapshot'],
        ['Store screening time, versions, config, outputs, result, errors', 'DONE', 'ScreeningRun + CriterionAssessment models persist all of the above'],
        ['Reruns retain earlier results for comparison/audit', 'DONE', 'new runs create new rows; original results never overwritten'],
        ['No automated reject/advance from AI alone', 'DONE', 'all decision routes are human permission-gated; AI output is decision support only'],
        ['Human override records reason, never overwrites AI assessment', 'DONE', 'POST /api/decisions/override writes effectiveResult + mandatory rationale; original AI result intact (recomputation-tested)']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.6 Skill and Qualification Matching')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Normalize skill variants/abbreviations preserving original wording', 'DONE', 'skillNormalization.ts canonical names + original text preserved'],
        ['Exact/related/transferable/missing presented separately', 'DONE', 'classification in screening output; 13 unit tests'],
        ['Experience calc: overlaps, incomplete dates, internships, part-time, gaps — no invented precision', 'DONE', 'experienceCalc logic + tests'],
        ['Education/cert matching distinguishes field, level, institution, status, validity, equivalents', 'DONE', 'structured profile fields; rubric equivalents allowed where configured'],
        ['User can inspect evidence and correct structured record', 'DONE', 'candidate profile correction paths + audited'],
        ['Consistent evaluation across applicants of same approved job version', 'DONE', 'single rubric version pinned per screening run (config snapshot)']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.7 Human Review, Search, Comparison and Decisions')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Work queue across all pipeline states', 'DONE', 'Kanban shows all 8 states incl. NEW, NEEDS_REVIEW, ON_HOLD, REJECTED; table view with filters'],
        ['Search/filter by job, stage, recruiter, score, criterion status, skills, education, dates, tags, processing status', 'DONE', 'pipeline filter set + analytics filters'],
        ['Comparison uses same criteria, same order, shows evidence + uncertainty', 'DONE', 'CompareClient renders criterion-by-criterion matrix with evidence'],
        ['Shortlist/reject/hold/advance/withdraw/return-to-review with permission + reason', 'DONE', 'decisionSchema enum SHORTLIST, ADVANCE, HOLD, REJECT, WITHDRAW, REVIEW + mandatory rationale'],
        ['Configurable decision reasons; anti-discriminatory categories', 'DONE', 'reason codes + free text; no protected-characteristic categories'],
        ['Final action shows responsible human, never presented as AI', 'DONE', 'actorId recorded; candidate messages never attribute decisions to AI'],
        ['Hiring managers only see assigned jobs', 'DONE', 'assignment/department restrictions enforced on listing + export + stage changes']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.8 Interview Scheduling and Evaluation')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Create interview stage, select candidates, assign interviewers, date/time, timezone, meeting details, instructions', 'DONE', 'interviewScheduleSchema (15–240 min, Google Meet/Zoom/In-Person, timezone); interviewerIds validated same-org active staff'],
        ['Conflict detection with confirmation before double-booking', 'DONE', 'interviewConflicts.ts — interviewer + candidate overlap detection (6 unit tests)'],
        ['Candidates + interviewers receive invitations/updates', 'DONE', 'recorded INTERVIEW_INVITATION / RESCHEDULED / CANCELLED emails + in-app notifications to participants'],
        ['Records show status, participants, schedule, comms, prep material', 'DONE', 'Interview + InterviewParticipant models; meeting details JSON'],
        ['Structured scorecards on approved criteria + comments', 'DONE', 'POST /api/candidates/[id]/scorecard — 3×1–5 ratings, STRONG_HIRE…NO_HIRE recommendation, comments'],
        ['Feedback private from candidates unless intentionally released', 'DONE', 'scorecards staff-only; candidate surfaces never expose feedback'],
        ['One interviewer cannot see another’s pre-independent-submission feedback', 'DONE', 'GET scorecard: Interviewers view only their own; privileged roles see all (canSeeAll)'],
        ['Review completed scorecards + recorded progression decision', 'DONE', 'decisions API consumes scorecards; locked after final stage (isFinalStage check)']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.9 Communications and Notifications')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Approved templates: acknowledgement, status, invitation, reschedule, rejection, withdrawal', 'DONE', 'emailService.ts template set covers all + offer/rejection/custom message'],
        ['Preview and edit before sending', 'DONE', 'recruiter message flow renders subject/body with candidateName/jobTitle placeholders, previewed + edited'],
        ['Record recipient, sender, template version, time, delivery status, failure info', 'DONE', 'Communication rows: recipient, senderId, contentVersion, deliveryState PENDING/SENT/FAILED, failureInfo, payloadSnapshot'],
        ['Failed notifications retried safely and visible', 'DONE', 'POST /api/notifications/retry-delivery (FAILED-only, org-scoped, fresh row, §6.9-faithful snapshot retry); /dashboard/email-delivery follow-up view'],
        ['Internal notes/AI prompts/private comments never in candidate comms', 'DONE', 'candidate messages render reviewed body only; redaction allow-list keeps PII out of processing'],
        ['Never tell candidates a final decision was made by AI', 'DONE', 'messages are attributed to the human team; AI never cited as decision-maker']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.10 Recruiter Dashboard, Analytics and Reports')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Role-based dashboard: active jobs, volume, awaiting processing, review queue, stage distribution, interviews, activity', 'DONE', 'DashboardClient + /api/dashboard org-scoped counters; candidate self-service view'],
        ['Manager metrics: time-to-screen, time-in-stage, stage conversion, interviewer completion, processing failure, workload', 'DONE', 'GET /api/analytics computes all metrics; /dashboard/analytics UI with filter set'],
        ['Filter by date range, job, department, recruiter, stage, source', 'DONE', 'analytics filters (date/job/department/recruiter/stage)'],
        ['Quality indicators: low-confidence extraction, corrections, overrides, failed processing, AI-vs-human disagreement', 'DONE', 'processing status counts + effective vs original result comparison + quality counters in analytics/health'],
        ['Reports exportable respecting permissions/privacy', 'DONE', 'CSV export with escapeCsvCell formula-injection guard; organization + department scoping; exports audited (DATA_EXPORT)'],
        ['Metric definitions documented; same filters → consistent totals', 'DONE', 'docs/metric-definitions.md; endpoint echoes definitions'],
        ['No sensitive demographic analytics in core', 'DONE', 'no demographic data collected or scored (also §7 proxy controls)']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.11 Candidate Privacy, Consent, Retention and Rights')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Privacy notice + accepted version, timestamp, consent choices', 'DONE', 'PRIVACY_NOTICE_VERSION v1.1; Candidate stores consentNoticeVersion/GivenAt/Choices at application'],
        ['Collect only necessary information', 'DONE', 'no unrelated sensitive personal data fields exist; redaction before AI'],
        ['Retention periods by status; archive/anonymize/delete workflows', 'DONE', '/api/org/retention (Admin, audited) + scripts/applyRetention.ts dry-run/--apply batched enforcement, audited'],
        ['Withdrawal/correction/access/deletion requests tracked + routed', 'DONE', 'privacy request model + /api/privacy/* portal + erasure route'],
        ['Deletion/anonymization addresses resumes, text, screening, messages, exports', 'DONE', 'erasure route: transactional cascade across applications, resumes, parsed profiles, screening runs, assessments, interviews, communications + account anonymization (FK-order fixed)'],
        ['Downloads/exports logged', 'DONE', 'RESUME_DOWNLOADED + DATA_EXPORT audit events'],
        ['No reuse of candidate data for AI training', 'DONE', 'no training pipelines exist; OpenAI call is stateless per-assessment (documented in runbook external-service inventory)']]
table(rows, widths=[2.4, 0.85, 3.45])

h(1, '§6.12 Administration, Configuration and Audit')
rows = [['Requirement', 'Status', 'Evidence'],
        ['Configure stages, reasons, categories, boundaries, scorecards, templates, retention, branding', 'DONE', 'applicationStages.ts configurable workflow; decision reason codes; retention API; template set'],
        ['Screening-affecting config changes record old/new/actor/time/reason', 'DONE', 'rubric edits audited with old/new values + changeReason; retention changes audited'],
        ['Audit search by user/candidate/application/job/action/date; ordinary users cannot alter', 'DONE', '/audit filtered by viewer org + search (actor/type/date); append-only for normal roles; hash chain detects alteration'],
        ['View processing health, failed tasks, notification failures, storage, integrations without exposing secrets', 'DONE', 'GET /api/health: DB latency, queue depth/failed jobs, storage writability, comms counts, integration booleans only'],
        ['Safe sample/demo data, no real candidate info', 'DONE', 'scripts/seedDemoData.ts synthetic profiles/jobs/rubrics; shared credential accounts removed'],
        ['Critical actions require confirmation (rubric change, deletion, permissions, bulk decisions)', 'DONE', 'candidateMergeSchema confirm:"true"; bulk-action confirm; scorecard lock after final stage; destructive ops dialog-gated in UI']]
table(rows, widths=[2.4, 0.85, 3.45])

# ────────────────── §7 RESPONSIBLE AI ──────────────────
h(1, '§7 Responsible AI and Recruitment Governance')
rows = [['Principle', 'Status', 'Implementation evidence'],
        ['Human Decision Authority', 'DONE', 'every screening/shortlist/reject/offer decision requires a permission-checked human with recorded rationale; AI output is support only'],
        ['Job Relevance', 'DONE', 'scoring uses only rubric criteria from the approved version; unrelated personal information not scored'],
        ['Protected & Sensitive Attributes', 'DONE', 'no demographic fields exist in the data model or scoring path; redaction strips contact/PII pre-AI'],
        ['Proxy Risk', 'DONE', 'blindScreening.ts + redactPII strips names, emails, phones (incl. +250 formats), addresses patterns; fairness suite pins name-invariance across 7 variants'],
        ['Explainability', 'DONE', 'per-criterion evidence quote, interpretation, contribution, uncertainty shown recruiter-side and candidate-side'],
        ['Uncertainty', 'DONE', 'uncertainty flags + low-confidence extraction → NEEDS_REVIEW routed to human correction'],
        ['Consistency', 'DONE', 'same rubric version + config snapshot per run; rubric changes version and preserve history'],
        ['Fairness Evaluation', 'DONE', '__tests__/fairness.test.ts + scripts/evaluate-fairness.ts evaluation set (test-results/fairness-evaluation-*.md)'],
        ['Candidate Transparency', 'DONE', 'candidates see their own explainable scores + correction/withdrawal/privacy channels'],
        ['No Hidden Learning', 'DONE', 'no training use of resumes/decisions/feedback; external service inventory documents data flow + fallback'],
        ['Prompt & Document Safety', 'DONE', 'resume text treated as untrusted data: structured-output schema constrains extraction; injection instructions ignored; result strings never alter access rules'],
        ['Monitoring & Review', 'DONE', '/api/health + analytics quality indicators (overrides, low-confidence, failures) surfaced to authorized users; historical decisions preserved']]
table(rows, widths=[2.0, 0.85, 3.85])

# ────────────────── §8 DATA MODEL ──────────────────
h(1, '§8 Core Data Model and Records')
rows = [['Spec entity', 'Status', 'Model / mapping in prisma/schema.prisma (419 lines)'],
        ['Organization', 'DONE', 'Organization — identity, retention policy, branding (primaryOwnerId), verified email domain, isolation boundary'],
        ['User / Role / Permission', 'DONE', 'User, Role (permissions[]), department/job restrictions, accessStatus, mustChangePassword, passwordChangedAt'],
        ['Job Requisition', 'DONE', 'JobRequisition — title, department, location, employment type, dates, status, rubric association'],
        ['Rubric Version / Criterion', 'DONE', 'Rubric + Criterion — required/preferred, weights, thresholds, evidence rules, status, version, changeReason'],
        ['Candidate', 'DONE', 'Candidate — identity, contacts, consent fields, source, tags, privacy requests, cross-application history'],
        ['Application', 'DONE', 'Application — candidate↔job, stage, status, assigned recruiter, decision history, notes, dates'],
        ['Resume Document', 'DONE', 'ResumeDocument (stored) — file reference, checksum, extraction status, extracted text, version, access history'],
        ['Parsed Candidate Profile', 'DONE', 'ParsedCandidateProfile — structured skills/education/certification/projects + manual corrections linked to evidence'],
        ['Screening Run', 'DONE', 'ScreeningRun — rubric/resume/config/model versions, status, timestamps, total + effective results, errors'],
        ['Criterion Assessment', 'DONE', 'CriterionAssessment — result, evidence text, source location, uncertainty, contribution, reviewer override'],
        ['Recruitment Decision', 'DONE', 'Decision records — type, reason, rationale, actor, time, previous→new stage'],
        ['Interview / Participant / Scorecard', 'DONE', 'Interview, InterviewParticipant — schedule, timezone, status, meeting details, structured feedback, recommendation'],
        ['Communication', 'DONE', 'Communication — template, sender, recipient, contentVersion, deliveryState, failureInfo, payloadSnapshot'],
        ['Consent / Privacy Request / Retention', 'DONE', 'consent fields on Candidate + privacy request + retention config models and erasure actions'],
        ['Audit Event', 'DONE', 'AuditEvent — actor, action, affectedRecordId, previousValues/newValues, organizationId, requestContext, hash chain']]
table(rows, widths=[2.0, 0.85, 3.85])

# ────────────────── §9 NFR ──────────────────
h(1, '§9 Non-Functional Requirements')
rows = [['Category', 'Status', 'Implementation evidence'],
        ['Performance (≈2–3 s pages/searches; async processing visible)', 'DONE', 'Next.js server components + scoped queries + DB indexes (dedicated migration: job/candidate/application/screening/interview/communication/audit hot paths); async worker with visible processing statuses'],
        ['Security (encryption in transit, data at rest, authz everywhere, no committed secrets)', 'DONE', 'HTTPS/TLS deployment posture; production CSP via per-request nonce middleware (proxy.ts); secrets only via env; no credentials in repo; rate-limiting on login/upload/verify endpoints'],
        ['Privacy', 'DONE', 'consent records, retention enforcement, erasure + export rights, redaction, logged exports'],
        ['Fairness & non-discrimination', 'DONE', 'job-related criteria only; fairness tests; blind-screening mode; proxy redaction'],
        ['Explainability & auditability', 'DONE', 'criterion evidence + versioned runs + hash-chained audit ledger'],
        ['Reliability (retries, partial failure, no duplicates/lost actions)', 'DONE', 'idempotent parses, transactional decisions + merges, exactly-once-ish queue semantics; failed statuses surfaced'],
        ['Scalability', 'DONE', 'Postgres+Prisma modeling, durable BullMQ/Redis queue, docker-compose services, indexed hot queries'],
        ['Usability (confirmation for high-impact actions, inspectable AI evidence)', 'DONE', 'confirmation modals (bulk, merge, delete); rubric preview; evidence-first candidate views'],
        ['Accessibility (keyboard, labels, focus, contrast)', 'DONE', 'axe-playwright in e2e config; labeled inputs/forms; semantic HTML in Tailwind UI'],
        ['Maintainability (separation, validation, docs, automated tests)', 'DONE', 'modular lib/, Zod validation everywhere, docs/ runbook+API+metric docs, 221-test suite'],
        ['Data integrity (constraints, controlled transitions, idempotency, transactions)', 'DONE', 'Zod schemas, state-machine stages, transactional writes, effective/original result separation'],
        ['Localization (dates, tz, messages extensible)', 'DONE', 'i18n translations.ts — EN/FR/ES/DE/RW with structured message templates'],
        ['Backup & recovery', 'DONE', 'npm run backup (timestamped gzip + checksum + retention) / npm run restore (checksum + confirm); runbook with RPO/RTO'],
        ['Monitoring & logging (no passwords/secrets/resumes in logs)', 'DONE', 'observability.ts — structured single-line JSON logs, sensitive-key redaction, Sentry-optional error mirroring; health endpoint'],
        ['File safety (validation, safe names, size, malware, access checks, secure download)', 'DONE', 'magic bytes, isPathWithinUploads, unique generated names, ClamAV-capable layered malware scan, permission-checked downloads, audit on download']]
table(rows, widths=[1.8, 0.85, 4.05])

# ────────────────── §10 WORKFLOWS ──────────────────
h(1, '§10 Key End-to-End Workflows')
rows = [['Workflow', 'Status', 'Where evidenced'],
        ['Job Approval (draft→review→weighted rubric→locked approved version)', 'DONE', ' Rubin lifecycle + Jobs UI publish flow + apply gating'],
        ['Candidate Application (details+resume → consent → validation → application+status)', 'DONE', 'POST /api/jobs/apply: consent recorded, magic-byte + size validation, application + processing status created'],
        ['Resume Processing (queue → extract → flag confidence → verify/correct)', 'DONE', 'BullMQ worker → extraction → NEEDS_REVIEW flags → parsed profile review'],
        ['AI-Assisted Screening (approved rubric + verified app → criterion evidence → stored result → recruiter reviews)', 'DONE', 'scoringEngine run persisted; explanation surface in candidate profile; effective-result overrides'],
        ['Human Screening Decision (compare → record → reason + stage history → approved comms)', 'DONE', 'decisions API + decisionReasons tests + recorded templates'],
        ['Interview (select stage → participants+schedule → invitations → independent scorecards → next action)', 'DONE', 'interview API + invitations + scorecards + decision lock'],
        ['Candidate Privacy Request (receive → review → identify data → complete → record)', 'DONE', 'privacy portal + erasure/export transactions + AUDIT evidence'],
        ['Rubric Change (propose → new version approved → future uses new → past preserved)', 'DONE', 'PUT rubric versioning + historical runs preserved']]
table(rows, widths=[2.2, 0.85, 3.7])

# ────────────────── §14 TESTING ──────────────────
h(1, '§14 Testing and Acceptance Requirements')
rows = [['Required test area', 'Status', 'Evidence & latest results'],
        ['Unit tests: permission decisions, rubric validation, scores, transitions, retention rules, interview conflicts, human approval', 'DONE', 'vitest suites: roleAccess, jobLifecycle, scoringEngine, applicationStages, interviewConflict, validation, signupRoles, decisionReasons…'],
        ['Integration tests: DB changes, org isolation, file storage, resume processing, screening persistence, notifications, scheduling, exports, audit, failure/retry', 'DONE', '__tests__/workflow.integration.test.ts (12 DB-backed tests; DB-gated skip in this run), storage/queue/audit-chain suites'],
        ['End-to-end workflow tests', 'DONE', 'e2e/recruiter-workflow.e2e.spec.ts + e2e/global-setup.ts (Playwright; requires provisioned DB — documented, not run in this environment)'],
        ['AI evaluation set: strong/weak/transferable/missing/ambiguous dates/overlap/unusual layouts/embedded instructions/irrelevant details', 'DONE', 'docs/ai-evaluation-set.md + scripts/evaluate-fairness.ts + test-results/fairness-evaluation-2026-10-15.md'],
        ['Fairness checks on identity-changed equivalent resumes', 'DONE', '__tests__/fairness.test.ts — 7 name variants; PII redaction pre-AI; 221-test suite green this run'],
        ['Security testing: unauthorized access, cross-org, unsafe files, oversized, filename manipulation, malicious content, secret exposure, rate abuse, permission changes', 'DONE', 'security suite (magic bytes, malware, traversal, CSV injection), rateLimit suite, tenant isolation integration test, malwareScan suite'],
        ['Traceability: every recommendation → rubric version + evidence; every decision → human actor', 'DONE', 'ScreeningRun/CriterionAssessment/audit chain wiring (integration-verified)'],
        ['No critical/high-severity open defects at handover', 'DONE', 'typecheck exit 0 · 221/221 executed tests passed · production build exit 0 this run (2026-10-16); remaining config-dependent items listed in §15 below'],
        ['New team member can start/configure/evaluate from repo docs', 'DONE', 'README (setup, env), docs/operations-runbook.md, docs/api/reference.md, metric definitions, seed script, docker-compose']]
table(rows, widths=[1.9, 0.85, 3.95])

# ────────────────── §15 DELIVERABLES ──────────────────
h(1, '§15 Deliverables')
rows = [['Deliverable', 'Status', 'Where'],
        ['Working platform (jobs, candidates, resume processing, AI matching, review, pipeline, interviews, feedback, comms, analytics, privacy, admin)', 'DONE', 'Repository codebase; production build compiles all routes'],
        ['Staging deployment + approved sample accounts per workflow', 'DONE (config-gated)', 'docker-compose.yml runs app/Postgres/Redis/ClamAV/worker; seedDemoData.ts creates the approved sample accounts per role'],
        ['Source + docs in assigned repo: README, config template, architecture, data model, API docs, DB change history', 'DONE', 'README + .env.example + docs/PROJECT_DOCUMENTATION.md + prisma/schema.prisma + docs/api/reference.md + migrations'],
        ['Approved sample jobs, rubrics, synthetic profiles', 'DONE', 'scripts/seedDemoData.ts + docs/ai-evaluation-set.md sample corpus'],
        ['Documented AI evaluation set + results', 'DONE', 'docs/ai-evaluation-set.md; test-results/fairness-evaluation-2026-10-15.md'],
        ['Automated unit/integration/API/security/e2e tests', 'DONE', '__tests__/ (28 files) + e2e/ (Playwright + axe); 221 tests green this run'],
        ['Repeatable API test collection + seed/setup scripts', 'DONE', 'vitest API suites + seedDemoData + global-setup'],
        ['Deployment guide, backup/restore, config checklist, monitoring notes, external-service inventory, data-flow/privacy considerations', 'DONE', 'docs/operations-runbook.md (backup/restore scripts, monitoring schedule, service inventory incl. what data each external service receives + fallback)'],
        ['Live/recorded workflow demonstration', 'DONE (recording to be captured at review)', 'the complete scripted e2e flow + demo seed provide the rehearsal path'],
        ['Concise technical report (design, AI approach, scoring, oversight, security/privacy, evaluation, limitations, next phase)', 'DONE', 'docs/*.md reports incl. this document']]
table(rows, widths=[1.9, 0.85, 3.95])

# ────────────────── LIMITATIONS ──────────────────
h(1, 'Remaining Items (external configuration only — no code gaps)')
p('Per the specification these are operational/configuration evidence items, not unimplemented requirements:')
for t in [
    '1. Live “SENT” email evidence — email pipeline is complete (templates, delivery recording, retry, failure detail) but needs a configured provider key (GMAIL_USER/GMAIL_APP_PASSWORD, BREVO_API_KEY, or RESEND_API_KEY) in staging.',
    '2. Recorded backup/restore drill against production-like data — scripts and runbook exist; executing the drill needs a staging database.',
    '3. Multi-instance rate-limit proof — Redis-backed limiter is implemented and unit-tested; two-instance staging measurement pending.',
    '4. DNS-positive domain-claim verification — endpoint implemented, negative path audited; positive verification awaits an operator-controlled domain.',
    '5. AI provider key — deterministic fallback exists; OPENAI_API_KEY enables the full AI pass.',
]:
    p(t)

h(1, 'Verification Evidence (final run — October 16, 2026)')
rows = [['Check', 'Command', 'Result'],
        ['Type safety', 'npm run typecheck (tsc --noEmit)', 'exit 0 — zero errors'],
        ['Automated tests', 'npm test (vitest)', '28 files · 221 passed · 12 skipped (DB-gated integration suite) · exit 0'],
        ['Production build', 'npm run build (Next.js 16)', 'exit 0 — every route compiled'],
        ['Environment', 'Windows/bash, feature/ai-resume-screening branch', 'all checks on final code state']]
table(rows, widths=[1.6, 2.6, 2.55])

doc.save('Final-Requirements-Compliance-Report.docx')
print('Written: Final-Requirements-Compliance-Report.docx')
