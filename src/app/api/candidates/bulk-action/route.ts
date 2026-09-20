import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse, validateBody } from '@/lib/validation';
import { z } from 'zod/v4';

const bulkActionSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1, 'Select at least one candidate application').max(50),
  action: z.enum(['SHORTLIST', 'ADVANCE', 'HOLD', 'REJECT', 'WITHDRAW', 'REVIEW']),
  reason: z.string().min(1, 'A mandatory reason is required for bulk decisions').max(5000),
  // §6.12: bulk decisions are critical actions and must require explicit
  // confirmation — the client must send confirm: "true".
  confirm: z.literal('true', { message: 'Bulk actions require explicit confirmation' }),
});

export async function POST(req: Request) {
  try {
    const auth = await requirePermission(Permission.MakeHiringDecisions);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { data, error } = validateBody(bulkActionSchema, body);
    if (error) return error;

    const { applicationIds, action, reason } = data;

    // Verify all applications belong to the user's organization (spec §6.1 tenant boundary)
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        job: { organizationId: auth.user.organizationId },
      },
      include: {
        job: true,
        candidate: true,
      },
    });

    if (applications.length !== applicationIds.length) {
      return NextResponse.json(
        { error: 'One or more applications were not found or access is restricted' },
        { status: 404 }
      );
    }

    // Map action to target stage and status (consistent with individual decision routes)
    let newStage = 'SCREENING';
    let newStatus = 'ACTIVE';

    switch (action) {
      case 'SHORTLIST':
        newStage = 'SHORTLISTED';
        newStatus = 'ACTIVE';
        break;
      case 'ADVANCE':
        newStage = 'INTERVIEW_SCHEDULED';
        newStatus = 'INTERVIEW';
        break;
      case 'HOLD':
        newStage = 'ON_HOLD';
        newStatus = 'ACTIVE';
        break;
      case 'REJECT':
        newStage = 'REJECTED';
        newStatus = 'REJECTED';
        break;
      case 'WITHDRAW':
        newStage = 'WITHDRAWN';
        newStatus = 'WITHDRAWN';
        break;
      case 'REVIEW':
        newStage = 'NEEDS_REVIEW';
        newStatus = 'ACTIVE';
        break;
    }

    // Execute atomic bulk update and decision record creation (spec §6.3, §6.7)
    await prisma.$transaction(async (tx) => {
      for (const app of applications) {
        await tx.recruitmentDecision.create({
          data: {
            applicationId: app.id,
            actorId: auth.user.id,
            humanAction: 'BULK_DECISION_RECORDED',
            decisionType: action,
            reason: `[BULK_ACTION] ${reason.trim()}`,
            previousStage: app.stage,
            newStage,
          },
        });

        await tx.application.update({
          where: { id: app.id },
          data: { stage: newStage, status: newStatus },
        });
      }
    });

    await logAuditEvent({
      action: 'CANDIDATE_BULK_ACTION',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: applicationIds.join(','),
      previousValues: {
        count: applications.length,
        previousStages: applications.map((a) => a.stage),
      },
      newValues: {
        action,
        newStage,
        newStatus,
        reason: reason.trim(),
        count: applications.length,
      },
    });

    return NextResponse.json({
      success: true,
      count: applications.length,
      action,
      newStage,
      newStatus,
    });
  } catch (error) {
    console.error('Candidate bulk action error:', error);
    return safeErrorResponse('Failed to execute bulk candidate action');
  }
}
