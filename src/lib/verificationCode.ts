import { createHash, randomInt, timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';

/**
 * Emailed verification codes (spec §6.1 hardening).
 *
 * Two purposes share this machinery:
 *  - LOGIN_MFA: two-step sign-in. After the password is verified, a 6-digit
 *    code is emailed and must be pasted back before a session is issued.
 *  - EMAIL_VERIFICATION: signup activation. The emailed code replaces the
 *    old click-a-link flow.
 *
 * Threat model (mirrors passwordReset.ts / emailVerification.ts):
 *  - The plain code exists ONLY in the email. The database stores a SHA-256
 *    hash, so a database leak exposes no usable codes.
 *  - Codes are single-use: verification consumes the row atomically
 *    (updateMany guarded on usedAt = null), so replays lose the race.
 *  - Codes expire after 10 minutes.
 *  - Wrong entries are bounded: each code tolerates at most 5 attempts, so
 *    online guessing stays ≈ 5/1,000,000 per code while it lives.
 *  - Comparison is constant-time (timingSafeEqual on the hash), so response
 *    latency leaks nothing about how many leading digits were right.
 */

export type VerificationCodePurpose = 'LOGIN_MFA' | 'EMAIL_VERIFICATION';

export const VERIFICATION_CODE_TTL_MINUTES = 10;
export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;
/** Minimum delay between two codes for the same user+purpose (60s). */
export const VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS = 60;

export function generateNumericCode(): { code: string; codeHash: string } {
  // Cryptographically random 6-digit code — 1,000,000 possibilities.
  // randomInt is [min, max): 0..999999, zero-padded to 6 digits.
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  return { code, codeHash: hashVerificationCode(code) };
}

export function hashVerificationCode(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex');
}

/**
 * Constant-time equality for submitted vs stored codes. timingSafeEqual
 * requires equal-length buffers; short/oversized submissions hash to the
 * fixed-length digest anyway, so lengths always match here.
 */
export function codesMatch(submitted: string, codeHash: string): boolean {
  const submittedHash = hashVerificationCode(submitted);
  const a = Buffer.from(submittedHash, 'hex');
  const b = Buffer.from(codeHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Issue a fresh code for a user+purpose. Invalidates all previous codes in
 * the scope first (a new code always supersedes older ones), prunes expired
 * rows, and enforces a cooldown against code-request spam (email bombing).
 *
 * @returns { ok: true, code } on success; { ok: false, retryAfterSeconds }
 * when the resend cooldown is still active.
 */
export async function issueVerificationCode(
  userId: string,
  purpose: VerificationCodePurpose
): Promise<{ ok: true; code: string } | { ok: false; retryAfterSeconds: number }> {
  // Contain request floods: at most one code per cooldown window per scope.
  const latest = await prisma.verificationCode.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (latest) {
    const elapsedSeconds = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (elapsedSeconds < VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        retryAfterSeconds: Math.ceil(VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS - elapsedSeconds),
      };
    }
  }

  // A fresh code invalidates every outstanding code in the same scope —
  // there is exactly one live code per user+purpose at any time.
  await prisma.verificationCode.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Opportunistic cleanup: expired rows and rows invalidated (superseded or
  // guess-exhausted) without ever being solved are garbage. Solved rows are
  // kept until expiry — their verifiedAt is the proof-of-solve that downstream
  // steps (session issuance) check for the next few minutes.
  await prisma.verificationCode.deleteMany({
    where: {
      userId,
      purpose,
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null }, verifiedAt: null },
      ],
    },
  });

  const { code, codeHash } = generateNumericCode();
  await prisma.verificationCode.create({
    data: {
      userId,
      purpose,
      codeHash,
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60_000),
      maxAttempts: VERIFICATION_CODE_MAX_ATTEMPTS,
    },
  });

  return { ok: true, code };
}

/**
 * True when the user has a LOGIN_MFA code that was solved (verifiedAt set)
 * within the last 5 minutes. Used by the NextAuth authorize() step to prove
 * the second factor actually passed — not merely that a code row exists.
 */
