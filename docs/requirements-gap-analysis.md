# AI Resume Screening Platform
## Requirements-to-System Gap Analysis

**Specification reviewed:** Codafriqa AI Resume Screening Platform - Intern Project Specification, Version 1.0
**Repository reviewed:** `stevenbadaga/Ai-Resume-Screening-Platform`
**Review date:** 2026-08-26
**Assessment basis:** Supplied PDF text and images, repository source, Prisma schema, tests, package scripts, and README. This is a code-and-documentation assessment, not a production penetration test or user acceptance test.

## Executive Summary

The repository contains a substantial Next.js/Prisma MVP with authentication, role concepts, job and candidate screens, resume upload, AI-related scoring code, pipeline actions, audit screens, privacy UI, and supporting tests. It does not yet meet the specification's minimum completion standard for a secure, deployable recruitment platform.

The system currently demonstrates many UI surfaces and data structures, but several critical workflows are incomplete or only simulated. The most consequential risks are cross-organization data exposure, incomplete authorization on ID-based operations, a processing worker that does not complete AI screening, incomplete privacy deletion/export, and missing integration/end-to-end coverage. The README also claims capabilities that the implementation does not consistently provide.

### Overall status

| Assessment | Meaning | Result |
|---|---|---|
| Implemented | The requirement is materially present and supported by the current code | Some foundational controls and UI surfaces |
| Partial | A model, UI, or route exists, but important behavior, authorization, persistence, or testing is incomplete | Most functional areas |
| Missing / not evidenced | No reliable implementation was found in the reviewed repository | Several required workflows |
| High risk | The gap could expose personal data, permit unauthorized action, or invalidate recruitment results | Tenant isolation, privacy, screening execution |

**Overall conclusion: Partial implementation; not ready for specification acceptance or production handover.**

### Implementation update: 2026-08-26

The following gaps were addressed after the initial review:

- Inactive accounts are rejected during sign-in and protected requests.
- Authenticated requests now expose database-backed organization context.
- Major jobs, exports, candidate mutations, decisions, overrides, team actions, offers, interview questions, and retry operations now enforce organization ownership.
- The unsafe fallback to the first candidate's applications was removed.
- Human-effective screening scores and criterion results are stored separately from original AI values and used by exports/talent-pool calculations.
- Privacy processing now removes linked application, resume, profile, screening, assessment, interview, decision, and communication records before anonymizing the candidate and matching account.
- Resume retries are idempotent, invoke scoring after successful processing, and persist explicit processing/scoring failures.
- Interview scheduling now has an authenticated API with tenant checks and persisted interview/participant records.
- Notification client payloads and read-state names now match the API contract.
- Signup email normalization and syntax validation have regression tests.

These changes improve the status of the affected areas from the initial assessment, but do not by themselves satisfy the full staging, security, privacy, interview, delivery, and end-to-end acceptance requirements below.

## Requirement Matrix

### 1. Authentication, organization, and access control

**Specification requires:** secure credential handling, session/logout/expiry and password controls, role-based authorization on every protected operation, account activation/suspension, organization separation, administrative user management, and auditability.

**System has:**

- NextAuth credentials authentication and bcrypt password hashing in `src/app/api/auth/[...nextauth]/route.ts`.
- JWT/session role information and reusable authentication helpers in `src/lib/auth.ts`.
- Rate limiting for login and signup.
- `Organization`, `User`, `Role`, access status, department restrictions, and organization relations in `prisma/schema.prisma`.
- Team invite, role change, and deletion routes.

**Gaps and risks:**

- `accessStatus` is modeled but is not reliably checked during authentication; suspended users may still authenticate.
- Organization identity is not consistently included in the session or used in every query.
- Many pages and routes query by an ID or globally without verifying organization ownership. This creates a high-risk IDOR and cross-tenant exposure concern.
- `departmentRestrictions` is present in the schema but not consistently enforced.
- Team mutation routes need strict target-user organization checks.
- Password reset, account activation, and session-expiry workflows are not evidenced.

