import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { sendRecordedEmail } from '@/lib/emailService';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { offerSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.OfferJob);
    if (auth.error) return auth.error;

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;
    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(offerSchema, body);
    if (error) return error;

    const { salary, startDate, equity, signingBonus, notes } = data;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { candidate: true, job: true }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.job.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Update application stage to OFFERED
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        stage: 'OFFERED',
        status: 'OFFER_EXTENDED'
      }
    });

    // Send offer letter email, recording the real delivery outcome (spec §6.9).
    // Delivery failure does not roll back the offer — it is surfaced in the response
    // and recorded on the Communication row for follow-up.
    const delivery = await sendRecordedEmail({
      to: application.candidate.email,
      template: 'OFFER_LETTER',
      data: {
        candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
        jobTitle: application.job.title,
        offerDetails: {
          salary: String(salary),
          startDate,
          equity
        }
      },
      applicationId: application.id,
      jobId: application.job.id,
      senderId: auth.user.id
    });

    // Log to immutable audit trail
    await logAuditEvent({
      action: 'OFFER_EXTENDED',
      actorId: auth.user.id,
      affectedRecordId: applicationId,
      newValues: { salary, startDate, equity, signingBonus, notes }
    });

    return NextResponse.json({
      success: true,
      message: `Formal offer extended to ${application.candidate.firstName} successfully!`,
      emailDelivered: delivery.delivered,
      emailError: delivery.delivered ? undefined : delivery.error
    });
  } catch (error: any) {
    console.error('Offer letter error:', error);
    return safeErrorResponse('Failed to extend offer');
  }
}