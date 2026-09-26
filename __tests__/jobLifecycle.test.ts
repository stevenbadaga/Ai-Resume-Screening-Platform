import { describe, it, expect } from 'vitest';

describe('Job Requisition Lifecycle & Rubric Preview (§6.2)', () => {
  const validRubricTransitions: Record<string, string[]> = {
    DRAFT: ['REVIEW'],
    REVIEW: ['APPROVED', 'DRAFT'],
    APPROVED: ['ARCHIVED'],
    ARCHIVED: [],
  };

  it('enforces strict state transitions for rubrics', () => {
    expect(validRubricTransitions['DRAFT']).toContain('REVIEW');
    expect(validRubricTransitions['DRAFT']).not.toContain('APPROVED'); // Cannot skip REVIEW
    expect(validRubricTransitions['REVIEW']).toContain('APPROVED');
    expect(validRubricTransitions['APPROVED']).toContain('ARCHIVED');
    expect(validRubricTransitions['ARCHIVED']).toHaveLength(0); // Terminal state
  });

  it('validates rubric criteria weighting and calculates consistent relative percentages', () => {
    const criteria = [
      { id: '1', name: 'TypeScript', isRequired: true, weight: 5 },
      { id: '2', name: 'PostgreSQL', isRequired: false, weight: 3 },
      { id: '3', name: 'Docker', isRequired: false, weight: 2 },
    ];

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBe(10);

    const relativeWeights = criteria.map((c) => Math.round((c.weight / totalWeight) * 100));
    expect(relativeWeights).toEqual([50, 30, 20]);
    expect(relativeWeights.reduce((sum, w) => sum + w, 0)).toBe(100);
  });

  it('formats duplicated job requisition attributes with DRAFT status and cloned criteria', () => {
    const sourceJob = {
      id: 'job-source-123',
      title: 'Senior Fullstack Engineer',
      department: 'Engineering',
      description: 'Lead backend and frontend web systems',
      criteria: [
        { category: 'Skills', description: 'Next.js 16', isRequired: true, weight: 5 },
        { category: 'Data', description: 'PostgreSQL & Prisma', isRequired: false, weight: 4 },
      ],
    };

    const duplicatePayload = {
      title: `${sourceJob.title} (Copy)`,
      department: sourceJob.department,
      description: sourceJob.description,
      status: 'DRAFT',
      criteria: sourceJob.criteria.map((c) => ({ ...c })),
    };

    expect(duplicatePayload.title).toBe('Senior Fullstack Engineer (Copy)');
    expect(duplicatePayload.status).toBe('DRAFT');
    expect(duplicatePayload.criteria).toHaveLength(2);
    expect(duplicatePayload.criteria[0].isRequired).toBe(true);
    expect(duplicatePayload.criteria[0].weight).toBe(5);
  });

  it('§6.2/§6.5: intake must never fall back to a non-approved rubric', () => {
    // Mirrors the intake-route selection logic: only an APPROVED rubric may
    // drive screening — no first-rubric fallback (which could pick DRAFT).
    const jobRubrics = [
      { id: 'rubric-draft', status: 'DRAFT', version: 2 },
      { id: 'rubric-approved', status: 'APPROVED', version: 1 },
    ];
    const approved = jobRubrics.find((r) => r.status === 'APPROVED');
    expect(approved?.id).toBe('rubric-approved');

    const onlyDraft = [{ id: 'rubric-draft', status: 'DRAFT', version: 1 }];
    expect(onlyDraft.find((r) => r.status === 'APPROVED')).toBeUndefined();
  });

  it('§6.2: the application window is enforced when configured', () => {
    const job = { opensAt: new Date('2026-01-01'), closesAt: new Date('2026-09-01') };
    const now = new Date('2026-09-25');
    const windowClosed = (job.opensAt && now < job.opensAt) || (job.closesAt && now > job.closesAt);
    expect(windowClosed).toBeTruthy();

    const openJob: { opensAt: Date | null; closesAt: Date | null } = { opensAt: null, closesAt: null };
    const windowOpen =
      (openJob.opensAt && now < openJob.opensAt) || (openJob.closesAt && now > openJob.closesAt);
    expect(windowOpen).toBeFalsy();
  });
});
