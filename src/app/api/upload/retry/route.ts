import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resumeQueue } from '@/lib/queue';
import { logAuditEvent } from '@/lib/auditLogger';
import { requireAuth } from '@/lib/auth';
import { safeRedirect, safeErrorResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require authentication — retrying processing is a privileged operation
    const auth = await requireAuth(['Admin', 'Recruiter']);
    if (auth.error) return auth.error;

    const data = await req.formData();
    const applicationId = data.get('applicationId') as string;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Application ID required' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { resumeDocument: true, job: true }
    });

    if (!application || !application.resumeDocument) {
      return NextResponse.json({ success: false, error: 'Application or Resume not found' }, { status: 404 });
    }

    if (application.job.organizationId !== auth.user.organizationId) {
      return NextResponse.json({ success: false, error: 'Application or Resume not found' }, { status: 404 });
    }

    // Reset status to QUEUED
    await prisma.resumeDocument.update({
      where: { id: application.resumeDocument.id },
      data: { processingStatus: 'QUEUED' }
    });

    // Re-queue for processing
    await resumeQueue.add('process-resume', {
      applicationId: application.id,
      resumeDocumentId: application.resumeDocument.id,
      filePath: application.resumeDocument.fileReference
    });

    await logAuditEvent({
      action: 'RESUME_PROCESSING_RETRIED',
      actorId: auth.user.id,
      affectedRecordId: application.id,
    });

    // SECURITY: Use safe redirect to prevent open redirect
    return safeRedirect('/candidates');

  } catch (error) {
    console.error('Retry error:', error);
    return safeErrorResponse('Server error during retry');
  }
}
