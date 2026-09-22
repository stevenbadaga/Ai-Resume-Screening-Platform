/**
 * Playwright global teardown — deletes ONLY the per-run namespace created by
 * global-setup (org-a-e2e<runid> org, recruiter.<runid>@ / tess.<runid>@ /
 * ANON-<runid> emails, role-recruiter-<runid> role), in FK-safe order.
 */
import fs from 'fs';
import path from 'path';
import { E2E, RUN_ID } from './constants';
import { createE2EPrisma } from './prismaClient';

export default async function globalTeardown() {
  if (!process.env.TEST_DATABASE_URL) return;

  // Interop-proof client (see prismaClient.ts) bound to TEST_DATABASE_URL.
  const prisma = createE2EPrisma();

  try {
    const org = await prisma.organization.findUnique({ where: { id: E2E.orgId } });
    if (org) {
      const apps = await prisma.application.findMany({
        where: { job: { organizationId: org.id } },
        select: { id: true },
      });
      for (const app of apps) {
        const appId = app.id;
        await prisma.criterionAssessment.deleteMany({ where: { screeningRun: { applicationId: appId } } });
        await prisma.recruitmentDecision.deleteMany({ where: { applicationId: appId } });
        await prisma.screeningRun.deleteMany({ where: { applicationId: appId } });
        await prisma.parsedProfile.deleteMany({ where: { applicationId: appId } });
        await prisma.interviewParticipant.deleteMany({ where: { interview: { applicationId: appId } } });
        await prisma.interview.deleteMany({ where: { applicationId: appId } });
        await prisma.communication.deleteMany({ where: { applicationId: appId } });
        await prisma.resumeDocument.deleteMany({ where: { applicationId: appId } });
        await prisma.application.delete({ where: { id: appId } });
      }
      await prisma.notification.deleteMany({ where: { user: { organizationId: org.id } } });
      await prisma.auditEvent.deleteMany({ where: { organizationId: org.id } });
      await prisma.criterion.deleteMany({ where: { rubric: { job: { organizationId: org.id } } } });
      await prisma.rubric.deleteMany({ where: { job: { organizationId: org.id } } });
      await prisma.jobRequisition.deleteMany({ where: { organizationId: org.id } });
      await prisma.user.deleteMany({ where: { organizationId: org.id } });
      await prisma.organization.delete({ where: { id: org.id } });
    }
    await prisma.privacyRequest.deleteMany({
      where: {
        candidate: {
          OR: [
            { email: { startsWith: `tess.${RUN_ID}@` } },
            { email: { startsWith: `ANON-${RUN_ID}` } },
          ],
        },
      },
    });
    await prisma.candidate.deleteMany({
      where: {
        OR: [
          { email: { startsWith: `tess.${RUN_ID}@` } },
          { email: { startsWith: `ANON-${RUN_ID}` } },
        ],
      },
    });
    await prisma.role.deleteMany({ where: { id: E2E.roleId } });
  } catch (err) {
    console.warn('[e2e] teardown failed (artifacts may remain):', err);
  } finally {
    if (fs.existsSync(E2E.resumePath)) fs.unlinkSync(E2E.resumePath);
    // Remove the shared run-id marker so the next run generates a fresh one.
    try {
      fs.unlinkSync(path.join(process.cwd(), 'test-results', '.e2e-run-id'));
    } catch {
      // already gone
    }
    await prisma.$disconnect();
  }
}
