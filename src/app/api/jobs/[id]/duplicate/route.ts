import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse } from '@/lib/validation';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ManageJobs);
    if (auth.error) return auth.error;

    const { id: sourceJobId } = await params;

    const sourceJob = await prisma.jobRequisition.findFirst({
      where: { id: sourceJobId, organizationId: auth.user.organizationId },
      include: {
        rubrics: {
          include: { criteria: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!sourceJob) {
      return NextResponse.json({ error: 'Source job not found' }, { status: 404 });
    }

    const latestRubric = sourceJob.rubrics[0];
    const sourceCriteria = latestRubric?.criteria ?? [];

    const duplicatedJob = await prisma.$transaction(async (tx) => {
      const newJob = await tx.jobRequisition.create({
        data: {
          title: `${sourceJob.title} (Copy)`,
          department: sourceJob.department,
          location: sourceJob.location,
          employmentType: sourceJob.employmentType,
          description: sourceJob.description,
          status: 'DRAFT',
          ownerId: auth.user.id,
          organizationId: auth.user.organizationId,
          rubrics: {
            create: {
              version: 1,
              status: 'DRAFT',
              changeReason: `Cloned from "${sourceJob.title}" (ID: ${sourceJob.id})`,
              criteria: {
                create: sourceCriteria.map((c) => ({
                  category: c.category,
                  description: c.description,
                  isRequired: c.isRequired,
                  weight: c.weight,
                  threshold: c.threshold,
                  evidenceRules: c.evidenceRules,
                })),
              },
            },
          },
        },
        include: {
          rubrics: {
            include: { criteria: true },
          },
        },
      });

      return newJob;
    });

    await logAuditEvent({
      action: 'JOB_REQUISITION_DUPLICATED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: duplicatedJob.id,
      previousValues: { sourceJobId: sourceJob.id, sourceTitle: sourceJob.title },
      newValues: { newJobId: duplicatedJob.id, newTitle: duplicatedJob.title },
    });

    return NextResponse.json({ success: true, job: duplicatedJob }, { status: 201 });
  } catch (error) {
    console.error('Job duplication error:', error);
    return safeErrorResponse('Failed to duplicate job requisition');
  }
}
