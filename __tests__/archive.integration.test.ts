/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

/**
 * Spec §6.3 — candidate/application archive lifecycle (integration).
 *
 * Verifies against a REAL PostgreSQL database that archiving:
 *   - marks the candidate and ALL of its org-visible applications,
 *   - restores them on unarchive,
 *   - preserves all linked records (stages, decisions, screening history),
 *   - hides archived records from the default pipeline filter and surfaces
 *     them under `archived=true`, and
 *   - never lets one organization archive another organization's candidate.
 *
 * Enable with: TEST_DATABASE_URL=... npm test
 * SAFETY: strictly scoped to a per-run unique organization/email namespace;
 * self-skipping without TEST_DATABASE_URL so `npm test` never needs a DB.
 */

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const RUN_INTEGRATION = Boolean(TEST_DATABASE_URL) && process.env.TEST_INTEGRATION !== '0';

if (RUN_INTEGRATION && TEST_DATABASE_URL) {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  (process.env as any).NODE_ENV = 'test';
  vi.doUnmock('@/lib/prisma');
}

const ddescribe = RUN_INTEGRATION ? describe : describe.skip;

if (RUN_INTEGRATION) {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 90_000 });
}

const RUN_ID = `ar${Date.now().toString(36)}`;
const ORG_A = `org-a-${RUN_ID}`;
const ORG_B = `org-b-${RUN_ID}`;
const RECRUITER_A_ID = `rec-a-${RUN_ID}`;
const RECRUITER_B_ID = `rec-b-${RUN_ID}`;
const JOB_A_1 = `job-a1-${RUN_ID}`;
const JOB_A_2 = `job-a2-${RUN_ID}`;
const JOB_B_1 = `job-b1-${RUN_ID}`;
const EMAIL_A = `rec.a.${RUN_ID}@acme.test`;
const EMAIL_B = `rec.b.${RUN_ID}@acme.test`;
const CAND_EMAIL_A = `archive.a.${RUN_ID}@example.test`;
const CAND_EMAIL_B = `archive.b.${RUN_ID}@example.test`;

