import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { canAccessDepartment, requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { stageChangeSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { statusForStage } from '@/lib/applicationStages';

export async function PATCH(req: Request) {
  try {
    const auth = await requirePermission(Permission.MakeHiringDecisions);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(stageChangeSchema, body);
    if (error) return error;

    const { applicationId, newStage, newStatus, reason } = data;

    const existingApp = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: true
      }
    });

    if (!existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (existingApp.job.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (!canAccessDepartment(auth.user, existingApp.job.department)) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Status is always derived from the canonical stage map — the caller
    // cannot set a contradictory status (§6.7 vocabulary integrity).
    const status = statusForStage(newStage);

    const updatedApp = await prisma.$transaction(async (tx) => {
      // §6.3: every stage change is recorded with actor, timestamp, previous
      // stage, new stage, and reason — as a first-class RecruitmentDecision.
      await tx.recruitmentDecision.create({
        data: {
          applicationId,
          actorId: auth.user.id,
          humanAction: 'STAGE_CHANGE_RECORDED',
          decisionType: 'STAGE_CHANGE',
          reason: reason.trim(),
          previousStage: existingApp.stage,
          newStage,
        },
      });

      return tx.application.update({
        where: { id: applicationId },
        data: {
          stage: newStage,
          status: status
        }
      });
    });

    // Notify Candidate if they have an associated User account
    const candidateUser = await prisma.user.findUnique({
      where: { email: existingApp.candidate.email }
    });

    if (candidateUser) {
      const stageLabels: Record<string, string> = {
        SHORTLISTED: 'Shortlisted for Review',
        INTERVIEW_SCHEDULED: 'Invited to Technical Interview',
        OFFERED: 'Job Offer Extended 🎉',
        HIRED: 'Hired & Offer Accepted! 🚀',
        REJECTED: 'Application Status Update'
      };

      await prisma.notification.create({
        data: {
          userId: candidateUser.id,
          title: `Status Update: ${existingApp.job.title}`,
          message: `Your application stage has been updated to: ${stageLabels[newStage] || newStage}.`,
          type: 'APPLICATION_STATUS',
          link: '/dashboard/my-applications'
        }
      });
    }

    // Log Audit Trail (old/new values, §6.12)
    await logAuditEvent({
      action: 'CANDIDATE_STAGE_CHANGED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: applicationId,
      previousValues: { stage: existingApp.stage, status: existingApp.status },
      newValues: { stage: newStage, status, reason: reason.trim(), candidateName: `${existingApp.candidate.firstName} ${existingApp.candidate.lastName}`, jobTitle: existingApp.job.title }
    });

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error: any) {
    console.error('Update stage error:', error);
    // SECURITY: Never leak internal error details
    return safeErrorResponse('Failed to update candidate stage');
  }
}