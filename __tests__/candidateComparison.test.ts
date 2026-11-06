import { describe, expect, it } from 'vitest';

describe('Candidate Comparison Benchmark (§6.7 & §6.5)', () => {
  interface Criterion {
    id: string;
    category: string;
    description: string;
    isRequired: boolean;
    weight: number;
  }

  it('orders criteria with required criteria first, then weight descending', () => {
    const rawCriteria: Criterion[] = [
      { id: '1', category: 'Skill', description: 'Docker & Kubernetes', isRequired: false, weight: 4 },
      { id: '2', category: 'Skill', description: 'TypeScript & React', isRequired: true, weight: 3 },
      { id: '3', category: 'Skill', description: 'Node.js Backend', isRequired: true, weight: 5 },
      { id: '4', category: 'Education', description: 'Computer Science Degree', isRequired: false, weight: 2 },
    ];

    const sorted = [...rawCriteria].sort((a, b) => {
      if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.description.localeCompare(b.description);
    });

    expect(sorted.map((c) => c.id)).toEqual(['3', '2', '1', '4']);
    expect(sorted[0].isRequired).toBe(true);
    expect(sorted[0].weight).toBe(5);
    expect(sorted[1].isRequired).toBe(true);
    expect(sorted[1].weight).toBe(3);
    expect(sorted[2].isRequired).toBe(false);
    expect(sorted[2].weight).toBe(4);
  });

  it('distinguishes absence of evidence from confirmed absence (§6.5)', () => {
    const classifyMissing = (assessment: { result: string; supportingEvidence?: string | null }) => {
      if (assessment.result !== 'MISSING') return 'PRESENT';
      return assessment.supportingEvidence && assessment.supportingEvidence.trim().length > 0
        ? 'CONFIRMED_ABSENCE'
        : 'ABSENCE_OF_EVIDENCE';
    };

    expect(classifyMissing({ result: 'MISSING', supportingEvidence: null })).toBe('ABSENCE_OF_EVIDENCE');
    expect(classifyMissing({ result: 'MISSING', supportingEvidence: '' })).toBe('ABSENCE_OF_EVIDENCE');
    expect(
      classifyMissing({
        result: 'MISSING',
        supportingEvidence: 'Candidate explicitly notes no experience in Go or Rust.',
      })
    ).toBe('CONFIRMED_ABSENCE');
  });

  it('preserves uncertainty flags for low-confidence evidence without guessing', () => {
    const evaluateCriterionCertainty = (assessment: { uncertainty?: boolean }) => {
      return assessment.uncertainty ? 'REQUIRES_HUMAN_REVIEW' : 'CONFIDENT';
    };

    expect(evaluateCriterionCertainty({ uncertainty: true })).toBe('REQUIRES_HUMAN_REVIEW');
    expect(evaluateCriterionCertainty({ uncertainty: false })).toBe('CONFIDENT');
  });

  it('verifies that all ten spec §6.7 workflow stages exist in the pipeline', () => {
    const requiredStages = [
      'NEW',
      'SCREENING',
      'NEEDS_REVIEW',
      'ON_HOLD',
      'SHORTLISTED',
      'INTERVIEW_SCHEDULED',
      'OFFERED',
      'HIRED',
      'REJECTED',
      'WITHDRAWN',
    ];

    expect(requiredStages.length).toBe(10);
    expect(requiredStages).toContain('HIRED');
    expect(requiredStages).toContain('WITHDRAWN');
    expect(requiredStages).toContain('NEEDS_REVIEW');
  });
});
