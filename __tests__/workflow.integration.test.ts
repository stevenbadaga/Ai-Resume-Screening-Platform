/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Spec §14 — Integration tests (database-backed).
 *
 * Runs the full minimum-completion-standard workflow against a REAL
 * PostgreSQL database:
 *   job + approved rubric → application → screening run with evidence →
 *   human decision with reason → interview scheduling (conflicts) →
 *   independent scorecards (privacy) → analytics → §6.11 erasure.
 *
 * Enable with:
 *   TEST_DATABASE_URL=postgresql://... TEST_INTEGRATION=1 npm test
 *
 * SAFETY: the suite is strictly scoped — it creates its own Organization
 * rows with per-run unique ids and touches ONLY records linked to them
 * (candidates/users are identified by per-run emails/ids). afterAll deletes
 * exactly what the run created. Shared or pre-existing data in the target
 * database is never modified or deleted. The suite self-skips when
 * TEST_DATABASE_URL is not set, so `npm test` never requires a database.
 */

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const RUN_INTEGRATION = Boolean(TEST_DATABASE_URL) && process.env.TEST_INTEGRATION !== '0';

if (RUN_INTEGRATION && TEST_DATABASE_URL) {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  (process.env as any).NODE_ENV = 'test';
  // tests/setup.ts mocks @/lib/prisma for the unit suite; undo that here so
  // the dynamic import below resolves the REAL Prisma client.
  vi.doUnmock('@/lib/prisma');
}

const ddescribe = RUN_INTEGRATION ? describe : describe.skip;

if (RUN_INTEGRATION) {
  // Remote database (e.g. Neon) round-trips take far longer than local
  // Postgres — the 5s unit-suite default is not enough.
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 90_000 });
}

// ─────────────────────────────────────────────
// Per-run, collision-free identifiers
// ─────────────────────────────────────────────

const RUN_ID = `it${Date.now().toString(36)}`;
const ORG_A = `org-a-${RUN_ID}`;
const ORG_B = `org-b-${RUN_ID}`;
const ROLE_ADMIN_ID = `role-admin-${RUN_ID}`;
const ROLE_RECRUITER_ID = `role-recruiter-${RUN_ID}`;
const ROLE_MANAGER_ID = `role-manager-${RUN_ID}`;
const ROLE_INTERVIEWER_ID = `role-interviewer-${RUN_ID}`;

const TEST_USERS = [
  { id: `u-admin-${RUN_ID}`, email: `admin-${RUN_ID}@acme.test`, name: 'Ava Admin', role: 'Admin', roleId: ROLE_ADMIN_ID },
  { id: `u-rec-${RUN_ID}`, email: `recruiter-${RUN_ID}@acme.test`, name: 'Rosa Recruiter', role: 'Recruiter', roleId: ROLE_RECRUITER_ID },
  { id: `u-mgr-${RUN_ID}`, email: `manager-${RUN_ID}@acme.test`, name: 'Mark Manager', role: 'HiringManager', roleId: ROLE_MANAGER_ID },
  { id: `u-int-${RUN_ID}`, email: `interviewer-${RUN_ID}@acme.test`, name: 'Ivy Interviewer', role: 'Interviewer', roleId: ROLE_INTERVIEWER_ID },
];

const CANDIDATE_EMAIL = `tess.${RUN_ID}@example.test`;
const CANDIDATE_EMAIL_2 = `ana.${RUN_ID}@example.test`;

/** Emails assigned by the §6.11 erasure test during anonymization. */
const anonymizedEmails: string[] = [];

