/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from 'openai';

import prisma from '@/lib/prisma';
const openai = new OpenAI();

export async function scoreCandidateProfile(applicationId: string, rubricId: string) {
  try {
    // 1. Fetch Profile and Rubric
    const profile = await prisma.parsedProfile.findUnique({
      where: { applicationId },
      include: { application: { include: { resumeDocument: true } } }
    });
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: { criteria: true }
    });

    if (!profile || !rubric) throw new Error("Missing profile or rubric");

    // 2. Initialize Screening Run
    const screeningRun = await prisma.screeningRun.create({
      data: {
        applicationId,
        rubricId,
        resumeId: profile.application.resumeDocument!.id,
        aiVersion: "gpt-4o-2024-08-06",
        status: "PROCESSING"
      }
    });

    // 3. AI Evaluation via Structured Outputs
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        { 
          role: "system", 
          content: "You are a strict, unbiased AI recruitment assessor. Evaluate the candidate's profile strictly against the provided rubric criteria. Do not infer or guess. If evidence is missing, mark it MISSING. Provide verbatim 'supportingEvidence' from the profile." 
        },
        { 
          role: "user", 
          content: `Candidate Profile:\n${JSON.stringify(profile)}\n\nRubric Criteria:\n${JSON.stringify(rubric.criteria.map((c: { id: string; description: string; weight: number }) => ({ id: c.id, description: c.description, weight: c.weight })))}` 
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "screening_assessment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              assessments: { 
                type: "array", 
                items: {
                  type: "object",
                  properties: {
                    criterionId: { type: "string" },
                    result: { type: "string", enum: ["MATCH", "PARTIAL", "MISSING"] },
                    supportingEvidence: { type: "string", description: "Direct quote from profile justifying the result." },
                    uncertainty: { type: "boolean" }
                  },
                  required: ["criterionId", "result", "supportingEvidence", "uncertainty"],
                  additionalProperties: false
                }
              }
            },
            required: ["assessments"],
            additionalProperties: false
          }
        }
      }
    });

    const assessmentContent = completion.choices[0]?.message?.content;
    if (!assessmentContent) throw new Error("AI returned empty assessment");
    
    const parsedAssessments = JSON.parse(assessmentContent);

    // 4. Calculate Scores and Save
    let totalScore = 0;
    let maxScore = 0;

    for (const assessment of parsedAssessments.assessments) {
      const criteria = rubric.criteria.find((c: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any) => c.id === assessment.criterionId);
      if (!criteria) continue;

      let scoreContribution = 0;
      if (assessment.result === 'MATCH') scoreContribution = criteria.weight;
      if (assessment.result === 'PARTIAL') scoreContribution = criteria.weight * 0.5;
      
      totalScore += scoreContribution;
      maxScore += criteria.weight;

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

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    await prisma.screeningRun.update({
      where: { id: screeningRun.id },
      data: { 
        status: "COMPLETED",
        totalResult: percentage 
      }
    });

  } catch (error) {
    console.error('Scoring error:', error);
    // Note: In production, find the active screening run and mark it FAILED.
  }
}
