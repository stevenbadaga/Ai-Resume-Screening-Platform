import { NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';
import { getObject, contentTypeFromKey } from '@/lib/storage';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;
    const resume = await prisma.resumeDocument.findUnique({
      where: { id },
      include: { application: { include: { job: true, candidate: true } } },
    });

    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    const isStaff = auth.user.organizationId === resume.application.job.organizationId && auth.user.role !== 'Candidate';
    const isCandidate = auth.user.email.toLowerCase() === resume.application.candidate.email.toLowerCase();
    if (!isStaff && !isCandidate) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    // Stream the document through the storage abstraction (cloud bucket or
    // legacy local row). The key's extension drives the content type.
    const referenceTail = resume.fileReference.split('/').pop() || resume.fileReference;
    const { bytes: file, contentType: detectedType } = await getObject(resume.fileReference);
    const contentTypeHeader = detectedType || contentTypeFromKey(referenceTail);

    // Spec §6.11: resume downloads are controlled personal-data access and
    // must be logged. Candidate self-downloads are also recorded.
    await logAuditEvent({
      action: 'RESUME_DOWNLOADED',
      actorId: auth.user.id,
      organizationId: isStaff ? auth.user.organizationId : undefined,
      affectedRecordId: resume.id,
      newValues: {
        applicationId: resume.applicationId,
        accessedAs: isStaff ? 'staff' : 'candidate',
      },
    });

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': contentTypeHeader,
        'Content-Disposition': `attachment; filename="resume-${resume.id}${path.extname(referenceTail).toLowerCase()}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Resume download error:', error);
    return safeErrorResponse('Failed to download resume');
  }
}