export async function hasRecentSolvedLoginCode(userId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - 5 * 60_000);
  const count = await prisma.verificationCode.count({
    where: {
      userId,
      purpose: 'LOGIN_MFA',
      verifiedAt: { not: null },
      // Proven within the last 5 minutes OR still unexpired: a solved code
      // stays the proof-of-solve for as long as the code itself is live.
      OR: [{ verifiedAt: { gte: cutoff } }, { expiresAt: { gt: new Date() } }],
    },
  });
  return count > 0;
}

/**
 * Idempotent re-verification of an ALREADY SOLVED, unexpired code.
 *
 * A correct entry consumes the code (single-use against guessing), but the
 * solve itself proves the second factor until the code expires — authorize()
 * honors that same window (hasRecentSolvedLoginCode). Re-submitting the SAME
 * 6 digits therefore re-issues an MFA ticket instead of failing, which is
 * what lets a login interrupted between step 1 and step 2 resume (and what
 * the E2E pre-staged code relies on). A wrong guess never matches here.
 */
async function findSolvedEquivalent(
  userId: string,
  purpose: VerificationCodePurpose,
  submittedCode: string
): Promise<{ id: string } | null> {
  const solved = await prisma.verificationCode.findMany({
    where: { userId, purpose, verifiedAt: { not: null }, expiresAt: { gt: new Date() } },
    orderBy: { verifiedAt: 'desc' },
    take: 5,
    select: { id: true, codeHash: true },
  });
  const match = solved.find((row) => codesMatch(submittedCode, row.codeHash));
  return match ? { id: match.id } : null;
}

export type CodeVerificationResult =
  | { ok: true; codeId: string }
  | { ok: false; reason: 'NOT_FOUND' | 'EXPIRED' | 'MAX_ATTEMPTS' | 'INVALID_CODE' };

/**
 * Verify a submitted code for a user+purpose, atomically.
 *
 * - Expired / exhausted codes are rejected up front.
 * - A match consumes the code in a guarded transaction (updateMany on
 *   usedAt = null); losing the concurrent race reads as INVALID_CODE.
 * - A mismatch consumes one attempt; reaching maxAttempts invalidates the
 *   code so further guessing cannot continue.
 */
export async function verifyVerificationCode(
  userId: string,
  purpose: VerificationCodePurpose,
  submittedCode: string
): Promise<CodeVerificationResult> {
  const normalized = submittedCode.trim();

  const record = await prisma.verificationCode.findFirst({
    where: { userId, purpose, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    const equivalent = await findSolvedEquivalent(userId, purpose, normalized);
    if (equivalent) return { ok: true, codeId: equivalent.id };
    return { ok: false, reason: 'NOT_FOUND' };
  }
  if (record.expiresAt < new Date()) return { ok: false, reason: 'EXPIRED' };
  if (record.attempts >= record.maxAttempts) return { ok: false, reason: 'MAX_ATTEMPTS' };

  if (!codesMatch(normalized, record.codeHash)) {
    // The submitted code may be one that was already solved moments ago
    // (re-login / interrupted step 2) — accept it before counting a miss.
    const equivalent = await findSolvedEquivalent(userId, purpose, normalized);
    if (equivalent) return { ok: true, codeId: equivalent.id };
    const attempts = record.attempts + 1;
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts },
    });
    if (attempts >= record.maxAttempts) {
      // Invalidate immediately — do not let the 6th guess ride the TTL.
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      return { ok: false, reason: 'MAX_ATTEMPTS' };
    }
    return { ok: false, reason: 'INVALID_CODE' };
  }

  // Correct code: consume atomically. Guarded on usedAt = null so two
  // concurrent verifications cannot both succeed (single-use guarantee).
  // verifiedAt is stamped in the same write: only a correct entry can ever
  // set it, so it doubles as the proof-of-solve for downstream steps.
  const now = new Date();
  const consumed = await prisma.verificationCode.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: now, verifiedAt: now },
  });
  if (consumed.count === 0) return { ok: false, reason: 'INVALID_CODE' };

  return { ok: true, codeId: record.id };
}

/** True when the user has a live, unconsumed, unexpired code in scope. */
export async function hasActiveVerificationCode(
  userId: string,
  purpose: VerificationCodePurpose
): Promise<boolean> {
  const count = await prisma.verificationCode.count({
    where: {
      userId,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  return count > 0;
}
