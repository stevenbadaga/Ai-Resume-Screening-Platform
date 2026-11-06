import { describe, it, expect, vi } from 'vitest';
import { resolveAuditRecordScope, type AuditScopePrisma } from '@/lib/auditRecordScope';

/**
 * Spec §6.12: the audit log must support search by candidate, application,
 * and job. A record search expands one searched id into every related ledger
 * record id **within the viewing organization** — unknown and cross-org ids
 * must resolve to an empty scope so the search never widens silently.
 */

const ORG = 'org-1';

function stubPrisma(responses: {
  job?: any | null;
  candidate?: any | null;
  application?: any | null;
}): { prisma: AuditScopePrisma; calls: string[] } {
  const calls: string[] = [];
  /* type trick below keeps the stub honest while its responses stay fixtures */
  const prisma: AuditScopePrisma = {
    jobRequisition: {
      findFirst: vi.fn(async (args: any) => {
        calls.push('jobRequisition');
        expect(args.where.organizationId).toBe(ORG); // org-scoped always
        return responses.job ?? null;
      }),
    },
    candidate: {
      findUnique: vi.fn((args: any) => {
        calls.push('candidate');
        if (responses.candidate) {
          // Applications passed in already simulate the org-filtered include.
          return responses.candidate;
        }
        return null;
      }),
    },
    application: {
      findFirst: vi.fn((args: any) => {
        calls.push('application');
        expect(args.where.job.organizationId).toBe(ORG); // org-scoped always
        return responses.application ?? null;
      }),
    },
  };
  return { prisma: prisma as unknown as AuditScopePrisma, calls };
}

describe('resolveAuditRecordScope (§6.12 audit record search)', () => {
  it('expands a job search into the job, its applications, and their linked records', async () => {
    const { prisma } = stubPrisma({
      job: {
        id: 'job-1',
        applications: [
          {
            id: 'app-1',
            screeningRuns: [{ id: 'run-1' }],
            decisions: [{ id: 'dec-1' }],
            interviews: [{ id: 'int-1' }],
            resumeDocument: { id: 'res-1' },
            parsedProfile: { id: 'pp-1' },
          },
          {
            id: 'app-2',
            screeningRuns: [],
            decisions: [],
            interviews: [],
            resumeDocument: null,
            parsedProfile: null,
          },
        ],
      },
    });

    const scope = await resolveAuditRecordScope(prisma, ORG, 'job-1');
    expect(scope.type).toBe('job');
    expect(scope.affectedRecordIds.sort()).toEqual(
      ['job-1', 'app-1', 'run-1', 'dec-1', 'int-1', 'res-1', 'pp-1', 'app-2'].sort()
    );
  });

  it('expands a candidate search into the candidate, its org-visible applications, and their jobs', async () => {
    const { prisma } = stubPrisma({
      candidate: {
        id: 'cand-1',
        applications: [
          {
            id: 'app-9',
            job: { id: 'job-9' },
            screeningRuns: [{ id: 'run-9' }],
            decisions: [{ id: 'dec-9' }],
            interviews: [],
            resumeDocument: { id: 'res-9' },
            parsedProfile: null,
          },
        ],
      },
    });

    const scope = await resolveAuditRecordScope(prisma, ORG, 'cand-1');
    expect(scope.type).toBe('candidate');
    expect(scope.affectedRecordIds.sort()).toEqual(
      ['cand-1', 'app-9', 'job-9', 'run-9', 'dec-9', 'res-9'].sort()
    );
  });

  it('expands an application search into the application and its linked records', async () => {
    const { prisma, calls } = stubPrisma({
      application: {
        id: 'app-5',
        screeningRuns: [{ id: 'run-5' }],
        decisions: [{ id: 'dec-5' }],
        interviews: [{ id: 'int-5' }],
        resumeDocument: { id: 'res-5' },
        parsedProfile: { id: 'pp-5' },
      },
    });

    const scope = await resolveAuditRecordScope(prisma, ORG, 'app-5');
    expect(scope.type).toBe('application');
    expect(scope.affectedRecordIds.sort()).toEqual(
      ['app-5', 'run-5', 'dec-5', 'int-5', 'res-5', 'pp-5'].sort()
    );
    // Resolution order: job, then candidate, then application.
    expect(calls).toEqual(['jobRequisition', 'candidate', 'application']);
  });

  it('returns an empty scope for an unknown or cross-organization id', async () => {
    const { prisma } = stubPrisma({});
    const scope = await resolveAuditRecordScope(prisma, ORG, 'does-not-exist');
    expect(scope.type).toBe('unknown');
    expect(scope.affectedRecordIds).toEqual([]);
  });

  it('never queries without an organization scope', async () => {
    const { prisma } = stubPrisma({ job: { id: 'job-x', applications: [] } });
    const scope = await resolveAuditRecordScope(prisma, null, 'job-x');
    expect(scope.type).toBe('unknown');
    expect(scope.affectedRecordIds).toEqual([]);
  });

  it('handles blank search text defensively', async () => {
    const { prisma } = stubPrisma({});
    const scope = await resolveAuditRecordScope(prisma, ORG, '   ');
    expect(scope.type).toBe('unknown');
    expect(scope.affectedRecordIds).toEqual([]);
  });
});
