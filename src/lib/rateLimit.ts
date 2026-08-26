/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance deployments (dev/staging).
 * For production multi-instance, replace with Redis-backed limiter.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 600_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 300_000);

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

/**
 * Check whether a request from the given identifier is allowed.
 * @param identifier – typically IP address or user ID
 * @param config – rate limit configuration
 */
export function checkRateLimit(
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
  /** Login: 10 attempts per 15 minutes */
  login: { maxRequests: 10, windowSeconds: 900 } as RateLimitConfig,
  /** Signup: 5 per 15 minutes */
  signup: { maxRequests: 5, windowSeconds: 900 } as RateLimitConfig,
  /** File upload: 10 per 5 minutes */
  upload: { maxRequests: 10, windowSeconds: 300 } as RateLimitConfig,
  /** Support chatbot: 30 messages per minute */
  support: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
  /** Generic API: 60 requests per minute */
  api: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
} as const;
