import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/auditLogger';
import { sendMockEmail } from '@/lib/mockEmailService';

import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { applicationId, decision, rationale } = await req.json();

    if (!applicationId || !decision || !rationale) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine the new application stage based on the decision
    const stage = decision === 'ADVANCED' ? 'SCREENING' : 'REJECTED';

    // Transaction to ensure atomicity
    const [_, application] = await prisma.$transaction([
      // 1. Create the Decision Audit Record
      prisma.recruitmentDecision.create({
        data: {
          applicationId,
          actorId: 'SYSTEM_USER', // TODO: Replace with authenticated user ID from Auth.js session
          humanAction: 'DECISION_MADE',
          decisionType: decision,
          reason: rationale,
          previousStage: 'UNKNOWN',
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
      actorId: 'SYSTEM_USER',
      affectedRecordId: applicationId,
      newValues: { decision, rationale, stage }
    });

    return NextResponse.json({ success: true, stage });
  } catch (error) {
    console.error('Decision error:', error);
    return NextResponse.json({ error: 'Failed to save decision' }, { status: 500 });
  }
}
