import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    if (!userId || (role !== 'Admin' && role !== 'Recruiter' && role !== 'Hiring Manager')) {
      return NextResponse.json({ error: 'Unauthorized to change candidate stage' }, { status: 401 });
    }

    const { applicationId, newStage, newStatus } = await req.json();

    if (!applicationId || !newStage) {
      return NextResponse.json({ error: 'Missing applicationId or newStage' }, { status: 400 });
    }

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
      actorId: userId,
      affectedRecordId: applicationId,
      previousValues: { stage: existingApp.stage, status: existingApp.status },
      newValues: { stage: newStage, status, candidateName: `${existingApp.candidate.firstName} ${existingApp.candidate.lastName}`, jobTitle: existingApp.job.title }
    });

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error: any) {
    console.error('Update stage error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update candidate stage' }, { status: 500 });
  }
}