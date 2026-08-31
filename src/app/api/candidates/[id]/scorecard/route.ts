import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { scorecardSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager', 'Interviewer', 'ComplianceAuditor']);
    if (auth.error) return auth.error;

    const { id } = await params;
    const application = await prisma.application.findFirst({
      where: {
        id,
        job: { organizationId: auth.user.organizationId }
      },
      include: {
        interviews: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const scorecards = application.interviews.flatMap((interview) =>
      interview.participants
        .filter((p) => p.structuredFeedback || p.recommendation || p.comments)
        .map((p) => {
          let parsedFeedback: any = {};
          try {
            parsedFeedback = p.structuredFeedback ? JSON.parse(p.structuredFeedback) : {};
          } catch {
            parsedFeedback = {};
          }
          return {
            id: p.id,
            interviewId: interview.id,
            interviewer: p.user,
            ratings: parsedFeedback,
            recommendation: p.recommendation,
            comments: p.comments,
            submittedAt: p.updatedAt
          };
        })
    );

    return NextResponse.json({ scorecards });
  } catch (error) {
    console.error('Fetch scorecards error:', error);
    return safeErrorResponse('Failed to fetch scorecards');
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager', 'Interviewer']);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json();

    const { data, error } = validateBody(scorecardSchema, body);
    if (error) return error;

    const application = await prisma.application.findFirst({
      where: {
        id,
        job: { organizationId: auth.user.organizationId }
      },
      include: {
        job: true,
        candidate: true,
        interviews: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Find existing interview or create default interview session
    let interview = application.interviews[0];
    if (!interview) {
      interview = await prisma.interview.create({
        data: {
          applicationId: id,
          schedule: new Date(),
          timezone: 'UTC',
          status: 'IN_EVALUATION',
          meetingDetails: JSON.stringify({ type: 'Standard Structured Interview' })
        }
      });
    }

    const structuredFeedback = JSON.stringify({
      techRating: data.techRating,
      commRating: data.commRating,
      problemRating: data.problemRating
    });

    // Check if participant record exists for this user on this interview
    const existingParticipant = await prisma.interviewParticipant.findFirst({
      where: {
        interviewId: interview.id,
        userId: auth.user.id
      }
    });

    let participant;
    if (existingParticipant) {
      participant = await prisma.interviewParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          structuredFeedback,
          recommendation: data.recommendation,
          comments: data.comments || ''
        }
      });
    } else {
      participant = await prisma.interviewParticipant.create({
        data: {
          interviewId: interview.id,
          userId: auth.user.id,
          structuredFeedback,
          recommendation: data.recommendation,
          comments: data.comments || ''
        }
      });
    }

    // Log Audit Event
    await logAuditEvent({
      action: 'INTERVIEW_SCORECARD_SUBMITTED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: id,
      newValues: {
        recommendation: data.recommendation,
        ratings: { tech: data.techRating, comm: data.commRating, problem: data.problemRating },
        candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
        jobTitle: application.job.title
      }
    });

    return NextResponse.json({
      success: true,
      participant,
      message: `Structured interview scorecard (${data.recommendation}) submitted successfully.`
    }, { status: 201 });
  } catch (error) {
    console.error('Submit scorecard error:', error);
    return safeErrorResponse('Failed to submit interview scorecard');
  }
}