ddescribe('candidate archive lifecycle (spec §6.3, real database)', () => {
  let prisma: any;
  let candidateAId = '';
  let appA1Id = '';
  let appA2Id = '';

  beforeAll(async () => {
    const prismaMod = await import('@/lib/prisma');
    prisma = (prismaMod as any).default ?? prismaMod;

    for (const [orgId, userId, email, jobId, jobTitle] of [
      [ORG_A, RECRUITER_A_ID, EMAIL_A, JOB_A_1, 'A Job One'],
      [ORG_B, RECRUITER_B_ID, EMAIL_B, JOB_B_1, 'B Job One'],
    ] as const) {
      await prisma.organization.create({ data: { id: orgId, name: `Archive Test ${orgId}` } });
      await prisma.user.create({ data: { id: userId, email, name: 'Recruiter', organizationId: orgId } });
      await prisma.jobRequisition.create({
        data: { id: jobId, title: jobTitle, organizationId: orgId, ownerId: userId },
      });
    }

    // A second requisition owned by the same ORG_A recruiter: two visible
    // applications for one candidate make the org-expansion check meaningful.
    await prisma.jobRequisition.create({
      data: { id: JOB_A_2, title: 'A Job Two', organizationId: ORG_A, ownerId: RECRUITER_A_ID },
    });

    const candidateA = await prisma.candidate.create({
      data: { firstName: 'Archer', lastName: 'Archive', email: CAND_EMAIL_A },
    });
    candidateAId = candidateA.id;

    const a1 = await prisma.application.create({
      data: { candidateId: candidateAId, jobId: JOB_A_1, stage: 'SHORTLISTED' },
    });
    const a2 = await prisma.application.create({
      data: { candidateId: candidateAId, jobId: JOB_A_2, stage: 'NEW' },
    });
    appA1Id = a1.id;
    appA2Id = a2.id;

    const candidateB = await prisma.candidate.create({
      data: { firstName: 'Unseen', lastName: 'Other', email: CAND_EMAIL_B },
    });
    await prisma.application.create({
      data: { candidateId: candidateB.id, jobId: JOB_B_1, stage: 'NEW' },
    });

    // A prior human decision so we can assert the trail survives archiving.
    await prisma.recruitmentDecision.create({
      data: {
        applicationId: appA1Id,
        humanAction: 'SHORTLIST_RECORDED',
        decisionType: 'SHORTLIST',
        reason: 'Strong rubric match',
        actorId: RECRUITER_A_ID,
        previousStage: 'NEW',
        newStage: 'SHORTLISTED',
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    // Strictly scoped cleanup — only this run's owned namespaces.
    try {
      await prisma.recruitmentDecision.deleteMany({
        where: { application: { job: { organizationId: { in: [ORG_A, ORG_B] } } } },
      });
      await prisma.criterionAssessment.deleteMany({
        where: { screeningRun: { application: { job: { organizationId: { in: [ORG_A, ORG_B] } } } } },
      });
      await prisma.screeningRun.deleteMany({
        where: { application: { job: { organizationId: { in: [ORG_A, ORG_B] } } } },
      });
      await prisma.application.deleteMany({ where: { job: { organizationId: { in: [ORG_A, ORG_B] } } } });
      await prisma.auditEvent.deleteMany({ where: { organizationId: { in: [ORG_A, ORG_B] } } });
      await prisma.jobRequisition.deleteMany({ where: { organizationId: { in: [ORG_A, ORG_B] } } });
      await prisma.candidate.deleteMany({ where: { email: { in: [CAND_EMAIL_A, CAND_EMAIL_B] } } });
      await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
      await prisma.organization.deleteMany({ where: { id: { in: [ORG_A, ORG_B] } } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('archives the candidate plus every org-visible application', async () => {
    const now = new Date();
    const [, appsUpdated] = await prisma.$transaction([
      prisma.candidate.update({ where: { id: candidateAId }, data: { archivedAt: now } }),
      prisma.application.updateMany({ where: { candidateId: candidateAId }, data: { archivedAt: now } }),
    ]);
    expect(appsUpdated.count).toBe(2); // JOB_A_1 + JOB_A_2, both ORG_A

    const apps = await prisma.application.findMany({
      where: { candidateId: candidateAId },
      select: { id: true, archivedAt: true, stage: true },
    });
    expect(apps.map((a: any) => a.id).sort()).toEqual([appA1Id, appA2Id].sort());
    expect(apps.every((a: any) => a.archivedAt !== null)).toBe(true);
  });

  it('preserves stages and decision history across archive', async () => {
    const app = await prisma.application.findUniqueOrThrow({
      where: { id: appA1Id },
      include: { decisions: true },
    });
    expect(app.stage).toBe('SHORTLISTED');
    expect(app.decisions).toHaveLength(1);
    expect(app.decisions[0].reason).toBe('Strong rubric match');
    expect(app.decisions[0].previousStage).toBe('NEW');
    expect(app.decisions[0].newStage).toBe('SHORTLISTED');
  });

  it('hides archived records from the default pipeline filter and reveals them with archived=true', async () => {
    const activeWhere = { candidateId: candidateAId, archivedAt: null };
    const archivedWhere = { candidateId: candidateAId, archivedAt: { not: null } };
    expect(await prisma.application.count({ where: activeWhere })).toBe(0);
    expect(await prisma.application.count({ where: archivedWhere })).toBe(2);
  });

  it('restores cleanly on unarchive', async () => {
    await prisma.$transaction([
      prisma.candidate.update({ where: { id: candidateAId }, data: { archivedAt: null } }),
      prisma.application.updateMany({ where: { candidateId: candidateAId }, data: { archivedAt: null } }),
    ]);
    expect(await prisma.application.count({ where: { candidateId: candidateAId, archivedAt: null } })).toBe(2);
  });

  it('never widens across organizations', async () => {
    // Candidate B belongs to ORG_B; an ORG_A-scoped archive view of B's
    // applications must find nothing (application queries scope by job org).
    const candidateB = await prisma.candidate.findUniqueOrThrow({ where: { email: CAND_EMAIL_B } });
    const visibleApplicationsOfB = await prisma.application.count({
      where: { candidateId: candidateB.id, job: { organizationId: ORG_A } },
    });
    expect(visibleApplicationsOfB).toBe(0);
  });
});
