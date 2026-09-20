import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { isPathWithinUploads, safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';

function contentType(fileReference: string): string {
  const extension = path.extname(fileReference).toLowerCase();
  if (extension === '.pdf') return 'application/pdf';
  if (extension === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (extension === '.md') return 'text/markdown; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

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

    const filePath = path.isAbsolute(resume.fileReference)
      ? resume.fileReference
      : path.resolve(process.cwd(), resume.fileReference);
    if (!isPathWithinUploads(filePath)) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    const file = await readFile(filePath);

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

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType(filePath),
        'Content-Disposition': `attachment; filename="resume-${resume.id}${path.extname(filePath).toLowerCase()}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Resume download error:', error);
    return safeErrorResponse('Failed to download resume');
  }
}