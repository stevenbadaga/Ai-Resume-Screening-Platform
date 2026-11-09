import ApplyForm from './ApplyForm';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
export const dynamic = 'force-dynamic';

export default async function ApplyPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  // Fetch active jobs to populate the dropdown
  const jobs = await prisma.jobRequisition.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: 'desc' }
  });

  // Personalization: pre-fill form with saved candidate profile data
  let candidateProfile: any = null;
  let savedCv: any = null;
  let userPhone = '';
  if (userEmail) {
    const [cand, userRec] = await Promise.all([
      prisma.candidate.findFirst({
        where: { email: userEmail },
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          skills: true,
          experience: true,
          profileResumeName: true,
          profileResumeSize: true,
          profileResumeUploadedAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { email: userEmail },
        select: { phone: true },
      }),
    ]);
    candidateProfile = cand;
    userPhone = cand?.phone || userRec?.phone || '';
    savedCv = candidateProfile?.profileResumeName ? {
      name: candidateProfile.profileResumeName,
      size: candidateProfile.profileResumeSize,
      uploadedAt: candidateProfile.profileResumeUploadedAt,
    } : null;
  }

  return (
    <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%', padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '3rem' }}>
        <ApplyForm 
          jobs={jobs} 
          candidateProfile={candidateProfile ? {
            firstName: candidateProfile.firstName || '',
            lastName: candidateProfile.lastName || '',
            email: userEmail || '',
            phone: userPhone,
            savedCv: savedCv,
          } : null}
        />
      </div>
    </div>
  );
}
