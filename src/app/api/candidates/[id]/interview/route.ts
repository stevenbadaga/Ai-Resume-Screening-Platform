import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { interviewScheduleSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';
import { sendRecordedEmail } from '@/lib/emailService';
import { z } from 'zod/v4';

const rescheduleSchema = z.object({
  interviewId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(15).max(240),
  timezone: z.string().min(1).max(100).optional().default('UTC'),
});

const interviewScheduleWithInterviewersSchema = interviewScheduleSchema.extend({
  // Spec §6.8: authorized users must be able to assign interviewers when
  // scheduling. Must be staff users within the same organization.
  interviewerIds: z.array(z.string().uuid()).max(10).optional().default([]),
});

/**
 * Spec §6.8: notify interview participants of scheduling, rescheduling, or
 * cancellation. The interviewer must be in the same organization as the job.
 */
async function notifyInterviewers(
  interviewerIds: string[],
  organizationId: string,
  payload: { title: string; message: string; link: string }
) {
  if (interviewerIds.length === 0) return;
  const staff = await prisma.user.findMany({
    where: { id: { in: interviewerIds }, organizationId, accessStatus: 'ACTIVE' },
    select: { id: true },
  });
  if (staff.length === 0) return;
  await prisma.notification.createMany({
    data: staff.map((u) => ({
      userId: u.id,
      title: payload.title,
      message: payload.message,
      type: 'INTERVIEW_SCHEDULE',
      link: payload.link,
    })),
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(Permission.ViewScorecards);
  if (auth.error) return auth.error;

  const { id } = await params;

  // Spec §5 (Interviewer role): interviewers view only interview information
  // for interviews they are assigned to — not every application in the org.
  if (auth.user.role === 'Interviewer') {
    const participationCount = await prisma.interviewParticipant.count({
      where: { userId: auth.user.id, interview: { applicationId: id } },
    });
    if (participationCount === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
  }

  const application = await prisma.application.findFirst({
    where: { id, job: { organizationId: auth.user.organizationId } },
    include: { candidate: true, job: true, interviews: { include: { participants: true } } },
  });

  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  return NextResponse.json({ application });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ScheduleInterviews);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json();
    const { data, error } = validateBody(interviewScheduleWithInterviewersSchema, body);
    if (error) return error;

    const application = await prisma.application.findFirst({
      where: { id, job: { organizationId: auth.user.organizationId } },
      include: { job: true, candidate: true },
    });
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    // C5 FIX: Correct conflict detection — compare new slot against each existing interview's own duration
    const newStart = data.scheduledAt;
    const newEnd = new Date(newStart.getTime() + data.durationMinutes * 60_000);

    const existingInterviews = await prisma.interview.findMany({
      where: {
        status: { not: 'CANCELLED' },
        participants: { some: { userId: auth.user.id } },
        schedule: { not: null },
      },
    });

    for (const existing of existingInterviews) {
      if (!existing.schedule) continue;
      let existingDuration = 60; // default fallback minutes
      try {
        const details = existing.meetingDetails ? JSON.parse(existing.meetingDetails) : {};
        if (details.durationMinutes) existingDuration = details.durationMinutes;
      } catch { /* ignore parse errors */ }
      const existingEnd = new Date(existing.schedule.getTime() + existingDuration * 60_000);
      if (newStart < existingEnd && newEnd > existing.schedule) {
        return NextResponse.json({ error: 'The interviewer has a scheduling conflict' }, { status: 409 });
      }
    }

    // Spec §6.8: Candidate conflict detection across all their applications
    const candidateInterviews = await prisma.interview.findMany({
      where: {
        status: { not: 'CANCELLED' },
        application: { candidateId: application.candidateId },
        schedule: { not: null },
      },
    });

    for (const existing of candidateInterviews) {
      if (!existing.schedule) continue;
      let existingDuration = 60;
      try {
        const details = existing.meetingDetails ? JSON.parse(existing.meetingDetails) : {};
        if (details.durationMinutes) existingDuration = details.durationMinutes;
      } catch { /* ignore parse errors */ }
      const existingEnd = new Date(existing.schedule.getTime() + existingDuration * 60_000);
      if (newStart < existingEnd && newEnd > existing.schedule) {
        return NextResponse.json(
          { error: 'The candidate has an existing scheduled interview at this time' },
          { status: 409 }
        );
      }
    }

    // C13 FIX: Accept timezone from the validated request body (defaults to UTC)
    const timezone = data.timezone || 'UTC';

    // Spec §6.8: assigned interviewers must be active staff in this organization.
    const assignedInterviewerIds = Array.from(new Set(data.interviewerIds)).filter(
      (assignedId) => assignedId !== auth.user.id
    );

    const interview = await prisma.interview.create({
      data: {
        applicationId: id,
        schedule: data.scheduledAt,
        timezone,
        status: 'SCHEDULED',
        meetingDetails: JSON.stringify({ type: data.meetingType, durationMinutes: data.durationMinutes }),
        participants: {
          create: [
            { userId: auth.user.id },
            ...assignedInterviewerIds.map((userId) => ({ userId })),
          ],
        },
      },
      include: { participants: true },
    });

    await prisma.application.update({ where: { id }, data: { stage: 'INTERVIEW_SCHEDULED', status: 'INTERVIEW' } });

    // §6.8/§6.9: candidates must receive an approved invitation with schedule,
    // timezone and meeting details; the delivery outcome is recorded on the
    // Communication row for follow-up (no silent failures).
    const candidateDetails = JSON.parse(interview.meetingDetails || '{}');
    const invitation = await sendRecordedEmail({
      to: application.candidate.email,
      template: 'INTERVIEW_INVITATION',
      data: {
        candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`.trim(),
        jobTitle: application.job.title,
        schedule: data.scheduledAt.toISOString(),
        timezone,
        meetingLink: candidateDetails.meetingLink || candidateDetails.location || undefined,
      },
      applicationId: application.id,
      jobId: application.job.id,
      senderId: auth.user.id,
    });

    const candidateUser = await prisma.user.findUnique({
      where: { email: application.candidate.email },
    });
    if (candidateUser) {
      await prisma.notification.create({
        data: {
          userId: candidateUser.id,
          title: `Interview Invitation: ${application.job.title}`,
          message: `You have been invited to an interview${data.scheduledAt ? ` on ${data.scheduledAt.toISOString()}` : ''} (${timezone}). Check your email for details.`,
          type: 'APPLICATION_STATUS',
          link: '/dashboard/my-applications',
        },
      });
    }

    // Spec §6.8: assigned interviewers receive scheduling notifications.
    await notifyInterviewers(assignedInterviewerIds, auth.user.organizationId, {
      title: `Interview Assignment: ${application.job.title}`,
      message: `You have been assigned to interview ${application.candidate.firstName} ${application.candidate.lastName} on ${data.scheduledAt.toISOString()} (${timezone}).`,
      link: `/candidates/${application.id}/interview`,
    });
    await logAuditEvent({
      action: 'INTERVIEW_SCHEDULED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: id,
      newValues: { interviewId: interview.id, schedule: data.scheduledAt.toISOString(), meetingType: data.meetingType, timezone },
    });

    return NextResponse.json({
      success: true,
      interview,
      invitationDelivered: invitation.delivered,
      invitationError: invitation.delivered ? undefined : invitation.error,
    }, { status: 201 });
  } catch (error) {
    console.error('Interview scheduling error:', error);
    return safeErrorResponse('Failed to schedule interview');
  }
}

// C5 FIX: PATCH — reschedule an existing interview
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ScheduleInterviews);
    if (auth.error) return auth.error;

    const { id: applicationId } = await params;
    const { data, error } = validateBody(rescheduleSchema, await req.json());
    if (error) return error;

    const interview = await prisma.interview.findFirst({
      where: {
        id: data.interviewId,
        applicationId,
        application: { job: { organizationId: auth.user.organizationId } },
      },
    });
    if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    if (interview.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot reschedule a cancelled interview' }, { status: 409 });
    }

    const previousSchedule = interview.schedule;
    const updated = await prisma.interview.update({
      where: { id: data.interviewId },
      data: {
        schedule: data.scheduledAt,
        timezone: data.timezone,
        status: 'SCHEDULED',
        meetingDetails: JSON.stringify({
          ...JSON.parse(interview.meetingDetails || '{}'),
          durationMinutes: data.durationMinutes,
        }),
      },
    });

    await logAuditEvent({
      action: 'INTERVIEW_RESCHEDULED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: applicationId,
      previousValues: { schedule: previousSchedule },
      newValues: { schedule: data.scheduledAt.toISOString(), timezone: data.timezone },
    });

    // Spec §6.8: candidates and interviewers must receive rescheduling updates.
    const rescheduleApp = await prisma.interview.findUnique({
      where: { id: data.interviewId },
      include: {
        application: {
          include: {
            candidate: { select: { email: true, firstName: true, lastName: true } },
            job: { select: { title: true } },
          },
        },
      },
    });
    if (rescheduleApp) {
      const candidateU = await prisma.user.findUnique({
        where: { email: rescheduleApp.application.candidate.email },
      });
      if (candidateU) {
        await prisma.notification.create({
          data: {
            userId: candidateU.id,
            title: `Interview Rescheduled: ${rescheduleApp.application.job.title}`,
            message: `Your interview has been moved to ${data.scheduledAt.toISOString()} (${data.timezone}).`,
            type: 'APPLICATION_STATUS',
            link: '/dashboard/my-applications',
          },
        });
      }
      await notifyInterviewers(
        (await prisma.interview.findUnique({
          where: { id: data.interviewId },
          include: { participants: true },
        }))?.participants.map((p) => p.userId).filter((uid) => uid !== auth.user.id) ?? [],
        auth.user.organizationId,
        {
          title: `Interview Rescheduled: ${rescheduleApp.application.job.title}`,
          message: `The interview for ${rescheduleApp.application.candidate.firstName} ${rescheduleApp.application.candidate.lastName} has been moved to ${data.scheduledAt.toISOString()} (${data.timezone}).`,
          link: `/candidates/${applicationId}/interview`,
        }
      );
    }

    return NextResponse.json({ success: true, interview: updated });
  } catch (error) {
    console.error('Interview reschedule error:', error);
    return safeErrorResponse('Failed to reschedule interview');
  }
}

// C5 FIX: DELETE — cancel an interview
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ScheduleInterviews);
    if (auth.error) return auth.error;

    const { id: applicationId } = await params;
    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId query parameter is required' }, { status: 400 });
    }

    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        applicationId,
        application: { job: { organizationId: auth.user.organizationId } },
      },
    });
    if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'CANCELLED' },
    });

    await logAuditEvent({
      action: 'INTERVIEW_CANCELLED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: applicationId,
      previousValues: { status: interview.status, schedule: interview.schedule },
      newValues: { status: 'CANCELLED' },
    });

    // Spec §6.8: candidates and interviewers must receive cancellation updates.
    const cancelledInterview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        participants: true,
        application: {
          include: {
            candidate: { select: { email: true, firstName: true, lastName: true } },
            job: { select: { title: true } },
          },
        },
      },
    });
    if (cancelledInterview) {
      const candidateU = await prisma.user.findUnique({
        where: { email: cancelledInterview.application.candidate.email },
      });
      if (candidateU) {
        await prisma.notification.create({
          data: {
            userId: candidateU.id,
            title: `Interview Cancelled: ${cancelledInterview.application.job.title}`,
            message: 'Your interview has been cancelled. The team will contact you about next steps.',
            type: 'APPLICATION_STATUS',
            link: '/dashboard/my-applications',
          },
        });
      }
      await notifyInterviewers(
        cancelledInterview.participants.map((p) => p.userId).filter((uid) => uid !== auth.user.id),
        auth.user.organizationId,
        {
          title: `Interview Cancelled: ${cancelledInterview.application.job.title}`,
          message: `The interview for ${cancelledInterview.application.candidate.firstName} ${cancelledInterview.application.candidate.lastName} has been cancelled.`,
          link: `/candidates/${applicationId}/interview`,
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Interview cancel error:', error);
    return safeErrorResponse('Failed to cancel interview');
  }
}
