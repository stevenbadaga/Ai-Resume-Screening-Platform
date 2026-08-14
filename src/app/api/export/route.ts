import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const role = (session.user as any)?.role || 'Recruiter';
  const userId = (session.user as any)?.id;

  const whereClause: any = {};
  if (role === 'HiringManager' && userId) {
    whereClause.job = {
      ownerId: userId
    };
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      candidate: true,
      job: true,
      screeningRuns: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Construct CSV string
  let csvContent = 'Application ID,Candidate Name,Email,Job Title,Status,AI Match Score,Applied At\n';

  for (const app of applications) {
    const score = app.screeningRuns[0]?.totalResult ?? 'N/A';
    const name = `${app.candidate.firstName} ${app.candidate.lastName}`;
    csvContent += `"${app.id}","${name}","${app.candidate.email}","${app.job.title}","${app.status}","${score}","${app.createdAt.toISOString()}"\n`;
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="recruitment_report.csv"'
    }
  });
}
