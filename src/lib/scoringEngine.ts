/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { getOpenAI, isOpenAIConfigured } from '@/lib/aiConfig';
import { CANONICAL_SKILL_NAMES, normalizeSkillList } from '@/lib/skillNormalization';

/**
 * Deterministic rubric scoring.
 *
 * Iterates the RUBRIC CRITERIA (source of truth) — not the AI's assessment list —
 * so a criterion the AI failed to assess defaults to MISSING instead of silently
 * dropping out of maxScore and inflating the match percentage.
 *
 * Rules:
 *  - MATCH = full weight, PARTIAL = half weight, MISSING (or unassessed) = 0.
 *  - C4: a required criterion that is MISSING (or unassessed) fails the run at 0%.
 *  - Duplicate assessments for one criterion count once; assessments referencing
 *    criteria outside the rubric are ignored entirely.
 */
export function calculateTotalScore(assessments: any[], criteriaList: any[]) {
  let totalScore = 0;
  let maxScore = 0;

  // Index assessments by criterionId — first entry wins (duplicates cannot stack).
  const assessmentByCriterionId = new Map<string, any>();
  for (const assessment of assessments) {
    if (!assessmentByCriterionId.has(assessment.criterionId)) {
      assessmentByCriterionId.set(assessment.criterionId, assessment);
    }
  }

  for (const criteria of criteriaList) {
    const assessment = assessmentByCriterionId.get(criteria.id);
    const result = assessment ? assessment.result : 'MISSING';

    // C4 FIX: Required criteria that are MISSING (or never assessed) cause an immediate 0% score
    if (criteria.isRequired && result === 'MISSING') {
      return {
        totalScore: 0,
        maxScore: 0,
        percentage: 0,
        failedRequiredCriterion: criteria.description || criteria.id,
      };
    }

    let scoreContribution = 0;
    if (result === 'MATCH') scoreContribution = criteria.weight;
    if (result === 'PARTIAL') scoreContribution = criteria.weight * 0.5;

    totalScore += scoreContribution;
    maxScore += criteria.weight;
  }

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  return { totalScore, maxScore, percentage, failedRequiredCriterion: null };
}

