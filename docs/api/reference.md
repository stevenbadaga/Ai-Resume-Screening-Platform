# RecruitAI API Reference

**AI Resume Screening Platform** — CODAFRIQA Intern Project Specification, Version 1.0

This document is the standing API reference for the platform (spec §15 deliverable). It is
maintained alongside the route handlers; when a route changes, update this doc.

## Conventions

- All mutating endpoints accept and return JSON unless noted (multipart for upload/apply).
- Every authenticated endpoint enforces the RBAC matrix in `src/lib/roleAccess.ts` via
  `requirePermission()` from `src/lib/auth.ts`. Role names are never trusted from the client.
- Errors return `{ error: "..." }` with an appropriate HTTP status. Internal details are never
  leaked (see `safeErrorResponse` in `src/lib/validation.ts`).
- Rate limiting applies to sign-in, signup, upload, apply, and the support chatbot
  (`src/lib/rateLimit.ts`).
- Background work (resume processing, screening) is asynchronous via BullMQ/Redis. Submitting
  an application or requesting a screening rerun returns immediately; status is polled via the
  resource's `processingStatus` / screening-run history.

## Authentication

- Credentials: NextAuth v4 credentials provider with bcrypt (12 rounds) password hashing.
- Sessions: JWT, 8-hour expiry, hourly refresh, `__Secure-` cookies in production.
- Two-step sign-in (2FA): step 1 verifies email + password and issues a 6-digit code (10-minute
  TTL, 5 max attempts, constant-time compare, SHA-256 hashed at rest); step 2 exchanges the code
  for the session. Codes that have been solved are stamped with `usedAt`/`verifiedAt` and satisfy
  the proof-of-solve check for their TTL.
- Email verification gate: new accounts cannot sign in until the emailed single-use 24-hour
  hashed verification link/code is consumed. Disposable inbox domains are rejected at signup.
  Existing accounts created before this control are grandfathered.
- Password reset: hashed single-use 30-minute token, anti-enumeration request endpoint, atomic
  consumption, audit-logged completion.

## Roles

| Role | Identifier in matrix | Primary scope |
|---|---|---|
| System Administrator | `Admin` | Org/users/roles/security/retention/config/audit; recruitment decisions only when separately authorized |
| Recruitment Manager / HR Administrator | `Recruiter` | Teams, workflows, templates, analytics, authorize sensitive operational actions |
| Recruiter | `Recruiter` | Jobs (where permitted), resumes, AI assessments, search/compare, decisions, communications, interviews |
| Hiring Manager | `HiringManager` | Review approved candidates for assigned jobs, comment, shortlist, approve/reject progression within assigned vacancies |
| Interviewer | `Interviewer` | Assigned interview info only, structured scorecards, comments, recommendations |
| Compliance Auditor | `ComplianceAuditor` | Read-only approved reports, decisions, evidence, config history, audit records |
| Candidate | `Candidate` | Browse open jobs, apply, track own applications, self-service privacy |

Department restrictions (`User.departmentRestrictions`) further limit staff to permitted
departments on job listing, exports, and stage changes.

## Base URL

Local development: `http://localhost:3000`

## Endpoints

### Authentication

#### `POST /api/auth/signup`

- **Role scope:** Public
- **Purpose:** Candidate and staff self-registration.
- **Request body:** `{ email, password, name?, role? }` — the client-supplied `role` is always
  ignored server-side; staff signup for an unclaimed email domain founds a workspace and becomes
  its Admin (founder bootstrap); staff whose email domain matches a verified workspace auto-join as
  Recruiters.
- **Behavior:** bcrypt password hashing, disposable-domain rejection, email-verification gate
  triggered (account cannot sign in until verified), anti-enumeration resend. If the email domain
  has no verified workspace, the first staff signup becomes that workspace's Admin.
- **Response:** `{ success: true, message: "..." }` (signup flow details forwarded to the page).

#### `POST /api/auth/forgot-password`

