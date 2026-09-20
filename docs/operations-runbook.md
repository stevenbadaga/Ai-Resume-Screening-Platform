# Operations Runbook

**AI Resume Screening Platform (RecruitAI)** — operational procedures for backup & recovery,
monitoring, health checks, and the external-service inventory.

Aligned with the CODAFRIQA specification: §9 (Backup and Recovery, Monitoring and Logging),
§6.12 (Administration, Configuration and Audit), and §11 (external service transparency).

---

## 1. Backup and Recovery

### 1.1 What must be backed up

| Asset | Tool | Location |
|---|---|---|
| Application database (all recruitment records, audit ledger) | `scripts/backup.sh` (`pg_dump` + gzip) | `./backups/` or external volume/object storage |
| Uploaded resume documents | filesystem sync of `STORAGE_LOCAL_PATH` (e.g. `rsync`, `restic`, S3 sync) | same cadence as the database |
| Configuration | `.env` (kept out of git; copy to the secret manager or an encrypted store) | manual, per environment change |

> The database and the upload directory must be backed up together (or both restored to the
> same point in time) so `ResumeDocument.fileReference` rows match files that still exist.

### 1.2 Taking a backup

```bash
npm run backup              # ./scripts/backup.sh — dumps to ./backups/, writes a .sha256 checksum,
                            # and prunes backups older than RETENTION_DAYS (default 14)
RETENTION_DAYS=30 npm run backup ./backups   # custom retention and target directory
```

Schedule it nightly (cron example):

```
0 2 * * *  cd /srv/recruitai && RETENTION_DAYS=30 ./scripts/backup.sh >> /var/log/recruitai-backup.log 2>&1
```

Copy the newest `recruitai-backup-*.sql.gz` (+ checksum) off the host after each run — a backup
that only lives on the same machine as the database does not survive that machine.

### 1.3 Restoring (tested procedure)

```bash
npm run restore -- backups/recruitai-backup-YYYYMMDD-HHMMSS.sql.gz
# verifies the SHA-256 checksum, then asks for the database name as confirmation
npm run restore -- backups/recruitai-backup-YYYYMMDD-HHMMSS.sql.gz --yes   # non-interactive
npx prisma migrate deploy   # only if the backup predates the current schema
```

Restore drill (do this in staging at least once before handover, then quarterly):

1. Restore the latest backup into a throwaway database (`TEST_DATABASE_URL`).
2. Start the app against it and confirm: sign-in works, the job list renders, one candidate
   profile shows its screening run, and the audit ledger loads.
3. Record the date, backup name, and result of the drill.

### 1.4 Recovery expectations

| Metric | Target |
|---|---|
| RPO (max data loss) | 24 h with nightly backups; tighten the schedule as needed |
| RTO (max restore time) | < 1 h on a warm host (restore ≈ dump size / disk speed + `migrate deploy`) |
| Verification | checksum `.sha256` sidecar verified by `scripts/restore.sh` on every restore |

---

## 2. Monitoring and Logging

### 2.1 Health endpoint

`GET /api/health` — no authentication, returns only `{"status":"ok","timestamp":…}`. Safe to
wire to a load-balancer probe or uptime monitor.

Authenticated `GET /api/health` (Admin or ComplianceAuditor session) returns the operational
detail view: database reachability + latency, queue depth and failed-job counts, storage
writability, resume processing status counts, communication delivery counts (including FAILED
for follow-up), and which integrations are configured — reported as booleans only, never
secret values.

### 2.2 Scheduled verification

| Check | Command | Frequency |
|---|---|---|
| Audit ledger integrity | `npm run verify-audit-chain` (exit 0 = intact, 1 = tampering) | nightly, after the backup |
| Queue failures | authenticated `GET /api/health` → `checks.queue.failed` | daily review / alert when > 0 |
| Notification failures | authenticated `GET /api/health` → `checks.communications.failed` | daily review |
| Storage writable | authenticated `GET /api/health` → `checks.storage.writable` | with uptime probe |

### 2.3 Log hygiene (§9 Monitoring and Logging)

Operational logs record processing failures, security events (e.g. `MALWARE_SCAN_REJECTED`
audit events), and service health — and must never contain passwords, secrets, or full resume
text. Verify after any change that:

- `console.error` call sites print error **messages**, not credential objects or resume bodies;
- request context stored in audit events (`requestContext`) contains route + actor ids only;
- extracted resume text lives in the database (`ResumeDocument.extractedText`), never in stdout.

---

## 3. External Service Inventory (§11)

| Service | Purpose | Data it receives | Where processed | Credential handling | Fallback if unavailable |
|---|---|---|---|---|---|
| PostgreSQL (incl. Neon if used) | all recruitment data, audit ledger | everything entered in the app | provider region chosen at signup | `DATABASE_URL` / `DIRECT_URL` in env only | none — the app is down; restores from backup |
| Redis (incl. Upstash if used) | BullMQ resume-processing queue, rate limiting | job payloads with application/resume ids (no resume content) | provider region | `REDIS_URL` in env only | rate limiting fails open to in-memory; queue adds fail the request |
| OpenAI (`gpt-4o-…`) | structured profile extraction + criterion scoring | **PII-redacted** resume text only (emails/phones redacted pre-send) | OpenAI API (US) | `OPENAI_API_KEY` in env; never logged | processing marks the resume FAILED with a visible error; BullMQ retries |
| Brevo / Resend | transactional email (confirmations, invitations, resets) | recipient address, template content (names, job title, schedule) | provider API | `BREVO_API_KEY` / `RESEND_API_KEY` + `EMAIL_FROM` in env | send failure recorded honestly on the `Communication` row (`FAILED` + `failureInfo`) |
| ClamAV daemon (optional, `docker-compose` service) | full antivirus scanning of uploads | raw upload bytes (in-memory stream, nothing retained) | self-hosted container | none (network-local) | signature-only scanning continues; with ClamAV configured the scan fails CLOSED |

No candidate data is used for model training by any integration; prompts are one-shot requests
with no retention arrangement beyond the provider's API processing.

---

## 4. Deployment checklist

1. `.env` complete (all `?:` required vars in `docker-compose.yml`) — generate
   `NEXTAUTH_SECRET` with `openssl rand -base64 32`; never reuse secrets across environments.
2. `docker compose up -d db redis` (add `clamav` and set `CLAMAV_HOST=clamav` for full AV).
3. `npx prisma migrate deploy` (runs automatically in the compose `app` service).
4. First staff signup for the workspace's email domain becomes its Admin (founder bootstrap) —
   complete DNS domain claiming on the Team page to let teammates auto-join.
5. Configure a real email sender (Brevo verified sender or Resend domain) — the staging IP
   allow-list note in `docs/staging-evidence-auth-domain-claim.md` applies.
6. Smoke-test `GET /api/health` (public) and the authenticated detail view.
7. Schedule backups (§1.2) and the nightly audit-chain verification (§2.2); run one restore
   drill (§1.3) before go-live.
