import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const userIds = users.map((user) => user.id);
  const ownedJobs = await prisma.jobRequisition.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const jobIds = ownedJobs.map((job) => job.id);
  const applications = await prisma.application.findMany({
    where: { jobId: { in: jobIds } },
    select: { id: true },
  });
  const applicationIds = applications.map((application) => application.id);

  await prisma.$transaction(async (tx) => {
    if (userIds.length > 0) {
      await tx.interviewParticipant.deleteMany({ where: { userId: { in: userIds } } });
      await tx.recruitmentDecision.deleteMany({ where: { actorId: { in: userIds } } });
      await tx.auditEvent.updateMany({ where: { actorId: { in: userIds } }, data: { actorId: null } });
      await tx.communication.updateMany({ where: { senderId: { in: userIds } }, data: { senderId: null } });
      await tx.application.updateMany({ where: { assignedRecruiterId: { in: userIds } }, data: { assignedRecruiterId: null } });
    }

    if (applicationIds.length > 0) {
      await tx.recruitmentDecision.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.interview.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.criterionAssessment.deleteMany({ where: { screeningRun: { applicationId: { in: applicationIds } } } });
      await tx.screeningRun.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.parsedProfile.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.resumeDocument.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.communication.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await tx.application.deleteMany({ where: { id: { in: applicationIds } } });
    }

    if (jobIds.length > 0) {
      await tx.communication.deleteMany({ where: { jobId: { in: jobIds } } });
      await tx.criterionAssessment.deleteMany({ where: { criterion: { rubric: { jobId: { in: jobIds } } } } });
      await tx.screeningRun.deleteMany({ where: { rubric: { jobId: { in: jobIds } } } });
      await tx.criterion.deleteMany({ where: { rubric: { jobId: { in: jobIds } } } });
      await tx.rubric.deleteMany({ where: { jobId: { in: jobIds } } });
      await tx.jobRequisition.deleteMany({ where: { id: { in: jobIds } } });
    }

    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });

  console.log(`Removed ${users.length} account(s): ${users.map((user) => user.email).join(', ') || 'none'}`);
}

main()
  .catch((error) => {
    console.error('Could not remove accounts:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
