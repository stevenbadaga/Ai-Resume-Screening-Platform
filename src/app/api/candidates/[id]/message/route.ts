import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse, validateBody } from '@/lib/validation';
import { sendRecordedEmail, EmailTemplateType } from '@/lib/emailService';
import { findMessageSafetyIssues, renderMessageBody } from '@/lib/candidateMessage';
import { z } from 'zod/v4';

/**
 * Spec §6.9 — manually composed candidate communications.
 *
 *   POST /api/candidates/[id]/message
 *   { mode: 'preview' | 'send', template?, subject, body }
 *
 *  - `preview` renders the exact message (placeholders resolved) with NO side
 *    effects and reports any confidentiality issues so the author can edit.
 *  - `send` re-checks the guards (enforced with 400), delivers through the
 *    provider, and records an honest SENT/FAILED Communication row + audit.
 *
 * Permitted templates are the approved candidate-facing ones; the composed
 * subject/body are the "permitted message fields" the recruiter edits after
 * preview (spec §6.9).
 */
const messageSchema = z.object({
  mode: z.enum(['preview', 'send']),
  template: z
    .enum([
      'RECRUITER_MESSAGE',
      'APPLICATION_CONFIRMATION',
      'INTERVIEW_INVITATION',
      'INTERVIEW_RESCHEDULED',
      'INTERVIEW_CANCELLED',
      'REJECTION_FEEDBACK',
    ])
    .default('RECRUITER_MESSAGE'),
  subject: z.string().min(1, 'Subject is required').max(300),
  body: z.string().min(1, 'Message body is required').max(10000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ContactCandidates);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { data, error } = validateBody(messageSchema, await req.json());
    if (error) return error;

    const application = await prisma.application.findFirst({
      where: { id, job: { organizationId: auth.user.organizationId } },
      include: { candidate: true, job: true },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`.trim();
    const jobTitle = application.job.title;
    const subject = renderMessageBody(data.subject, { candidateName, jobTitle });
    const body = renderMessageBody(data.body, { candidateName, jobTitle });

    // Confidentiality guards run in BOTH modes (§6.9): surfaced at preview,
    // enforced at send.
    const issues = findMessageSafetyIssues({
      subject,
      body,
      internalNotes: application.notes,
    });

    if (data.mode === 'preview') {
      return NextResponse.json({ preview: { subject, body }, issues });
    }

    if (issues.length > 0) {
      return NextResponse.json(
        { error: issues[0].message, issues },
        { status: 400 }
      );
    }

    const result = await sendRecordedEmail({
      to: application.candidate.email,
      template: data.template as EmailTemplateType,
      data: { candidateName, jobTitle, subject, body },
      applicationId: application.id,
      senderId: auth.user.id,
    });

    await logAuditEvent({
      action: result.delivered ? 'CANDIDATE_MESSAGE_SENT' : 'CANDIDATE_MESSAGE_FAILED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: application.id,
      newValues: {
        template: data.template,
        communicationId: result.communicationId ?? null,
        recipient: application.candidate.email,
        delivered: result.delivered,
        error: result.error ? result.error.slice(0, 500) : null,
      },
    });

    return NextResponse.json({
      delivered: result.delivered,
      communicationId: result.communicationId ?? null,
      // Honest failure surface — never claim success the provider did not give.
      error: result.error ? result.error.slice(0, 500) : undefined,
    }, { status: result.delivered ? 200 : 502 });
  } catch (err) {
    console.error('Candidate message error:', err);
    return safeErrorResponse('Failed to process candidate message');
  }
}
