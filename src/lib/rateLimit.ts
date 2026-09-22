/**
 * Rate limiter.
 *
 * Backed by Redis (fixed-window counter via an atomic Lua script) when
 * REDIS_URL / REDIS_HOST is configured — safe for multi-instance deployments.
 * Falls back to an in-memory sliding window when Redis is not configured or
 * unreachable, so single-instance/dev deployments keep working without Redis.
 *
 * Availability note: on Redis failure the limiter fails OPEN (the request is
 * checked against the local fallback instead). Rate limiting should degrade
 * gracefully rather than take down auth and uploads.
 */

import type { Redis as RedisClient } from 'ioredis';

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale in-memory entries every 5 minutes.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 600_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 300_000);
// Do not keep the Node process alive just for this timer (matters for serverless / workers).
if (typeof cleanup.unref === 'function') cleanup.unref();

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

// ──────────────────────────────────────────────
// Redis backend (lazy singleton)
// ──────────────────────────────────────────────

type RedisLike = {
  // Atomic fixed-window counter: returns [hitsInWindow, ttlMilliseconds].
  eval(script: string, numKeys: number, key: string, arg: string): Promise<[number, number]>;
  quit(): Promise<unknown>;
};

let redisClient: RedisLike | null | undefined;

async function getRedisClient(): Promise<RedisLike | null> {
  if (redisClient !== undefined) return redisClient ?? null;

  try {
    const { default: RedisCtor } = await import('ioredis');
    let options: Record<string, unknown> | null = null;

    if (process.env.REDIS_URL) {
      const url = new URL(process.env.REDIS_URL);
      options = {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        tls: url.protocol === 'rediss:' ? {} : undefined,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false,
      };
    } else if (process.env.REDIS_HOST) {
      options = {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false,
      };
    }

    redisClient = (options ? new RedisCtor(options) : null) as unknown as RedisLike | null;
  } catch (error) {
    console.warn('Rate limiter: Redis unavailable, using in-memory fallback.', error);
    redisClient = null;
  }

  return redisClient;
}

// Fixed-window counter, atomic in Redis:
// returns [hitsInWindow, ttlMilliseconds] for the key.
const RATE_LIMIT_LUA = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {hits, ttl}
`;

async function checkRateLimitRedis(
  redis: RedisLike,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowMs = config.windowSeconds * 1000;
  const [hits, ttlMs] = await redis.eval(RATE_LIMIT_LUA, 1, key, String(windowMs));

  if (hits > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
    };
  }

  return { allowed: true, remaining: config.maxRequests - hits };
}

// ──────────────────────────────────────────────
// In-memory fallback (sliding window)
// ──────────────────────────────────────────────

function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Slide the window — remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
  };
}

/**
 * Check whether a request from the given identifier is allowed.
 * @param identifier – typically IP address or user ID
 * @param config – rate limit configuration
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = await getRedisClient();

  if (redis) {
    try {
      return await checkRateLimitRedis(redis, `ratelimit:${identifier}`, config);
    } catch (error) {
      console.warn(`Rate limiter: Redis check failed for "${identifier}", using in-memory fallback.`, error);
    }
  }

  return checkRateLimitMemory(identifier, config);
}

/**
 * Extract a rate-limit key from a Request object.
 * Uses x-forwarded-for, x-real-ip, or falls back to a constant.
 */
export function getRateLimitKey(req: Request, prefix = 'global'): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return `${prefix}:${ip}`;
}

/**
 * Pre-configured rate limit profiles for common use cases.
 */
export const RATE_LIMITS = {
  /**
   * Login: 30 attempts per 15 minutes per IP. Sized for real deployments
   * where an entire office shares one egress IP (and the limiter key falls
   * back to a constant when no proxy headers are present), while still
   * bounding online guessing to ~2 attempts/minute per source.
   */
  login: { maxRequests: 30, windowSeconds: 900 } as RateLimitConfig,
  /** Signup: 5 per 15 minutes */
  signup: { maxRequests: 5, windowSeconds: 900 } as RateLimitConfig,
  /** File upload: 10 per 5 minutes */
  upload: { maxRequests: 10, windowSeconds: 300 } as RateLimitConfig,
  /** Support chatbot: 30 messages per minute */
  support: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
  /** Generic API: 60 requests per minute */
  api: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
} as const;