**Status: Partial, high risk.**

### 2. Job requisitions and screening rubrics

**Specification requires:** job lifecycle management, structured criteria, required/preferred distinctions, weights and thresholds, approval workflow, versioning, readable preview, and preservation of historical results.

**System has:**

- Job creation, listing, criteria creation, and job detail routes in `src/app/api/jobs/`.
- `JobRequisition`, `Rubric`, and `Criterion` models with status, version, weights, thresholds, and evidence fields.
- Jobs UI in `src/app/jobs/`.

**Gaps and risks:**

- A complete rubric draft/review/approval/archive API and locked approved-version workflow are not evidenced.
- Version history and change reason are modeled but not demonstrated as an enforced immutable workflow.
- Required criteria and thresholds are not consistently enforced in scoring.
- Job reads are not consistently organization-scoped.
- Location, employment type, application dates, responsibilities, and configurable decision reasons are incomplete or inconsistently represented.

**Status: Partial.**

### 3. Candidate and application management

**Specification requires:** candidate records, multiple applications, search/filter/tag/assignment/archive/export, history, duplicate review, internal/public notes, consent, controlled stage transitions, and audited bulk actions.

**System has:**

- Candidate and application models with stage/status, assignment, notes, tags, consent, and linked recruitment records.
- Candidate pipeline, comparison, duplicate detection, merge, profile, and application pages under `src/app/candidates/`.
- Stage, merge, profile, and application API routes.

**Gaps and risks:**

- Candidate and application pages perform global queries in several places instead of enforcing organization and permitted-job scope.
- `src/app/dashboard/my-applications/page.tsx` has a fallback to the first candidate when no session-email match is found, which can expose another person's application.
- Stage transition rules, required reasons, and previous-stage capture are inconsistent.
- Bulk-action safeguards and a complete archive/withdraw/correction workflow are not evidenced.
- Export authorization and privacy filtering require stronger verification.

**Status: Partial, high risk.**

### 4. Resume upload, validation, and processing

**Specification requires:** approved formats and size limits, safe storage, malware checking, extraction, structured profile linkage, confidence/manual correction, status and retry handling, and secure access.

**System has:**

- Upload routes in `src/app/api/upload/route.ts` and `src/app/api/jobs/apply/route.ts`.
- File size/type checks, magic-byte checks in parts of the upload flow, checksums, queueing, processing status, and local storage helpers.
- Resume, parsed-profile, and screening-run models.
- Retry route and processing code in `src/lib/resumeProcessor.ts`.

**Gaps and risks:**

- Upload routes are inconsistent in authentication, job validation, and format handling.
- One flow accepts DOCX while the processing implementation is primarily PDF-oriented; this needs an explicit supported-format contract and tests.
- Malware checking is simulated or filename-based rather than an approved scanning process.
- Local filesystem storage is not a durable production storage design and lacks a complete secure download/access path.
- Confidence and manual correction controls are not fully connected to processing outcomes.

**Status: Partial, high risk.**

### 5. AI-assisted matching, ranking, and explainability

**Specification requires:** approved-rubric-only screening, criterion-level results, evidence/source location, uncertainty, reproducibility, versioned history, reruns, no autonomous decisions, and human overrides that preserve the original assessment.

**System has:**

- Weighted scoring code in `src/lib/scoringEngine.ts`.
- Screening and assessment models containing AI version, result, evidence, uncertainty, source location, and reviewer correction fields.
- Prompt/document safety and redaction logic in `src/lib/resumeProcessor.ts` and `src/lib/blindScreening.ts`.
- Candidate evaluation UI and audit event calls.

**Gaps and risks:**