- **Role scope:** Public
- **Purpose:** Anti-enumeration password-reset request.
- **Request body:** `{ email }`
- **Behavior:** issues a single-use 30-minute hashed reset token; the endpoint never reveals
  whether an account exists.
- **Response:** `{ success: true, message: "..." }`

#### `POST /api/auth/reset-password`

- **Role scope:** Public
- **Purpose:** Consume a reset token and set a new password.
- **Request body:** `{ token, password }`
- **Behavior:** atomic token consumption; token invalidated after use.
- **Response:** `{ success: true, message: "..." }`

#### `GET /api/auth/verify-email`

- **Role scope:** Public
- **Purpose:** Consume an email-verification token (atomic, single-use).
- **Query:** `?token=...`
- **Behavior:** activates sign-in for the account.
- **Response:** redirects / success page.

#### `POST /api/auth/resend-verification`

- **Role scope:** Public
- **Purpose:** anti-enumeration re-send of the verification link/code.
- **Request body:** `{ email }`
- **Response:** `{ success: true, message: "..." }`

### Organization and administration

#### `POST /api/org/domain-claim`

- **Role scope:** Admin
- **Purpose:** start (or return) the DNS TXT domain-ownership challenge for the workspace identity.
- **Behavior:** workspace identity = verified email domain (unique platform-wide); the challenge is
  a TXT record `recruitai-verify=<token>` at `_recruitai-challenge.<domain>`; tokens are only ever
  logged as truncated SHA-256 references.
- **Response:** `{ challenge: "..." }`

#### `POST /api/org/domain-claim/verify`

- **Role scope:** Admin
- **Purpose:** re-check DNS and mark the domain verified.
- **Behavior:** honors DNS TTL honestly; re-runnable.
- **Response:** `{ verified: boolean, message: "..." }`

#### `PUT /api/org/retention`

- **Role scope:** Admin (audited with old/new values)
- **Purpose:** configure per-status retention periods on the organization.
- **Request body:** `{ retentionPolicy: {...} }` (JSON)
- **Behavior:** stored on `Organization.retentionPolicy`; enforced by
  `scripts/applyRetention.ts` (dry-run by default, `--apply` to execute).
- **Response:** `{ success: true, retentionPolicy: {...} }`

### Jobs

#### `GET /api/jobs`

- **Role scope:** Authenticated (Candidate sees OPEN requisitions cross-tenant; staff see their org)
- **Query:** `?department=&search=`
- **Response:** `{ jobs: JobRequisition[], count, myApplications?, hasSavedResume? }`
- **Notes:** staff are filtered to permitted departments if restricted; candidates get their
  application standing per position (stage, status, latest score, appliedAt).

#### `POST /api/jobs`

- **Role scope:** Admin, Recruiter, HiringManager (`ManageJobs`)
- **Request body:** `{ title, department?, description?, location?, employmentType?, opensAt?, closesAt?, criteria: [{ category?, description/name?, isRequired?, weight?, threshold?, evidenceRules? }] }`
- **Behavior:** creates the requisition (status `DRAFT`) and a DRAFT rubric with the given criteria
  in one transaction; vacancy opens to applicants only after the rubric is approved and the job is
  published.
- **Response:** `{ success: true, job: JobRequisition }` (201)

#### `GET /api/jobs/[id]`

- **Role scope:** Authenticated (org-scoped for staff; candidates see OPEN)
- **Response:** job with current rubric + criteria + application count.

#### `PUT /api/jobs/[id]`

- **Role scope:** Admin, Recruiter, HiringManager (org-owned jobs)
- **Purpose:** edit job details.
- **Behavior:** org ownership enforced.
- **Response:** `{ success: true, job }`

#### `POST /api/jobs/[id]/duplicate`

- **Role scope:** Admin, Recruiter (org-owned jobs)
- **Purpose:** detect potential duplicate candidates for a job.
- **Response:** `{ duplicates: Candidate[] }`

#### `GET /api/jobs/[id]/rubric/preview`

- **Role scope:** Authenticated
- **Purpose:** readable pre-screen rubric preview (spec §6.2).
- **Response:** rubric with criteria, weights, required flags, thresholds, evidence rules, and the
  deterministic weight distribution / scoring formula.

