import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requireAuth } from '@/lib/auth';
import { createJobSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    // Require authentication to list jobs
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const where: any = { organizationId: auth.user.organizationId };
    if (department && department !== 'ALL') {
      where.department = department;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } }
      ];
    }

    const jobs = await prisma.jobRequisition.findMany({
      where,
      include: {
        organization: { select: { name: true } },
        rubrics: {
          include: { criteria: true },
          take: 1
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ jobs, count: jobs.length });
  } catch (error: any) {
    console.error('Fetch jobs error:', error);
    return safeErrorResponse('Failed to fetch jobs');
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager']);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(createJobSchema, body);
    if (error) return error;

    const { title, department, description, criteria } = data;

    const job = await prisma.jobRequisition.create({
      data: {
        title,
        department,
        description: description || 'No description provided.',
        status: 'OPEN',
        ownerId: auth.user.id,
        organizationId: auth.user.organizationId,
        rubrics: {
          create: {
            status: 'APPROVED',
            criteria: {
              create: criteria.map((c) => ({
                category: c.category || 'General Requirement',
                description: c.description,
                weight: c.weight || 3
              }))
            }
          }
        }
      },
      include: {
        rubrics: {
          include: { criteria: true }
        }
      }
    });

    await logAuditEvent({
      action: 'JOB_REQUISITION_CREATED',
      actorId: auth.user.id,
      affectedRecordId: job.id,
      newValues: { title: job.title, department: job.department }
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error: any) {
    console.error('Job creation error:', error);
    // SECURITY: Never leak internal error details
    return safeErrorResponse('Failed to create job requisition');
  }
}