- The worker path does not clearly call the scoring engine after resume processing, so queued processing may not produce persisted screening runs.
- Failure handling does not consistently mark active screening runs as failed with actionable status.
- Approved rubric gating, threshold enforcement, required-criterion handling, and reproducibility configuration are not fully enforced.
- Score overrides are not consistently persisted as effective scores or recalculated totals; some paths only create an audit event.
- Criterion overrides store correction text but may not update effective result or ranking.
- Blind screening/redaction coverage is incomplete and the stronger utility is not clearly wired into every processing path.
- There is no complete low-confidence review gate, model quality monitoring, or controlled evaluation report.

**Status: Partial, high risk.**

### 6. Responsible AI and recruitment governance

**Specification requires:** human decision authority, job relevance, protected-attribute and proxy controls, uncertainty, consistency, fairness evaluation, candidate transparency, no hidden learning, prompt safety, and monitoring.

**System has:**

- README and UI language describing decision support and human review.
- Basic redaction and prompt-injection safeguards.
- Bias mitigation unit tests in `__tests__/biasMitigation.test.ts`.
- Human decision endpoints and audit concepts.

**Gaps and risks:**

- No complete fairness evaluation pipeline comparing equivalent resumes with irrelevant identity changes.
- Name, address, graduation-year, and other proxy handling is incomplete.
- No adverse-impact or score-distribution monitoring is evidenced.
- No documented candidate-facing explanation and correction channel covering AI assistance end to end.
- No explicit governance control proving candidate data cannot become training data.
- Human approval gates are not consistently enforced across offer, stage, and screening operations.

**Status: Partial.**

### 7. Human review, decisions, and recruiter workflow

**Specification requires:** work queues, filters, comparison, assignment, notes/tags, configurable stages, reasoned shortlist/reject/hold/advance/withdraw actions, and authorized human accountability.

**System has:**

- Kanban pipeline and candidate comparison screens.
- Decision routes in `src/app/api/decisions/`.
- Audit logging around decisions and stage changes.
- Role concepts for recruiter and hiring manager.

**Gaps and risks:**

- Decision ownership and organization checks are incomplete.
- Some decision records use `UNKNOWN` rather than the actual previous stage.
- Stage/status vocabulary is inconsistent across routes and UI.
- Final human review attribution and reason requirements need a single enforced service-level contract.
- Hiring-manager access to only assigned jobs is not consistently demonstrated.

**Status: Partial.**

### 8. Interview scheduling, participants, and scorecards

**Specification requires:** scheduling, timezone/details, participant assignment, conflict checks, invitations, rescheduling/cancellation, private independent scorecards, feedback, and progression decisions.

**System has:**

- `Interview` and `InterviewParticipant` models.
- Interview page and question-generation route.
- Some interview-related UI actions.

**Gaps and risks:**

- Complete create/update/cancel/reschedule scheduling APIs are not evidenced.
- Candidate/interview routes referenced by UI are missing or incomplete.
- Conflict detection is not evidenced.
- Scorecard submission is not reliably persisted and independent-feedback visibility controls are not evidenced.
- Interview invitations and delivery tracking are incomplete.

**Status: Partial to missing, high risk for completion standard.**

### 9. Communications and notifications

**Specification requires:** approved templates, editable permitted fields, sender/recipient/version/status records, safe retries, failure visibility, and no confidential information leakage.

**System has:**

- `Communication` and `Notification` models.
- Notification route and bell UI.
- Mock and transactional email service abstractions.
- Decision and offer flows that attempt communications.

**Gaps and risks:**

- Email delivery is mock-oriented and does not provide production delivery evidence.
- Notification contract mismatch: the UI sends an `id` while the API expects `notificationId`, so individual read updates can fail.
- Template approval/versioning and confidential-content filtering are not fully enforced.
- Delivery failure persistence, retry visibility, and idempotency need integration tests.
- "Real-time" notification claims in the README are not supported by a live event system.

**Status: Partial.**

### 10. Dashboards, analytics, and reports

**Specification requires:** role-based operational dashboards, pipeline and stage metrics, processing/interview quality indicators, filters, consistent exports, and documented metric definitions.

**System has:**