#### `PUT /api/jobs/[id]/rubric`

- **Role scope:** Admin, Recruiter, HiringManager (org-owned jobs)
- **Purpose:** edit the rubric.
- **Behavior (spec §6.2 versioning):** editing a DRAFT/REVIEW rubric replaces criteria in place
  (audited with old/new values); editing an APPROVED rubric requires a change reason and creates a
  NEW DRAFT version (version + 1) — the approved version keeps scoring until the replacement is
  approved, and historical screening results are never re-parented. Approving a rubric with zero
  criteria is refused.
- **Request body:** `{ criteria: [...], status?, changeReason? }`
- **Response:** `{ success: true, rubric }`

#### `GET /api/jobs/[id]/talent-pool`

- **Role scope:** Admin, Recruiter (org-owned jobs, department restrictions apply)
- **Purpose:** candidate pool for a job.
- **Behavior:** reports real data only — `null` score when not screened, empty skills rather than
  invented ones; respects department restrictions.
- **Response:** `{ candidates: ... }`

#### `POST /api/jobs/apply`

- **Role scope:** Public / Candidate (multipart)
- **Purpose:** application intake with resume upload (PDF/DOCX/TXT, ≤ 5 MB).
- **Form fields:** `jobId`, `firstName?`, `lastName?`, `email?`, `consentGiven?`, `resume` (file),
  `useProfileResume?` (one-click apply from saved CV).
- **Behavior:** rate-limited; magic-byte validation; layered malware scan (signature layer always +
  optional ClamAV daemon when `CLAMAV_HOST` is set, fail-closed when unreachable); consent recorded
  (`consentNoticeVersion`, `consentGivenAt`, `consentChoices`); document stored in cloud bucket
  (Supabase) or legacy local row; processing queued via BullMQ; application starts at `NEW`;
  requires an OPEN requisition with an APPROVED rubric; acknowledgement email sent (recorded
  SENT/FAILED).
- **Response:** `{ success: true, applicationId, screeningQueued, acknowledgementDelivered, message }`
  (201); 503 with `Retry-After` when storage is unavailable.

### Candidate pipeline

#### `GET /api/candidates`

- **Role scope:** Admin, Recruiter, HiringManager (org-scoped, filtered by permitted stages/departments)
- **Query:** stage, department, search, score range, recruiter, source, tags, processing status.
- **Response:** paginated candidate+application list.

#### `GET /api/candidates/[id]`

- **Role scope:** Admin, Recruiter, HiringManager, Interviewer (assigned interviews only), ComplianceAuditor
- **Behavior:** Interviewers can only view applications they are assigned to (checked via
  `InterviewParticipant`); returns application, candidate, job, resume, parsed profile, screening
  runs with criterion assessments + evidence, decisions, interviews, communications.
- **Response:** `{ application: ... }`

#### `PATCH /api/candidates/[id]/profile`

- **Role scope:** Admin, Recruiter (org-owned application)
- **Purpose:** update candidate/application notes, tags, assignment.
- **Behavior:** org-scoped; manual corrections on parsed profile are auditable.
- **Response:** `{ success: true }`

#### `POST /api/candidates/[id]/stage`

- **Role scope:** Admin, Recruiter (`UpdateApplicationStage`)
- **Request body:** `{ stage, reason? }`
- **Behavior:** atomic stage + status transition; actual previous stage recorded; department
  restrictions enforced; audit-logged.
- **Response:** `{ success: true, application }`

#### `POST /api/candidates/merge`

