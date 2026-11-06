import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/validation';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id: jobId } = await params;

    const job = await prisma.jobRequisition.findFirst({
      where: {
        id: jobId,
        ...(auth.user.role === 'Candidate'
          ? { status: 'OPEN' }
          : { organizationId: auth.user.organizationId }),
      },
      include: {
        rubrics: {
          include: { criteria: true },
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const activeRubric = job.rubrics.find((r) => r.status === 'APPROVED') || job.rubrics[0];
    if (!activeRubric) {
      return NextResponse.json({ error: 'No rubric defined for this job' }, { status: 404 });
    }

    const criteria = activeRubric.criteria || [];
    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 1), 0);
    const requiredCriteria = criteria.filter((c) => c.isRequired);
    const preferredCriteria = criteria.filter((c) => !c.isRequired);

    const criteriaBreakdown = criteria.map((c) => {
      const weight = c.weight || 1;
      const relativeWeightPercent = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
      return {
        id: c.id,
        category: c.category,
        description: c.description,
        isRequired: c.isRequired,
        weight,
        relativeWeightPercent,
        threshold: c.threshold || 'None specified',
        evidenceRules: c.evidenceRules || 'Verbatim quote from candidate resume',
        scoringImpact: c.isRequired
          ? `Crucial: Missing this required qualification sets total match score to 0%. When present: up to ${relativeWeightPercent}% of total score.`
          : `Contributes up to ${relativeWeightPercent}% of candidate match score.`,
      };
    });

    const preview = {
      jobId: job.id,
      jobTitle: job.title,
      department: job.department,
      jobStatus: job.status,
      rubricId: activeRubric.id,
      rubricVersion: activeRubric.version,
      rubricStatus: activeRubric.status,
      summary: {
        totalCriteria: criteria.length,
        requiredCriteriaCount: requiredCriteria.length,
        preferredCriteriaCount: preferredCriteria.length,
        totalWeightPoints: totalWeight,
        isConsistent: totalWeight > 0 && criteria.length > 0,
      },
      scoringRules: {
        formula: 'MatchScore = (Sum of earned criterion points / Total weight points) * 100%',
        matchPoints: '100% of criterion weight',
        partialPoints: '50% of criterion weight',
        missingPoints: '0 points',
        requiredCriterionRule:
          'If ANY required criterion is missing or unverified, overall candidate match fails at 0%.',
        evidenceStandard: 'Every criterion result is backed by direct quotes from resume text.',
        uncertaintyHandling:
          'Ambiguous, incomplete, or low-confidence dates/skills are flagged for manual recruiter review.',
      },
      criteria: criteriaBreakdown,
    };

    return NextResponse.json({ success: true, preview });
  } catch (error) {
    console.error('Rubric preview error:', error);
    return safeErrorResponse('Failed to generate rubric preview');
  }
}
