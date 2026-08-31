import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { isPathWithinUploads, safeErrorResponse } from '@/lib/validation';
import { unlink } from 'fs/promises';

export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const userEmail = auth.user.email;
    const userId = auth.user.id;

    // Find candidate record associated with this email
    const candidate = await prisma.candidate.findFirst({
      where: { email: userEmail },
      include: {
        applications: {
          include: { resumeDocument: true }
        }
      }
    });

    // 1. Delete physical resume files safely
    if (candidate) {
      for (const app of candidate.applications) {
        if (app.resumeDocument?.fileReference) {
          if (isPathWithinUploads(app.resumeDocument.fileReference)) {
            try {
              await unlink(app.resumeDocument.fileReference);
            } catch (fsErr) {
              console.warn('Physical file already unlinked or missing:', fsErr);
            }
          }
        }
      }
    }

    const anonymizedId = `ANON-${uuidv4()}`;

    // 2. Perform atomic database deletion and anonymization transaction
    await prisma.$transaction(async (tx) => {
      if (candidate) {
        const applicationIds = candidate.applications.map((app) => app.id);

        if (applicationIds.length > 0) {
          await tx.criterionAssessment.deleteMany({
            where: { screeningRun: { applicationId: { in: applicationIds } } }
          });
          await tx.recruitmentDecision.deleteMany({
            where: { applicationId: { in: applicationIds } }
          });
          await tx.screeningRun.deleteMany({
            where: { applicationId: { in: applicationIds } }
          });
          await tx.parsedProfile.deleteMany({
            where: { applicationId: { in: applicationIds } }
          });
          await tx.resumeDocument.deleteMany({
            where: { applicationId: { in: applicationIds } }
          });
          await tx.interviewParticipant.deleteMany({
            where: { interview: { applicationId: { in: applicationIds } } }
          });
          await tx.interview.deleteMany({
            where: { applicationId: { in: applicationIds } }
          });
          await tx.communication.deleteMany({
            where: { applicationId: { in: applicationIds } }
          });
          await tx.application.deleteMany({
            where: { id: { in: applicationIds } }
          });
        }

        // Anonymize Candidate Record
        await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            firstName: 'Anonymized',
            lastName: 'User',
            email: `${anonymizedId}@deleted.local`,
            consentGiven: false
          }
        });

        // Record Privacy Request Log
        await tx.privacyRequest.create({
          data: {
            candidateId: candidate.id,
            noticeVersion: 'v1.0',
            candidateRequest: 'RIGHT_TO_BE_FORGOTTEN',
            decision: 'APPROVED',
            anonymizationAction: 'Scrambled PII, erased all applications and unlinked resumes.'
          }
        });
      }

      // 3. Clear user notifications & deactivate User account
      await tx.notification.deleteMany({
        where: { userId }
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          email: `${anonymizedId}@deleted.local`,
          name: 'Deleted User',
          passwordHash: null,
          accessStatus: 'SUSPENDED'
        }
      });
    });

    // 4. Log Audit Trail
    await logAuditEvent({
      action: 'USER_ACCOUNT_ERASURE_PROCESSED',
      actorId: userId,
      organizationId: auth.user.organizationId,
      affectedRecordId: userId,
      newValues: { action: 'ANONYMIZED_AND_DEACTIVATED', anonymizedId }
    });

    return NextResponse.json({
      success: true,
      message: 'Account and associated personal records have been permanently erased pursuant to GDPR Art. 17.'
    });
  } catch (error) {
    console.error('Account erasure error:', error);
    return safeErrorResponse('Failed to process account erasure');
  }
}