- **Role scope:** Admin, Recruiter (org-scoped via applications' job organization, requires `confirm: true`, transactional, audited)
- **Request body:** `{ candidateIds: string[], confirm: true, reason? }`
- **Behavior:** merges duplicate candidates within the same organization; previous IDOR (cross-org
  merge by email alone) is closed.
- **Response:** `{ success: true, mergedCandidateId }`

#### `POST /api/candidates/bulk-action`

- **Role scope:** Admin, Recruiter
- **Request body:** `{ applicationIds, action, reason, confirm: "true" }`
- **Behavior:** requires explicit `confirm` plus reason; audited as one transaction.
- **Response:** `{ success: true }`

#### `POST /api/candidates/[id]/message`

- **Role scope:** Admin, Recruiter (org-owned application)
- **Purpose:** compose → preview/edit → send a candidate communication (spec §6.9).
- **Request body:** `{ template, subject?, body, ...templateData }`
- **Behavior:** confidentiality guards reject internal-note leakage, "AI made the decision" claims,
  and prompt/model internals; delivery recorded SENT/FAILED on the `Communication` row; retry is
  faithful from the payload snapshot.
- **Response:** `{ success: true, communication, delivered }`

### Screening and decisions

#### `POST /api/candidates/[id]/screening`

- **Role scope:** Admin, Recruiter, HiringManager (`RunScreening`)
- **Purpose:** queue a screen-only re-run against the current APPROVED rubric (spec §6.5).
- **Behavior:** resume must be `COMPLETED`; requires an APPROVED rubric; refuses to queue a duplicate
  while one is PROCESSING (idempotency, §9); earlier screening runs are never touched; audit-logged.
- **Response:** `{ success: true, queued: true, rubricId, rubricVersion, previousRunId }`

#### `POST /api/decisions`

- **Role scope:** Admin, Recruiter, HiringManager (`MakeHiringDecisions`)
- **Request body:** `{ applicationId, decision, reasonCode?, rationale }`
- **Behavior:** decision types: `SHORTLIST`, `ADVANCE`, `HOLD`, `REJECT`, `WITHDRAW`, `REVIEW`;
  reason must come from the org's configured catalog (or be a valid free-text rationale); neither
  reason code nor rationale may cite protected/sensitive characteristics; actual previous stage
  recorded; stage + status updated atomically; rejection triggers a recorded rejection email;
  in-app notification if candidate has a portal account; audit-logged with reason, actor, previous
  stage, new stage.
- **Response:** `{ success: true, stage, status, decision, emailDelivered? }`

#### `POST /api/decisions/override`

- **Role scope:** Admin, Recruiter, HiringManager (`OverrideScores`)
- **Purpose:** non-destructive score recalibration (spec §6.5).
- **Request body:** either `{ applicationId, newScore, reason? }` (direct score override) or
  `{ assessmentId, newResult, rationale }` (criterion-level override).
- **Behavior:** original AI result preserved on `result`; human-corrected value stored in
  `effectiveResult`; criterion overrides recompute the run's overall `effectiveResult` so ranking/
  exports reflect them; audit-logged.
- **Response:** `{ success: true, message? }` or `{ success: true, assessment }`

#### `GET /api/decisions/reasons`

- **Role scope:** Admin, Recruiter, HiringManager
- **Purpose:** load the org's configured decision-reason catalog (spec §6.7).
- **Response:** `{ reasons: ... }`

### Interviews

#### `GET /api/candidates/[id]/interview`

- **Role scope:** Admin, Recruiter, HiringManager, Interviewer (assigned interviews only)
- **Behavior:** Interviewers can only view interview info for interviews they are assigned to.
- **Response:** `{ application: Application & { interviews: Interview[] } }`

#### `POST /api/candidates/[id]/interview`

- **Role scope:** Admin, Recruiter, HiringManager (`ScheduleInterviews`)
- **Request body:** `{ scheduledAt, durationMinutes, timezone?, meetingType?, meetingLink?, location?, interviewerIds? }`
- **Behavior:** schedule + participant assignment (interviewers validated as active same-org staff);
  conflict detection across all participants + candidate (duration-aware, per-user); candidate +
  interviewer notifications; candidate invitation email (recorded SENT/FAILED); application stage set
  to `INTERVIEW_SCHEDULED`; audit-logged.
- **Response:** `{ success: true, interview, invitationDelivered, invitationError? }`

#### `PATCH /api/candidates/[id]/interview`

- **Role scope:** Admin, Recruiter, HiringManager (`ScheduleInterviews`)
- **Request body:** `{ interviewId, scheduledAt, durationMinutes, timezone? }`
- **Behavior:** reschedule with fresh conflict check; candidate + interviewer rescheduling updates
  (email + notification); audit-logged with previous/new schedule.
- **Response:** `{ success: true, interview, rescheduleDelivered }`

#### `DELETE /api/candidates/[id]/interview`

- **Role scope:** Admin, Recruiter, HiringManager (`ScheduleInterviews`)
- **Query:** `?interviewId=...`
- **Behavior:** cancel interview; candidate + interviewer cancellation updates (email + notification);
  audit-logged with previous status/schedule.
- **Response:** `{ success: true, cancellationDelivered }`

#### `POST /api/candidates/[id]/scorecard`

- **Role scope:** Interviewer, Recruiter, Admin (`SubmitScorecards`)
- **Request body:** `{ techRating, commRating, problemRating, recommendation, comments? }`
- **Behavior:** interviewers may only complete scorecards for interviews they are assigned to; final
  stages (OFFERED/HIRED/REJECTED/WITHDRAWN) lock scorecards (409); each interviewer's feedback is
  independent — one interviewer cannot see another's submitted feedback before independent submission
  when that control is enabled; audit-logged.
- **Response:** `{ success: true, participant, message }` (201)

#### `POST /api/candidates/[id]/generate-questions`

- **Role scope:** Interviewer, Recruiter, Admin
- **Purpose:** synthesize behavioral interview questions from candidate criteria gaps (spec §6.8).
- **Request body:** `{ focus? }`
- **Response:** `{ questions: string[] }`

### Communications and notifications

#### `GET /api/notifications`

- **Role scope:** Authenticated (user-scoped ownership check)
- **Response:** `{ notifications: Notification[], unreadCount }`

#### `POST /api/notifications/read`

- **Role scope:** Authenticated
- **Request body:** `{ notificationId }` (note: uses `notificationId`, not `id`)
- **Response:** `{ success: true }`

### Export and privacy

#### `GET /api/export`

- **Role scope:** Admin, Recruiter, ComplianceAuditor (org-scoped, department restrictions apply)
- **Query:** `?department=&search=&status=`
- **Purpose:** recruitment pipeline CSV export with formula-injection escaping (`=`, `+`, `-`, `@`
  neutralized per cell).
- **Response:** CSV file (`Content-Type: text/csv`, `Content-Disposition` attachment).
- **Audit:** `DATA_EXPORT` recorded.

#### `GET /api/privacy/export`

- **Role scope:** Candidate (self-service, authenticated as the candidate)
- **Purpose:** GDPR Article 20 data portability export.
- **Response:** JSON attachment with account, candidate profile, applications, assessments,
  scorecards, interviews, notifications; `GDPR_DATA_EXPORT_DOWNLOADED` audit event recorded.

#### `POST /api/privacy/erasure`

- **Role scope:** Candidate (self-service) or Admin
- **Purpose:** GDPR Article 17 transactional erasure.
- **Behavior:** deletes stored resume objects (cloud bucket or legacy local, path-traversal guarded);
  deletes linked records in FK-safe order (criterionAssessments → decisions → screeningRuns →
  parsedProfiles → resumeDocuments → interviewParticipants → interviews → communications →
  applications); anonymizes candidate PII (`ANON-<uuid>@deleted.local`); deactivates the user account
  and clears notifications; records a `PrivacyRequest` + audit event.
- **Response:** `{ success: true, message: "..." }`

### Health and operations

#### `GET /api/health`

- **Role scope:** Unauthenticated (liveness) or Admin/ComplianceAuditor (detail)
- **Response (unauthenticated):** `{ status: "ok", timestamp }`
- **Response (authenticated detail):** `{ status, timestamp, checks: { database: { reachable, latencyMs }, queue: { reachable, waiting, active, failed, completed }, storage: { writable, backend, configured, bucket?, path? }, processing: { available, resumesByStatus }, communications: { available, failed, sent, pending }, integrations: { openaiConfigured, emailProviderConfigured, redisConfigured, malwareScanner } } }`
- **Notes:** integration status is reported as configured/not — never with secret values.

### Support copilot

#### `POST /api/support`

- **Role scope:** Authenticated
- **Purpose:** in-app AI assistant grounded on product knowledge with domain guardrails.
- **Request body:** `{ message }`
- **Behavior:** answers questions about the RecruitAI platform; renders the live skill taxonomy from
  the same shared table the screening engine uses (drift-guarded).
- **Response:** `{ answer, sources? }`

## Error conventions

| Status | Meaning |
|---|---|
| 400 | Validation error (Zod) or bad request |
| 401 | Not authenticated / session invalid or inactive |
| 403 | Authenticated but lacking the required permission / not assigned |
| 404 | Resource not found or not visible to the caller (org-scoped) |
| 409 | Conflict (e.g. duplicate screening run in flight, scorecards locked, reschedule of cancelled interview) |
| 429 | Rate limited (`Retry-After` header) |
| 503 | Service unavailable (e.g. storage backend down) with `Retry-After` where appropriate |

## Data model (reference)

The canonical data model is `prisma/schema.prisma`. Key entities:

- `Organization` — tenant boundary, verified email domain, retention/branding/security/workflow config.
- `User` / `Role` — staff identity, access status, department restrictions, roles+permissions.
- `JobRequisition` — vacancy, owner, status (DRAFT/OPEN/CLOSED/ARCHIVED), department, location, dates.
- `Rubric` / `Criterion` — approved screening criteria: category, required/preferred, weight, threshold,
  evidence rules, status (DRAFT/REVIEW/APPROVED/ARCHIVED), version, change reason.
- `Candidate` — identity, contact, consent (version/timestamp/choices), source, tags, self-declared
  skills/experience, saved CV reference.
- `Application` — candidate-to-job relationship: stage, status, assigned recruiter, notes, tags,
  decision history, linked resume/profile/screening/decisions/interviews/communications.
- `ResumeDocument` — original file reference, processing status, extracted text, version, checksum,
  safe metadata, access history.
- `ParsedProfile` — structured skills/employment/education/certifications/languages/projects, manual
  corrections linked to source evidence.
- `ScreeningRun` — rubric version, resume version, AI version, configuration snapshot, status,
  totalResult, effectiveResult, error information.
- `CriterionAssessment` — criterion result, effective result (human correction), supporting evidence,
  source location, interpretation, uncertainty, score contribution, reviewer correction.
- `RecruitmentDecision` — human action, decision type, reason, actor, previous stage, new stage.
- `Interview` / `InterviewParticipant` — schedule, timezone, status, meeting details, structured
  feedback, comments, recommendation.
- `Communication` — template, sender, recipient, content version, delivery state (PENDING/SENT/FAILED),
  failure info, payload snapshot.
- `PrivacyRequest` — notice version, consent record, candidate request, decision, completion evidence,
  anonymization action.
- `AuditEvent` — actor, action, affected record, previous/new values, timestamp, organization, request
  context, tamper-evident hash chain (`previousHash`, `hash`).
- `PasswordResetToken` / `EmailVerificationToken` / `VerificationCode` — single-use, hashed, time-limited.

## Rates and limits

- Upload/apply: rate-limited (fixed window via Redis, in-memory fail-open fallback).
- Sign-in/signup: rate-limited.
- Support chatbot: rate-limited.
- Resume size: ≤ 5 MB.
- Supported formats: PDF, DOCX, TXT (magic-byte validated).

## Supported resume formats and processing

- PDF (`%PDF-` magic byte), DOCX (`PK\x03\x04`), TXT/MD.
- Extraction: mammoth (DOCX), pdf-parse (PDF), raw text (TXT/MD).
- PII is redacted **before** any AI call (emails, phones, names, institutions, addresses, graduation
  years, cities, pronouns). The redacted text is what reaches OpenAI; the original extracted text is
  stored for recruiter verification.
- Confidence < 80 ⇒ `NEEDS_REVIEW` with manual-correction path.
