import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requireAuth } from '@/lib/auth';
import { overrideBodySchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager']);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(overrideBodySchema, body);
    if (error) return error;

    const { assessmentId, newResult, rationale, applicationId, newScore, reason } = data;

    // If payload contains applicationId and newScore (direct score override)
    if (applicationId && (newScore !== undefined || reason)) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: true,
          screeningRuns: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      if (application.job.organizationId !== auth.user.organizationId) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      const latestRun = application.screeningRuns[0];
      if (!latestRun) {
        return NextResponse.json({ error: 'No screening result exists for this application' }, { status: 409 });
      }

      const previousScore = latestRun.effectiveResult ?? latestRun.totalResult;
      await prisma.screeningRun.update({
        where: { id: latestRun.id },
        data: { effectiveResult: newScore ?? previousScore }
      });

      await logAuditEvent({
        action: 'HUMAN_SCORE_OVERRIDE',
        actorId: auth.user.id,
        affectedRecordId: applicationId,
        newValues: { score: newScore, reason: reason || rationale }
      });

      return NextResponse.json({ success: true, message: 'Score recalibrated successfully' });
    }

    if (!assessmentId || !newResult || !rationale) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assessment = await prisma.criterionAssessment.findUnique({
      where: { id: assessmentId },
      include: { screeningRun: { include: { application: { include: { job: true } } } } }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.screeningRun.application.job.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const correctionString = `${newResult}|${rationale}`;

    const updatedAssessment = await prisma.criterionAssessment.update({
      where: { id: assessmentId },
      data: {
        reviewerCorrection: correctionString,
        effectiveResult: newResult
      }
    });

    await logAuditEvent({
      action: 'CRITERION_OVERRIDE',
      actorId: auth.user.id,
      affectedRecordId: assessmentId,
      previousValues: { result: assessment.result },
      newValues: { reviewerCorrection: correctionString }
    });

    return NextResponse.json({
      success: true,
      assessment: updatedAssessment
    });
  } catch (error: any) {
    console.error('Error overriding decision:', error);
    return safeErrorResponse('Internal server error');
  }
}