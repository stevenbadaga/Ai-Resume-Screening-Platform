/**
 * Playwright global setup — seeds a scoped E2E dataset through the REAL
 * Prisma client against TEST_DATABASE_URL (never the unit-suite mock):
 *
 *   organization + recruiter role + ACTIVE recruiter user (verified email,
 *   known password) + OPEN job with APPROVED rubric (2 weighted criteria) +
 *   consented candidate + application + completed resume document +
 *   completed screening run with per-criterion evidence assessments.
 *
 * Everything lives in the per-run namespace (e2e/constants.ts) so teardown
 * can delete exactly what was created. Self-skips cleanly when
 * TEST_DATABASE_URL is not set.
 */
import fs from 'fs';
import path from 'path';
import { chromium, type FullConfig } from '@playwright/test';
import { E2E, RUN_ID } from './constants';
import { createE2EPrisma } from './prismaClient';

async function seedDatabase() {
  // Interop-proof client (see prismaClient.ts) bound to TEST_DATABASE_URL.
  const prisma = createE2EPrisma();

  // Reclaim artifacts from earlier crashed runs (scoped prefixes only).
  const staleOrgs = await prisma.organization.findMany({
    where: { OR: [{ id: { startsWith: 'org-a-e2e' } }] },
    select: { id: true },
  });
  for (const org of staleOrgs) {
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
  await prisma.role.deleteMany({ where: { id: { startsWith: 'role-recruiter-e2e' } } });

  // Role (unique name per run avoids unique-constraint collisions)
  // Authorization is keyed by role NAME (roleAccess matrix); the scoped role
  // must carry a recognized name (Admin also unlocks /audit for the workflow test).
  const role = await prisma.role.create({
    data: { id: E2E.roleId, name: 'Admin', permissions: ['e2e:test'] },
  });

  // Organization + recruiter with a KNOWN password (bcrypt, same cost as app)
  await prisma.organization.create({ data: { id: E2E.orgId, name: E2E.orgName } });

  const bcrypt = (await import('bcryptjs')).default;
  const passwordHash = await bcrypt.hash(E2E.recruiter.password, 12);
  await prisma.user.create({
    data: {
      id: E2E.recruiter.id,
      email: E2E.recruiter.email,
      name: E2E.recruiter.name,
      passwordHash,
      organizationId: E2E.orgId,
      accessStatus: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { connect: { id: role.id } },
    },
  });

  // Job with DRAFT → APPROVED rubric (matches the API state machine)
  const job = await prisma.jobRequisition.create({
    data: {
      title: E2E.job.title,
      department: E2E.job.department,
      description: 'E2E seeding job for the recruiter workflow browser test.',
      status: 'DRAFT',
      ownerId: E2E.recruiter.id,
      organizationId: E2E.orgId,
      rubrics: {
        create: {
          version: 1,
          status: 'DRAFT',
          criteria: {
            create: [
              { category: 'Skill', description: 'Node.js backend experience', isRequired: true, weight: 5 },
              { category: 'Skill', description: 'PostgreSQL experience', isRequired: false, weight: 3 },
            ],
          },
        },
      },
    },
    include: { rubrics: true },
  });
  const rubric = job.rubrics[0];
  await prisma.rubric.update({
    where: { id: rubric.id },
    data: { status: 'APPROVED', changeReason: 'E2E seed', version: { increment: 1 } },
  });
  await prisma.jobRequisition.update({ where: { id: job.id }, data: { status: 'OPEN' } });

  // Candidate + application + resume + screening run with evidence
  const candidate = await prisma.candidate.create({
    data: {
      firstName: E2E.candidate.firstName,
      lastName: E2E.candidate.lastName,
      email: E2E.candidate.email,
      consentGiven: true,
      consentNoticeVersion: 'v1.1',
      consentGivenAt: new Date(),
      consentChoices: JSON.stringify({ dataProcessing: true }),
    },
  });
  const application = await prisma.application.create({
    data: { candidateId: candidate.id, jobId: job.id, stage: 'NEW', status: 'NEW' },
  });

  const uploadsDir = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const resumeText = 'Node.js and PostgreSQL developer with 5 years of experience.';
  const absoluteResumePath = path.join(process.cwd(), E2E.resumePath);
  fs.writeFileSync(absoluteResumePath, resumeText);

  const resume = await prisma.resumeDocument.create({
    data: {
      applicationId: application.id,
      fileReference: absoluteResumePath,
      extractedText: resumeText,
      processingStatus: 'COMPLETED',
    },
  });

  const criteria = await prisma.criterion.findMany({ where: { rubricId: rubric.id } });
  const required = criteria.find((c: any) => c.isRequired)!;
  const optional = criteria.find((c: any) => !c.isRequired)!;

  const run = await prisma.screeningRun.create({
    data: {
      applicationId: application.id,
      rubricId: rubric.id,
      resumeId: resume.id,
      rubricVersion: 2,
      resumeVersion: 1,
      aiVersion: 'e2e-model-v1',
      configuration: JSON.stringify({ model: 'e2e-model-v1' }),
      status: 'COMPLETED',
      totalResult: 86.7,
      effectiveResult: 86.7,
    },
  });
  await prisma.criterionAssessment.create({
    data: {
      screeningRunId: run.id,
      criterionId: required.id,
      result: 'MATCH',
      supportingEvidence: 'Node.js and PostgreSQL developer with 5 years of experience.',
      sourceLocation: 'extractedText:1',
      uncertainty: false,
      scoreContribution: required.weight,
    },
  });
  await prisma.criterionAssessment.create({
    data: {
      screeningRunId: run.id,
      criterionId: optional.id,
      result: 'MATCH',
      supportingEvidence: 'PostgreSQL developer with 5 years of experience.',
      sourceLocation: 'extractedText:1',
      uncertainty: false,
      scoreContribution: optional.weight,
    },
  });

  await prisma.$disconnect();

  return { jobTitle: E2E.job.title };
}

async function globalSetup(_config: FullConfig) {
  if (!process.env.TEST_DATABASE_URL) {
    console.warn('\n[e2e] TEST_DATABASE_URL not set — E2E suite requires it for scoped seeding. Skipping.\n');
    return;
  }

  const { jobTitle } = await seedDatabase();

  // Wait for the app to come up before tests start.
  // Same resolution as playwright.config.ts (FullConfig type doesn't expose .use).
  const baseURL = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const deadline = Date.now() + 120_000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    try {
      const response = await page.goto(baseURL, { timeout: 10_000 });
      ready = Boolean(response && response.ok());
    } catch {
      await page.waitForTimeout(2_000);
    }
  }
  await browser.close();
  if (!ready) throw new Error(`[e2e] App did not become reachable at ${baseURL}`);
  console.log(`\n[e2e] Seeded and app ready at ${baseURL} (job: "${jobTitle}")\n`);
}

export default globalSetup;
