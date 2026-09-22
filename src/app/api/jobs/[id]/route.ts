import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse, validateBody } from '@/lib/validation';
import { z } from 'zod/v4';

const updateJobSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  department: z.string().min(1).max(200).optional(),
  location: z.string().max(200).optional(),
  employmentType: z.string().max(100).optional(),
  description: z.string().max(10000).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id: jobId } = await params;

    const where: any = auth.user.role === 'Candidate'
      ? { id: jobId, status: 'OPEN' }
      : { id: jobId, organizationId: auth.user.organizationId };

    const job = await prisma.jobRequisition.findFirst({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        rubrics: {
          include: { criteria: true },
          orderBy: { version: 'desc' },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Fetch job error:', error);
    return safeErrorResponse('Failed to fetch job details');
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ManageJobs);
    if (auth.error) return auth.error;

    const { id: jobId } = await params;
    const body = await req.json();

    const { data, error } = validateBody(updateJobSchema, body);
    if (error) return error;

    const existingJob = await prisma.jobRequisition.findFirst({
      where: { id: jobId, organizationId: auth.user.organizationId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updatedJob = await prisma.jobRequisition.update({
      where: { id: jobId },
      data: {
        title: data.title ?? existingJob.title,
        department: data.department ?? existingJob.department,
        location: data.location ?? existingJob.location,
        employmentType: data.employmentType ?? existingJob.employmentType,
        description: data.description ?? existingJob.description,
        status: data.status ?? existingJob.status,
      },
      include: {
        rubrics: {
          include: { criteria: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    await logAuditEvent({
      action: 'JOB_REQUISITION_UPDATED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: jobId,
      previousValues: {
        title: existingJob.title,
        status: existingJob.status,
        department: existingJob.department,
      },
      newValues: {
        title: updatedJob.title,
        status: updatedJob.status,
        department: updatedJob.department,
      },
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('Update job error:', error);
    return safeErrorResponse('Failed to update job requisition');
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(Permission.ManageJobs);
    if (auth.error) return auth.error;

    const { id: jobId } = await params;

    const existingJob = await prisma.jobRequisition.findFirst({
      where: { id: jobId, organizationId: auth.user.organizationId },
      include: { _count: { select: { applications: true } } },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // If applications exist, archive rather than hard delete to preserve historical integrity (spec §6.2)
    if (existingJob._count.applications > 0) {
      const archived = await prisma.jobRequisition.update({
        where: { id: jobId },
        data: { status: 'ARCHIVED' },
      });

      await logAuditEvent({
        action: 'JOB_REQUISITION_ARCHIVED',
        actorId: auth.user.id,
        organizationId: auth.user.organizationId,
        affectedRecordId: jobId,
        newValues: { status: 'ARCHIVED', reason: 'Job has existing candidate applications' },
      });

      return NextResponse.json({ success: true, message: 'Job archived because applications exist', job: archived });
    }

    // If no applications, safe to remove rubrics and job requisition
    await prisma.$transaction(async (tx) => {
      const rubrics = await tx.rubric.findMany({ where: { jobId } });
      for (const r of rubrics) {
        await tx.criterion.deleteMany({ where: { rubricId: r.id } });
      }
      await tx.rubric.deleteMany({ where: { jobId } });
      await tx.jobRequisition.delete({ where: { id: jobId } });
    });

    await logAuditEvent({
      action: 'JOB_REQUISITION_DELETED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: jobId,
      previousValues: { title: existingJob.title },
    });

    return NextResponse.json({ success: true, message: 'Job requisition deleted' });
  } catch (error) {
    console.error('Delete job error:', error);
    return safeErrorResponse('Failed to delete job requisition');
  }
}
