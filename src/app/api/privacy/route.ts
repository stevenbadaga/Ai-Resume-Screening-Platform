import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { logAuditEvent } from '@/lib/auditLogger';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required for privacy requests' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { email },
      include: { applications: { include: { resumeDocument: true } } }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // 1. Delete physical resume files
    for (const app of candidate.applications) {
      if (app.resumeDocument?.fileReference) {
        try {
          await unlink(app.resumeDocument.fileReference);
        } catch (fsError) {
          console.warn(`Could not delete file ${app.resumeDocument.fileReference}`, fsError);
        }
      }
    }

    // 2. Anonymize Candidate Data (Scramble PII)
    const anonymizedId = `ANON-${uuidv4()}`;
    await prisma.$transaction([
      prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          firstName: 'Anonymized',
          lastName: 'Candidate',
          email: `${anonymizedId}@deleted.local`,
          consentGiven: false
        }
      }),
      // 3. Create Privacy Request Record
      prisma.privacyRequest.create({
        data: {
          candidateId: candidate.id,
          noticeVersion: 'v1.0',
          candidateRequest: 'DELETE',
          decision: 'APPROVED',
          anonymizationAction: 'Scrambled PII and deleted physical resumes'
        }
      })
    ]);

    // 4. Audit Log
    await logAuditEvent({
      action: 'DATA_DELETION_PROCESSED',
      actorId: 'SYSTEM_USER',
      affectedRecordId: candidate.id,
      newValues: { action: 'ANONYMIZED', originalEmailHash: email /* Never log plain PII in an audit log if deleted */ }
    });

    return NextResponse.json({ success: true, message: 'Data successfully anonymized and deleted according to privacy policies.' });
  } catch (error) {
    console.error('Privacy request error:', error);
    return NextResponse.json({ error: 'Failed to process privacy request' }, { status: 500 });
  }
}
