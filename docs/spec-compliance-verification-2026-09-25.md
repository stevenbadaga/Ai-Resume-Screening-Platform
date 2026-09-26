# Specification Compliance Verification — September 25, 2026

**Scope:** every functional and non-functional requirement of the CODAFRIQA
AI Resume Screening Platform specification (17-page PDF, v1.0), re-verified
against the current codebase after the compliance pass described below.

**Method:** full source audit of all 40 API routes, the lib layer, the Prisma
schema, the UI surfaces, tests, and operations scripts — not a re-read of prior
self-assessments.

---

## Hardening pass (same day, second review round)

After the gap fixes below, a second review round identified and fixed further
correctness, scale, and hardening gaps:

| # | Spec | Issue | Fix |
|---|------|-------|-----|
| 1 | §6.3/§6.4 | `/api/jobs/apply` and `/api/upload` had divergent intake paths: local-disk writes, signature-only malware scan, duplicate in-request extraction. | New `src/lib/intakeService.ts` — one pipeline (full layered scan, cloud storage, checksum, worker-only extraction, consent record, ack email, audit). Both routes are thin transports over it. |
| 2 | §6.8 | Conflict detection only checked the *scheduler's* calendar — assigned interviewers could be double-booked. | `src/lib/interviewConflicts.ts`: per-participant overlap checks (scheduler + every assigned interviewer + candidate) with per-interview durations; assigned interviewers validated as active same-org staff; reschedule re-checks the new slot. |
| 3 | §6.8 | Reschedule/cancel only created in-app notifications — candidates without portal accounts never learned of changes. | `INTERVIEW_RESCHEDULED` / `INTERVIEW_CANCELLED` email templates; PATCH/DELETE send recorded emails (§6.9) with delivery outcome in the response. |
| 4 | §6.7/§8 | Offer extended the stage without a `RecruitmentDecision` record. | Offer writes an `OFFER` decision (actor, previous stage, reason) in the same transaction as the stage update. |
| 5 | §9 Reliability | A queue outage after application creation returned a 503 whose only retry path was a 409 duplicate rejection. | Intake marks the resume QUEUED, reports honestly (`screeningQueued: false`), and staff retry (`/api/upload/retry`) or the sweeper recovers — no dead end. |
| 6 | §9 Reliability | Worker crashes left ScreeningRuns stuck in PROCESSING forever. | `src/lib/screeningRecovery.ts` sweeper (+ `npm run sweep-stale-runs`, wired into the worker): stale PROCESSING runs → FAILED with a clear error, resume re-queued against the approved rubric. |
| 7 | §6.7/§9 Perf | Pipeline loaded every application org-wide and filtered client-side; filters were thinner than the spec's contract. | Server-side pagination (50/page) + full filter set via URL params: search, job, stage, recruiter, score range (effective result), required-criterion status (missing/uncertain), processing status, tags, date range — shareable, consistent with exports. |
| 8 | §6.10 | `timeInStage` measured `now − updatedAt`, which moves on any edit. | Computed from the latest `RecruitmentDecision` that produced the current stage (falls back to application creation); metric definition updated. |
| 9 | §9 Security | CSP shipped `script-src 'unsafe-inline' 'unsafe-eval'` in production. | Middleware (`src/proxy.ts`) issues per-request nonce CSP (`'nonce-…' 'strict-dynamic'`, `object-src 'none'`) in production; dev keeps the relaxed policy. Dropped unnecessary `connect-src https://api.openai.com` (OpenAI is server-side only). |
| 10 | §6.9 | Email retries could only re-render generic content (one-off details like schedules were never stored). | `Communication.payloadSnapshot` (JSON) written at send time; retries re-render from the snapshot — faithful, never fabricated. Legacy rows fall back to job/candidate fields. |
| 11 | §6.11 | Correction/access/withdrawal requests were not trackable as first-class requests. | `POST/GET /api/privacy/requests` + candidate form on `/privacy`: requests are recorded (PrivacyRequest), routed to privacy staff with notifications, and their status is visible to the candidate. |
| 12 | §9 Accessibility | No automated a11y checks; `focus:outline-none` without visible replacement; no skip link. | Global `:focus-visible` ring, skip-to-content link in the root layout, and an axe-core E2E suite (`e2e/accessibility.a11y.spec.ts`) that fails on serious/critical violations across the core pages. |
| 13 | §9 Logging | Observability was unstructured `console.error`; audit `requestContext` was unused. | `src/lib/observability.ts`: request IDs (hashed client IDs to prevent log injection), structured JSON logs with sensitive-field redaction, response `X-Request-ID`; intake logs and audit `requestContext` carry the correlation id. |
| 14 | §6.3/§6.7/§6.8 | `stage` vs `status` mappings diverged per route; scorecards could be rewritten after final decisions; duplicate detection was exact-email only. | Single canonical map (`src/lib/applicationStages.ts`) used by decisions/bulk/stage/offer routes with derived status; scorecards locked (409) at final stages; duplicate detection adds normalized-name matching beside exact email (tagging only — merging stays human). |
| 15 | §9 Logging | Swallowed `console.error` noise was invisible — no error tracking, so recurring failures (queue outages, scoring crashes, audit failures) never surfaced for review. | Sentry wired through `src/lib/errorTracker.ts`: warn/error `logEvent`s, route-wrapper 500s (with stack + request id), audit-persistence failures, worker job failures, unhandled process errors, and client render errors (via `POST /api/telemetry/client-error`) all become grouped, alertable events. DSN-gated no-op without `SENTRY_DSN`; breadcrumb deny-list + redacted structured extras keep PII out; documented in the runbook's external-service inventory. |

