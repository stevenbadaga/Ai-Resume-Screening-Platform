import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { createJobSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    // Require authentication to list jobs
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const where: any = auth.user.role === 'Candidate'
      ? { status: 'OPEN' }
      : { organizationId: auth.user.organizationId };

    // Spec §6.1: users may be limited to permitted departments. A department-
    // restricted user only sees jobs in their allowed departments (the filter
    // is already applied to decisions and exports).
    if (auth.user.role !== 'Candidate' && auth.user.departmentRestrictions.length > 0) {
      where.department = { in: auth.user.departmentRestrictions };
    }

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

    // Candidates get their own standing per position (§6.3 explainability):
    // application stage/status plus the latest AI screening score, so the
    // board shows where they stand on each job and powers one-click apply.
    let myApplications: Record<
      string,
      { applicationId: string; status: string; stage: string; score: number | null; appliedAt: string }
    > = {};
    if (auth.user.role === 'Candidate') {
      const candidate = await prisma.candidate.findFirst({
        where: { email: auth.user.email },
        select: {
          profileResumeRef: true,
          applications: {
            select: {
              id: true,
              jobId: true,
              status: true,
              stage: true,
              createdAt: true,
              screeningRuns: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { totalResult: true, effectiveResult: true },
              },
            },
          },
        },
      });
      if (candidate) {
        myApplications = Object.fromEntries(
          candidate.applications.map((a) => {
            const run = a.screeningRuns[0];
            const raw = run?.effectiveResult ?? run?.totalResult ?? null;
            const score = raw === null ? null : Number(raw);
            return [
              a.jobId,
              {
                applicationId: a.id,
                status: a.status,
                stage: a.stage,
                score: score !== null && Number.isFinite(score) ? score : null,
                appliedAt: a.createdAt.toISOString(),
              },
            ];
          })
        );
      }
      return NextResponse.json({
        jobs,
        count: jobs.length,
        myApplications,
        hasSavedResume: Boolean(candidate?.profileResumeRef),
      });
    }

    return NextResponse.json({ jobs, count: jobs.length });
  } catch (error: any) {
    console.error('Fetch jobs error:', error);
    return safeErrorResponse('Failed to fetch jobs');
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requirePermission(Permission.ManageJobs);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input with Zod
    const { data, error } = validateBody(createJobSchema, body);
    if (error) return error;

    const { title, department, description, location, employmentType, opensAt, closesAt, criteria } = data;

    const job = await prisma.jobRequisition.create({
      data: {
        title,
        department,
        description: description || 'No description provided.',
        location,
        employmentType,
        status: 'DRAFT',
        ownerId: auth.user.id,
        organizationId: auth.user.organizationId,
        rubrics: {
          create: {
            status: 'DRAFT',
            criteria: {
              create: criteria.map((c) => ({
                // §6.2: every criterion carries a category; empty input falls
                // back to a sensible default instead of a blank category.
                category: c.category?.trim() || 'General Requirement',
                description: c.description || c.name || 'General requirement',
                isRequired: c.isRequired ?? false,
                weight: c.weight || 3,
                threshold: c.threshold?.trim() || null,
                evidenceRules: c.evidenceRules?.trim() || null
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
      organizationId: auth.user.organizationId,
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