- Dashboard, pipeline, audit, comparison, and milestone screens.
- Export route in `src/app/api/export/route.ts`.
- Visual counts and funnel-style UI.

**Gaps and risks:**

- Dashboard and audit counts are not consistently organization-scoped.
- Dedicated, filterable analytics services for time-to-screen, time-in-stage, conversion, workload, interviewer completion, and processing quality are not evidenced.
- AI quality indicators, manual corrections, overrides, and disagreement metrics are incomplete.
- Export authorization, privacy minimization, and metric consistency need tests.
- Live ticker/realtime telemetry claims are not demonstrated.

**Status: Partial.**

### 11. Candidate privacy, consent, retention, and rights

**Specification requires:** understandable notice, consent/version/timestamp, configurable retention, withdrawal/correction/access/deletion requests, linked-data deletion/anonymization, controlled exports, and no unauthorized training reuse.

**System has:**

- Candidate consent field and privacy request model.
- Privacy page and `src/app/api/privacy/route.ts`.
- Export and erasure UI language.
- Path traversal checks and some anonymization/deletion logic.

**Gaps and risks:**

- Advertised self-service export and erasure endpoints are not consistently present as separate, complete service contracts.
- Deletion does not reliably remove or anonymize every linked resume, parsed profile, screening, assessment, message, application, export, and stored file.
- Candidate identity verification and request workflow are incomplete.
- Retention configuration and scheduled enforcement are not evidenced.
- Relative file references may not be handled safely by all deletion paths.

**Status: Partial, high risk.**

### 12. Administration, configuration, and audit

**Specification requires:** configurable workflow/rules/templates/retention/branding, auditable configuration changes, searchable tamper-evident audit history, operational health, and safe sample data.

**System has:**

- Admin/team pages and team mutation routes.
- Audit model, logger, and audit page.
- Organization branding/security/retention fields in the schema.
- Rate-limit, queue, storage, and email abstractions.

**Gaps and risks:**

- Audit queries are not consistently tenant-scoped and the audit logger may swallow persistence failures.
- The implementation does not establish cryptographic chaining or immutable storage, despite README claims of a tamper-proof/immutable trail.
- Configuration management UI and old/new value plus reason capture are incomplete.
- Operational health for queue, notifications, storage, and integrations is not a complete admin feature.
- Demo persona accounts and the legacy seed path were removed during this review; safe synthetic sample data still needs an approved, non-credentialed evaluation setup.

**Status: Partial.**

### 13. Testing, deployment, reliability, and documentation

**Specification requires:** unit, integration, API, security, fairness, file-safety, workflow, end-to-end, performance, backup/restore, deployment, monitoring, and complete operational documentation.

**System has:**

- Unit tests in `__tests__/scoringEngine.test.ts`, `__tests__/biasMitigation.test.ts`, and `__tests__/auditLogger.test.ts`.
- Dockerfile, Docker Compose, PostgreSQL, Redis/BullMQ, Prisma, and Next.js configuration.
- README setup and architecture notes.

**Gaps and risks:**

- No package `test` script is defined.
- No API integration, authorization/IDOR, tenant isolation, queue, upload security, privacy, scheduling, browser, or end-to-end suites are evidenced.
- Docker/compose setup has production-readiness concerns such as default secrets, missing durable upload volume, and stale seed/setup references.
- In-memory rate limiting is unsuitable for multiple instances.
- Backup/restore procedure, monitoring runbook, external-service data-flow inventory, and staging acceptance evidence are missing.
- README claims exceed verified behavior, including realtime notifications, immutable audit signatures, complete GDPR controls, and fully working interview workflows.

**Status: Partial, insufficient for handover.**

## Minimum Completion Standard Assessment

The specification says the project is complete when an authorized recruiter can create an approved job and rubric, receive multiple applications, review extracted resume information, run explainable screening, inspect evidence, record a human decision, schedule interviews, collect feedback, move candidates through the pipeline, and view accurate dashboard data in a tested staging deployment.

