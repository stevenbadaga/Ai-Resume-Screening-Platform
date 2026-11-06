import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/validation';
import { resolveDecisionReasons } from '@/lib/decisionReasons';

/**
 * Spec §6.7 — the effective decision-reason catalog for the signed-in user's
 * organization (falls back to the built-in job-related defaults).
 *
 * Readable by any authenticated staff member so decision forms (recruiter,
 * hiring manager) always offer exactly the categories the organization has
 * approved — the admin-only workflow-config endpoint cannot serve this.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.organizationId },
      select: { workflowConfig: true },
    });

    let configured: unknown;
    try {
      configured = org?.workflowConfig ? JSON.parse(org.workflowConfig)?.decisionReasons : undefined;
    } catch {
      configured = undefined;
    }

    return NextResponse.json({ reasons: resolveDecisionReasons(configured) });
  } catch (error) {
    console.error('Decision reasons fetch error:', error);
    return safeErrorResponse('Failed to load decision reasons');
  }
}
