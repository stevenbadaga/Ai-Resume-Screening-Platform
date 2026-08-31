import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { interviewScheduleSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager', 'Interviewer']);
  if (auth.error) return auth.error;

  const { id } = await params;
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
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager']);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { data, error } = validateBody(interviewScheduleSchema, await req.json());
    if (error) return error;

    const application = await prisma.application.findFirst({
      where: { id, job: { organizationId: auth.user.organizationId } },
      include: { job: true },
    });
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const endAt = new Date(data.scheduledAt.getTime() + data.durationMinutes * 60_000);
    const conflict = await prisma.interview.findFirst({
      where: {
        schedule: { not: null, lt: endAt },
        status: { not: 'CANCELLED' },
        participants: { some: { userId: auth.user.id } },
      },
    });
    if (conflict && conflict.schedule && conflict.schedule.getTime() < endAt.getTime()) {
      const conflictEnd = new Date(conflict.schedule.getTime() + data.durationMinutes * 60_000);
      if (data.scheduledAt < conflictEnd) {
        return NextResponse.json({ error: 'The interviewer has a scheduling conflict' }, { status: 409 });
      }
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId: id,
        schedule: data.scheduledAt,
        timezone: 'UTC',
        status: 'SCHEDULED',
        meetingDetails: JSON.stringify({ type: data.meetingType, durationMinutes: data.durationMinutes }),
        participants: { create: { userId: auth.user.id } },
      },
      include: { participants: true },
    });

    await prisma.application.update({ where: { id }, data: { stage: 'INTERVIEW_SCHEDULED', status: 'INTERVIEW' } });
    await logAuditEvent({
      action: 'INTERVIEW_SCHEDULED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: id,
      newValues: { interviewId: interview.id, schedule: data.scheduledAt.toISOString(), meetingType: data.meetingType },
    });

    return NextResponse.json({ success: true, interview }, { status: 201 });
  } catch (error) {
    console.error('Interview scheduling error:', error);
    return safeErrorResponse('Failed to schedule interview');
  }
}