import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { safeErrorResponse } from '@/lib/validation';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const userEmail = auth.user.email;

    // Fetch user and linked candidate records
    const [userRecord, candidateRecord] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.user.id },
        include: {
          roles: { select: { name: true, permissions: true } },
          notifications: { orderBy: { createdAt: 'desc' }, take: 50 },
          organization: { select: { id: true, name: true } }
        }
      }),
      prisma.candidate.findFirst({
        where: { email: userEmail },
        include: {
          applications: {
            include: {
              job: { select: { id: true, title: true, department: true } },
              parsedProfile: true,
              screeningRuns: {
                include: { assessments: { include: { criterion: true } } },
                orderBy: { createdAt: 'desc' }
              },
              interviews: {
                include: { participants: true },
                orderBy: { createdAt: 'desc' }
              },
              decisions: { orderBy: { createdAt: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
          },
          privacyRequests: true
        }
      })
    ]);

    const exportData = {
      gdprNotice: 'This export is generated pursuant to Article 20 of the General Data Protection Regulation (GDPR) - Right to Data Portability.',
      exportTimestamp: new Date().toISOString(),
      subjectEmail: userEmail,
      account: userRecord ? {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        accessStatus: userRecord.accessStatus,
        role: userRecord.roles[0]?.name || 'Candidate',
        organization: userRecord.organization.name,
        createdAt: userRecord.createdAt
      } : null,
      candidateProfile: candidateRecord ? {
        id: candidateRecord.id,
        firstName: candidateRecord.firstName,
        lastName: candidateRecord.lastName,
        email: candidateRecord.email,
        consentGiven: candidateRecord.consentGiven,
        source: candidateRecord.source,
        tags: candidateRecord.tags,
        createdAt: candidateRecord.createdAt,
        applications: candidateRecord.applications.map((app) => ({
          applicationId: app.id,
          jobTitle: app.job.title,
          department: app.job.department,
          stage: app.stage,
          status: app.status,
          appliedAt: app.createdAt,
          parsedSkills: app.parsedProfile?.skills ? JSON.parse(app.parsedProfile.skills) : [],
          parsedEmployment: app.parsedProfile?.employment ? JSON.parse(app.parsedProfile.employment) : [],
          parsedEducation: app.parsedProfile?.education ? JSON.parse(app.parsedProfile.education) : [],
          evaluations: app.screeningRuns.map((run) => ({
            screeningId: run.id,
            score: run.effectiveResult ?? run.totalResult,
            aiVersion: run.aiVersion,
            assessments: run.assessments.map((a) => ({
              category: a.criterion.category,
              description: a.criterion.description,
              result: a.effectiveResult ?? a.result,
              evidence: a.supportingEvidence
            }))
          })),
          interviews: app.interviews.map((inv) => ({
            id: inv.id,
            schedule: inv.schedule,
            status: inv.status
          }))
        }))
      } : null,
      notifications: userRecord?.notifications || []
    };

    await logAuditEvent({
      action: 'GDPR_DATA_EXPORT_DOWNLOADED',
      actorId: auth.user.id,
      organizationId: auth.user.organizationId,
      affectedRecordId: auth.user.id,
      newValues: { email: userEmail, timestamp: new Date().toISOString() }
    });

    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="recruitai_gdpr_export_${Date.now()}.json"`
      }
    });
  } catch (error) {
    console.error('Privacy export error:', error);
    return safeErrorResponse('Failed to generate GDPR data export');
  }
}