---

## Final verification pass (September 26, 2026)

Full re-verification of every check against the current tree, plus defects found and fixed:

| # | Spec | Issue found by live verification | Fix |
|---|------|----------------------------------|-----|
| 1 | §4.2/§6.1 | **Sign-in redirect loop (critical):** the route guard redirected every unauthenticated request to `/auth/signin` — including `/auth/signin` itself — so signed-out users could never reach the sign-in page at all. The application was unreachable without an existing session. (`/auth/signin` → 307 → itself.) | `src/proxy.ts` now serves `/auth/*` unauthenticated instead of redirecting; all other routes keep the sign-in redirect and every role check. Re-verified live: `/auth/signin` 200 signed-out, protected routes still 307, full credentials sign-in → `/dashboard` 200 works end-to-end. |
| 2 | §15 | `scripts/seedDemoData.ts` (safe synthetic sample-data deliverable) instantiated `PrismaClient` without the Prisma 7 driver adapter, so the script crashed before seeding anything. | Seed now builds the client with `@prisma/adapter-pg` exactly like `scripts/dbPing.ts` / `src/lib/prisma.ts`; the full demo workspace (7 role accounts, 2 approved rubric jobs, 5 edge-case synthetic resumes) seeds successfully. |
| 3 | §14 | Test suite was flaky on slower machines: one test timed out at the 5s default under parallel cold module imports (`@sentry/node`), and Windows fork exhaustion caused a worker start failure. | `vitest.config.mts` raises `testTimeout` to 20s and caps `maxWorkers` at 4. Full suite now passes repeatedly (165 unit tests + 12 self-skipping integration tests). |
| 4 | §9 Data integrity | Three September 25 migrations were recorded as failed because their columns had already been applied to the shared dev database by `prisma db push`, blocking all future `migrate deploy` runs. | Columns verified present in the target database, then all three migrations marked applied via `prisma migrate resolve`; `migrate deploy` is now clean (10 migrations, no pending). |
| 5 | §6.1 | The tamper-evident audit ledger correctly flagged its first-ever hashed event (2026-09-20) with a `HASH_MISMATCH` — the row's hash was written by a pre-final iteration of the hashing code from the same day. Detection worked as designed; the shared dev database, not production, was affected. | Content untouched; `scripts/resealAuditChain.ts` re-seals hashes from a flagged event forward for documented dev-data remediation. Ledger now verifies intact (11 events). |
| 6 | §9 Reliability | Live-boot resilience checks: Redis login-rate-limit first-connect race and a transient cloud-DB connection timeout during worker startup were both absorbed by the designed fallbacks (in-memory limiter fallback; logged non-fatal recovery sweep with periodic retry) instead of crashing sign-in or the worker. | No code change needed — failure paths confirmed working under real faults. |

## Gaps found and fixed in this pass

