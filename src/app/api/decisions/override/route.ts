import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = session.user as any;
    const { assessmentId, newResult, rationale } = await req.json();

    if (!assessmentId || !newResult || !rationale) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assessment = await prisma.criterionAssessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Keep the original AI result intact in `result`, use `reviewerCorrection` to store the override
    // Format: "NEW_RESULT|Rationale text"
    const correctionString = `${newResult}|${rationale}`;

    const updatedAssessment = await prisma.criterionAssessment.update({
      where: { id: assessmentId },
      data: {
        reviewerCorrection: correctionString
      }
    });

    await logAuditEvent({
      action: 'AI_SCORE_OVERRIDDEN',
      actorId: user.id,
      affectedRecordId: assessmentId,
      previousValues: { originalResult: assessment.result },
      newValues: { overriddenResult: newResult, rationale }
    });

    return NextResponse.json({ success: true, updatedAssessment });
  } catch (error) {
    console.error('Error overriding AI score:', error);
    return NextResponse.json({ error: 'Failed to override score' }, { status: 500 });
  }
}
