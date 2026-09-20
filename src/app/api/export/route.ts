import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { escapeCsvCell, safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';

export async function GET() {
  // SECURITY: Fixed getServerSession() → requireAuth (uses authOptions)
  const auth = await requirePermission(Permission.ExportData);
  if (auth.error) return auth.error;

  const whereClause: any = { job: { organizationId: auth.user.organizationId } };
  if (auth.user.role === 'HiringManager') {
    whereClause.job = {
      ownerId: auth.user.id
    };
  }
  if (auth.user.departmentRestrictions.length > 0) {
    whereClause.job = {
      ...(whereClause.job || {}),
      department: { in: auth.user.departmentRestrictions },
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

  // Spec §6.11: downloaded resumes and exported reports are controlled personal
  // data and must be logged — record who exported what and how many records.
  await logAuditEvent({
    action: 'DATA_EXPORT',
    actorId: auth.user.id,
    organizationId: auth.user.organizationId,
    newValues: {
      format: 'csv',
      recordCount: applications.length,
      filters: { role: auth.user.role },
    },
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="recruitment_report.csv"'
    }
  });
}
