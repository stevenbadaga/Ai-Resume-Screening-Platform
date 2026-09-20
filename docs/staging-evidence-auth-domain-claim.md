# Staging Evidence — Auth, Verification & Domain-Claim Flow (v1.1)

**Date:** 2026-09-12
**Environment:** local dev server (`localhost:3000`), live PostgreSQL, Brevo email provider
**Method:** real HTTP requests against the running app (no mocks); state verified directly in the database; audit trail queried from `AuditEvent`

Covers spec §6.1 (email ownership proof), §2.1 (RBAC bootstrap), and the domain-claim hardening.

---

## Evidence captured

### 1. RBAC bootstrap (workspace founder becomes Admin)

- `POST /api/auth/signup` with a fresh staff email returned:
  `{"success":true,"role":"Admin"}` — the founder account was created with the **Admin** role and recorded as the organization's `primaryOwnerId`.
- No manual DB step was used at any point in the account lifecycle.

### 2. Display names never route (squatting is dead)

- A second staff signup used the **same company name** ("RecruitAI Staging") as the existing workspace. Result: it **founded a separate workspace** rather than joining by name — two organizations with identical display names existed simultaneously, and the name matched nobody.
- Membership is decided solely by verified email domain (auto-join) or invitation.

### 3. Email verification gate (spec §6.1)

| Step | Result |
|---|---|
| Sign-in **before** verification | `401` → `error=EMAIL_NOT_VERIFIED` (thrown after password check — no enumeration signal) |
| Consume verification link | `200` `{"success":true,…}` |
| **Replay** the same link | `400` `"This verification link has expired or was already used."` — single-use enforced |
| Sign-in **after** verification | `200` + `next-auth.session-token` cookie set (session established) |

Tokens are stored **hashed** (SHA-256, `tokenHash @unique`); the plain token exists only in the email body.

### 4. Anti-enumeration resend

- `POST /api/auth/resend-verification` with an email that has no account returned the **generic** `200 {"success":true,"message":"If that email address has an unverified account…"}` — identical shape to the account-exists case.

### 5. Shared-provider denylist (domain-claim hardening)

- `POST /api/org/domain-claim {"domain":"gmail.com"}` → `403`
  `"Public email provider domains (gmail.com, outlook.com, etc.) cannot be claimed as a workspace identity…"`
- The signup pre-seed path applies the same denylist: a gmail-founder's workspace was **not** given a pending challenge for `gmail.com` (regression pinned in `__tests__/rbacBootstrap.test.ts`).

### 6. Domain-claim lifecycle (reserved test domain `example.com`)

| Step | Result |
|---|---|
| Start claim | `200` with host `_recruitai-challenge.example.com` and TXT `recruitai-verify=bb7eee0a…` |
| `GET /api/org/domain-claim` | Pending challenge exposed (`pendingDomain`, `pendingHost`, `pendingTxtRecord`) |
| Verify (no DNS record published) | `200 {"verified":false,…}` — **fails safely**, no crash, no false positive |

No real domain was available in this environment, so the **positive** DNS-verification case (`DOMAIN_CLAIM_VERIFIED`) remains to be captured on a domain the operator controls. The negative path proves the DNS lookup, error handling, and audit wiring work end to end.

### 7. Audit trail (queried from `AuditEvent`)

```
USER_REGISTERED          {email, role:"Admin", accountType, organizationId, foundedWorkspace}
EMAIL_VERIFIED           {email}
USER_REGISTERED          {email, role:"Admin", …}          ← second founder
EMAIL_VERIFIED           {email}
DOMAIN_CLAIM_STARTED     {domain:"example.com", tokenRef}  ← token hash reference, never the plain token
DOMAIN_CLAIM_CHECK_FAILED{domain:"example.com", host}
USER_REGISTERED          {email, role:"Admin", …}          ← third founder
```

### 8. Email delivery — infrastructure finding + observability fix

- **Finding:** Brevo rejects sends from this environment with `HTTP 401` (IP restriction on the sender account). This is an account/infrastructure matter, not a code defect — to be resolved by allow-listing the staging IP in Brevo or sending from an allow-listed host.
- **Observability fix proven live:** signup and resend-verification now send via `sendRecordedEmail` (spec §6.9). The attempt is recorded in the `Communication` table with an honest state:
  ```
  recipient: qa.probe.2k7@gmail.com
  template:  EMAIL_VERIFICATION
  state:     FAILED
  failureInfo: Email delivery failed (Brevo HTTP 401): {"message":"We have detected you are usi…
  ```
  Previously these sends were fire-and-forget (`sendTransactionalEmail`) and left **no trace** — a delivery failure was invisible. The API response (`emailDelivered:false`) and the Communication row now agree.

---

## Remaining items (infrastructure, not code)

1. **Positive DNS-verification capture** — start a claim on a domain you control, publish the TXT record, click Verify. Expected audit event: `DOMAIN_CLAIM_VERIFIED`.
2. **Brevo IP allow-listing** — unblock real delivery, then capture a `SENT` Communication row and the received email itself.
3. Both are addenda to the "known remaining items" list in `specification-compliance-report.md` §3.

## Artifact hygiene

QA probe accounts and their workspaces were deleted after the run (FK design: `AuditEvent.actorId` and `Communication.senderId` are `ON DELETE SET NULL`, so the evidence trail above survives user deletion). The founder account and its workspace were preserved.
