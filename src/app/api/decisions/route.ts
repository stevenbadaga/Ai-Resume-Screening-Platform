import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/auditLogger';
import { sendRecordedEmail } from '@/lib/emailService';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { decisionSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // Require authentication with appropriate roles
    const auth = await requirePermission(Permission.MakeHiringDecisions);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(decisionSchema, body);
    if (error) return error;

    const { applicationId, decision, reasonCode, rationale } = data;

    const existingApplication = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { candidate: true, job: true }
    });

    if (!existingApplication || existingApplication.job.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Determine the new application stage and status based on the decision
    let stage = existingApplication.stage;
    let status = existingApplication.status;

    switch (decision) {
      case 'SHORTLIST':
        stage = 'SHORTLISTED';
        status = 'ACTIVE';
        break;
      case 'ADVANCE':
      case 'ADVANCED':
        stage = 'INTERVIEW_SCHEDULED';
        status = 'INTERVIEW';
        break;
      case 'HOLD':
        stage = 'ON_HOLD';
        status = 'ACTIVE';
        break;
      case 'REJECT':
      case 'REJECTED':
        stage = 'REJECTED';
        status = 'REJECTED';
        break;
      case 'WITHDRAW':
        stage = 'WITHDRAWN';
        status = 'WITHDRAWN';
        break;
      case 'REVIEW':
        stage = 'NEEDS_REVIEW';
        status = 'ACTIVE';
        break;
      default:
        stage = 'SCREENING';
        status = 'ACTIVE';
    }

    const fullReason = reasonCode ? `[${reasonCode}] ${rationale}` : rationale;

    // Transaction to ensure atomicity
    const [_, application] = await prisma.$transaction([
      // 1. Create the Decision Audit Record
      prisma.recruitmentDecision.create({
        data: {
          applicationId,
          actorId: auth.user.id,
          humanAction: 'HUMAN_DECISION_RECORDED',
          decisionType: decision,
          reason: fullReason,
          previousStage: existingApplication.stage,
          newStage: stage
        }
      }),
      // 2. Update Application Stage & Status
      prisma.application.update({
        where: { id: applicationId },
        data: { stage, status },
        include: {
          candidate: true,
          job: true
        }
      })
    ]);

    // Send rejection email, recording the real delivery outcome (spec §6.9).
    // Failure is recorded on the Communication row; the decision itself still succeeds.
    let emailDelivered: boolean | undefined;
    if (decision === 'REJECT' || decision === 'REJECTED') {
      const delivery = await sendRecordedEmail({
        to: application.candidate.email,
        template: 'REJECTION_FEEDBACK',
        data: {
          candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`.trim(),
          jobTitle: application.job.title
        },
        applicationId: application.id,
        jobId: application.job.id,
        senderId: auth.user.id
      });
      emailDelivered = delivery.delivered;
    }

    // In-app candidate notification if candidate has a portal account
    const candidateUser = await prisma.user.findUnique({
      where: { email: application.candidate.email }
    });

    if (candidateUser) {
      await prisma.notification.create({
        data: {
          userId: candidateUser.id,
          title: `Application Update: ${application.job.title}`,
          message: `Your application stage has been updated to ${stage}.`,
          type: 'APPLICATION_STATUS',
          link: '/dashboard/my-applications'
        }
      });
    }

    // 3. Write Audit Log with Organization Context
    await logAuditEvent({
      action: 'RECRUITMENT_DECISION_MADE',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: applicationId,
      previousValues: { stage: existingApplication.stage, status: existingApplication.status },
      newValues: { decision, reasonCode, rationale, stage, status, candidateName: `${application.candidate.firstName} ${application.candidate.lastName}` }
    });

    return NextResponse.json({
      success: true,
      stage,
      status,
      decision,
      emailDelivered
    });
  } catch (error) {
    console.error('Decision error:', error);
    return safeErrorResponse('Failed to save decision');
  }
}
