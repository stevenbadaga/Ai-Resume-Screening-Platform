import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requireAuth } from '@/lib/auth';
import { stageChangeSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager']);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(stageChangeSchema, body);
    if (error) return error;

    const { applicationId, newStage, newStatus } = data;

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

    // Determine status mapping
    let status = newStatus || existingApp.status;
    if (newStage === 'INTERVIEW_SCHEDULED') status = 'INTERVIEW';
    if (newStage === 'OFFERED') status = 'OFFER';
    if (newStage === 'HIRED') status = 'HIRED';
    if (newStage === 'REJECTED') status = 'REJECTED';

    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        stage: newStage,
        status: status
      }
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

    // Log Audit Trail
    await logAuditEvent({
      action: 'CANDIDATE_STAGE_CHANGED',
      actorId: auth.user.id,
      affectedRecordId: applicationId,
      previousValues: { stage: existingApp.stage, status: existingApp.status },
      newValues: { stage: newStage, status, candidateName: `${existingApp.candidate.firstName} ${existingApp.candidate.lastName}`, jobTitle: existingApp.job.title }
    });

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error: any) {
    console.error('Update stage error:', error);
    // SECURITY: Never leak internal error details
    return safeErrorResponse('Failed to update candidate stage');
  }
}