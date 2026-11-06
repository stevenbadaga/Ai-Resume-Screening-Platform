/**
 * Audit record search scope (spec §6.12).
 *
 * The audit ledger stores events with `affectedRecordId` — the id of the
 * concrete record each event touched (candidate, application, job requisition,
 * decision, interview, resume, parsed profile, screening run). Recruiters,
 * auditors, and administrators search that history "by candidate, application,
 * or job", so a record search expands one search id into the related record ids
 * before matching events.
 */

export type AuditRecordScopeType = 'candidate' | 'application' | 'job' | 'unknown';

export interface AuditRecordScope {
  /** How the searched id was interpreted within the organization. */
  type: AuditRecordScopeType;
  /** Every record id whose audit events belong to this search (self included). */
  affectedRecordIds: string[];
}

type ExpApplicationRow = {
  id: string;
  job?: { id: string };
  screeningRuns: Array<{ id: string }>;
  decisions: Array<{ id: string }>;
  interviews: Array<{ id: string }>;
  resumeDocument: { id: string } | null;
  parsedProfile: { id: string } | null;
};
type CandidateRow = { id: string; applications: ExpApplicationRow[] };
type JobRow = { id: string; applications: ExpApplicationRow[] };
type ApplicationRow = ExpApplicationRow;

/** Minimal Prisma-like surface this helper needs (keeps it unit-testable). */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AuditScopePrisma {
  jobRequisition: {
    findFirst(args: any): Promise<JobRow | null>;
  };
  candidate: {
    findUnique(args: any): Promise<CandidateRow | null>;
  };
  application: {
    findFirst(args: any): Promise<ApplicationRow | null>;
  };
}

/**
 * Resolves `recordId` (a candidate id, application id, or job-requisition id,
 * each organization-scoped) into every audit `affectedRecordId` that belongs to
 * it. Unknown or out-of-organization ids produce an empty scope — the search
 * matches nothing and never widens beyond the caller's organization.
 */
export async function resolveAuditRecordScope(
  prisma: AuditScopePrisma,
  organizationId: string | null,
  recordId: string
): Promise<AuditRecordScope> {
  const trimmed = recordId.trim();
  if (!trimmed || !organizationId) {
    return { type: 'unknown', affectedRecordIds: [] };
  }

  // 1) Job requisition — the job's own events plus those of its applications
  //    and each application's linked decision/interview/profile records.
  const job = await prisma.jobRequisition.findFirst({
    where: { id: trimmed, organizationId },
    select: {
      id: true,
      applications: {
        select: {
          id: true,
          screeningRuns: { select: { id: true } },
          decisions: { select: { id: true } },
          interviews: { select: { id: true } },
          resumeDocument: { select: { id: true } },
          parsedProfile: { select: { id: true } },
        },
      },
    },
  });
  if (job) {
    const ids: string[] = [job.id];
    for (const app of job.applications) {
      ids.push(app.id, ...app.screeningRuns.map((r) => r.id), ...app.decisions.map((d) => d.id), ...app.interviews.map((i) => i.id));
      if (app.resumeDocument) ids.push(app.resumeDocument.id);
      if (app.parsedProfile) ids.push(app.parsedProfile.id);
    }
    return { type: 'job', affectedRecordIds: [...new Set(ids)] };
  }

  // 2) Candidate — the candidate's own events plus those of every application
  //    the candidate holds in the viewing organization (cross-org applications
  //    stay invisible: the ledger filter itself is org-scoped).
  const candidate = await prisma.candidate.findUnique({
    where: { id: recordId },
    include: {
      applications: {
        where: { job: { organizationId } },
        select: {
          id: true,
          job: { select: { id: true } },
          screeningRuns: { select: { id: true } },
          decisions: { select: { id: true } },
          interviews: { select: { id: true } },
          resumeDocument: { select: { id: true } },
          parsedProfile: { select: { id: true } },
        },
      },
    },
  });
  if (candidate) {
    const ids: string[] = [candidate.id];
    const jobIds: string[] = [];
    for (const app of candidate.applications) {
      ids.push(app.id, ...app.screeningRuns.map((r) => r.id), ...app.decisions.map((d) => d.id), ...app.interviews.map((i) => i.id));
      if (app.resumeDocument) ids.push(app.resumeDocument.id);
      if (app.parsedProfile) ids.push(app.parsedProfile.id);
      if (app.job) jobIds.push(app.job.id);
    }
    return { type: 'candidate', affectedRecordIds: [...new Set([candidate.id, ...ids, ...jobIds])] };
  }

  // 3) Application — the application and its linked records.
  const application = await prisma.application.findFirst({
    where: { id: recordId, job: { organizationId } },
    include: {
      screeningRuns: { select: { id: true } },
      decisions: { select: { id: true } },
      interviews: { select: { id: true } },
      resumeDocument: { select: { id: true } },
      parsedProfile: { select: { id: true } },
    },
  });
  if (application) {
    const ids = [
      application.id,
      ...application.screeningRuns.map((r) => r.id),
      ...application.decisions.map((d) => d.id),
      ...application.interviews.map((i) => i.id),
      ...(application.resumeDocument ? [application.resumeDocument.id] : []),
      ...(application.parsedProfile ? [application.parsedProfile.id] : []),
    ];
    return { type: 'application', affectedRecordIds: [...new Set(ids)] };
  }

  return { type: 'unknown', affectedRecordIds: [] };
}
