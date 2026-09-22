import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse, validateBody, rubricUpdateSchema } from '@/lib/validation';

const VALID_STATUSES = new Set(['DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED']);

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REVIEW'],
  REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['ARCHIVED'],
  ARCHIVED: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ManageRubrics);
    if (auth.error) return auth.error;

    const { id: jobId } = await params;
    const body = await req.json();
    const { rubricId, newStatus, changeReason } = body as {
      rubricId: string;
      newStatus: string;
      changeReason?: string;
    };

    if (!rubricId || !newStatus) {
      return NextResponse.json({ error: 'rubricId and newStatus are required' }, { status: 400 });
    }
    if (!VALID_STATUSES.has(newStatus)) {
      return NextResponse.json({ error: 'Invalid rubric status' }, { status: 400 });
    }
    if (newStatus === 'APPROVED' && !changeReason?.trim()) {
      return NextResponse.json({ error: 'An approval reason is required' }, { status: 400 });
    }

    // Verify job belongs to this org
    const job = await prisma.jobRequisition.findFirst({
      where: { id: jobId, organizationId: auth.user.organizationId },
    });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const rubric = await prisma.rubric.findFirst({
      where: { id: rubricId, jobId },
    });
    if (!rubric) return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });

    const allowed = VALID_TRANSITIONS[rubric.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition rubric from ${rubric.status} to ${newStatus}` },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextRubric = await tx.rubric.update({
        where: { id: rubricId },
        data: {
          status: newStatus,
          changeReason: changeReason?.trim() ?? null,
          version: newStatus === 'APPROVED' ? { increment: 1 } : undefined,
        },
        include: { criteria: true },
      });

      if (newStatus === 'APPROVED') {
        await tx.jobRequisition.update({
          where: { id: jobId },
          data: { status: 'OPEN' },
        });
      } else if (newStatus === 'ARCHIVED') {
        await tx.jobRequisition.update({
          where: { id: jobId },
          data: { status: 'CLOSED' },
        });
      }

      return nextRubric;
    });

    await logAuditEvent({
      action: 'RUBRIC_STATUS_CHANGED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: rubricId,
      previousValues: { status: rubric.status, version: rubric.version },
      newValues: { status: newStatus, version: updated.version, changeReason },
    });

    return NextResponse.json({ success: true, rubric: updated });
  } catch (error) {
    console.error('Rubric approval error:', error);
    return safeErrorResponse('Failed to update rubric status');
  }
}

/**
 * §6.2: edit a rubric's criteria.
 *  - DRAFT / REVIEW rubrics are edited in place (change recorded in the audit
 *    ledger with previous and new values).
 *  - APPROVED rubrics are immutable: an edit creates a NEW version in DRAFT
 *    state with a mandatory change reason, while the approved version and all
 *    historical screening results remain untouched. The replacement takes
 *    effect for official screening only after it passes the normal
 *    draft → review → approved flow.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ManageRubrics);
    if (auth.error) return auth.error;

    const { id: jobId } = await params;
    const body = await req.json();
    const { data, error } = validateBody(rubricUpdateSchema, body);
    if (error) return error;

    if (data.criteria.reduce((sum, c) => sum + c.weight, 0) <= 0) {
      return NextResponse.json({ error: 'Rubric weighting must total a positive value' }, { status: 400 });
    }

    // Org-scoped job lookup (§6.1 tenant boundary)
    const job = await prisma.jobRequisition.findFirst({
      where: { id: jobId, organizationId: auth.user.organizationId },
    });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const rubric = await prisma.rubric.findFirst({
      where: { id: data.rubricId, jobId },
      include: { criteria: true },
    });
    if (!rubric) return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    if (rubric.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Archived rubrics cannot be edited' }, { status: 409 });
    }

    const nextCriteria = data.criteria.map((c) => ({
      category: c.category ?? 'Skill',
      description: c.description ?? c.name ?? c.category ?? 'Criterion',
      isRequired: c.isRequired,
      weight: c.weight,
      threshold: c.threshold ?? null,
      evidenceRules: c.evidenceRules ?? null,
    }));

    // ── Immutable approved rubric → new version (§6.2) ──
    if (rubric.status === 'APPROVED') {
      if (!data.changeReason?.trim()) {
        return NextResponse.json(
          { error: 'A change reason is required when editing an approved rubric' },
          { status: 400 }
        );
      }

      const newVersion = await prisma.$transaction(async (tx) => {
        const created = await tx.rubric.create({
          data: {
            jobId,
            version: rubric.version + 1,
            status: 'DRAFT',
            changeReason: data.changeReason!.trim(),
            criteria: { create: nextCriteria },
          },
          include: { criteria: true },
        });
        return created;
      });

      await logAuditEvent({
        action: 'RUBRIC_NEW_VERSION_CREATED',
        actorId: auth.user.id,
        organizationId: auth.user.organizationId,
        affectedRecordId: rubric.id,
        previousValues: {
          rubricId: rubric.id,
          version: rubric.version,
          status: rubric.status,
          criteriaCount: rubric.criteria.length,
        },
        newValues: {
          rubricId: newVersion.id,
          version: newVersion.version,
          status: newVersion.status,
          criteriaCount: newVersion.criteria.length,
          changeReason: data.changeReason.trim(),
          editor: auth.user.email,
        },
      });

      return NextResponse.json({ success: true, rubric: newVersion, supersededRubricId: rubric.id }, { status: 201 });
    }

    // ── DRAFT / REVIEW: edit in place, audit the change ──
    const updated = await prisma.$transaction(async (tx) => {
      await tx.criterion.deleteMany({ where: { rubricId: rubric.id } });
      return tx.rubric.update({
        where: { id: rubric.id },
        data: {
          changeReason: data.changeReason?.trim() ?? rubric.changeReason,
          criteria: { create: nextCriteria },
        },
        include: { criteria: true },
      });
    });

    await logAuditEvent({
      action: 'RUBRIC_CRITERIA_UPDATED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: rubric.id,
      previousValues: {
        status: rubric.status,
        criteriaCount: rubric.criteria.length,
        criteria: rubric.criteria.map((c) => ({ description: c.description, isRequired: c.isRequired, weight: c.weight })),
      },
      newValues: {
        status: updated.status,
        criteriaCount: updated.criteria.length,
        criteria: updated.criteria.map((c) => ({ description: c.description, isRequired: c.isRequired, weight: c.weight })),
        changeReason: data.changeReason?.trim(),
      },
    });

    return NextResponse.json({ success: true, rubric: updated });
  } catch (error) {
    console.error('Rubric edit error:', error);
    return safeErrorResponse('Failed to update rubric criteria');
  }
}