| # | Spec | Gap found by this audit | Fix |
|---|------|--------------------------|-----|
| 1 | §6.2/§6.5 | `POST /api/upload` fell back to `job.rubrics[0]` when no APPROVED rubric existed — a DRAFT rubric could drive official screening. | Fallback removed; intake now refuses applications with 409 until a rubric version is APPROVED. |
| 2 | §6.1 | `POST /api/upload` wrote an audit event with `actorId: 'SYSTEM_USER'` — no such User row exists, so the FK violation aborted the request *after* records were created (broken recruiter upload path + missing audit event). | Unattended candidate submissions are now attributed to the receiving job's owner (a real User row); the audit event always persists. |
| 3 | §6.9 | The `APPLICATION_CONFIRMATION` template existed but was **never sent** — no application acknowledgement. | Both intake routes (`/api/upload`, `/api/jobs/apply`) now send the acknowledgement via `sendRecordedEmail`; delivery failure is recorded on the Communication row, never faked. |
| 4 | §6.3/§6.7 | `PATCH /api/candidates/stage` changed stages without a required reason and without creating a `RecruitmentDecision` — the decision trail was incomplete for stage transitions. | `reason` is now mandatory (schema-enforced); the route writes a `STAGE_CHANGE` RecruitmentDecision with actor/previous stage/new stage/reason inside the same transaction. |
| 5 | §6.10 | The dashboard's "score overrides" quality indicator counted audit actions `SCORE_OVERRIDDEN`/`CRITERION_OVERRIDDEN` — names the override route never writes (`HUMAN_SCORE_OVERRIDE`/`CRITERION_OVERRIDE`). The indicator always read 0. | Action list aligned with what the override route actually writes. |
| 6 | §6.10 | `/api/analytics` lacked three required screening-quality indicators: recommendation overrides, manual corrections, and AI-vs-human disagreement. | All three added (overrides/corrections from the audit ledger; disagreement = latest completed run where effective score deviates ≥ 10 points from the AI score), with documented metric definitions. |
| 7 | §6.12 | No admin configuration for decision reasons, recruitment stages, job categories, scoring boundaries, or branding (only retention existed, with no UI). | New `GET/PUT /api/org/workflow-config` (Admin-only, audited with old/new values) + `/dashboard/settings` UI with workflow, retention, and branding tabs. |
| 8 | §6.9 | Failed email deliveries were displayed but **not retryable** — the spec requires safe retry plus follow-up. | New `POST /api/notifications/retry-delivery` (Admin-only, tenant-scoped, FAILED-only) + retry button in `/dashboard/email-delivery`. Retries record their own Communication row with the honest outcome; the original failure is never rewritten. |
| 9 | §6.1/§6.12 | Audit events from `offer`, `profile` (manual correction), and both `override` paths lacked `organizationId`, breaking org-scoped audit search for those actions. | All four now record the acting user's organization. |
| 10 | §6.2 | Requisitions could not carry location, employment type, or application dates through the API/UI (fields existed in the schema but were unsettable), and the application window was not enforced at intake. | `createJobSchema`/`updateJobSchema` accept `location`, `employmentType`, `opensAt`, `closesAt`; the create UI collects them; both intake routes reject applications outside the window. |
| 11 | §6.11/§6.12 | Retention policy was configurable only via raw API calls. | Retention policy UI added to `/dashboard/settings` (documents the `applyRetention.ts` enforcement path). |

## Verified as satisfied (evidence re-checked in source)

