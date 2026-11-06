import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { resumeQueue } from '@/lib/queue';
import { getStorageStatusSummary } from '@/lib/storage';

/**
 * Operational health checks (spec §6.12: administrators must be able to view
 * processing health, failed background tasks, notification failures, storage
 * status, and integration status without exposing secrets).
 *
 * Shared between the /api/health endpoint (machine-readable) and the
 * /dashboard/system-health page (human-readable). Every check reports
 * booleans/counts — never secret values.
 */

export interface HealthChecks {
  database: { reachable: boolean; latencyMs: number | null };
  queue: {
    reachable: boolean;
    waiting: number | null;
    active: number | null;
    failed: number | null;
    completed: number | null;
  };
  storage: { writable: boolean; backend: string; configured: boolean; path?: string | null; bucket?: string | null };
  processing: { available: boolean; resumesByStatus: Record<string, number> | null };
  communications: { available: boolean; failed: number | null; sent: number | null; pending: number | null };
  integrations: {
    openaiConfigured: boolean;
    emailProviderConfigured: boolean;
    redisConfigured: boolean;
    malwareScanner: string;
  };
}

export async function collectHealthChecks(): Promise<HealthChecks> {
  const [database, queue, storage, processing, communications] = await Promise.all([
    checkDatabase(),
    checkQueue(),
    checkStorage(),
    checkProcessing(),
    checkCommunications(),
  ]);

  return {
    database,
    queue,
    storage,
    processing,
    communications,
    // Integrations are reported as configured/not — never with key values.
    integrations: {
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      emailProviderConfigured: Boolean(process.env.BREVO_API_KEY || process.env.RESEND_API_KEY),
      redisConfigured: Boolean(process.env.REDIS_URL || process.env.REDIS_HOST),
      malwareScanner: process.env.CLAMAV_HOST ? 'clamav' : 'signature-only',
    },
  };
}

async function checkDatabase() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { reachable: true, latencyMs: Date.now() - started };
  } catch {
    return { reachable: false, latencyMs: null };
  }
}

async function checkQueue() {
  try {
    const counts = await resumeQueue.getJobCounts('waiting', 'active', 'failed', 'completed');
    return {
      reachable: true,
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      // §6.12: failed background tasks must be visible to administrators.
      failed: counts.failed ?? 0,
      completed: counts.completed ?? 0,
    };
  } catch {
    return { reachable: false, waiting: null, active: null, failed: null, completed: null };
  }
}

async function checkStorage() {
  const status = getStorageStatusSummary();

  if (status.mode === 'cloud') {
    return {
      writable: true,
      backend: 'supabase',
      configured: true,
      bucket: status.bucket ?? 'resumes',
      path: null,
    };
  }

  const dir = status.path ?? path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_PATH || './uploads');
  const probe = path.join(dir, `.health-probe-${Date.now()}`);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(probe, 'ok');
    await fs.unlink(probe);
    return { writable: true, backend: 'local', configured: false, path: dir };
  } catch {
    return { writable: false, backend: 'local', configured: false, path: dir };
  }
}

async function checkProcessing() {
  try {
    const statuses = await prisma.resumeDocument.groupBy({
      by: ['processingStatus'],
      _count: { _all: true },
    });
    const byStatus: Record<string, number> = {};
    for (const group of statuses) {
      byStatus[group.processingStatus] = group._count._all;
    }
    return { available: true, resumesByStatus: byStatus };
  } catch {
    return { available: false, resumesByStatus: null };
  }
}

async function checkCommunications() {
  try {
    const [failed, sent, pending] = await Promise.all([
      prisma.communication.count({ where: { deliveryState: 'FAILED' } }),
      prisma.communication.count({ where: { deliveryState: 'SENT' } }),
      prisma.communication.count({ where: { deliveryState: 'PENDING' } }),
    ]);
    // §6.12: notification failures must be visible for follow-up.
    return { available: true, failed, sent, pending };
  } catch {
    return { available: false, failed: null, sent: null, pending: null };
  }
}
