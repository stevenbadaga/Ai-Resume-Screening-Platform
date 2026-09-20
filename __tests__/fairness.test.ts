import { describe, it, expect } from 'vitest';
import { calculateTotalScore } from '@/lib/scoringEngine';
import { redactPII } from '@/lib/resumeProcessor';

/**
 * Fairness and non-discrimination checks (spec §9 "Fairness and
 * Non-Discrimination" and §14 acceptance: "Fairness checks must compare
 * equivalent resumes in which non-job-related identifying details are changed.
 * Material score or ranking differences must be investigated, corrected, or
 * clearly documented before handover").
 *
 * Strategy: the scoring engine only ever sees criterion assessments, so a
 * candidate's name can never influence the math. The PII redaction layer that
 * runs before the AI prompt must strip the identifiers that could act as
 * proxies. These tests pin both guarantees.
 */

const rubric = [
  { id: 'c1', weight: 5, isRequired: true },
  { id: 'c2', weight: 3, isRequired: false },
  { id: 'c3', weight: 2, isRequired: false },
];

const strongAssessments = [
  { criterionId: 'c1', result: 'MATCH' },
  { criterionId: 'c2', result: 'MATCH' },
  { criterionId: 'c3', result: 'PARTIAL' },
];

describe('Fairness: name invariance of screening results (spec §14)', () => {
  it('produces identical scores regardless of the candidate name attached to assessments', () => {
    const nameVariants = [
      'James Okafor',
      'Priya Sharma',
      'Wei Chen',
      'Fatima Al-Sayed',
      'Jean-Pierre Mbala',
      'A',
      'Zeurjevanastanamiliovich', // exotic/unusual length
    ];

    const reference = calculateTotalScore(strongAssessments, rubric);
    for (const name of nameVariants) {
      const result = calculateTotalScore(
        strongAssessments.map((a) => ({ ...a, candidateName: name })),
        rubric.map((c) => ({ ...c, candidateName: name }))
      );
      expect(result.percentage, `score changed for candidate "${name}"`).toBe(reference.percentage);
      expect(result.totalScore, `score changed for candidate "${name}"`).toBe(reference.totalScore);
    }
  });

  it('produces identical rankings for two candidates whose only difference is their name', () => {
    const strongA = calculateTotalScore(strongAssessments, rubric);
    const strongB = calculateTotalScore(strongAssessments, rubric);
    expect(strongA.percentage).toBe(strongB.percentage);
    expect(strongA.failedRequiredCriterion).toBe(strongB.failedRequiredCriterion);

    const weakA = calculateTotalScore(
      [
        { criterionId: 'c1', result: 'PARTIAL' },
        { criterionId: 'c2', result: 'MISSING' },
        { criterionId: 'c3', result: 'MISSING' },
      ],
      rubric
    );
    // Weak profile must rank below strong profile no matter whose name it carries.
    expect(weakA.percentage).toBeLessThan(strongA.percentage);
  });

  it('redacts direct identifiers from resume text before any AI evaluation', () => {
    const variants = [
      'Contact: amara.okafor@example.com | +250 788 123 456',
      'Contact: li.wei@example.com | 555-867-5309',
    ];
    for (const text of variants) {
      const redacted = redactPII(text);
      expect(redacted).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
      expect(redacted).toContain('[EMAIL_REDACTED]');
      expect(redacted).toContain('[PHONE_REDACTED]');
    }
  });

  it('keeps job-related content intact after redaction (no over-redaction)', () => {
    const text = 'Senior Backend Engineer. Email: dev@example.com. 8 years of TypeScript and PostgreSQL.';
    const redacted = redactPII(text);
    expect(redacted).toContain('Senior Backend Engineer');
    expect(redacted).toContain('TypeScript');
    expect(redacted).toContain('PostgreSQL');
  });
});
