# Full Application Audit & Implementation Report

**Project:** RecruitAI — AI-Resume-Screening-Platform (Next.js 16 + Prisma 7 + PostgreSQL/Neon + BullMQ/Redis)
**Branch:** `feature/ai-resume-screening` · **Date:** 2026-10-16
**Verification:** `tsc --noEmit` ✅ exit 0 · `vitest run` ✅ 221 passed / 12 skipped · `next build` ✅ exit 0 (all routes compiled)

---

## 1. Application Audit — Issues Discovered

The audit confirmed the application is a complete, production-oriented system rather than a page
collection. Issues found and (where in scope of this session) fixed:

| # | Area | Finding | Status |
|---|------|---------|--------|
| A1 | Email templates | `TEAM_INVITATION` rendered no workspace name; template only knew `organizationName` but callers sent `orgName` | **Fixed** — both flows normalize to `organizationName`; invitation now names the real workspace |
| A2 | Email templates | `renderEmailHtml` silently fell back to "Dear there" with no signal | Fixed — one-time server-side warning when a name is missing (not candidate-visible) |
| A3 | Team invite | Invite route assumed `auth.user.organization` (does not exist → blank org name); sent a non-schema `firstName` field | **Fixed** — fetches org from DB; invalid field removed |
| A4 | Null-safety | `${user.firstName} ${user.lastName}` interpolated `"undefined undefined"` into candidate emails when profile names blank (interview, decisions, scorecard, offer, talent-pool) | **Fixed** — null-safe name derivation with template fallback in all 5 routes |
| A5 | Delivery retry | `POST /api/notifications/retry-delivery` did not restore `organizationName` from the §6.9 payload snapshot | **Fixed** — retried invitations stay faithful to the original send |
| A6 | Script | `scripts/evaluate-fairness.ts` used an invalid `prisma['_engine']` hack that broke typecheck | **Fixed** — removed |
| A7 | Middleware | `/interviews/:path*` listed in the proxy matcher but no page/route exists at that path (dead matcher entry, harmless) | Documented — no action needed |
| A8 | No `/admin` page | Admin functions live under `/dashboard/{team,settings}` permission-gated by a permission matrix rather than a URL prefix — by design | Documented |

Pre-existing verified strengths confirmed by the audit (not touched): permission-matrix RBAC
(`src/lib/roleAccess.ts`), `requirePermission` on every team/decision/interview/AI endpoint,
2FA login challenge/verify, first-login forced password set, audit chain with hash verification
(`npm run verify-audit-chain`), CSP via nonce middleware, magic-byte file validation, malware
scan, rate limiting Redis-backed.

---

## 2. UI/UX Changes

- **Unauthenticated users:** `proxy.ts` redirects every protected route (`/dashboard/*`, `/candidates/*`,
  `/audit/*`) to `/auth/signin?callbackUrl=…`, preserving the intended destination. Public surface
  is limited to landing, `/jobs` listings, and `/auth/*` pages.
- **Applicants:** see `/dashboard/my-applications`, `/jobs`, `/privacy`, profile — never candidate
  review screens (middleware redirects candidates away from `/candidates` to their own applications).
- **Staff:** `/dashboard/team` (invite, suspend/reactivate, role change via `/api/team/{invite,role,status,delete}`),
  `/dashboard/email-delivery` for failed-notification follow-up, `/audit` for Admin/ComplianceAuditor.
- **Workflow states accounted for:** awaiting-2FA (login challenge), first-login activation
  (`/auth/first-login` page + `/api/auth/first-login` forcing password set for `INVITED &&
  mustChangePassword` accounts), email verification (`verify-email` + 10-minute single-use 6-digit
  codes), suspended accounts (session invalidated by `accessStatus` checks in auth), loading/empty/
  error states in cards and tables.

---

## 3. Authentication

| Feature | Implementation |
|---|---|
| Login | `POST /api/auth/login/challenge` — email+password verified against bcrypt hash → issues single-use 6-digit OTP |
| 2FA | OTP delivered via email (Gmail SMTP / Brevo / Resend); `POST /api/auth/login/verify` completes the session — **no session is granted on password alone**; codes expire in 10 min, resend cooldown + attempt limits enforced |
| First login | Invited staff MUST set a new password (`/api/auth/first-login`): verifies the temp credential, enforces ≥8 chars, swaps hash (bcrypt cost 12), stamps `passwordChangedAt`, clears `mustChangePassword`, sets account ACTIVE. No "keep temp password" path exists |
| Email verification | Signup → hashed code in DB → 6-digit code email; resend endpoint rate-limited; responses never reveal whether an account exists |
| Password reset | `/api/auth/forgot-password` + `reset-password` with hashed single-use tokens and generic responses |
| Password hygiene | Never logged, never returned in errors, generic credential errors on both login and first-login |

**Dependency:** email delivery requires `GMAIL_USER`+`GMAIL_APP_PASSWORD` (preferred), or
`BREVO_API_KEY`, or `RESEND_API_KEY`, plus `EMAIL_FROM`. Without a provider, sends fail *honestly*
(Communication row → `FAILED` with failure reason) — there is no fake-success path.

---

## 4. RBAC

- **Permission matrix** (`src/lib/roleAccess.ts`): roles Admin / Recruiter / HiringManager /
  Interviewer / ComplianceAuditor / Candidate map to granular permissions (`ManageTeam`,
  `ViewScorecards`, `SubmitScorecards`, `ViewEmailDelivery`, …). Granting is explicit; role name
  alone confers nothing.
