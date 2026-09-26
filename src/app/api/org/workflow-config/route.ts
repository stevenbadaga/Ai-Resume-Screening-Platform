import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse, validateBody } from '@/lib/validation';
import { z } from 'zod/v4';

/**
 * Spec §6.12 — administration & configuration.
 *
 * Authorized administrators configure the organization-wide recruitment
 * workflow: decision reason catalog, recruitment stages, job categories,
 * scoring boundaries, and organization branding. Every change records the
 * old value, new value, actor, and time in the audit ledger (§6.12) via
 * logAuditEvent.
 *
 * Stored as JSON on Organization.workflowConfig. Shape (all optional keys —
 * omitted keys keep their previous value):
 * {
 *   "decisionReasons": [{ "code": "LACKS_EXPERIENCE", "label": "Lacks required experience" }],
 *   "stages": ["NEW", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED", "REJECTED", "WITHDRAWN"],
 *   "jobCategories": ["Engineering", "Data", "Operations"],
 *   "scoringBoundaries": { "strongMatchPct": 80, "reviewPct": 50 },
 *   "branding": { "displayName": "Acme Talent", "logoUrl": "", "primaryColor": "#4f46e5" }
 * }
 */

const reasonSchema = z.object({
  code: z.string().min(1).max(100),
  label: z.string().min(1).max(300),
});

const workflowConfigSchema = z.object({
  decisionReasons: z.array(reasonSchema).max(200).optional(),
  stages: z.array(z.string().min(1).max(100)).max(50).optional(),
  jobCategories: z.array(z.string().min(1).max(200)).max(200).optional(),
  scoringBoundaries: z
    .object({
      strongMatchPct: z.coerce.number().min(0).max(100).optional(),
      reviewPct: z.coerce.number().min(0).max(100).optional(),
    })
    .optional(),
  branding: z
    .object({
      displayName: z.string().max(200).optional(),
      logoUrl: z.string().max(2000).optional(),
      primaryColor: z.string().max(30).optional(),
    })
    .optional(),
});

function parseConfig(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.organizationId },
      select: { workflowConfig: true, branding: true, retentionPolicy: true },
    });

    return NextResponse.json({
      workflowConfig: parseConfig(org?.workflowConfig),
      branding: parseConfig(org?.branding),
    });
  } catch (error) {
    console.error('Workflow config GET error:', error);
    return safeErrorResponse('Failed to load workflow configuration');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requirePermission(Permission.ManageTeam);
    if (auth.error) return auth.error;

    const { data, error } = validateBody(workflowConfigSchema, await req.json());
    if (error) return error;

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.organizationId },
      select: { workflowConfig: true, branding: true },
    });

    const previousConfig = parseConfig(org?.workflowConfig);
    const previousBranding = parseConfig(org?.branding);

    const nextConfig = {
      ...previousConfig,
      ...(data.decisionReasons !== undefined ? { decisionReasons: data.decisionReasons } : {}),
      ...(data.stages !== undefined ? { stages: data.stages } : {}),
      ...(data.jobCategories !== undefined ? { jobCategories: data.jobCategories } : {}),
      ...(data.scoringBoundaries !== undefined
        ? { scoringBoundaries: { ...((previousConfig.scoringBoundaries as object) ?? {}), ...data.scoringBoundaries } }
        : {}),
    };

    // Branding lives on its own Organization column (per the data model);
    // keep the two surfaces consistent from this single endpoint.
    const nextBranding =
      data.branding !== undefined ? { ...previousBranding, ...data.branding } : previousBranding;

    await prisma.$transaction(
      (tx) =>
        Promise.all([
          tx.organization.update({
            where: { id: auth.user.organizationId },
            data: { workflowConfig: JSON.stringify(nextConfig) },
          }),
          data.branding !== undefined
            ? tx.organization.update({
                where: { id: auth.user.organizationId },
                data: { branding: JSON.stringify(nextBranding) },
              })
            : Promise.resolve(null),
        ]),
      { isolationLevel: 'Serializable' }
    );

    // §6.12: configuration changes that can affect screening or decisions
    // must record the old value, new value, actor, and time.
    await logAuditEvent({
      action: 'WORKFLOW_CONFIG_UPDATED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      previousValues: { workflowConfig: previousConfig, branding: previousBranding },
      newValues: { workflowConfig: nextConfig, branding: nextBranding },
    });

    return NextResponse.json({ success: true, workflowConfig: nextConfig, branding: nextBranding });
  } catch (error) {
    console.error('Workflow config PUT error:', error);
    return safeErrorResponse('Failed to save workflow configuration');
  }
}