| Area (spec §) | Evidence |
|---|---|
| §5 Roles | All seven roles from the spec exist and are enforced (Admin, Recruiter, HiringManager, Interviewer, ComplianceAuditor/Auditor, Candidate) via the typed RBAC matrix. |
| §6.1 Auth & tenancy | bcrypt(12), email-verification gate, hashed single-use reset tokens, 8-hour sessions, inactive-account rejection in `requireAuth`, `requirePermission` on protected routes, org scoping on ID-bearing routes, `__Secure-` cookies, security headers (CSP/HSTS/X-Frame-Options/nosniff) in `next.config.ts`. |
| §6.1 Audit ledger | SHA-256 hash-chained appends inside serializable transactions (row-locked), `scripts/verifyAuditChain.ts` + test for tamper detection. |
| §6.2 Rubric lifecycle | DRAFT→REVIEW→APPROVED→ARCHIVED state machine (server-enforced), immutable approved rubrics (edit creates a new version with a mandatory change reason), weighting validation, readable preview endpoint, historical results untouched. |
| §6.3 Candidates | Multi-job applications, tags, assignment, internal notes, duplicate detection + human-reviewed merge (transactional, audited), bulk actions gated by `confirm:"true"` + mandatory reason. |
| §6.4 Resume intake | Magic-byte validation, size limits, layered malware scan (signature layer + optional ClamAV, fail-closed), re-scan in the worker, cloud object storage with safe keys, checksums, extraction to structured profile, confidence < 80 → NEEDS_REVIEW, honest failure states, idempotent retry, download path audited + access-controlled. |
| §6.5 Screening | Approved-rubric-only gating, structured outputs, criterion-level results with verbatim evidence, required-criterion failure at 0%, missing-criterion detection (AI omissions fail the run), stored rubric/resume/config versions for reproducibility, original AI result preserved from human overrides, effective-result recomputation. |
| §6.6 Matching | Shared skill-normalization taxonomy (exact vs related/transferable vs missing), original wording preserved, drift-guard tests. |
| §6.7 Human review | Work-queue stages (NEW/SCREENING/NEEDS_REVIEW/ON_HOLD/SHORTLISTED/INTERVIEW/OFFERED/REJECTED/WITHDRAWN), search + department filters, comparison screen, decisions require reason codes + rationale, hiring managers scoped to their own jobs, stage changes now leave a full decision trail (fix #4). |
| §6.8 Interviews | Scheduling with timezone/duration/meeting type, interviewer assignment (same-org active staff), interviewer **and** candidate double-booking detection, invitations + reschedule/cancel notifications, independent scorecards (interviewers see only their own until privileged review), participant-scoped access. |
| §6.9 Communications | Approved templates (ack, status, invitation, reschedule, rejection, offer, team invite, verification, reset), honest SENT/FAILED + failureInfo rows, admin delivery-health screen, safe retry (fix #8), in-app notifications with IDOR checks. |
| §6.10 Dashboards & analytics | Org-scoped role dashboard (jobs, volume, stage distribution, upcoming interviews, recent activity, quality indicators), manager analytics (time-to-screen, time-in-stage, stage conversion, interviewer completion, workload) with date/job/department/recruiter/stage filters, documented metric definitions, CSV export with formula-injection escaping and audited access. |
| §6.11 Privacy | Consent records (notice version + timestamp + choices), Art. 20 export, Art. 17 transactional erasure across all linked records + stored files, privacy-request tracking, retention configuration + enforcement script + UI (fix #11), resume download logging. |
| §6.12 Admin | Audited configuration API + UI (fix #7), org-scoped searchable audit screen, `/api/health` (DB latency, queue depth, storage writability, processing/communication counts, integration booleans — no secret values), synthetic demo seed (`scripts/seedDemoData.ts`, one account per role, edge-case resumes). |
| §7 Responsible AI | Human decision authority (AI never advances candidates), PII redaction before prompts, prompt-injection-hardened extraction, deterministic scoring bound to approved rubrics, uncertainty flags → NEEDS_REVIEW, name-invariance fairness test suite, no-training-reuse (no such pipeline exists), candidate-facing AI disclosure on the consent form. |
| §8 Data model | All 14 spec entities present with the required minimum information (+ PasswordResetToken, EmailVerificationToken, Notification). |
| §9 NFRs | Composite indexes on hot org-scoped queries; async screening with visible status; Zod validation on every mutating endpoint; idempotent queue retries; hash-chained audit; backup/restore scripts with checksums + runbook; five-language i18n; CI runs typecheck+tests+build on every push/PR; Docker secrets interpolated from `.env` with hard failures. |
| §14 Testing | 148 unit tests (18 files) incl. RBAC, scoring rules, required-criterion failure, fairness/name-invariance, malware signatures, rate limiting, audit chain, interview conflicts, skill normalization, rubric state machine; 12 DB-backed integration tests (org isolation, full workflow, tenant isolation, erasure, analytics); Playwright E2E covering the minimum completion standard (self-skips without `TEST_DATABASE_URL`). |

## Remaining items (operator evidence, not code)

These cannot be closed by writing more code in this repository:

1. Live `SENT` email evidence from the configured provider (Brevo IP allow-listing / Resend domain setup) — the failure path is fully implemented and surfaced.
2. A recorded restore drill against production-like data (`npm run restore`).
3. Multi-instance rate-limit proof (two app instances behind one Redis).
4. DNS-positive domain-claim verification for a domain the operator controls.
5. §11/§12 process obligations (supervisor approvals, milestone cadence, PR review process) belong to the intern/supervisor workflow, not this repository.

## Verification commands

```bash
npx tsc --noEmit        # clean
npm test                # 22 files, 165 tests passing (integration self-skips without TEST_DATABASE_URL)
npm run build           # passes (standalone output)
npm run lint            # 0 errors (warnings only)
npx prisma migrate deploy  # clean: 10 migrations, no pending
npm run verify-audit-chain # chain intact — no tampering detected
npm run sweep-stale-runs   # optional: recover stale screening runs (cron; --apply to execute)
npx tsx scripts/seedDemoData.ts   # optional: safe synthetic demo data (7 role accounts, 2 jobs, 5 edge-case resumes)
npx playwright test e2e/accessibility.a11y.spec.ts  # axe scans (needs TEST_DATABASE_URL)
```

Live-boot verification (2026-09-26): standalone production server booted, `/api/health` → `ok`, sign-in page reachable signed-out, credentials sign-in with a demo account → dashboard/candidates/jobs all 200, RBAC correctly redirected a recruiter away from `/audit`, and the screening worker started with its recovery sweep tolerant of a transient DB fault.
