import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { escapeCsvCell, safeErrorResponse } from '@/lib/validation';

export async function GET() {
  // SECURITY: Fixed getServerSession() → requireAuth (uses authOptions)
  const auth = await requireAuth(['Admin', 'Recruiter', 'HiringManager']);
  if (auth.error) return auth.error;

  const whereClause: any = { job: { organizationId: auth.user.organizationId } };
  if (auth.user.role === 'HiringManager') {
    whereClause.job = {
      ownerId: auth.user.id
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

  // Construct CSV string — SECURITY: Escape all cells to prevent CSV formula injection
  let csvContent = 'Application ID,Candidate Name,Email,Job Title,Status,AI Match Score,Applied At\n';

  for (const app of applications) {
    const score = app.screeningRuns[0]?.effectiveResult ?? app.screeningRuns[0]?.totalResult ?? 'N/A';
    const name = `${app.candidate.firstName} ${app.candidate.lastName}`;
    csvContent += `${escapeCsvCell(app.id)},${escapeCsvCell(name)},${escapeCsvCell(app.candidate.email)},${escapeCsvCell(app.job.title)},${escapeCsvCell(app.status)},${escapeCsvCell(String(score))},${escapeCsvCell(app.createdAt.toISOString())}\n`;
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="recruitment_report.csv"'
    }
  });
}
