import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { candidateMergeSchema, validateBody, safeErrorResponse } from '@/lib/validation';

/**
 * Merge duplicate candidate records (spec §6.3).
 *
 * §6.3: "Potential duplicate candidates must be identified using controlled
 * matching rules and presented for human review before records are merged."
 * The duplicates page is that human-review step; this endpoint executes the
 * confirmed merge. Candidates are scoped to the caller's organization via
 * their applications (spec §6.1 tenant boundary).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(Permission.MergeDuplicates);
    if (auth.error) return auth.error;

    // COMPAT: legacy duplicates page posts form-data; JSON is preferred.
    // The request body can only be read once, so pick the reader by header.
    const contentType = req.headers.get('content-type') ?? '';
    let email: string | null = null;
    let confirm: string | null = null;
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      const parsed = validateBody(candidateMergeSchema, body);
      if (parsed.error) return parsed.error;
      email = parsed.data.email;
      confirm = parsed.data.confirm;
    } else {
      const form = await req.formData();
      email = (form.get('email') as string | null)?.toLowerCase() ?? null;
      confirm = (form.get('confirm') as string | null) ?? null;
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    // §6.12: critical actions (bulk data-affecting operations) must require
    // confirmation — the duplicates screen is the explicit human confirmation.
    if (confirm !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Merge must be confirmed by the recruiter (confirm=true).' },
        { status: 400 }
      );
    }

    // SECURITY: only candidates with applications in the caller's organization
    // are visible to this route — candidates are global, applications are the
    // tenant boundary (spec §6.1).
    const duplicates = await prisma.candidate.findMany({
      where: {
        email,
        applications: { some: { job: { organizationId: auth.user.organizationId } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (duplicates.length <= 1) {
      return NextResponse.json(
        { success: false, error: 'No duplicate records found for this candidate in your organization' },
        { status: 404 }
      );
    }

    const primaryCandidate = duplicates[0];
    const duplicatesToMerge = duplicates.slice(1);
    const mergedIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const dup of duplicatesToMerge) {
        // Move applications and privacy requests to the primary record.
        await tx.application.updateMany({
          where: { candidateId: dup.id },
          data: { candidateId: primaryCandidate.id },
        });
        await tx.privacyRequest.updateMany({
          where: { candidateId: dup.id },
          data: { candidateId: primaryCandidate.id },
        });

        mergedIds.push(dup.id);

        // Delete the now-empty duplicate.
        await tx.candidate.delete({ where: { id: dup.id } });
      }
    });

    // Remove the POTENTIAL_DUPLICATE tag from the primary candidate.
    const updatedTags = primaryCandidate.tags.filter((t) => t !== 'POTENTIAL_DUPLICATE');
    await prisma.candidate.update({
      where: { id: primaryCandidate.id },
      data: { tags: updatedTags },
    });

    await logAuditEvent({
      action: 'CANDIDATE_MERGED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: primaryCandidate.id,
      newValues: {
        mergedFrom: mergedIds,
        duplicateCount: mergedIds.length,
        primaryEmailDomain: primaryCandidate.email.split('@')[1] ?? '',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Merged ${mergedIds.length} duplicate record(s) into the primary candidate.`,
      mergedCount: mergedIds.length,
    });
  } catch (error) {
    console.error('Merge error:', error);
    return safeErrorResponse('Server error during merge');
  }
}
