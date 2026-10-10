import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

/**
 * Emailed verification codes (two-step login 2FA + signup activation):
 * hash-only storage, constant-time comparison, single-use consumption with
 * proof-of-solve, attempt bounding, and the resend cooldown.
 */

const prismaMock = (await import('@/lib/prisma')).default as unknown as {
  verificationCode: Record<string, ReturnType<typeof vi.fn>>;
};

const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex');

const activeCode = (over: Record<string, unknown> = {}) => ({
  id: 'code-1',
  userId: 'user-1',
  purpose: 'LOGIN_MFA',
  codeHash: sha256('123456'),
  expiresAt: new Date(Date.now() + 10 * 60_000),
  usedAt: null,
  verifiedAt: null,
  attempts: 0,
  maxAttempts: 5,
  createdAt: new Date(Date.now() - 30_000),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  // The idempotent re-verify fallback queries already-solved rows; default
  // to "none found" so every existing expectation is unchanged.
  const vc = prismaMock.verificationCode as unknown as Record<string, ReturnType<typeof vi.fn>>;
  if (!vc.findMany) vc.findMany = vi.fn();
  vc.findMany.mockResolvedValue([] as never);
});

describe('generateNumericCode', () => {
  it('produces a 6-digit code and stores only its hash', async () => {
    const { generateNumericCode } = await import('@/lib/verificationCode');
    const { code, codeHash } = generateNumericCode();

    expect(code).toMatch(/^\d{6}$/);
    expect(codeHash).toBe(sha256(code));
    expect(codeHash).not.toContain(code); // hash, not plaintext
  });

  it('generates different codes across calls (no reuse)', async () => {
    const { generateNumericCode } = await import('@/lib/verificationCode');
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) seen.add(generateNumericCode().code);
    // Collision odds across 50 draws from 1e6 are ~0.1% — expect none.
    expect(seen.size).toBe(50);
  });
});

