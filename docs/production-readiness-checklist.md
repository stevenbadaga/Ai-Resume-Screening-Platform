# Production-Readiness To-Do List

**Audit date:** 2026-10-25  
**Scope:** repository review, documentation cross-check, and local automated baseline. This is not a penetration test, legal opinion, production acceptance, or verification of external credentials/infrastructure.

## Executive decision

**Status: feature-complete in the reviewed codebase, but not yet evidenced as production-ready.** The current local baseline passes TypeScript checking and the Vitest suite. Vitest reports **231 passed and 17 skipped** (29 files passed, 2 skipped); the skipped tests include infrastructure-backed coverage. ESLint exits successfully but emits warnings. CI previously did not run ESLint, so this audit adds it as a CI step.

The remaining release work is principally environment-dependent acceptance evidence and governance—not a justified reason to invent more application features. Do not describe the deployment as production-accepted until the go-live blockers below are closed and recorded.

## P0 — Required before production handover

- [ ] **Prove email delivery end to end.** Configure and verify the production sender/domain and provider access; send representative application, interview, team, and account-lifecycle messages; confirm receipt and corresponding `SENT` records. Verify a deliberate provider failure remains visible and safely retryable. Never place provider credentials in this document or source control.
- [ ] **Complete and record a restore drill.** Take a production-like backup, verify its checksum, restore into an isolated database, deploy migrations, and smoke-test sign-in, jobs, candidate records, resumes, and audit-chain verification. Record date, backup identifier, duration, result, and operator in the runbook/evidence log.
- [ ] **Verify distributed rate limiting.** Exercise authentication and intake limits against at least two app instances sharing the production Redis service; confirm the limit is shared and document behavior during Redis unavailability.
- [ ] **Prove positive DNS domain ownership.** Publish the challenge TXT record for a domain the operator controls, verify successful claim and audit events, and record the sanitized evidence (never the challenge secret).
- [ ] **Verify database-backed and browser acceptance in CI.** CI now provisions an isolated PostgreSQL service, applies migrations, enables the database-backed tests, and runs Chromium E2E. Confirm the workflow has completed green on the release commit; investigate skipped tests or failures. Do not point destructive suites at production data.
- [ ] **Complete privacy, AI-governance, and security sign-off.** Obtain the responsible organization's approval for candidate notices/consent, retention periods, erasure/export behavior, data residency/provider terms, AI disclosure and human-review policy, fairness limitations, incident response, and applicable employment/privacy law. Code tests do not establish legal compliance or model fairness in deployment.

## P1 — Required before calling the service operationally hardened

- [ ] **Confirm production malware-scanning mode.** Deploy the supported scanner, verify the configured fail-closed policy with safe test fixtures, monitor scanner health/signature updates, and record the expected upload behavior when it is unavailable. Signature-only mode is not equivalent to a managed antivirus service.
- [ ] **Validate storage durability and recovery.** Confirm the private object-storage bucket, encryption/access policy, lifecycle rules, backup/versioning, restore access, and file deletion behavior. Perform a safe upload/download/erase drill using synthetic data.
- [ ] **Validate integrations and worker recovery in staging.** Exercise the configured database, Redis/queue, AI provider, email, object storage, and error tracker; force safe failure cases and verify queue recovery, stale-run sweeping, alerts, and operator ownership.
- [ ] **Establish operational ownership and SLOs.** Name on-call owners; set alert thresholds for health, failed jobs, failed communications, audit-chain verification, storage, backups, and error tracking; document escalation and incident communications.
- [ ] **Verify migration/release procedure.** Apply pending migrations to a disposable copy first; confirm deployment ordering, rollback/forward-fix strategy, and backup point before production migration.

## P2 — Ongoing assurance

- [ ] Run the audit-chain verifier on a schedule and retain its result with backup evidence.
- [ ] Run backup and restore drills at least quarterly and after material storage/schema changes.
- [ ] Review RBAC, tenant isolation, dependencies, and secrets exposure on every release; investigate all CI failures and lint warnings rather than treating a green exit alone as a clean lint baseline.
- [ ] Re-run the fairness/evaluation set after changes to parsing, prompts, models, redaction, rubrics, or scoring; preserve versioned results and review limitations with qualified stakeholders.
- [ ] Review access, retention, erasure completion, and failed communications on a defined cadence.

## Completed during this audit

- [x] Captured the current local baseline: `npm run typecheck` succeeds; `npm test` reports 231 passed / 17 skipped; `npm run lint` exits successfully with warnings.
- [x] Added ESLint execution to CI so lint findings are visible on pushes and pull requests.
- [x] Removed the dead `/interviews/:path*` proxy matcher entry; interview API routes remain governed by their route-level authorization.
- [x] Secured the Compose reference deployment: private service port bindings, Redis health dependency, restart policies, ClamAV enabled by default/fail-closed, and a separate migration job that completes before app/worker startup.
- [x] Removed the weak sample PostgreSQL password and documented HTTPS ingress and explicit secret setup.
- [x] Added isolated PostgreSQL migrations/integration tests and Chromium browser E2E execution to CI; this still requires an actual green CI run on the release commit.
- [x] Upgraded the container and CI runtime from Node 20 to Node 22 LTS after the workspace surfaced high/critical vulnerabilities on the prior container base.

## Evidence and limitations

- The local Vitest run skipped 17 tests; a passing local run is not evidence that database-backed integration or browser E2E tests passed.
- Live provider credentials, operator-controlled DNS, a production-like backup target, and multi-instance deployment are external prerequisites. This audit did not access or change them.
- Docker, PostgreSQL client tools, and container execution were unavailable in this workstation session, so the modified Docker images/Compose deployment and database-backed CI workflow were not executed locally.
- Existing compliance/audit documents are point-in-time reports and can describe older test counts or statuses. Use this checklist's dated local baseline plus newly collected environment evidence for release decisions.
