import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('--- Cleaning Existing Database Records ---');
  await prisma.auditEvent.deleteMany();
  await prisma.criterionAssessment.deleteMany();
  await prisma.screeningRun.deleteMany();
  await prisma.parsedProfile.deleteMany();
  await prisma.resumeDocument.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.criterion.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.jobRequisition.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();

  console.log('--- Starting Database Seeding ---');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Codafriqa Tech Corp',
    }
  });

  // 2. Create Roles with appropriate permissions
  const adminRole = await prisma.role.create({
    data: { name: 'Admin', permissions: ['ALL', 'VIEW_AUDIT', 'MANAGE_TEAM'] }
  });
  
  const recruiterRole = await prisma.role.create({
    data: { name: 'Recruiter', permissions: ['SCREENING', 'INTERVIEWING', 'VIEW_JOBS'] }
  });
  
  const hmRole = await prisma.role.create({
    data: { name: 'Hiring Manager', permissions: ['VIEW_ASSIGNED', 'DECISION', 'VIEW_JOBS'] }
  });

  const interviewerRole = await prisma.role.create({
    data: { name: 'Interviewer', permissions: ['INTERVIEWING', 'VIEW_JOBS'] }
  });

  const auditorRole = await prisma.role.create({
    data: { name: 'Auditor', permissions: ['VIEW_AUDIT', 'EXPORT_DATA'] }
  });

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@codafriqa.rw',
      name: 'Alexandre Ndungutse (Primary Owner)',
      passwordHash: 'password123',
      organizationId: org.id,
      roles: { connect: { id: adminRole.id } }
    }
  });

  // Set Primary Owner on Organization
  await prisma.organization.update({
    where: { id: org.id },
    data: { primaryOwnerId: admin.id }
  });

  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@codafriqa.rw',
      name: 'Sarah Keza (Lead Recruiter)',
      passwordHash: 'password123',
      organizationId: org.id,
      roles: { connect: { id: recruiterRole.id } }
    }
  });

  const hiringManager = await prisma.user.create({
    data: {
      email: 'manager@codafriqa.rw',
      name: 'David Mugabe (Engineering Director)',
      passwordHash: 'password123',
      organizationId: org.id,
      roles: { connect: { id: hmRole.id } }
    }
  });

  await prisma.user.create({
    data: {
      email: 'interviewer@codafriqa.rw',
      name: 'Elena Uwase (Staff Engineer)',
      passwordHash: 'password123',
      organizationId: org.id,
      roles: { connect: { id: interviewerRole.id } }
    }
  });

  await prisma.user.create({
    data: {
      email: 'auditor@codafriqa.rw',
      name: 'Marcus Gakwaya (Compliance Auditor)',
      passwordHash: 'password123',
      organizationId: org.id,
      roles: { connect: { id: auditorRole.id } }
    }
  });

  // 4. Create Job Requisitions & Rubrics
  const job1 = await prisma.jobRequisition.create({
    data: {
      title: 'Senior Full-Stack Engineer',
      department: 'Engineering',
      description: 'Looking for a Senior Full-Stack Engineer to architect distributed cloud services and build React/Next.js interfaces.',
      status: 'OPEN',
      ownerId: hiringManager.id,
      organizationId: org.id,
      rubrics: {
        create: {
          status: 'APPROVED',
          criteria: {
            create: [
              { category: 'Technical Skills', description: '5+ years experience with TypeScript, React, and Node.js', isRequired: true, weight: 5 },
              { category: 'Database', description: 'Strong knowledge of PostgreSQL, relational schema design, and query optimization', isRequired: true, weight: 4 },
              { category: 'Cloud & DevOps', description: 'Hands-on experience with Docker, CI/CD pipelines, and Redis caching', isRequired: false, weight: 3 },
              { category: 'Communication', description: 'Demonstrated experience mentoring engineers and technical writing', isRequired: false, weight: 2 }
            ]
          }
        }
      }
    },
    include: { rubrics: { include: { criteria: true } } }
  });

  const job2 = await prisma.jobRequisition.create({
    data: {
      title: 'AI / Machine Learning Engineer',
      department: 'Data & AI',
      description: 'Join our AI platform team building LLM evaluation pipelines, structured output parsers, and retrieval systems.',
      status: 'OPEN',
      ownerId: hiringManager.id,
      organizationId: org.id,
      rubrics: {
        create: {
          status: 'APPROVED',
          criteria: {
            create: [
              { category: 'AI/ML Core', description: 'Proven experience with OpenAI APIs, Prompt Engineering, and RAG architectures', isRequired: true, weight: 5 },
              { category: 'Python', description: 'Proficiency in Python (FastAPI, PyTorch, LangChain/LlamaIndex)', isRequired: true, weight: 4 },
              { category: 'Evaluation', description: 'Understanding of AI bias mitigation, precision/recall metrics, and LLM guardrails', isRequired: false, weight: 3 }
            ]
          }
        }
      }
    },
    include: { rubrics: { include: { criteria: true } } }
  });

  // 5. Create Candidates & Applications
  const candidate1 = await prisma.candidate.create({
    data: {
      firstName: 'Jean-Luc',
      lastName: 'Habimana',
      email: 'jeanluc.habimana@example.rw',
      consentGiven: true
    }
  });

  const app1 = await prisma.application.create({
    data: {
      jobId: job1.id,
      candidateId: candidate1.id,
      status: 'SCREENING',
      stage: 'RESUME_SCREENED'
    }
  });

  const resume1 = await prisma.resumeDocument.create({
    data: {
      applicationId: app1.id,
            fileReference: 'uploads/jeanluc_habimana_resume.pdf',
      extractedText: 'Jean-Luc Habimana. 6+ years Senior Full-Stack Engineer with deep experience in TypeScript, React, Node.js, and PostgreSQL.',
      processingStatus: 'COMPLETED'
    }
  });

  await prisma.parsedProfile.create({
    data: {
      applicationId: app1.id,
      skills: JSON.stringify(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Next.js', 'Redis']),
      employment: JSON.stringify([
        { company: 'Kigali FinTech Hub', title: 'Senior Backend Engineer', startDate: '2021-01', endDate: 'Present', description: 'Scaled core banking APIs to 2M transactions/day.' },
        { company: 'Innovate Labs', title: 'Full-Stack Developer', startDate: '2018-06', endDate: '2020-12', description: 'Built React customer portals and GraphQL services.' }
      ]),
      education: JSON.stringify([
        { institution: 'University of Rwanda', degree: 'Bachelor of Science', fieldOfStudy: 'Computer Science', graduationDate: '2018' }
      ])
    }
  });

  const rubric1Criteria = job1.rubrics[0].criteria;
  await prisma.screeningRun.create({
    data: {
      application: { connect: { id: app1.id } },
      rubric: { connect: { id: job1.rubrics[0].id } },
      resume: { connect: { id: resume1.id } },
      totalResult: 94.5,
      aiVersion: 'gpt-4o-2024-08-06',
      assessments: {
        create: [
          { criterionId: rubric1Criteria[0].id, result: 'MATCH', supportingEvidence: 'Has 6+ years building scalable TypeScript & React applications at FinTech Hub.', scoreContribution: 95 },
          { criterionId: rubric1Criteria[1].id, result: 'MATCH', supportingEvidence: 'Deep experience designing PostgreSQL transactional schemas and indexing.', scoreContribution: 95 },
          { criterionId: rubric1Criteria[2].id, result: 'MATCH', supportingEvidence: 'Manages Dockerized microservices and Redis clusters.', scoreContribution: 90 }
        ]
      }
    }
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      firstName: 'Claire',
      lastName: 'Mukamana',
      email: 'claire.m@example.rw',
      consentGiven: true
    }
  });

  const app2 = await prisma.application.create({
    data: {
      jobId: job1.id,
      candidateId: candidate2.id,
      status: 'INTERVIEW',
      stage: 'TECHNICAL_INTERVIEW'
    }
  });

  const resume2 = await prisma.resumeDocument.create({
    data: {
      applicationId: app2.id,
            fileReference: 'uploads/claire_mukamana_cv.pdf',
      extractedText: 'Claire Mukamana. Frontend Developer with 3+ years experience in React, JavaScript, and CSS design systems.',
      processingStatus: 'COMPLETED'
    }
  });

  await prisma.parsedProfile.create({
    data: {
      applicationId: app2.id,
      skills: JSON.stringify(['React', 'JavaScript', 'CSS', 'Node.js', 'MySQL']),
      employment: JSON.stringify([
        { company: 'Creative Solutions', title: 'Frontend Developer', startDate: '2022-03', endDate: 'Present', description: 'Developed React design systems and interactive UI dashboards.' }
      ]),
      education: JSON.stringify([
        { institution: 'Carnegie Mellon University Africa', degree: 'M.S. Information Technology', fieldOfStudy: 'Software Engineering', graduationDate: '2022' }
      ])
    }
  });

  await prisma.screeningRun.create({
    data: {
      application: { connect: { id: app2.id } },
      rubric: { connect: { id: job1.rubrics[0].id } },
      resume: { connect: { id: resume2.id } },
      totalResult: 82.0,
      aiVersion: 'gpt-4o-2024-08-06',
      assessments: {
        create: [
          { criterionId: rubric1Criteria[0].id, result: 'MATCH', supportingEvidence: 'Strong front-end React portfolio and responsive UI implementation.', scoreContribution: 88 },
          { criterionId: rubric1Criteria[1].id, result: 'PARTIAL', supportingEvidence: 'Experience with MySQL, but limited deep PostgreSQL tuning evidence.', scoreContribution: 70 },
          { criterionId: rubric1Criteria[2].id, result: 'MATCH', supportingEvidence: 'Uses Docker in CI/CD pipeline regularly.', scoreContribution: 85 }
        ]
      }
    }
  });

  // 6. Create Realistic Audit Events
  const auditLogs = [
    { action: 'ORGANIZATION_INITIALIZED', actorId: admin.id, recordId: org.id, details: { name: org.name, primaryOwner: admin.name } },
    { action: 'JOB_REQUISITION_CREATED', actorId: hiringManager.id, recordId: job1.id, details: { title: job1.title, department: job1.department } },
    { action: 'JOB_REQUISITION_CREATED', actorId: hiringManager.id, recordId: job2.id, details: { title: job2.title, department: job2.department } },
    { action: 'RUBRIC_APPROVED', actorId: hiringManager.id, recordId: job1.rubrics[0].id, details: { criteriaCount: 4 } },
    { action: 'CANDIDATE_RESUME_PARSED', actorId: admin.id, recordId: app1.id, details: { candidate: 'Jean-Luc Habimana', status: 'SUCCESS' } },
    { action: 'AI_SCREENING_COMPLETED', actorId: admin.id, recordId: app1.id, details: { matchScore: '94.5%', confidence: 'High' } },
    { action: 'CANDIDATE_RESUME_PARSED', actorId: admin.id, recordId: app2.id, details: { candidate: 'Claire Mukamana', status: 'SUCCESS' } },
    { action: 'AI_SCREENING_COMPLETED', actorId: admin.id, recordId: app2.id, details: { matchScore: '82.0%', confidence: 'High' } },
    { action: 'STAGE_ADVANCED', actorId: recruiter.id, recordId: app2.id, details: { from: 'SCREENING', to: 'TECHNICAL_INTERVIEW' } },
    { action: 'USER_ROLE_ASSIGNED', actorId: admin.id, recordId: recruiter.id, details: { assignedRole: 'Recruiter' } },
    { action: 'SECURITY_AUDIT_VERIFIED', actorId: admin.id, recordId: org.id, details: { sslMode: 'verify-full', encryption: 'AES-256' } }
  ];

  for (const log of auditLogs) {
    await prisma.auditEvent.create({
      data: {
        organizationId: org.id,
        action: log.action,
        actorId: log.actorId,
        affectedRecordId: log.recordId,
        newValues: JSON.stringify(log.details)
      }
    });
  }

  console.log('--- Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });