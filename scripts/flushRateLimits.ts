/**
 * Clears all rate-limit counters from Redis (keys: ratelimit:*).
 *
 * Use after changing RATE_LIMITS in a running deployment, or before test
 * runs that perform many logins from one IP. Never touches application data.
 *
 * Usage: npx tsx scripts/flushRateLimits.ts
 */
import 'dotenv/config';
import Redis from 'ioredis';

async function main() {
  let redis: Redis;
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 2 });
  } else {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });
  }

  let cursor = '0';
  let deleted = 0;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', 'ratelimit:*', 'COUNT', 200);
    cursor = next;
    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== '0');

  console.log(`Cleared ${deleted} rate-limit key(s) from Redis.`);
  redis.disconnect();
}

main().catch((e) => {
  console.error('Flush failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
