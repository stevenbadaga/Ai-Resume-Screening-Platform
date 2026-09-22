import 'dotenv/config';
import prisma from '../src/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const counts = await prisma.$queryRaw<Array<{ table_name: string; row_count: bigint }>>`
    SELECT table_name, row_count::bigint
    FROM (
      SELECT 'User' AS table_name, COUNT(*) AS row_count FROM "User"
      UNION ALL SELECT 'Organization', COUNT(*) FROM "Organization"
      UNION ALL SELECT 'Role', COUNT(*) FROM "Role"
      UNION ALL SELECT 'Candidate', COUNT(*) FROM "Candidate"
      UNION ALL SELECT 'JobRequisition', COUNT(*) FROM "JobRequisition"
      UNION ALL SELECT 'Application', COUNT(*) FROM "Application"
      UNION ALL SELECT 'ResumeDocument', COUNT(*) FROM "ResumeDocument"
      UNION ALL SELECT 'ParsedProfile', COUNT(*) FROM "ParsedProfile"
      UNION ALL SELECT 'ScreeningRun', COUNT(*) FROM "ScreeningRun"
      UNION ALL SELECT 'CriterionAssessment', COUNT(*) FROM "CriterionAssessment"
      UNION ALL SELECT 'RecruitmentDecision', COUNT(*) FROM "RecruitmentDecision"
      UNION ALL SELECT 'Interview', COUNT(*) FROM "Interview"
      UNION ALL SELECT 'InterviewParticipant', COUNT(*) FROM "InterviewParticipant"
      UNION ALL SELECT 'Communication', COUNT(*) FROM "Communication"
      UNION ALL SELECT 'PrivacyRequest', COUNT(*) FROM "PrivacyRequest"
      UNION ALL SELECT 'AuditEvent', COUNT(*) FROM "AuditEvent"
      UNION ALL SELECT 'Notification', COUNT(*) FROM "Notification"
    ) AS counts
  `;

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany();
    await tx.interviewParticipant.deleteMany();
    await tx.recruitmentDecision.deleteMany();
    await tx.criterionAssessment.deleteMany();
    await tx.screeningRun.deleteMany();
    await tx.resumeDocument.deleteMany();
    await tx.parsedProfile.deleteMany();
    await tx.interview.deleteMany();
    await tx.communication.deleteMany();
    await tx.application.deleteMany();
    await tx.privacyRequest.deleteMany();
    await tx.candidate.deleteMany();
    await tx.criterion.deleteMany();
    await tx.rubric.deleteMany();
    await tx.jobRequisition.deleteMany();
    await tx.auditEvent.deleteMany();
    await tx.user.deleteMany();
    await tx.role.deleteMany();
    await tx.organization.deleteMany();
  }, { maxWait: 10_000, timeout: 60_000 });

  const uploadDir = path.resolve(process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'uploads'));
  await fs.mkdir(uploadDir, { recursive: true });
  const uploadEntries = await fs.readdir(uploadDir, { withFileTypes: true });
  await Promise.all(uploadEntries.map((entry) => fs.rm(path.join(uploadDir, entry.name), { recursive: true, force: true })));

  console.log('Full reset complete. Database records removed:');
  for (const count of counts) {
    console.log(`- ${count.table_name}: ${count.row_count.toString()}`);
  }
  console.log(`- Upload files removed: ${uploadEntries.length}`);
}

main()
  .catch((error) => {
    console.error('Could not remove accounts:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
