# Independent Specification Verification — September 22, 2026

**Scope:** functional and non-functional requirements of the CODAFRIQA AI Resume
Screening Platform specification (17-page PDF, v1.0), verified against the actual
codebase — not against prior self-assessment documents.

**Method:** every high-risk claim in `docs/specification-compliance-report.md` was
re-checked in source. The compliance report's claims were treated as hypotheses,
not evidence.

---

## Verified as genuinely implemented (evidence re-checked in source)

| Area (spec §) | Evidence |
|---|---|
| Auth, sessions, verification, reset (§6.1) | bcrypt(12), email-verification gate, hashed reset tokens, 8h JWT, `requirePermission` on protected routes |
| RBAC matrix (§5, §6.1) | `src/lib/roleAccess.ts` — typed, single source of truth, DB rows self-heal from it; 13 RBAC tests |
| Tenant isolation (§6.1) | Spot-checked `/audit`, bulk-action, analytics, export, merge — all org-scoped; integration test covers cross-org rejection |
| Rubric lifecycle + versioning (§6.2) | DRAFT/REVIEW/APPROVED/ARCHIVED state machine; editing APPROVED requires reason and creates new version; historical results untouched |
| Bulk-action safeguards (§6.3, §6.12) | `POST /api/candidates/bulk-action` requires `confirm: "true"` + mandatory reason, transactional, audited, org-scoped |
| File safety (§6.4) | magic-byte checks, path-traversal guards, layered malware scan (signature + optional ClamAV, fail-closed), checksums |
| Worker → scoring chain (§6.5) | `src/lib/worker.ts` re-scans, processes, then calls `scoreCandidateProfile` with the approved rubric — prior "not wired" gap is closed |
| Explainability (§6.5-6.6, §7) | criterion-level evidence, source location, uncertainty, effective-vs-original results, skill normalization shared with the copilot |
| Interview conflicts (§6.8) | interviewer + candidate double-booking detection with per-interview duration math (unit-tested) |
| Communications (§6.9) | real Brevo/Resend delivery, honest SENT/FAILED + failureInfo per row; provider errors carry actionable hints |
| Dashboards/analytics (§6.10) | org-scoped funnel counts, manager analytics API + UI, documented metric definitions |
| Privacy (§6.11) | consent records, Art. 20 export, Art. 17 transactional erasure (participants before interviews), retention config + enforcement script |
| Audit ledger (§6.1, §6.12) | SHA-256 hash-chained, row-locked appends, tamper-detection script + test |
| Ops health (§6.12) | `/api/health`: DB latency, queue depth/failed, storage writability, processing + communication counts, integration booleans (no secret values) |
| Backup/recovery (§9) | `scripts/backup.sh` (checksum + retention), `scripts/restore.sh` (verify + confirm), runbook |
| Docker secrets (§12) | compose interpolates all credentials from `.env` with hard failures; durable volumes; optional ClamAV service |
| Secrets hygiene (§12, §9) | `.env` never committed (verified across all history); `.gitignore` strict; no real keys in tree |
| Tests (§14) | 142 unit tests green (18 files) incl. fairness (name-invariance) and malware-scan suites; 12 DB-backed integration tests; typecheck clean; build passes; lint 0 errors |

## Corrections made during this verification

1. **"Sync Telemetry" was fake** — `DashboardClient.handleSyncTelemetry` slept
   600 ms and showed a success toast without touching data, contradicting the
   spec's prohibition on demo-only behavior and the README's telemetry claims.
   It now re-fetches server telemetry via `router.refresh()`.
2. **Synthetic sample data was missing** (§6.12, §15) — both prior audits
   admitted it. `scripts/seedDemoData.ts` now seeds a demo workspace with one
   account per role (documented demo-only passwords), two approved jobs with
   weighted rubrics, and five synthetic candidates covering: strong match,
   transferable skills, missing required criterion, ambiguous/overlapping
   dates, and embedded resume instructions (the §7 prompt-safety case).

## Known remaining items (operator evidence, not code-completable)

These cannot be closed by writing more code in this repository:

1. **Live `SENT` email evidence** — requires the Brevo account's IP
   allow-listing to be updated (the account rejects unknown egress IPs with
   HTTP 401) and one real send observed end-to-end. The failure path is fully
   implemented, recorded, and surfaced to admins.
2. **Recorded restore drill** against production-like data (`npm run restore`).
3. **Multi-instance rate-limit proof** — two app instances behind a load
   balancer sharing one Redis.
4. **DNS-positive domain-claim verification** for a domain the operator
   controls.
5. **§12 process rules** (supervisor approvals, milestone cadence, PR/review
   process) are obligations of the intern/supervisor workflow, not of this
   repository.

## Verification commands

```bash
npx tsc --noEmit        # clean
npm test                # 18 files, 142 tests passing (integration file self-skips without TEST_DATABASE_URL)
npm run build           # passes
npm run lint            # 0 errors (168 pre-existing style warnings)
npx tsx scripts/seedDemoData.ts   # optional: safe synthetic demo data
```
