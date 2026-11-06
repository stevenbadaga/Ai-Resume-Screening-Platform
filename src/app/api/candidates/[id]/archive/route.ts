import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { validateBody, safeErrorResponse } from '@/lib/validation';

/**
 * Candidate & application archive (spec §6.3) — an authorized recruiter can
 * archive or restore a candidate record along with every application the
 * candidate holds in this organization. Archiving is a lifecycle action, not a
 * decision: stages, decisions, screening history, and audit trails are all
 * preserved; the records simply leave the active pipeline and analytics
 * surfaces until restored.
 *
 * Every call is organization-scoped, requires an explicit human reason, and is
 * captured in the tamper-evident audit ledger.
 */

const archiveSchema = z.object({
  archived: z.boolean(),
  reason: z.string().trim().min(3).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.MakeHiringDecisions);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { data, error } = validateBody(archiveSchema, await req.json());
    if (error) return error;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          where: { job: { organizationId: auth.user.organizationId } },
          select: { id: true },
        },
      },
    });
    // Organization scope enforced: a candidate from another organization
    // resolves to zero visible applications, and without org-visible
    // applications there is nothing this workspace is permitted to archive.
    if (!candidate || candidate.applications.length === 0) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const now = new Date();
    const archivedAt = data.archived ? now : null;
    const action = data.archived ? 'CANDIDATE_ARCHIVED' : 'CANDIDATE_UNARCHIVED';

    await prisma.$transaction([
      prisma.candidate.update({
        where: { id: candidate.id },
        data: { archivedAt },
      }),
      prisma.application.updateMany({
        where: {
          candidateId: candidate.id,
          id: { in: candidate.applications.map((a) => a.id) },
        },
        data: { archivedAt },
      }),
    ]);

    await logAuditEvent({
      action,
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: candidate.id,
      previousValues: {
        candidateArchivedAt: candidate.archivedAt ?? null,
        applicationIds: candidate.applications.map((a) => a.id),
      },
      newValues: { archivedAt, reason: data.reason },
    });

    return NextResponse.json({
      success: true,
      archived: data.archived,
      applicationsAffected: candidate.applications.length,
    });
  } catch (err) {
    console.error('Archive candidate failed:', err);
    return safeErrorResponse('Failed to archive candidate');
  }
}