export async function scoreCandidateProfile(applicationId: string, rubricId: string) {
  let screeningRunId: string | undefined;
  try {
    // 1. Fetch Profile and Rubric
    const profile = await prisma.parsedProfile.findUnique({
      where: { applicationId },
      include: { application: { include: { resumeDocument: true, job: true } } }
    });
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: { criteria: true }
    });

    if (!profile || !rubric) throw new Error('Missing profile or rubric');
    if (rubric.status !== 'APPROVED') throw new Error('Only approved rubrics may be used for screening');
    if (rubric.jobId !== profile.application.jobId) throw new Error('Rubric does not belong to the application job');
    if (!profile.application.resumeDocument) throw new Error('Application has no resume document');

    // 2. Initialize Screening Run
    // Spec §6.5/§7: record rubric version, resume version, and a full config
    // snapshot so the run is reproducible for the same inputs and comparable
    // across reruns. configuration includes the exact weights and required
    // flags used, since criteria may change between rubric versions.
    const screeningConfiguration = {
      model: 'gpt-4o-2024-08-06',
      scoringRules: { MATCH: 'full weight', PARTIAL: 'half weight', MISSING: 0 },
      requiredCriterionPolicy: 'MISSING required criterion fails the run at 0%',
      criteria: rubric.criteria.map((c: { id: string; weight: number; isRequired: boolean; threshold: string | null }) => ({
        id: c.id,
        weight: c.weight,
        isRequired: c.isRequired,
        threshold: c.threshold,
      })),
    };

    const screeningRun = await prisma.screeningRun.create({
      data: {
        applicationId,
        rubricId,
        resumeId: profile.application.resumeDocument.id,
        rubricVersion: rubric.version,
        resumeVersion: profile.application.resumeDocument.version,
        aiVersion: 'gpt-4o-2024-08-06',
        configuration: JSON.stringify(screeningConfiguration),
        status: 'PROCESSING'
      }
    });
    screeningRunId = screeningRun.id;

    // C11 FIX: Strip DB metadata — only send parsed content fields to OpenAI, never IDs or relations
    // Skills are normalized through the shared taxonomy (§6.6): the canonical
    // name goes to the assessor while each entry keeps the candidate's
    // original wording in `original` for evidence traceability.
    const rawSkills: string[] = profile.skills ? JSON.parse(profile.skills) : [];
    const safeProfile = {
      skills: normalizeSkillList(rawSkills),
      recognizedSkills: CANONICAL_SKILL_NAMES,
      employment: profile.employment ? JSON.parse(profile.employment) : [],
      education: profile.education ? JSON.parse(profile.education) : [],
      certifications: profile.certifications ? JSON.parse(profile.certifications) : [],
      languages: profile.languages ? JSON.parse(profile.languages) : [],
      projects: profile.projects ? JSON.parse(profile.projects) : [],
    };

    // 3. AI Evaluation via Structured Outputs
    // Explicit config failure instead of a junk-credential request (aiConfig gate).
    if (!isOpenAIConfigured()) {
      throw new Error('OPENAI_API_KEY is not configured — screening cannot run.');
    }
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: "You are a strict, unbiased AI recruitment assessor. Evaluate the candidate's profile strictly against the provided rubric criteria. Do not infer or guess. If evidence is missing, mark it MISSING. Provide verbatim 'supportingEvidence' from the profile."
        },
        {
          role: 'user',
          content: `Candidate Profile:\n${JSON.stringify(safeProfile)}\n\nRubric Criteria:\n${JSON.stringify(rubric.criteria.map((c: { id: string; description: string; weight: number }) => ({ id: c.id, description: c.description, weight: c.weight })))}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'screening_assessment',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              assessments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    criterionId: { type: 'string' },
                    result: { type: 'string', enum: ['MATCH', 'PARTIAL', 'MISSING'] },
                    supportingEvidence: { type: 'string', description: 'Direct quote from profile justifying the result.' },
                    uncertainty: { type: 'boolean' }
                  },
                  required: ['criterionId', 'result', 'supportingEvidence', 'uncertainty'],
                  additionalProperties: false
                }
              }
            },
            required: ['assessments'],
            additionalProperties: false
          }
        }
      }
    });

    const assessmentContent = completion.choices[0]?.message?.content;
    if (!assessmentContent) throw new Error('AI returned empty assessment');

    const parsedAssessments = JSON.parse(assessmentContent);

    const returnedCriterionIds = new Set(
      parsedAssessments.assessments.map((assessment: { criterionId: string }) => assessment.criterionId)
    );
    const missingCriterion = rubric.criteria.find((criterion) => !returnedCriterionIds.has(criterion.id));
    if (missingCriterion) {
      throw new Error(`AI response omitted rubric criterion: ${missingCriterion.id}`);
    }

    // 4. Calculate Scores and Save
    const calc = calculateTotalScore(parsedAssessments.assessments, rubric.criteria);

    for (const assessment of parsedAssessments.assessments) {
      const criteria = rubric.criteria.find((c: any) => c.id === assessment.criterionId);
      if (!criteria) continue;

      let scoreContribution = 0;
      if (assessment.result === 'MATCH') scoreContribution = criteria.weight;
      if (assessment.result === 'PARTIAL') scoreContribution = criteria.weight * 0.5;

      await prisma.criterionAssessment.create({
        data: {
          screeningRunId: screeningRun.id,
          criterionId: assessment.criterionId,
          result: assessment.result,
          supportingEvidence: assessment.supportingEvidence,
          uncertainty: assessment.uncertainty,
          scoreContribution
        }
      });
    }

    // C4 FIX: Store failedRequiredCriterion in errorInformation when a required criterion is missing
    await prisma.screeningRun.update({
      where: { id: screeningRun.id },
      data: {
        status: 'COMPLETED',
        totalResult: calc.percentage,
        effectiveResult: calc.percentage,
        errorInformation: calc.failedRequiredCriterion
          ? `Required criterion not met: ${calc.failedRequiredCriterion}`
          : null
      }
    });

  } catch (error) {
    console.error('Scoring error:', error);
    if (screeningRunId) {
      await prisma.screeningRun.update({
        where: { id: screeningRunId },
        data: { status: 'FAILED', errorInformation: String(error) }
      });
    }
    throw error;
  }
}
