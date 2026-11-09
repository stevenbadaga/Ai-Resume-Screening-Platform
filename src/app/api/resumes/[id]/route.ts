import { NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';
import { getObject, contentTypeFromKey } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;

    // Resolve resume document by ResumeDocument ID, Application ID, or Candidate ID
    let resume = await prisma.resumeDocument.findUnique({
      where: { id },
      include: { application: { include: { job: true, candidate: true } } },
    });

    if (!resume) {
      resume = await prisma.resumeDocument.findFirst({
        where: { applicationId: id },
        include: { application: { include: { job: true, candidate: true } } },
      });
    }

    let fileReference = resume?.fileReference;
    let candidateName = 'Candidate';
    let applicationId = resume?.applicationId;
    let affectedRecordId = resume?.id;
    let orgId = resume?.application?.job?.organizationId;
    let candidateEmail = resume?.application?.candidate?.email;

    if (!fileReference) {
      // Check if id is a Candidate ID directly
      const candidate = await prisma.candidate.findUnique({
        where: { id },
      });
      if (candidate?.profileResumeRef) {
        fileReference = candidate.profileResumeRef;
        candidateName = `${candidate.firstName} ${candidate.lastName}`.trim();
        affectedRecordId = candidate.id;
        candidateEmail = candidate.email;
      }
    } else if (resume?.application?.candidate) {
      candidateName = `${resume.application.candidate.firstName} ${resume.application.candidate.lastName}`.trim();
    }

    if (!fileReference) {
      return NextResponse.json({ error: 'Resume document not found' }, { status: 404 });
    }

    const isStaff =
      (auth.user.role === 'Admin' ||
        (orgId ? auth.user.organizationId === orgId : true)) &&
      auth.user.role !== 'Candidate';
    const isCandidate =
      Boolean(candidateEmail && auth.user.email.toLowerCase() === candidateEmail.toLowerCase());

    if (!isStaff && !isCandidate && auth.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Stream the document through the storage abstraction
    const referenceTail = fileReference.split('/').pop() || fileReference;
    const cleanExt = path.extname(referenceTail).toLowerCase() || '.pdf';

    let fileBytes: Buffer;
    let detectedType: string | undefined;

    try {
      const result = await getObject(fileReference);
      fileBytes = result.bytes;
      detectedType = result.contentType;
    } catch (storageErr) {
      console.error('Storage retrieval failed for resume reference:', fileReference, storageErr);
      return NextResponse.json(
        { error: 'Resume document file could not be retrieved from storage.' },
        { status: 404 }
      );
    }

    const contentTypeHeader =
      detectedType ||
      contentTypeFromKey(referenceTail) ||
      (cleanExt === '.pdf'
        ? 'application/pdf'
        : cleanExt === '.docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'text/plain');

    // Spec §6.11: resume access audit log
    await logAuditEvent({
      action: 'RESUME_DOWNLOADED',
      actorId: auth.user.id,
      organizationId: isStaff ? auth.user.organizationId : undefined,
      affectedRecordId: affectedRecordId || id,
      newValues: {
        applicationId,
        fileReference,
        accessedAs: isStaff ? 'staff' : 'candidate',
      },
    });

    const url = new URL(request.url);
    const forceDownload =
      url.searchParams.get('download') === '1' || url.searchParams.get('mode') === 'download';
    const dispositionType = forceDownload ? 'attachment' : 'inline';
    const safeCandidateName = (candidateName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeCandidateName}_Resume${cleanExt}`;

    return new NextResponse(new Uint8Array(fileBytes), {
      headers: {
        'Content-Type': contentTypeHeader,
        'Content-Disposition': `${dispositionType}; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Resume download error:', error);
    return safeErrorResponse('Failed to download resume');
  }
}
