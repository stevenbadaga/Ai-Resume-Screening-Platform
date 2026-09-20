import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { scorecardSchema, validateBody, safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ViewScorecards);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Spec §5 (Interviewer role): interviewers view only their assigned
    // interviews — block access to applications they are not assigned to.
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
      include: {
        interviews: {
          include: {
            participants: {
              include: { user: { select: { id: true, name: true, email: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // C6 FIX: Interviewers only see their own scorecard; privileged roles see all
    const canSeeAll = ['Admin', 'Recruiter', 'HiringManager', 'ComplianceAuditor'].includes(auth.user.role);

    const scorecards = application.interviews.flatMap((interview) =>
      interview.participants
        .filter((p) => {
          const hasContent = p.structuredFeedback || p.recommendation || p.comments;
          return hasContent && (canSeeAll || p.userId === auth.user.id);
        })
        .map((p) => {
          let parsedFeedback: Record<string, unknown> = {};
          try {
            parsedFeedback = p.structuredFeedback ? JSON.parse(p.structuredFeedback) : {};
          } catch { /* ignore */ }
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
    const auth = await requirePermission(Permission.SubmitScorecards);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { data, error } = validateBody(scorecardSchema, await req.json());
    if (error) return error;

    const application = await prisma.application.findFirst({
      where: { id, job: { organizationId: auth.user.organizationId } },
      include: {
        job: true,
        candidate: true,
        interviews: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Spec §5 (Interviewer role): interviewers may only complete scorecards for
    // interviews they are assigned to — not for any application in the org.
    // (Checked against ALL interviews on this application, not just the latest.)
    if (auth.user.role === 'Interviewer') {
      const participationCount = await prisma.interviewParticipant.count({
        where: { userId: auth.user.id, interview: { applicationId: id } },
      });
      if (participationCount === 0) {
        return NextResponse.json(
          { error: 'You are not assigned to an interview for this application' },
          { status: 403 }
        );
      }
    }

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

    const existingParticipant = await prisma.interviewParticipant.findFirst({
      where: { interviewId: interview.id, userId: auth.user.id }
    });

    const participant = existingParticipant
      ? await prisma.interviewParticipant.update({
          where: { id: existingParticipant.id },
          data: { structuredFeedback, recommendation: data.recommendation, comments: data.comments || '' }
        })
      : await prisma.interviewParticipant.create({
          data: {
            interviewId: interview.id,
            userId: auth.user.id,
            structuredFeedback,
            recommendation: data.recommendation,
            comments: data.comments || ''
          }
        });

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