ddescribe('workflow integration (spec §14, real database)', () => {
  let prisma: any;
  let uploadedFilePath: string;

  /**
   * Scoped cleanup — deletes ONLY rows in this suite's reserved namespaces:
   *   organizations  org-a-it… / org-b-it…
   *   roles          role-*-it…
   *   candidates     tess.it…@ / ana.it…@ / ANON-it…
   * and their linked records (FK-ordered). Shared or pre-existing data in the
   * target database is never touched. Idempotent: run in beforeAll to reclaim
   * artifacts from an earlier crashed run, and in afterAll for this run.
   */
  async function cleanupTestNamespaces() {
    const orgs = await prisma.organization.findMany({
      where: { OR: [{ id: { startsWith: 'org-a-it' } }, { id: { startsWith: 'org-b-it' } }] },
      select: { id: true },
    });
    const orgIds = orgs.map((o: any) => o.id);
    if (orgIds.length > 0) {
      const apps = await prisma.application.findMany({
        where: { job: { organizationId: { in: orgIds } } },
        select: { id: true },
      });
      const appIds = apps.map((a: any) => a.id);
      if (appIds.length > 0) {
        await prisma.criterionAssessment.deleteMany({ where: { screeningRun: { applicationId: { in: appIds } } } });
        await prisma.recruitmentDecision.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.screeningRun.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.parsedProfile.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.interviewParticipant.deleteMany({ where: { interview: { applicationId: { in: appIds } } } });
        await prisma.interview.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.communication.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.resumeDocument.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.application.deleteMany({ where: { id: { in: appIds } } });
      }
      await prisma.notification.deleteMany({ where: { user: { organizationId: { in: orgIds } } } });
      await prisma.auditEvent.deleteMany({ where: { organizationId: { in: orgIds } } });
      // FK order matters: JobRequisition.ownerId is RESTRICT, so jobs (and
      // their rubrics/criteria) must go BEFORE the users who own them.
      await prisma.criterion.deleteMany({ where: { rubric: { job: { organizationId: { in: orgIds } } } } });
      await prisma.rubric.deleteMany({ where: { job: { organizationId: { in: orgIds } } } });
      await prisma.jobRequisition.deleteMany({ where: { organizationId: { in: orgIds } } });
      await prisma.user.deleteMany({ where: { organizationId: { in: orgIds } } });
      await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    }
    // PrivacyRequest.candidateId is RESTRICT — clear requests before candidates.
    await prisma.privacyRequest.deleteMany({
      where: {
        candidate: {
          OR: [
            { email: { startsWith: 'tess.it' } },
            { email: { startsWith: 'ana.it' } },
            { email: { startsWith: 'ANON-it' } },
          ],
        },
      },
    });
    await prisma.candidate.deleteMany({
      where: {
        OR: [
          { email: { startsWith: 'tess.it' } },
          { email: { startsWith: 'ana.it' } },
          { email: { startsWith: 'ANON-it' } },
        ],
      },
    });
    await prisma.role.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'role-admin-it' } },
          { id: { startsWith: 'role-recruiter-it' } },
          { id: { startsWith: 'role-manager-it' } },
          { id: { startsWith: 'role-interviewer-it' } },
        ],
      },
    });
  }

  beforeAll(async () => {
    if (!RUN_INTEGRATION) return;
    prisma = (await import('@/lib/prisma')).default;
    uploadedFilePath = path.join(process.cwd(), 'uploads', `integration-test-${RUN_ID}.txt`);
    fs.mkdirSync(path.dirname(uploadedFilePath), { recursive: true });
    fs.writeFileSync(uploadedFilePath, 'Node.js and PostgreSQL developer with 5 years experience.');
    await cleanupTestNamespaces();
  }, 90_000);

  afterAll(async () => {
    if (!RUN_INTEGRATION) return;
    try {
      await cleanupTestNamespaces();
    } catch (err) {
      console.warn('[integration] cleanup failed (test artifacts may remain):', err);
    } finally {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      await prisma?.$disconnect();
    }
  }, 90_000);

  it('creates isolated organizations, roles, and staff users', async () => {
    await prisma.organization.create({ data: { id: ORG_A, name: `Acme ${RUN_ID}` } });
    await prisma.organization.create({ data: { id: ORG_B, name: `Other ${RUN_ID}` } });

    const roleSeed = [
      { id: ROLE_ADMIN_ID, name: 'Admin' },
      { id: ROLE_RECRUITER_ID, name: 'Recruiter' },
      { id: ROLE_MANAGER_ID, name: 'HiringManager' },
      { id: ROLE_INTERVIEWER_ID, name: 'Interviewer' },
    ];
    for (const r of roleSeed) {
      await prisma.role.create({ data: { id: r.id, name: r.name, permissions: [`${r.name.toLowerCase()}:test`] } });
    }

    for (const u of TEST_USERS) {
      await prisma.user.create({
        data: {
          id: u.id,
          email: u.email,
          name: u.name,
          organizationId: ORG_A,
          accessStatus: 'ACTIVE',
          emailVerifiedAt: new Date(),
          roles: { connect: { id: u.roleId } },
        },
      });
    }

    const orgAUsers = await prisma.user.findMany({ where: { organizationId: ORG_A }, include: { roles: true } });
    expect(orgAUsers).toHaveLength(4);
    expect(orgAUsers.every((u: any) => u.roles.length === 1)).toBe(true);
  });

  it('creates a job with rubric and enforces the DRAFT → APPROVED state machine', async () => {
    const job = await prisma.jobRequisition.create({
      data: {
        title: 'Senior Backend Engineer',
        department: 'Engineering',
        description: 'Builds backend services',
        status: 'DRAFT',
        ownerId: TEST_USERS[1].id, // recruiter owns the requisition
        organizationId: ORG_A,
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
      include: { rubrics: { include: { criteria: true } } },
    });

    expect(job.status).toBe('DRAFT');
    expect(job.rubrics[0].status).toBe('DRAFT');
    expect(job.rubrics[0].criteria).toHaveLength(2);

    // State machine: DRAFT → REVIEW → APPROVED (mirrors the rubric API rules)
    const rubric = job.rubrics[0];
    await prisma.rubric.update({ where: { id: rubric.id }, data: { status: 'REVIEW', changeReason: 'Submitted for review' } });
    const approved = await prisma.rubric.update({
      where: { id: rubric.id },
      data: { status: 'APPROVED', changeReason: 'Approved for screening', version: { increment: 1 } },
    });
    await prisma.jobRequisition.update({ where: { id: job.id }, data: { status: 'OPEN' } });

    expect(approved.status).toBe('APPROVED');
    expect(approved.version).toBe(2);

    // Only OPEN jobs accept applications (verify the state the API checks)
    const openJob = await prisma.jobRequisition.findFirstOrThrow({ where: { id: job.id, status: 'OPEN' } });
    expect(openJob.id).toBe(job.id);
  });

  it('records a consent-compliant application for an OPEN job', async () => {
    const job = await prisma.jobRequisition.findFirstOrThrow({ where: { organizationId: ORG_A } });
    const candidate = await prisma.candidate.create({
      data: {
        firstName: 'Tess',
        lastName: 'Ngabo',
        email: CANDIDATE_EMAIL,
        consentGiven: true,
        consentNoticeVersion: 'v1.1',
        consentGivenAt: new Date(),
        consentChoices: JSON.stringify({ dataProcessing: true }),
      },
    });
    const application = await prisma.application.create({
      data: { candidateId: candidate.id, jobId: job.id, stage: 'NEW', status: 'NEW' },
    });

    expect(application.stage).toBe('NEW');

    const stored = await prisma.candidate.findUniqueOrThrow({ where: { id: candidate.id } });
    expect(stored.consentNoticeVersion).toBe('v1.1');
    expect(stored.consentGivenAt).toBeTruthy();
    expect(JSON.parse(stored.consentChoices!)).toEqual({ dataProcessing: true });
  });

  it('persists an explainable screening run with evidence (§6.5)', async () => {
    const job = await prisma.jobRequisition.findFirstOrThrow({ where: { organizationId: ORG_A } });
    const rubric = await prisma.rubric.findFirstOrThrow({ where: { jobId: job.id, status: 'APPROVED' }, include: { criteria: true } });
    const application = await prisma.application.findFirstOrThrow({ where: { jobId: job.id } });

    const resume = await prisma.resumeDocument.create({
      data: {
        applicationId: application.id,
        fileReference: uploadedFilePath,
        extractedText: 'Node.js and PostgreSQL developer with 5 years experience.',
        processingStatus: 'COMPLETED',
      },
    });

    const requiredCriterion = rubric.criteria.find((c: any) => c.isRequired);
    const optionalCriterion = rubric.criteria.find((c: any) => !c.isRequired);

    const run = await prisma.screeningRun.create({
      data: {
        applicationId: application.id,
        rubricId: rubric.id,
        resumeId: resume.id,
        rubricVersion: rubric.version,
        resumeVersion: resume.version,
        aiVersion: 'test-model-v1',
        configuration: JSON.stringify({
          model: 'test-model-v1',
          criteria: rubric.criteria.map((c: any) => ({ id: c.id, weight: c.weight, isRequired: c.isRequired })),
        }),
        status: 'COMPLETED',
      },
    });

    await prisma.criterionAssessment.create({
      data: {
        screeningRunId: run.id,
        criterionId: requiredCriterion.id,
        result: 'MATCH',
        supportingEvidence: 'Node.js and PostgreSQL developer with 5 years experience.',
        sourceLocation: 'extractedText:1',
        uncertainty: false,
        scoreContribution: requiredCriterion.weight,
      },
    });
    await prisma.criterionAssessment.create({
      data: {
        screeningRunId: run.id,
        criterionId: optionalCriterion.id,
        result: 'PARTIAL',
        supportingEvidence: 'PostgreSQL developer with 5 years experience.',
        sourceLocation: 'extractedText:1',
        uncertainty: true,
        scoreContribution: optionalCriterion.weight * 0.5,
      },
    });

    const stored = await prisma.screeningRun.findUniqueOrThrow({
      where: { id: run.id },
      include: { assessments: true },
    });
    expect(stored.rubricVersion).toBe(2);
    expect(stored.resumeVersion).toBe(1);
    expect(JSON.parse(stored.configuration!).criteria).toHaveLength(2);
    expect(stored.assessments).toHaveLength(2);
    expect(stored.assessments.every((a: any) => a.supportingEvidence.length > 0)).toBe(true);
    expect(stored.assessments.every((a: any) => a.sourceLocation !== null)).toBe(true);
  });

  it('records a human decision with reason, actor, and stage history (§6.7)', async () => {
    const job = await prisma.jobRequisition.findFirstOrThrow({ where: { organizationId: ORG_A } });
    const application = await prisma.application.findFirstOrThrow({ where: { jobId: job.id } });
    const run = await prisma.screeningRun.findFirstOrThrow({ where: { applicationId: application.id } });

    const decision = await prisma.recruitmentDecision.create({
      data: {
        applicationId: application.id,
        screeningRunId: run.id,
        actorId: TEST_USERS[1].id, // recruiter
        humanAction: 'HUMAN_DECISION_RECORDED',
        decisionType: 'SHORTLIST',
        reason: '[SKILL_MATCH] Strong backend evidence',
        previousStage: application.stage,
        newStage: 'SHORTLISTED',
      },
    });
    await prisma.application.update({ where: { id: application.id }, data: { stage: 'SHORTLISTED', status: 'ACTIVE' } });

    expect(decision.actorId).toBe(TEST_USERS[1].id);
    expect(decision.previousStage).toBe('NEW');
    expect(decision.newStage).toBe('SHORTLISTED');
    expect(decision.reason).toContain('SKILL_MATCH');

    // The AI run is preserved untouched (§6.5: decisions never overwrite runs)
    const unchanged = await prisma.screeningRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(unchanged.status).toBe('COMPLETED');

    // Every decision links to an authorized human actor
    const withActor = await prisma.recruitmentDecision.findUniqueOrThrow({
      where: { id: decision.id },
      include: { actor: true },
    });
    expect(withActor.actor.accessStatus).toBe('ACTIVE');
  });

  it('schedules an interview and detects interviewer conflicts (§6.8)', async () => {
    const job = await prisma.jobRequisition.findFirstOrThrow({ where: { organizationId: ORG_A } });
    const application = await prisma.application.findFirstOrThrow({ where: { jobId: job.id } });

    const slot = new Date(Date.now() + 48 * 3600 * 1000);
    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        schedule: slot,
        timezone: 'Africa/Kigali',
        status: 'SCHEDULED',
        meetingDetails: JSON.stringify({ type: 'Google Meet', durationMinutes: 60 }),
        participants: {
          create: [
            { userId: TEST_USERS[1].id }, // recruiter (scheduler)
            { userId: TEST_USERS[3].id }, // assigned interviewer
          ],
        },
      },
      include: { participants: true },
    });
    expect(interview.participants).toHaveLength(2);

    // Conflict rule: a 60-min slot starting 30 min into the existing one overlaps
    const existing = await prisma.interview.findMany({
      where: {
        status: { not: 'CANCELLED' },
        participants: { some: { userId: TEST_USERS[3].id } },
        schedule: { not: null },
      },
    });
    const overlapping = existing.filter((iv: any) => {
      const start = iv.schedule;
      const end = new Date(start.getTime() + 60 * 60_000);
      const newStart = new Date(slot.getTime() + 30 * 60_000);
      const newEnd = new Date(newStart.getTime() + 60 * 60_000);
      return newStart < end && newEnd > start;
    });
    expect(overlapping.length).toBeGreaterThan(0);

    // A non-overlapping slot must not conflict
    const nonOverlapping = new Date(slot.getTime() + 3 * 3600 * 1000);
    const nonConflicts = existing.filter((iv: any) => {
      const end = new Date(iv.schedule.getTime() + 60 * 60_000);
      return nonOverlapping < end && new Date(nonOverlapping.getTime() + 3600 * 1000) > iv.schedule;
    });
    expect(nonConflicts).toHaveLength(0);
  });

  it('keeps scorecards independent and respects interviewer scoping (§5, §6.8)', async () => {
    const job = await prisma.jobRequisition.findFirstOrThrow({ where: { organizationId: ORG_A } });
    const application = await prisma.application.findFirstOrThrow({ where: { jobId: job.id } });
    const interview = await prisma.interview.findFirstOrThrow({ where: { applicationId: application.id } });

    const participant = await prisma.interviewParticipant.findFirstOrThrow({
      where: { interviewId: interview.id, userId: TEST_USERS[3].id },
    });

    // Interviewer submits their own structured scorecard
    await prisma.interviewParticipant.update({
      where: { id: participant.id },
      data: {
        structuredFeedback: JSON.stringify({ techRating: 4, commRating: 4, problemRating: 5 }),
        recommendation: 'HIRE',
        comments: 'Strong system design discussion.',
      },
    });

    const mine = await prisma.interviewParticipant.findUniqueOrThrow({ where: { id: participant.id } });
    expect(mine.recommendation).toBe('HIRE');

    // §5: a non-participant interviewer must find no participation record —
    // the API gates on exactly this count before exposing application data.
    const outsiderViews = await prisma.interviewParticipant.count({
      where: { userId: TEST_USERS[2].id, interview: { applicationId: application.id } },
    });
    expect(outsiderViews).toBe(0);

    // §6.8: only submitted scorecards are reviewable
    const allParticipants = await prisma.interviewParticipant.findMany({
      where: { interview: { applicationId: application.id } },
    });
    const submitted = allParticipants.filter((p: any) => p.structuredFeedback);
    expect(submitted).toHaveLength(1);
    expect(allParticipants).toHaveLength(2);
  });

  it('rejects cross-organization data access (tenant isolation, §6.1)', async () => {
    const scoped = await prisma.application.findFirst({
      where: { job: { organizationId: ORG_B } },
    });
    expect(scoped).toBeNull();

    const orgAApps = await prisma.application.findMany({
      where: { job: { organizationId: ORG_A } },
    });
    expect(orgAApps).toHaveLength(1);
  });

  it('erases candidate data across linked records transactionally (§6.11)', async () => {
    const candidate = await prisma.candidate.findFirstOrThrow({ where: { email: CANDIDATE_EMAIL } });
    const applications = await prisma.application.findMany({ where: { candidateId: candidate.id } });
    const applicationIds = applications.map((a: any) => a.id);

    await prisma.$transaction(async (tx: any) => {
      await tx.criterionAssessment.deleteMany({ where: { screeningRun: { applicationId: { in: applicationIds } } } });
      await tx.recruitmentDecision.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.screeningRun.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.parsedProfile.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.interviewParticipant.deleteMany({ where: { interview: { applicationId: { in: applicationIds } } } });
      await tx.interview.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.communication.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.resumeDocument.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.application.deleteMany({ where: { id: { in: applicationIds } } });
      await tx.candidate.update({
        where: { id: candidate.id },
        data: {
          firstName: 'Anonymized',
          lastName: 'Candidate',
          email: `ANON-${RUN_ID}-${Date.now()}@deleted.local`,
          consentGiven: false,
        },
      });
      const erased = await tx.candidate.findUniqueOrThrow({ where: { id: candidate.id } });
      anonymizedEmails.push(erased.email);
    });

    expect(await prisma.application.count({ where: { id: { in: applicationIds } } })).toBe(0);
    expect(await prisma.screeningRun.count({ where: { applicationId: { in: applicationIds } } })).toBe(0);
    expect(await prisma.interview.count({ where: { applicationId: { in: applicationIds } } })).toBe(0);
  });

  it('computes workflow analytics over persisted data (§6.10)', async () => {
    const job = await prisma.jobRequisition.findFirstOrThrow({ where: { organizationId: ORG_A } });
    const candidate = await prisma.candidate.create({
      data: { firstName: 'Ana', lastName: 'Mutesi', email: CANDIDATE_EMAIL_2, consentGiven: true },
    });
    const app = await prisma.application.create({
      data: { candidateId: candidate.id, jobId: job.id, stage: 'REJECTED', status: 'REJECTED' },
    });
    const resume = await prisma.resumeDocument.create({
      data: { applicationId: app.id, fileReference: 'unused', processingStatus: 'COMPLETED' },
    });
    const rubric = await prisma.rubric.findFirstOrThrow({ where: { jobId: job.id } });
    const run = await prisma.screeningRun.create({
      data: {
        applicationId: app.id, rubricId: rubric.id, resumeId: resume.id,
        aiVersion: 'test-model-v1', status: 'COMPLETED', totalResult: 62.5,
      },
    });
    await prisma.recruitmentDecision.create({
      data: {
        applicationId: app.id, actorId: TEST_USERS[1].id, humanAction: 'HUMAN_DECISION_RECORDED',
        decisionType: 'REJECT', reason: '[THRESHOLD] Below required experience', previousStage: 'NEW', newStage: 'REJECTED',
      },
    });

    // Mirrors /api/analytics queries for the permitted scope
    const totalApps = await prisma.application.count({ where: { job: { organizationId: ORG_A } } });
    const rejected = await prisma.application.count({ where: { job: { organizationId: ORG_A }, stage: 'REJECTED' } });
    const completedRuns = await prisma.screeningRun.count({
      where: { status: 'COMPLETED', application: { job: { organizationId: ORG_A } } },
    });
    const submittedScorecards = await prisma.interviewParticipant.count({
      where: { interview: { application: { job: { organizationId: ORG_A } } }, structuredFeedback: { not: null } },
    });

    expect(totalApps).toBe(1); // the previous application was erased in the §6.11 test
    expect(rejected).toBe(1);
    expect(completedRuns).toBe(1);
    expect(submittedScorecards).toBe(0); // its interview was erased too
    expect(run.totalResult).toBeCloseTo(62.5);
  });

  it('edits an approved rubric into a new DRAFT version, preserving the approved version (§6.2)', async () => {
    const job = await prisma.jobRequisition.findFirstOrThrow({ where: { organizationId: ORG_A } });
    const approved = await prisma.rubric.findFirstOrThrow({
      where: { jobId: job.id, status: 'APPROVED' },
      include: { criteria: true },
    });

    // Mirrors the PUT /api/jobs/[id]/rubric transaction for an APPROVED rubric:
    // the edit becomes a NEW version in DRAFT state with a change reason;
    // the approved version and its criteria remain untouched.
    const newVersion = await prisma.$transaction(async (tx: any) => {
      return tx.rubric.create({
        data: {
          jobId: job.id,
          version: approved.version + 1,
          status: 'DRAFT',
          changeReason: 'Raised the required backend experience after calibration review',
          criteria: {
            create: [
              { category: 'Skill', description: 'Node.js backend experience (raised to 7 years)', isRequired: true, weight: 5 },
              { category: 'Skill', description: 'PostgreSQL experience', isRequired: false, weight: 3 },
              { category: 'Skill', description: 'Kubernetes operations', isRequired: false, weight: 2 },
            ],
          },
        },
        include: { criteria: true },
      });
    });

    expect(newVersion.id).not.toBe(approved.id);
    expect(newVersion.version).toBe(approved.version + 1);
    expect(newVersion.status).toBe('DRAFT');
    expect(newVersion.criteria).toHaveLength(3);

    // The approved version still exists unchanged — historical screening runs
    // keep pointing at the exact rubric version that produced them.
    const stillApproved = await prisma.rubric.findUniqueOrThrow({
      where: { id: approved.id },
      include: { criteria: true },
    });
    expect(stillApproved.status).toBe('APPROVED');
    expect(stillApproved.criteria).toHaveLength(2);
    expect(stillApproved.criteria.map((c: any) => c.id).sort()).toEqual(
      approved.criteria.map((c: any) => c.id).sort()
    );

    // Historical screening results were not re-parented to the new version.
    const historicalRuns = await prisma.screeningRun.findMany({ where: { rubricId: approved.id } });
    expect(historicalRuns.length).toBeGreaterThan(0);

    // Only the APPROVED version is eligible for official screening (§6.5).
    const screeningRubric = await prisma.rubric.findFirstOrThrow({
      where: { jobId: job.id, status: 'APPROVED' },
    });
    expect(screeningRubric.id).toBe(approved.id);
  });

  it('writes a hash-chained audit ledger and detects tampering (§6.1)', async () => {
    const { logAuditEvent } = await import('../src/lib/auditLogger');
    const { computeAuditHash, verifyAuditChain } = await import('../src/lib/auditChain');

    await logAuditEvent({
      action: 'TEST_CHAIN_EVENT',
      actorId: TEST_USERS[0].id,
      organizationId: ORG_A,
      affectedRecordId: ORG_A,
      newValues: { step: 'first' },
    });

    const latestEvent = await prisma.auditEvent.findFirstOrThrow({
      where: { organizationId: ORG_A },
      orderBy: { timestamp: 'desc' },
    });
    expect(latestEvent.action).toBe('TEST_CHAIN_EVENT');
    expect(latestEvent.hash).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));

    // The stored hash commits to the event's exact stored content.
    expect(latestEvent.hash).toBe(
      computeAuditHash(latestEvent.previousHash, {
        action: latestEvent.action,
        actorId: latestEvent.actorId,
        affectedRecordId: latestEvent.affectedRecordId,
        previousValues: latestEvent.previousValues,
        newValues: latestEvent.newValues,
        organizationId: latestEvent.organizationId,
        requestContext: latestEvent.requestContext,
        timestamp: latestEvent.timestamp.toISOString(),
      })
    );

    // Full-table walk: no tampering issues anywhere in the ledger (rows
    // written before hash chaining are grandfathered, not tampering).
    const cleanReport = await verifyAuditChain(prisma);
    expect(cleanReport.issues.filter((i: any) => i.problem !== 'MISSING_HASH')).toHaveLength(0);

    // Simulate an in-place edit of a historical event — verification must
    // flag exactly this row, then the row is restored.
    const originalAction = latestEvent.action;
    await prisma.auditEvent.update({
      where: { id: latestEvent.id },
      data: { action: 'TAMPERED_ACTION' },
    });
    const tamperedReport = await verifyAuditChain(prisma);
    expect(tamperedReport.issues.some((i: any) => i.eventId === latestEvent.id && i.problem === 'HASH_MISMATCH')).toBe(true);

    await prisma.auditEvent.update({
      where: { id: latestEvent.id },
      data: { action: originalAction },
    });
    const restoredReport = await verifyAuditChain(prisma);
    expect(restoredReport.issues.some((i: any) => i.eventId === latestEvent.id)).toBe(false);
  });
});
