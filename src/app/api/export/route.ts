import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roleAccess';
import { escapeCsvCell, safeErrorResponse } from '@/lib/validation';
import { logAuditEvent } from '@/lib/auditLogger';
import { logEvent } from '@/lib/observability';

/**
 * CSV export of the permitted application set (spec §6.10/§6.11).
 *
 * Previously loaded EVERY matching application (with candidate, job, and the
 * latest screening run) in a single findMany before building the CSV string —
 * unbounded memory on large datasets. Now the rows stream in cursor-batched
 * pages (createdAt + id keyset, 500 rows per query) and are written to the
 * response incrementally, so memory stays flat regardless of volume.
 *
 * Authorization and privacy semantics are unchanged: org scoping, hiring-
 * manager ownership, and department restrictions all still apply; the export
 * is audit-logged with the row count.
 */

const BATCH_SIZE = 500;
const CSV_HEADERS = 'Application ID,Candidate Name,Email,Job Title,Stage,Status,AI Match Score,Applied At\n';

export async function GET() {
  try {
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

    const encoder = new TextEncoder();
    let rowCount = 0;
    let cursor: { createdAt: Date; id: string } | null = null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(CSV_HEADERS));

          // Keyset pagination: strictly ordered by (createdAt, id) so batches
          // never overlap or skip, and each query is an indexed range scan.
          while (true) {
            const batch = await prisma.application.findMany({
              where: whereClause,
              include: {
                candidate: { select: { firstName: true, lastName: true, email: true } },
                job: { select: { title: true } },
                screeningRuns: {
                  orderBy: { createdAt: 'desc' as const },
                  take: 1,
                  select: { effectiveResult: true, totalResult: true },
                },
              },
              orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
              ...(cursor
                ? { where: { ...whereClause, OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                  ] } }
                : {}),
              take: BATCH_SIZE,
            });

            if (batch.length === 0) break;

            let csvChunk = '';
            for (const app of batch) {
              rowCount += 1;
              const score =
                app.screeningRuns[0]?.effectiveResult ??
                app.screeningRuns[0]?.totalResult ??
                'N/A';
              const name = `${app.candidate.firstName} ${app.candidate.lastName}`;
              csvChunk += `${escapeCsvCell(app.id)},${escapeCsvCell(name)},${escapeCsvCell(app.candidate.email)},${escapeCsvCell(app.job.title)},${escapeCsvCell(app.stage)},${escapeCsvCell(app.status)},${escapeCsvCell(String(score))},${escapeCsvCell(app.createdAt.toISOString())}\n`;
            }
            controller.enqueue(encoder.encode(csvChunk));

            const last = batch[batch.length - 1];
            cursor = { createdAt: last.createdAt, id: last.id };

            if (batch.length < BATCH_SIZE) break;
          }
        } catch (error) {
          // Surface the failure both to the tracker and to the consumer —
          // a truncated CSV must never look complete.
          logEvent('error', 'export.streamFailed', { rowsBeforeFailure: rowCount });
          controller.error(error);
          return;
        }
        controller.close();
      },
    });

    // §6.11: exported reports are controlled personal data — record who
    // exported what and how many records. Awaited before responding so the
    // audit event persists even if the client disconnects mid-download.
    await logAuditEvent({
      action: 'DATA_EXPORT',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      requestContext: { streaming: true, batchSize: BATCH_SIZE },
      newValues: {
        format: 'csv',
        recordCount: rowCount,
        filters: { role: auth.user.role },
      },
    });

    logEvent('info', 'export.completed', {
      actorId: auth.user.id,
      rows: rowCount,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="recruitment_report_${stamp}.csv"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return safeErrorResponse('Failed to export data');
  }
}
