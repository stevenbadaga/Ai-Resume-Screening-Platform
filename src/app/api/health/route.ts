import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { resumeQueue } from '@/lib/queue';

/**
 * Operational health endpoint (spec §6.12: administrators must be able to view
 * processing health, failed background tasks, notification failures, storage
 * status, and integration status without exposing secrets).
 *
 *  - Unauthenticated GET returns only a minimal liveness payload (safe for
 *    load balancers, leaks nothing).
 *  - Authenticated Admin / ComplianceAuditor GET returns the full operational
 *    detail. Every check reports booleans/counts — never secret values.
 */

export async function GET() {
  try {
    const auth = await requirePermission(Permission.ViewAuditLog);

    // Liveness for load balancers / uptime probes.
    if (auth.error) {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    const [database, queue, storage, processing, communications] = await Promise.all([
      checkDatabase(),
      checkQueue(),
      checkStorage(),
      checkProcessing(),
      checkCommunications(),
    ]);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
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
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
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
  const dir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
  const probe = path.join(dir, `.health-probe-${Date.now()}`);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(probe, 'ok');
    await fs.unlink(probe);
    return { writable: true, path: dir };
  } catch {
    return { writable: false, path: dir };
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
