import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/auditLogger';
import { sendMockEmail } from '@/lib/mockEmailService';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { decisionSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // Require authentication with appropriate roles
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager']);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(decisionSchema, body);
    if (error) return error;

    const { applicationId, decision, rationale } = data;

    const existingApplication = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true }
    });

    if (!existingApplication || existingApplication.job.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Determine the new application stage based on the decision
    const stage = decision === 'ADVANCED' ? 'SCREENING' : 'REJECTED';

    // Transaction to ensure atomicity
    const [_, application] = await prisma.$transaction([
      // 1. Create the Decision Audit Record
      prisma.recruitmentDecision.create({
        data: {
          applicationId,
          actorId: auth.user.id,
          humanAction: 'DECISION_MADE',
          decisionType: decision,
          reason: rationale,
          previousStage: existingApplication.stage,
          newStage: stage
        }
      }),
      // 2. Update Application Stage
      prisma.application.update({
        where: { id: applicationId },
        data: { stage },
        include: {
          candidate: true,
          job: true
        }
      })
    ]);

    // Week 6: Send Rejection Email
    if (decision === 'REJECTED') {
      await sendMockEmail(
        application.candidate.email,
        'REJECTION',
        {
          candidateName: application.candidate.firstName,
          jobTitle: application.job.title
        },
        application.id
      );
    }

    // 3. Write Audit Log
    await logAuditEvent({
      action: 'RECRUITMENT_DECISION_MADE',
      actorId: auth.user.id,
      affectedRecordId: applicationId,
      newValues: { decision, rationale, stage }
    });

    return NextResponse.json({ success: true, stage });
  } catch (error) {
    console.error('Decision error:', error);
    return safeErrorResponse('Failed to save decision');
  }
}
