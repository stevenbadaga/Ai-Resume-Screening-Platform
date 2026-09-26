import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { validateBody, safeErrorResponse } from '@/lib/validation';
import { z } from 'zod/v4';

/**
 * Spec §6.11 — candidate rights requests (withdrawal, correction, access,
 * deletion) must be tracked and routed to authorized staff for review and
 * completion.
 *
 * This endpoint is the candidate-facing intake: any authenticated user may
 * submit a request scoped to the candidate record matching their own email.
 * The request lands in the PrivacyRequest queue for staff review — nothing
 * is executed automatically, and the decision + completion evidence are
 * recorded by the staff privacy workflow (`/api/privacy`, `/api/privacy/*`).
 */

const privacySubmissionSchema = z.object({
  // §6.11 request categories:
  //  - ACCESS:        obtain a copy of my data (Art. 15/20)
  //  - CORRECTION:    fix inaccurate personal data (Art. 16)
  //  - DELETION:      erase my data (Art. 17)
  //  - WITHDRAWAL:    withdraw consent / stop processing (Art. 7(3))
  requestType: z.enum(['ACCESS', 'CORRECTION', 'DELETION', 'WITHDRAWAL']),
  details: z.string().max(5000).optional(),
  // For CORRECTION: what the candidate asserts should change.
  requestedChange: z.string().max(5000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { data, error } = validateBody(privacySubmissionSchema, await req.json());
    if (error) return error;

    // Scope: the candidate record matching the authenticated user's own
    // email. Candidates can never open requests on someone else's data.
    const candidate = await prisma.candidate.findFirst({
      where: { email: auth.user.email.toLowerCase() },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'No candidate record is associated with this account' },
        { status: 404 }
      );
    }

    const request = await prisma.privacyRequest.create({
      data: {
        candidateId: candidate.id,
        noticeVersion: 'v1.1',
        candidateRequest: data.requestType,
        consentRecord: JSON.stringify({
          submittedBy: auth.user.email,
          submittedAt: new Date().toISOString(),
          details: data.details ?? null,
          requestedChange: data.requestedChange ?? null,
        }),
        // decision/completionEvidence are set by the reviewing staff member.
      },
    });

    // Route to authorized staff: notify every privacy-queue holder in the
    // org (Admin / ComplianceAuditor) that a request needs review.
    const staff = await prisma.user.findMany({
      where: {
        organizationId: auth.user.organizationId,
        accessStatus: 'ACTIVE',
        roles: { some: { name: { in: ['Admin', 'ComplianceAuditor', 'Auditor'] } } },
      },
      select: { id: true },
    });
    if (staff.length > 0) {
      await prisma.notification.createMany({
        data: staff.map((u) => ({
          userId: u.id,
          title: `Privacy request: ${data.requestType}`,
          message: `A candidate submitted a ${data.requestType.toLowerCase()} request for review and completion.`,
          type: 'PRIVACY_REQUEST',
          link: '/privacy',
        })),
      });
    }

    await logAuditEvent({
      action: 'PRIVACY_REQUEST_SUBMITTED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: request.id,
      newValues: { requestType: data.requestType, candidateId: candidate.id },
    });

    return NextResponse.json(
      {
        success: true,
        requestId: request.id,
        message:
          'Your request has been recorded and routed to our privacy team for review. You will be contacted with the outcome.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Privacy request submission error:', err);
    return safeErrorResponse('Failed to submit privacy request');
  }
}

/** The submitting candidate can check the status of their own requests. */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const candidate = await prisma.candidate.findFirst({
      where: { email: auth.user.email.toLowerCase() },
      select: { id: true },
    });
    if (!candidate) {
      return NextResponse.json({ requests: [] });
    }

    const requests = await prisma.privacyRequest.findMany({
      where: { candidateId: candidate.id },
      select: {
        id: true,
        candidateRequest: true,
        decision: true,
        completionEvidence: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ requests });
  } catch (err) {
    console.error('Privacy request list error:', err);
    return safeErrorResponse('Failed to load privacy requests');
  }
}