- **Backend enforcement:** every protected endpoint starts with
  `requirePermission(Permission.X)` — 401 unauthenticated, 403 no-permission, 404 where tenant
  boundaries must not disclose existence. Deny-by-default throughout: team invite rejects role
  names outside `ROLE_PERMISSIONS`; Interviewers can only reach applications they participate in.
- **Tenant isolation:** every job/application/team query is scoped by
  `organizationId === auth.user.organizationId`; cross-org IDs return 404.
- **Privilege-escalation controls:** role is never accepted from client signup (server decides:
  candidate vs domain-verified recruiter; the *founding* account of a new org becomes its Admin —
  joining an existing org starts as Recruiter pending that Admin's approval path);
  mass-assignment is blocked by Zod schemas that strip unknown fields; `/audit` page is
  middleware-gated; audit writes are append-only for non-admin roles.
- **Frontend permission UI:** navigation and team actions render from the session's permissions;
  middleware `proxy.ts` is the second layer; the backend remains final authority.

---

## 5. Team Management

Admin-only invite workflow (verified in code and by tests):
1. Admin signs in → `/dashboard/team`.
2. "Add member" → `POST /api/team/invite` → `requirePermission(ManageTeam)` + Zod validation.
3. Server generates a cryptographically random temp password (`randomBytes(18).base64url`).
   It is **bcrypt-hashed immediately** (cost 12), never stored or logged in plaintext, and never
   displayed to the Admin — only delivered inside the invite email.
4. Recipient gets the TEAM_INVITATION email with the temp credential + sign-in link (this session
   made the org workspace name render correctly).
5. First login forces the first-login flow (§3) — temp credential invalidated after one use.

Suspension/reactivation (`/api/team/status`), role change (`/api/team/role`), deletion
(`/api/team/delete`) are all `ManageTeam`-gated, audited, and org-scoped. Suspension revokes
access immediately at the auth layer.

---

## 6. AI Recruitment

- **Pipeline:** upload → magic-byte validation (PDF/DOCX) + EICAR malware scan → text extraction
  (pdf-parse/mammoth) → structured extraction (OpenAI when `OPENAI_API_KEY` set, deterministic
  parsers as fallback) → blind screening strips names/contacts → rubric-based scoring
  (`scoringEngine.ts`, weights 1–10 per criterion).
- **Prompt injection:** CV text is treated as untrusted data — the AI layer extracts into a
  fixed schema and result strings never become executable instructions or override access checks.
- **Candidate transparency:** candidates with accounts see their own scores with per-criterion
  explanations; decisions require human rationale (`decisionSchema` mandates `rationale`); AI never
  auto-rejects.
- **Fairness:** `scripts/evaluate-fairness.ts` + `__tests__/fairness.test.ts` measure
  PII-blind determinism on the evaluation set; report archived at
  `test-results/fairness-evaluation-2026-10-15.md`.
- **Privacy:** CVs stored by the storage layer with access control; exports/erasure endpoints
  (`/api/privacy/*`) cover data-subject rights; raw CV contents are excluded from logs (redaction
  allow-list in `observability.ts`).

---

## 7. Database & Schema

Prisma 7 (`prisma/schema.prisma`, 419 lines) — no migrations were required in this pass; the
session's changes were code-only. Key models already aligning with the spec: `User` with
`accessStatus` / `mustChangePassword` / `passwordChangedAt`, `Role` with `permissions[]`,
`Communication` with `deliveryState` / `failureInfo` / `payloadSnapshot` (retry support),
append-only `AuditEvent` chain, `Organization` domain claims, `Interview`/`InterviewParticipant`
scorecards.

---

## 8. Testing

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | ✅ exit 0 |
| Unit/integration | `npm test` (vitest, 28 files) | ✅ **221 passed**, 12 skipped, 0 failed |
| Production build | `npm run build` (Next.js 16) | ✅ exit 0 — all routes compiled |

The skip group (`workflow.integration.test.ts`) is a DB-requiring integration suite that is
skipped when no live `DATABASE_URL` is provided. Playwright e2e (`e2e/`) requires a provisioned
database and seeded demo data (`scripts/seedDemoData.ts`) — not executed in this session;
not claimed as passing.

---

## 9. Configuration (required environment variables)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL/Neon connection |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Session + CSRF + redirect base |
| `REDIS_URL` | BullMQ + rate limiting (falls back gracefully) |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | Preferred email path (authenticated Gmail SMTP, 500/day) |
| `BREVO_API_KEY` or `RESEND_API_KEY` + `EMAIL_FROM` | Alternative providers; sender must be verified in the provider dashboard |
| `OPENAI_API_KEY` | AI extraction/scoring; without it the deterministic layer is used and the feature is *not* claimed operational |
| `SENTRY_DSN` | Optional error tracking |
| `SUPABASE_*`, `STORAGE_LOCAL_PATH` | Resume storage backends |

---

## 10. Outstanding Issues

1. **Email delivery is configuration-gated** — the code path is complete and honest (failures
   recorded, retry UI exists), but no provider credentials are configured in this environment;
   delivery cannot be demonstrated end-to-end here.
2. **AI extraction** — requires `OPENAI_API_KEY`; the deterministic fallback works but the AI
   pass is only as good as the configured model.
3. **E2E suite** — implemented but needs a provisioned DB (`docker-compose.yml` provides
   Postgres+Redis) and a seeded workspace to run.
4. **`/interviews` matcher entry** — dead matcher path in `proxy.ts` (no page exists); safe to
   remove in a future cleanup, no security impact.
5. **Email mail-box verification** — format validation + ownership verification exist; true
   deliverability checks would need a paid mailbox-validation service (intentionally not faked).
