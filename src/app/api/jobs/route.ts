import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    
    // We need the user's organizationId
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
    }

    const { title, department, description, criteria } = await req.json();

    if (!title || !description || !criteria || !Array.isArray(criteria)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the Job, Rubric, and Criteria in a single transaction
    const job = await prisma.jobRequisition.create({
      data: {
        title,
        department,
        description,
        status: 'OPEN',
        ownerId: dbUser.id,
        organizationId: dbUser.organizationId,

        rubrics: {
          create: {
            status: 'APPROVED',
            criteria: {
              create: criteria.map(c => ({
                category: c.category || 'Skill',
                description: c.description,
                isRequired: c.isRequired,
                weight: parseInt(c.weight, 10) || 1
              }))
            }
          }
        }
      },
      include: {
        rubrics: true
      }
    });

    await logAuditEvent({
      action: 'JOB_REQUISITION_CREATED',
      actorId: dbUser.id,
      affectedRecordId: job.id,
      newValues: { title, department },

    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const jobs = await prisma.jobRequisition.findMany({
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
