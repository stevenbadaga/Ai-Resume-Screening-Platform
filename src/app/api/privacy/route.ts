import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/auditLogger';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { privacyRequestSchema, validateBody, isPathWithinUploads, safeErrorResponse } from '@/lib/validation';
import { unlink } from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Only authorized staff can process GDPR data deletion requests
    const auth = await requireAuth(['Admin', 'ComplianceAuditor']);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input
    const { data, error } = validateBody(privacyRequestSchema, body);
    if (error) return error;

    const { email } = data;

    const candidate = await prisma.candidate.findFirst({
      where: {
        email,
        applications: { some: { job: { organizationId: auth.user.organizationId } } }
      },
      include: { applications: { include: { resumeDocument: true } } }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // 1. Delete physical resume files — with path traversal protection
    for (const app of candidate.applications) {
      if (app.resumeDocument?.fileReference) {
        // SECURITY: Validate file path is within uploads directory before deletion
        if (isPathWithinUploads(app.resumeDocument.fileReference)) {
          try {
            await unlink(app.resumeDocument.fileReference);
          } catch (fsError) {
            console.warn(`Could not delete file (may already be removed)`, fsError);
          }
        } else {
          console.warn(`SECURITY: Blocked path traversal attempt on file deletion: ${app.resumeDocument.fileReference}`);
          await logAuditEvent({
            action: 'PATH_TRAVERSAL_BLOCKED',
            actorId: auth.user.id,
            affectedRecordId: candidate.id,
            newValues: { blockedPath: app.resumeDocument.fileReference }
          });
        }
      }
    }

    const candidateUser = await prisma.user.findUnique({ where: { email } });
    const anonymizedId = `ANON-${uuidv4()}`;
    await prisma.$transaction(async (tx) => {
      const applicationIds = candidate.applications.map((app) => app.id);

      if (applicationIds.length > 0) {
        await tx.criterionAssessment.deleteMany({ where: { screeningRun: { applicationId: { in: applicationIds } } } });
        await tx.recruitmentDecision.deleteMany({ where: { applicationId: { in: applicationIds } } });
        await tx.screeningRun.deleteMany({ where: { applicationId: { in: applicationIds } } });
        await tx.parsedProfile.deleteMany({ where: { applicationId: { in: applicationIds } } });
        await tx.resumeDocument.deleteMany({ where: { applicationId: { in: applicationIds } } });
        await tx.interview.deleteMany({ where: { applicationId: { in: applicationIds } } });
        await tx.communication.deleteMany({ where: { applicationId: { in: applicationIds } } });
        await tx.application.deleteMany({ where: { id: { in: applicationIds } } });
      }

      await tx.candidate.update({
        where: { id: candidate.id },
        data: {
          firstName: 'Anonymized',
          lastName: 'Candidate',
          email: `${anonymizedId}@deleted.local`,
          consentGiven: false
        }
      });

      if (candidateUser) {
        await tx.user.update({
          where: { id: candidateUser.id },
          data: { email: `${anonymizedId}@deleted.local`, name: 'Anonymized User', passwordHash: null }
        });
      }

      await tx.privacyRequest.create({
        data: {
          candidateId: candidate.id,
          noticeVersion: 'v1.0',
          candidateRequest: 'DELETE',
          decision: 'APPROVED',
          anonymizationAction: 'Scrambled PII and deleted physical resumes'
        }
      })
    });

    // 4. Audit Log — SECURITY: Do NOT log the plaintext email (it's now deleted)
    await logAuditEvent({
      action: 'DATA_DELETION_PROCESSED',
      actorId: auth.user.id,
      affectedRecordId: candidate.id,
      newValues: { action: 'ANONYMIZED', processedBy: auth.user.id }
    });

    return NextResponse.json({ success: true, message: 'Data successfully anonymized and deleted according to privacy policies.' });
  } catch (error) {
    console.error('Privacy request error:', error);
    return safeErrorResponse('Failed to process privacy request');
  }
}
