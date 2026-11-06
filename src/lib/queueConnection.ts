import type { ConnectionOptions } from 'bullmq';

/**
 * BullMQ Redis connection options shared by the server-side queue and the
 * worker.
 *
 * Server-side (`resumeQueue.add`) uses fail-fast settings: the intake path
 * treats a queue outage as a degraded-but-recoverable state (the application
 * is saved and staff can retry — see intakeService + /api/upload/retry), so
 * the request must not hang on retry loops against an unreachable Redis.
 *
 * The worker deliberately uses its own long-lived retry policy: it must
 * outlive transient outages and pick work back up when Redis returns.
 */
export function buildQueueConnection(role: 'server' | 'worker'): ConnectionOptions {
  let connection: ConnectionOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
  };

  if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    connection = {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    };
  }

  // TLS is required for Upstash, but ioredis ignores the URL scheme —
  // enforce it by host so `rediss://` credentials always land on a TLS socket.
  if (connection.host?.endsWith('.upstash.io')) connection.tls = {};

  if (role === 'server') {
    // Fail fast: a dead queue must surface as an immediate error to the
    // caller (which records screeningQueued=false and tells the applicant),
    // never as a hung request.
    return {
      ...connection,
      connectTimeout: 5_000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      // Stop reconnecting after the first failure — each HTTP request creates
      // fresh work, so the next enqueue gets a brand-new connection attempt.
      retryStrategy: (times: number) => (times > 1 ? null : 500),
      reconnectOnError: () => false,
    };
  }

  // Worker: stay alive through transient outages (long backoff, keep retrying).
  return {
    ...connection,
    connectTimeout: 10_000,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => Math.min(times * 2_000, 30_000),
  };
}
