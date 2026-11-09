import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse, validateFileMagicBytes } from '@/lib/validation';
import { scanDocumentForMalware } from '@/lib/malwareScan';
import { putObject, getObject, buildObjectKey, contentTypeFromKey, deleteObject, StorageError } from '@/lib/storage';
import { logEvent } from '@/lib/observability';

/**
 * Candidate's saved default CV (self-service profile).
 *
 * The candidate uploads a CV ONCE to their profile; one-click applications
 * then reuse it for any OPEN requisition instead of re-uploading per
 * application. Validation mirrors the intake pipeline (extension allow-list,
 * size cap, magic bytes, layered malware scan) and storage is the same
 * private cloud bucket — the saved CV is scanned and stored exactly as an
 * application document would be.
 */

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    if (user.role !== 'Candidate') {
      return NextResponse.json(
        { error: 'Only candidate accounts keep a self-service CV' },
        { status: 403 }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid upload format — please try again.' }, { status: 400 });
    }

    const file = formData.get('resume') as unknown as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }

    const extension = file.name.toLowerCase().split('.').pop() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: 'Only PDF, DOCX, TXT, and Markdown CVs are allowed' },
        { status: 400 }
      );
    }
    if (file.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // §6.4: scan BEFORE storage — the saved CV is candidate content like any
    // application document.
    const scan = await scanDocumentForMalware(buffer);
    if (!scan.clean) {
      await logAuditEvent({
        action: 'MALWARE_SCAN_REJECTED',
        actorId: user.id,
        organizationId: user.organizationId,
        newValues: { filename: file.name, engine: scan.engine, threats: scan.threats, context: 'profile-resume' },
      });
      return NextResponse.json({ error: 'Upload rejected by security scanner' }, { status: 403 });
    }

    if (extension === 'pdf' || extension === 'docx') {
      const detectedType = validateFileMagicBytes(buffer);
      if (!detectedType) {
        return NextResponse.json(
          { error: 'Invalid file content. The file does not appear to be a valid PDF or DOCX document.' },
          { status: 400 }
        );
      }
    }

    const candidate = await prisma.candidate.findFirst({ where: { email: user.email } });
    if (!candidate) {
      const parts = (user.name ?? user.email.split('@')[0]).split(' ');
      await prisma.candidate.create({
        data: {
          firstName: parts[0] || user.email.split('@')[0],
          lastName: parts.slice(1).join(' ') || '(candidate)',
          email: user.email,
          consentGiven: false,
          tags: ['SELF_PROFILE'],
        },
      });
    }
    const candidateRow = candidate ?? (await prisma.candidate.findFirst({ where: { email: user.email } }))!;

    // Replace any previous saved CV (delete the old object first so no
    // orphaned documents accumulate in the bucket).
    if (candidateRow.profileResumeRef) {
      await deleteObject(candidateRow.profileResumeRef).catch(() => undefined);
    }

    const stored = await putObject(
      buffer,
      buildObjectKey(file.name),
      file.type || contentTypeFromKey(file.name)
    );

    await prisma.candidate.update({
      where: { id: candidateRow.id },
      data: {
        profileResumeRef: stored.reference,
        profileResumeName: file.name,
        profileResumeSize: file.size,
        profileResumeUploadedAt: new Date(),
      },
    });

    await logAuditEvent({
      action: 'PROFILE_RESUME_UPLOADED',
      actorId: user.id,
      organizationId: user.organizationId,
      affectedRecordId: candidateRow.id,
      newValues: { filename: file.name, size: file.size, backend: stored.backend },
    });
    logEvent('info', 'profile.resumeUploaded', {
      userId: user.id,
      candidateId: candidateRow.id,
      size: file.size,
      backend: stored.backend,
    });

    return NextResponse.json({
      success: true,
      savedResume: { name: file.name, size: file.size, uploadedAt: new Date().toISOString() },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageError) {
      console.error('Profile CV blocked: storage backend unavailable:', error.message);
      return NextResponse.json(
        {
          error:
            'We could not store your CV right now — our file service appears to be down. '
            + 'Nothing was saved; please try again in a few minutes.',
        },
        { status: 503, headers: { 'Retry-After': '120' } }
      );
    }
    console.error('Profile resume upload error:', error);
    return safeErrorResponse('Failed to save CV');
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    const candidate = await prisma.candidate.findFirst({ where: { email: user.email } });
    if (!candidate?.profileResumeRef) {
      return NextResponse.json({ error: 'No saved CV found' }, { status: 404 });
    }

    const { bytes: file, contentType: detectedType } = await getObject(candidate.profileResumeRef);
    const referenceTail = candidate.profileResumeRef.split('/').pop() || candidate.profileResumeRef;
    const cleanExt = path.extname(referenceTail).toLowerCase() || '.pdf';
    const contentTypeHeader = detectedType || contentTypeFromKey(referenceTail) || 'application/pdf';

    const url = new URL(req.url);
    const forceDownload = url.searchParams.get('download') === '1';
    const dispositionType = forceDownload ? 'attachment' : 'inline';
    const safeName = (candidate.profileResumeName || `${candidate.firstName}_${candidate.lastName}_CV`).replace(/[^a-zA-Z0-9_.-]/g, '_');

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': contentTypeHeader,
        'Content-Disposition': `${dispositionType}; filename="${safeName.endsWith(cleanExt) ? safeName : safeName + cleanExt}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Profile resume download error:', error);
    return safeErrorResponse('Failed to download saved resume');
  }
}

export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user } = auth;

    if (user.role !== 'Candidate') {
      return NextResponse.json(
        { error: 'Only candidate accounts keep a self-service CV' },
        { status: 403 }
      );
    }

    const candidate = await prisma.candidate.findFirst({ where: { email: user.email } });
    if (!candidate?.profileResumeRef) {
      return NextResponse.json({ error: 'No saved CV to remove' }, { status: 404 });
    }

    await deleteObject(candidate.profileResumeRef).catch(() => undefined);
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        profileResumeRef: null,
        profileResumeName: null,
        profileResumeSize: null,
        profileResumeUploadedAt: null,
      },
    });

    await logAuditEvent({
      action: 'PROFILE_RESUME_DELETED',
      actorId: user.id,
      organizationId: user.organizationId,
      affectedRecordId: candidate.id,
      previousValues: { filename: candidate.profileResumeName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile resume delete error:', error);
    return safeErrorResponse('Failed to remove CV');
  }
}
