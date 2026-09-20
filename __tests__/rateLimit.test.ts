import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────
// Mock ioredis entirely — no real Redis needed.
// The mock's eval() simulates the same fixed-window
// counter contract that RATE_LIMIT_LUA implements:
// INCR + PEXPIRE on first hit, returns [hits, pttl].
// ─────────────────────────────────────────────

type EvalCall = { key: string; windowMs: number };

const evalCalls: EvalCall[] = [];
const expiryByRedisKey = new Map<string, number>(); // key → expiry (ms since epoch)
const countsByRedisKey = new Map<string, number>();

// Each test mutates this to control mock behavior.
let evalBehavior: 'ok' | 'error' = 'ok';

function resetMockState() {
  evalCalls.length = 0;
  expiryByRedisKey.clear();
  countsByRedisKey.clear();
  evalBehavior = 'ok';
}

vi.mock('ioredis', () => {
  class Redis {
    eval(script: string, numKeys: number, key: string, arg: string): Promise<[number, number]> {
      void script;
      void numKeys;
      if (evalBehavior === 'error') {
        return Promise.reject(new Error('ECONNREFUSED (simulated)'));
      }
      const windowMs = parseInt(arg, 10);
      evalCalls.push({ key, windowMs });

      const now = Date.now();
      // Expire the window if its TTL has elapsed (simulates PEXPIRE expiry).
      const expiresAt = expiryByRedisKey.get(key) ?? 0;
      if (expiresAt !== 0 && now >= expiresAt) {
        countsByRedisKey.delete(key);
        expiryByRedisKey.delete(key);
      }

      const hits = (countsByRedisKey.get(key) ?? 0) + 1;
      countsByRedisKey.set(key, hits);

      let ttl: number;
      if (hits === 1) {
        ttl = windowMs;
        expiryByRedisKey.set(key, now + windowMs);
      } else {
        ttl = Math.max(0, (expiryByRedisKey.get(key) ?? now) - now);
      }

      return Promise.resolve([hits, ttl]);
    }
    quit(): Promise<unknown> {
      return Promise.resolve('OK');
    }
  }

  return { default: Redis };
});

// Set AFTER the mock is registered; getRedisClient() only builds a client
// when REDIS_URL is present, so this forces the Redis-backed path.
process.env.REDIS_URL = 'redis://default:testpassword@localhost:6379';

import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const CONFIG = { maxRequests: 3, windowSeconds: 60 } as const;

// Unique identifier per test so counters never leak between tests.
let uniqueId = 0;
const nextIdentifier = () => `test-${++uniqueId}`;

describe('checkRateLimit — Redis-backed fixed window', () => {
  beforeEach(() => {
    resetMockState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the limit and reports decreasing remaining', async () => {
    const id = nextIdentifier();

    const first = await checkRateLimit(id, CONFIG);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2); // 3 − 1

    const second = await checkRateLimit(id, CONFIG);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);

    const third = await checkRateLimit(id, CONFIG);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it('blocks requests beyond the limit with a retryAfter hint', async () => {
    const id = nextIdentifier();

    for (let i = 0; i < CONFIG.maxRequests; i++) {
      const result = await checkRateLimit(id, CONFIG);
      expect(result.allowed).toBe(true);
    }

    const blocked = await checkRateLimit(id, CONFIG);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(CONFIG.windowSeconds);
  });

  it('resets the window after the TTL elapses', async () => {
    vi.useFakeTimers();
    const start = new Date('2026-01-01T00:00:00.000Z');
    vi.setSystemTime(start);

    const id = nextIdentifier();

    // Burn the whole window.
    for (let i = 0; i < CONFIG.maxRequests; i++) {
      expect((await checkRateLimit(id, CONFIG)).allowed).toBe(true);
    }
    expect((await checkRateLimit(id, CONFIG)).allowed).toBe(false);

    // Advance past the 60s window — the counter must expire.
    vi.setSystemTime(new Date(start.getTime() + CONFIG.windowSeconds * 1000 + 1));

    const afterReset = await checkRateLimit(id, CONFIG);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(CONFIG.maxRequests - 1);
  });

  it('keeps separate counters per identifier and prefixes the redis key', async () => {
    const idA = nextIdentifier();
    const idB = nextIdentifier();

    await checkRateLimit(idA, CONFIG);
    const resultB = await checkRateLimit(idB, CONFIG);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(CONFIG.maxRequests - 1);

    // All eval calls hit redis keys namespaced under ratelimit:<identifier>.
    for (const call of evalCalls) {
      expect(call.key.startsWith('ratelimit:test-')).toBe(true);
    }
  });

  it('sends the window in milliseconds to the Lua script', async () => {
    await checkRateLimit(nextIdentifier(), RATE_LIMITS.login);
    expect(evalCalls[0].windowMs).toBe(RATE_LIMITS.login.windowSeconds * 1000);
  });

  it('fails open to the in-memory fallback when Redis errors', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    evalBehavior = 'error';

    const id = nextIdentifier();
    // In-memory sliding window shares the same maxRequests contract.
    const results: Array<boolean> = [];
    for (let i = 0; i < CONFIG.maxRequests + 2; i++) {
      results.push((await checkRateLimit(id, CONFIG)).allowed);
    }

    // First 3 allowed, the rest blocked by the fallback.
    expect(results).toEqual([true, true, true, false, false]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Redis check failed'),
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });
});