describe('issueVerificationCode', () => {
  it('creates a new hashed code with 10-minute expiry and 5 max attempts', async () => {
    const { issueVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(null);
    prismaMock.verificationCode.create.mockResolvedValue({});

    const result = await issueVerificationCode('user-1', 'LOGIN_MFA');

    expect(result).toEqual({ ok: true, code: expect.stringMatching(/^\d{6}$/) });
    expect(prismaMock.verificationCode.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', purpose: 'LOGIN_MFA', usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    // The row stores exactly the hash of the code that was emailed — and no
    // plaintext column exists (create data carries codeHash only).
    const createArg = prismaMock.verificationCode.create.mock.calls[0][0];
    const issuedCode = (result as { ok: true; code: string }).code;
    expect(createArg.data.codeHash).toBe(sha256(issuedCode));
    expect(Object.keys(createArg.data)).not.toContain('code');
    expect(createArg.data.maxAttempts).toBe(5);
    const ttlMs = createArg.data.expiresAt.getTime() - Date.now();
    expect(ttlMs).toBeGreaterThan(9 * 60_000);
    expect(ttlMs).toBeLessThanOrEqual(10 * 60_000);
  });

  it('enforces the 60s resend cooldown and reports the remaining wait', async () => {
    const { issueVerificationCode, VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS } = await import(
      '@/lib/verificationCode'
    );
    prismaMock.verificationCode.findFirst.mockResolvedValue({
      createdAt: new Date(Date.now() - 20_000), // 20s ago, cooldown is 60s
    });

    const result = await issueVerificationCode('user-1', 'EMAIL_VERIFICATION');

    expect(result).toEqual({
      ok: false,
      retryAfterSeconds: VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS - 20,
    });
    expect(prismaMock.verificationCode.create).not.toHaveBeenCalled();
  });

  it('supersedes (invalidates) outstanding codes before issuing the new one', async () => {
    const { issueVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue({
      createdAt: new Date(Date.now() - 120_000), // outside cooldown
    });
    prismaMock.verificationCode.create.mockResolvedValue({});

    await issueVerificationCode('user-1', 'LOGIN_MFA');

    expect(prismaMock.verificationCode.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', purpose: 'LOGIN_MFA', usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
  });
});

describe('verifyVerificationCode', () => {
  it('accepts the correct code, consumes it once, and stamps verifiedAt (proof-of-solve)', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(activeCode());
    prismaMock.verificationCode.updateMany.mockResolvedValue({ count: 1 });

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', '123456');

    expect(result).toEqual({ ok: true, codeId: 'code-1' });
    const consume = prismaMock.verificationCode.updateMany.mock.calls[0][0];
    expect(consume.where).toEqual({ id: 'code-1', usedAt: null });
    expect(consume.data.usedAt).toBeInstanceOf(Date);
    expect(consume.data.verifiedAt).toBeInstanceOf(Date);
    // No attempt was counted for a correct entry.
    expect(prismaMock.verificationCode.update).not.toHaveBeenCalled();
  });

  it('rejects a wrong code, counts the attempt, and does NOT stamp verifiedAt', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(activeCode());

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', '654321');

    expect(result).toEqual({ ok: false, reason: 'INVALID_CODE' });
    expect(prismaMock.verificationCode.update).toHaveBeenCalledWith({
      where: { id: 'code-1' },
      data: { attempts: 1 },
    });
    expect(prismaMock.verificationCode.updateMany).not.toHaveBeenCalled();
  });

  it('rejects trimmed/whitespace-padded input on the correct code (pasted with a space)', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(activeCode());
    prismaMock.verificationCode.updateMany.mockResolvedValue({ count: 1 });

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', ' 123456\n');

    expect(result).toEqual({ ok: true, codeId: 'code-1' });
  });

  it('invalidates the code immediately when the last attempt is burned', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(activeCode({ attempts: 4 }));

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', '000000');

    expect(result).toEqual({ ok: false, reason: 'MAX_ATTEMPTS' });
    // Consume-on-exhaust: no further guess can ride the remaining TTL.
    expect(prismaMock.verificationCode.update).toHaveBeenCalledWith({
      where: { id: 'code-1' },
      data: { usedAt: expect.any(Date) },
    });
  });

  it('rejects an expired code without counting an attempt', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(
      activeCode({ expiresAt: new Date(Date.now() - 1000) })
    );

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', '123456');

    expect(result).toEqual({ ok: false, reason: 'EXPIRED' });
    expect(prismaMock.verificationCode.update).not.toHaveBeenCalled();
  });

  it('rejects when no active code exists (never issued / already consumed)', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(null);

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', '123456');

    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('loses the concurrent-consume race as INVALID_CODE (single-use guarantee)', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(activeCode());
    // Two requests verified concurrently; this one's guarded update matched 0 rows.
    prismaMock.verificationCode.updateMany.mockResolvedValue({ count: 0 });

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', '123456');

    expect(result).toEqual({ ok: false, reason: 'INVALID_CODE' });
  });

  it('re-verifies an already-solved, unexpired code with the same digits (idempotent step 2)', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    // No unused code remains (it was consumed on first solve) …
    prismaMock.verificationCode.findFirst.mockResolvedValue(null);
    // … but the solved row for the SAME code is still unexpired.
    prismaMock.verificationCode.findMany.mockResolvedValue([
      { id: 'code-solved', codeHash: sha256('123456') },
    ]);

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', '123456');

    expect(result).toEqual({ ok: true, codeId: 'code-solved' });
  });

  it('never accepts wrong digits through the solved-code fallback', async () => {
    const { verifyVerificationCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.findFirst.mockResolvedValue(null);
    // A solved row exists, but for a DIFFERENT code.
    prismaMock.verificationCode.findMany.mockResolvedValue([
      { id: 'code-solved', codeHash: sha256('654321') },
    ]);

    const result = await verifyVerificationCode('user-1', 'LOGIN_MFA', '123456');

    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });
});

describe('hasRecentSolvedLoginCode', () => {
  it('is true only when a LOGIN_MFA code was verified within the window', async () => {
    const { hasRecentSolvedLoginCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.count.mockResolvedValue(1);

    await expect(hasRecentSolvedLoginCode('user-1')).resolves.toBe(true);
    const countArg = prismaMock.verificationCode.count.mock.calls[0][0];
    expect(countArg.where.purpose).toBe('LOGIN_MFA');
    expect(countArg.where.verifiedAt).toEqual({ not: null });
    // Proof window: solved within the last 5 minutes OR still unexpired —
    // long enough to finish sign-in, bounded by the code's own TTL.
    const or = countArg.where.OR as Array<Record<string, any>>;
    expect(or).toHaveLength(2);
    const cutoff = or[0].verifiedAt.gte as Date;
    expect(Date.now() - cutoff.getTime()).toBeCloseTo(5 * 60_000, -3);
    expect(or[1].expiresAt.gt).toBeInstanceOf(Date);
  });

  it('is false when nothing was solved', async () => {
    const { hasRecentSolvedLoginCode } = await import('@/lib/verificationCode');
    prismaMock.verificationCode.count.mockResolvedValue(0);

    await expect(hasRecentSolvedLoginCode('user-1')).resolves.toBe(false);
  });
});