| End-to-end step | Current assessment |
|---|---|
| Create job and approved rubric | Job creation exists; approval/version locking is incomplete |
| Receive multiple applications | Application flows exist; authorization and processing consistency need work |
| Review extracted resume information | UI and data models exist; extraction confidence and format support are incomplete |
| Run explainable AI comparison | Scoring code exists; worker-to-scoring persistence is not reliably wired |
| Inspect evidence for every criterion | Evidence fields/UI exist; approved-rubric and required-criterion enforcement is incomplete |
| Record human decision | Decision route exists; prior stage, tenant checks, and consistent reason controls need work |
| Schedule interviews | Models/UI exist; complete scheduling/conflict APIs are not evidenced |
| Collect interviewer feedback | Scorecard persistence and independent-feedback controls are incomplete |
| Move candidates through pipeline | Pipeline UI/routes exist; transition authorization and consistency need work |
| View accurate dashboards | Dashboards exist; tenant scoping and metric definitions are incomplete |
| Deploy and accept in staging | Container foundations exist; staging, backup/restore, security and E2E evidence are missing |

**Completion result: Not met.**

## Prioritized Remediation Plan

### Priority 0: Protect data and decision integrity

1. Centralize authorization around `organizationId`, permitted jobs/departments, role, and target record; apply it to every page, route, export, file, and mutation.
2. Add organization context to the session and reject suspended/inactive accounts during authentication.
3. Remove unsafe candidate/application fallbacks and add tenant-isolation and IDOR tests.
4. Make screening execution transactional and observable: approved rubric only, deterministic status transitions, persisted screening runs, explicit failures, retries, and model/configuration metadata.
5. Make human decisions and overrides authoritative only through validated service methods that preserve original AI results, capture actual previous stage, reason, actor, and organization.
6. Implement complete privacy export/deletion/anonymization across all linked records and stored files, with identity verification and audit evidence.

### Priority 1: Complete the required vertical slice

1. Implement rubric approval, versioning, preview, thresholds, required criteria, and historical-result preservation.
2. Standardize resume format validation and processing for every advertised format; replace simulated malware checks with an approved scanner or explicitly document the controlled limitation.
3. Complete interview scheduling, conflict checks, participant assignment, invitation lifecycle, private independent scorecards, and persistence.
4. Fix notification request contracts, delivery status, retries, template versioning, and confidential-content filtering.
5. Replace global dashboard queries with permitted-scope metrics and document metric definitions.

### Priority 2: Acceptance, operations, and handover

1. Add API integration, security, privacy, queue, upload, scheduling, fairness, browser, and end-to-end tests.
2. Add a real test command and CI checks for type checking, linting, tests, and build.
3. Document deployment, secrets, storage, backup/restore, monitoring, external data flows, retention, and incident response.
4. Create approved synthetic sample data without shared credentials and keep it separate from production data.
5. Reconcile README claims with verified behavior and remove unsupported "real-time", "immutable", and "complete" wording until implemented.
6. Run a staging acceptance test from the specification’s full job-to-application-to-screening-to-interview workflow.

## Evidence Reviewed

- `prisma/schema.prisma`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/signup/route.ts`
- `src/lib/auth.ts`
- `src/lib/scoringEngine.ts`
- `src/lib/resumeProcessor.ts`
- `src/lib/blindScreening.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/jobs/apply/route.ts`
- `src/app/api/decisions/route.ts`
- `src/app/api/privacy/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/export/route.ts`
- `src/app/candidates/`
- `src/app/dashboard/`
- `src/app/jobs/`
- `__tests__/`
- `package.json`, `Dockerfile`, `docker-compose.yml`, and `README.md`

## Validation Note

TypeScript validation currently passes with `npx tsc --noEmit --pretty false`. The full ESLint command still reports existing errors across unrelated files, so lint is not currently a clean acceptance gate. This report intentionally distinguishes code that exists from behavior that is fully enforced and tested.
