import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLogger';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const where: any = { status: 'OPEN' };
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

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Fetch jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, department, description, criteria } = await req.json();

    if (!title || !department) {
      return NextResponse.json({ error: 'Title and department are required' }, { status: 400 });
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Organization not found for user' }, { status: 400 });
    }

    // Create Job Requisition with Rubric
    const job = await prisma.jobRequisition.create({
      data: {
        title,
        department,
        description: description || '',
        status: 'OPEN',
        ownerId: userId,
        organizationId: user.organizationId,
        rubrics: {
          create: {
            status: 'APPROVED',
            criteria: {
              create: (criteria && criteria.length > 0)
                ? criteria.map((c: any) => ({
                    category: c.category || 'Core Skill',
                    description: c.description || '',
                    isRequired: c.isRequired ?? true,
                    weight: Number(c.weight) || 3
                  }))
                : [
                    { category: 'Technical Skills', description: 'Core domain competency and practical experience', isRequired: true, weight: 5 },
                    { category: 'Problem Solving', description: 'Analytical reasoning and architectural problem solving', isRequired: true, weight: 4 },
                    { category: 'Communication', description: 'Clear technical communication and team collaboration', isRequired: false, weight: 3 }
                  ]
            }
          }
        }
      },
      include: {
        rubrics: { include: { criteria: true } }
      }
    });

    // ðŸ“¢ Broadcast In-App Notification to all users in system/org
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    if (allUsers.length > 0) {
      await prisma.notification.createMany({
        data: allUsers.map((u: any) => ({
          userId: u.id,
          title: `ðŸ“¢ New Job Posted: ${title}`,
          message: `${user.organization?.name || 'RecruitAI'} is now hiring for ${title} (${department}). Click to review requirements and apply!`,
          type: 'JOB_POSTED',
          link: `/jobs`
        }))
      });
    }

    // Log Audit Event
    await logAuditEvent({
      action: 'JOB_REQUISITION_CREATED',
      actorId: userId,
      affectedRecordId: job.id,
      newValues: { title, department, criteriaCount: criteria?.length || 3, organizationId: user.organizationId }
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error: any) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create job requisition' }, { status: 500 });
  }
}