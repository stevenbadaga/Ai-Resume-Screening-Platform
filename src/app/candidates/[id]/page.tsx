import { PrismaClient } from '@prisma/client';
import CandidateProfileClient from './CandidateProfileClient';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      candidate: true,
      job: true,
      resumeDocument: true,
      parsedProfile: true,
      screeningRuns: {
        include: { criterionAssessments: { include: { criterion: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!application) {
    return <div className="animate-in" style={{ padding: '2rem' }}>Candidate application not found.</div>;
  }

  const screeningRun = application.screeningRuns[0];

  const profileData = {
    id: application.id,
    name: `${application.candidate.firstName} ${application.candidate.lastName}`,
    job: application.job.title,
    skills: application.parsedProfile?.skills ? JSON.parse(application.parsedProfile.skills) : [],
    experience: application.parsedProfile?.employment ? JSON.stringify(JSON.parse(application.parsedProfile.employment), null, 2) : 'No experience parsed.',
    rawText: application.resumeDocument?.extractedText || 'No raw text available.',
  };

  const screeningResultsData = screeningRun ? {
    totalScore: screeningRun.totalResult || 0,
    assessments: screeningRun.criterionAssessments.map(ca => ({
      criterion: ca.criterion.description,
      result: ca.result,
      evidence: ca.supportingEvidence || 'No evidence provided.',
      score: ca.scoreContribution
    }))
  } : null;

  return (
    <CandidateProfileClient 
      profile={profileData} 
      screeningResults={screeningResultsData} 
    />
  );
}
