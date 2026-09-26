import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { validateBody } from '@/lib/validation';
import { z } from 'zod/v4';
import { sendTransactionalEmail, type EmailTemplateType } from '@/lib/emailService';


/**
 * Spec §6.9 — failed notifications must be retried safely where appropriate
 * and displayed to authorized users for follow-up. The dashboard surfaces
 * FAILED Communication rows (/dashboard/email-delivery); this endpoint lets
 * an authorized administrator retry one safely:
 *
 *  - only FAILED deliveries may be retried (no double-send of SENT rows);
 *  - the Communication row must belong to the admin's organization;
 *  - the retry records a fresh Communication row with the real delivery
 *    outcome, so history is preserved (original failure is never rewritten).
 */

const retrySchema = z.object({
  communicationId: z.string().uuid(),
});

// Templates whose content can be deterministically rebuilt from stored data.
// The template field on a Communication row names the original template; the
// body is re-rendered from the related application/job at retry time — never
// from candidate-communication history that may have been edited.
function buildRetryPayload(templateName: string): { template: EmailTemplateType } {
  return { template: templateName as EmailTemplateType };
}

export async function POST(req: NextRequest) {
  let comm: {
    id: string;
    applicationId: string | null;
    jobId: string | null;
    recipient: string;
    template: string;
  } | null = null;

  try {
    const auth = await requirePermission(Permission.ViewEmailDelivery);
    if (auth.error) return auth.error;

    const { data, error } = validateBody(retrySchema, await req.json());
    if (error) return error;

    const foundComm = await prisma.communication.findUnique({
      where: { id: data.communicationId },
      select: {
        id: true,
        applicationId: true,
        jobId: true,
        recipient: true,
        template: true,
        deliveryState: true,
        payloadSnapshot: true,
        application: {
          include: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { id: true, title: true, organizationId: true } },
          },
        },
        job: { select: { id: true, title: true, organizationId: true } },
      },
    });

    if (!foundComm) {
      return NextResponse.json({ error: 'Delivery record not found' }, { status: 404 });
    }
    comm = {
      id: foundComm.id,
      applicationId: foundComm.applicationId,
      jobId: foundComm.jobId,
      recipient: foundComm.recipient,
      template: foundComm.template,
    };

    // Tenant boundary (§6.1): the delivery must belong to this workspace via
    // its job or the sender's organization.
    const orgId =
      foundComm.application?.job?.organizationId ?? foundComm.job?.organizationId ?? null;
    if (!orgId || orgId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'Delivery record not found' }, { status: 404 });
    }

    if (foundComm.deliveryState !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed deliveries can be retried' },
        { status: 409 }
      );
    }

    const { template } = buildRetryPayload(comm.template);
    const jobTitle =
      foundComm.application?.job?.title ?? foundComm.job?.title ?? '';
    const candidateName = foundComm.application?.candidate
      ? `${foundComm.application.candidate.firstName} ${foundComm.application.candidate.lastName}`.trim()
      : '';

    // §6.9 faithful retry: re-render from the payload snapshot recorded at
    // original send time (schedule, meeting link, offer details…). Falls
    // back to job/candidate fields only for legacy rows sent before the
    // snapshot column existed. No details are ever fabricated.
    let payload: Record<string, unknown> = {};
    if (foundComm.payloadSnapshot) {
      try {
        payload = JSON.parse(foundComm.payloadSnapshot);
      } catch {
        payload = {};
      }
    }
    const result = await sendTransactionalEmail({
      to: comm.recipient,
      template,
      data: {
        candidateName: (payload.candidateName as string) || candidateName,
        jobTitle: (payload.jobTitle as string) || jobTitle,
        schedule: payload.schedule as string | undefined,
        timezone: payload.timezone as string | undefined,
        meetingLink: payload.meetingLink as string | undefined,
        joinLink: payload.joinLink as string | undefined,
        offerDetails: payload.offerDetails as
          | { salary: string; startDate: string; equity?: string }
          | undefined,
        feedback: payload.feedback as string | undefined,
      },
      applicationId: comm.applicationId ?? undefined,
    });

    // Record the retry as its own Communication row (immutable history).
    const retryComm = await prisma.communication.create({
      data: {
        applicationId: comm.applicationId,
        jobId: comm.jobId,
        senderId: auth.user.id,
        recipient: comm.recipient,
        template: comm.template,
        contentVersion: 'v1.0-retry',
        deliveryState: 'SENT',
      },
    });

    await logAuditEvent({
      action: 'FAILED_DELIVERY_RETRIED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: comm.id,
      previousValues: { deliveryState: 'FAILED', recipient: comm.recipient, template: comm.template },
      newValues: { deliveryState: 'SENT', retryCommunicationId: retryComm.id, retriedBy: auth.user.email },
    });

    return NextResponse.json({
      success: true,
      delivered: true,
      providerId: result.id,
      retryCommunicationId: retryComm.id,
    });
  } catch (err) {
    // The provider rejected the retry — record it honestly on a new row so
    // the follow-up history stays complete (spec §6.9).
    const message = err instanceof Error ? err.message : String(err);
    if (comm) {
      try {
        await prisma.communication.create({
          data: {
            applicationId: comm.applicationId,
            jobId: comm.jobId,
            senderId: null,
            recipient: comm.recipient,
            template: comm.template,
            contentVersion: 'v1.0-retry',
            deliveryState: 'FAILED',
            failureInfo: message.slice(0, 2000),
          },
        });
      } catch (recordErr) {
        console.error('Failed to record retry failure:', recordErr);
      }
    }
    console.error('Delivery retry error:', message);
    return NextResponse.json(
      { error: 'Retry attempt failed', detail: message.slice(0, 500) },
      { status: 502 }
    );
  }
}
