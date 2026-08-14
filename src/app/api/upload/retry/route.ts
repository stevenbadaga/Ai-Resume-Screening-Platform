import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resumeQueue } from '@/lib/queue';
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const applicationId = data.get('applicationId') as string;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Application ID required' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { resumeDocument: true }
    });

    if (!application || !application.resumeDocument) {
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
      actorId: 'SYSTEM_USER',
      affectedRecordId: application.id,
    });

    // Redirect back to candidates page
    return NextResponse.redirect(new URL('/candidates', req.url));

  } catch (error) {
    console.error('Retry error:', error);
    return NextResponse.json({ success: false, error: 'Server error during retry' }, { status: 500 });
  }
}
