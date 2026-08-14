import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const email = data.get('email') as string;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    const duplicates = await prisma.candidate.findMany({
      where: { email },
      orderBy: { createdAt: 'asc' }
    });

    if (duplicates.length <= 1) {
      return NextResponse.redirect(new URL('/candidates', req.url));
    }

    const primaryCandidate = duplicates[0];
    const duplicatesToMerge = duplicates.slice(1);

    for (const dup of duplicatesToMerge) {
      // Move applications
      await prisma.application.updateMany({
        where: { candidateId: dup.id },
        data: { candidateId: primaryCandidate.id }
      });
      // Move privacy requests
      await prisma.privacyRequest.updateMany({
        where: { candidateId: dup.id },
        data: { candidateId: primaryCandidate.id }
      });

      await logAuditEvent({
        action: 'CANDIDATE_MERGED',
        actorId: 'SYSTEM_USER',
        affectedRecordId: primaryCandidate.id,
        newValues: { mergedFrom: dup.id }
      });

      // Delete the duplicate
      await prisma.candidate.delete({ where: { id: dup.id } });
    }

    // Remove the POTENTIAL_DUPLICATE tag from the primary candidate
    const updatedTags = primaryCandidate.tags.filter(t => t !== 'POTENTIAL_DUPLICATE');
    await prisma.candidate.update({
      where: { id: primaryCandidate.id },
      data: { tags: updatedTags }
    });

    return NextResponse.redirect(new URL('/candidates', req.url));

  } catch (error) {
    console.error('Merge error:', error);
    return NextResponse.json({ success: false, error: 'Server error during merge' }, { status: 500 });
  }
}
