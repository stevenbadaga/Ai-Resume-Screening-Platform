import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { collectHealthChecks } from '@/lib/healthChecks';

/**
 * Operational health endpoint (spec §6.12: administrators must be able to view
 * processing health, failed background tasks, notification failures, storage
 * status, and integration status without exposing secrets).
 *
 *  - Unauthenticated GET returns only a minimal liveness payload (safe for
 *    load balancers, leaks nothing).
 *  - Authenticated Admin / ComplianceAuditor GET returns the full operational
 *    detail (same checks as the /dashboard/system-health page).
 */

export async function GET() {
  try {
    const auth = await requirePermission(Permission.ViewAuditLog);

    // Liveness for load balancers / uptime probes.
    if (auth.error) {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    const checks = await collectHealthChecks();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
