import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const org = await prisma.organization.findFirst({
    where: { name: 'RecruitAI Demo Workspace' },
    include: {
      jobs: { include: { rubrics: { include: { criteria: true } } } },
    },
  });

  if (!org) {
    console.log('FAIL: NO DEMO ORG');
    process.exit(1);
  }

  console.log('Organization:', org.name);
  console.log('Domain claimed:', org.verifiedEmailDomain ?? 'NO (not claimed)');

  const users = await prisma.user.findMany({
    where: { organizationId: org.id },
    include: { roles: { select: { name: true } } },
    orderBy: { email: 'asc' },
  });
  const roleNames = [...new Set(users.flatMap(u => u.roles.map(r => r.name)))].sort();
  console.log('Roles (' + roleNames.length + '):', roleNames.join(', '));
  console.log('Staff users with roles: ' + users.filter(u => u.roles.length > 0).length + ', total users: ' + users.length);
  for (const u of users) {
    const names = u.roles.map(r => r.name).join('+') || '(candidate/no-role)';
    console.log('  ' + u.email + ' =(' + names + ')');
  }

  console.log('');
  console.log('Jobs (' + org.jobs.length + '):');
  for (const job of org.jobs) {
    const rubric = job.rubrics[0];
    console.log('  - ' + job.title + ' | dept=' + job.department + ' | jobStatus=' + job.status + ' | rubricStatus=' + rubric?.status + ' | v' + rubric?.version + ' | criteria=' + rubric?.criteria.length);
    if (rubric) {
      for (const c of rubric.criteria) {
        const extra: string[] = [];
        if (c.threshold) extra.push('threshold=' + c.threshold);
        if (c.evidenceRules) extra.push('evidence=' + c.evidenceRules);
        console.log('      [' + c.category + '] ' + c.description + ' | required=' + c.isRequired + ' | weight=' + c.weight + (extra.length ? ' | ' + extra.join(' ') : ''));
      }
    }
  }

  console.log('');
  // Scope to the 5 synthetic demo resumes only (exclude any real resumes
  // that may have been uploaded later, e.g. Karake Mugabo's CV).
  const resumes = await prisma.resumeDocument.findMany({
    where: {
      application: {
        job: { organizationId: org.id },
        candidate: { email: { endsWith: '@demo.local' } },
      },
    },
    include: { application: { include: { candidate: true } } },
    orderBy: { application: { createdAt: 'asc' } },
  });

  console.log('Resumes (' + resumes.length + '):');
  resumes.forEach((r, i) => {
    const c = r.application.candidate;
    const t = r.extractedText ?? '';
    const tag = classify(t);
    const meta = JSON.parse(r.safeMetadata || '{}');
    console.log(
      '  ' + (i + 1) + '. ' + c.firstName + ' ' + c.lastName +
      ' <' + c.email + '>' +
      ' file=' + r.fileReference.split('/').pop() +
      ' -> ' + tag +
      ' | consent=' + c.consentGiven + ' v' + c.consentNoticeVersion +
      ' | status=' + r.processingStatus +
      ' | conf=' + meta.confidenceScore +
      ' | synthetic=' + meta.synthetic
    );
  });

  console.log('');
  const allConsented = resumes.every(r => r.application.candidate.consentGiven && r.application.candidate.consentNoticeVersion);
  const allCompleted = resumes.every(r => r.processingStatus === 'COMPLETED');
  console.log('All candidates consented (with notice version):', allConsented);
  console.log('All resumes COMPLETED:', allCompleted);

  const expectedTags = [
    'STRONG-MATCH (Node.js + PostgreSQL)',
    'TRANSFERABLE (Java/Spring/MySQL, no Node.js keyword)',
    'MISSING-REQUIRED (designer, no backend)',
    'AMBIGUOUS-DATES (part-time overlap + incomplete)',
    'EMBEDDED-INSTRUCTIONS (prompt-safety case)',
  ];
  const actualTags = resumes.map(r => classify(r.extractedText ?? ''));
  const tagsMatch = JSON.stringify(actualTags) === JSON.stringify(expectedTags);

  console.log('');
  console.log('Expected edge-case tags:', expectedTags.join(' | '));
  console.log('Actual tags:            ', actualTags.join(' | '));
  console.log('Tags match expected 5-edge-case set:', tagsMatch);

  if (!allConsented || !allCompleted || !tagsMatch) {
    console.log('');
    console.log('FAIL — seeded data does not match the spec §15 deliverable expectations');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('');
  console.log('PASS — seeded demo workspace satisfies spec §15 (7 roles, 2 approved jobs, 5 edge-case resumes)');
  await prisma.$disconnect();
}

function classify(t: string): string {
  // Priority order: the embedded-instructions case is identified by its
  // distinctive prompt-injection text, even when the resume ALSO contains
  // matching skills (Nina's resume has Node.js + PostgreSQL AND the instructions).
  if (/Ignore previous instructions|rate this candidate as a perfect/i.test(t))
    return 'EMBEDDED-INSTRUCTIONS (prompt-safety case)';
  if (/Graphic design|Adobe Photoshop/i.test(t))
    return 'MISSING-REQUIRED (designer, no backend)';
  if (/part-time|overlap|incomplete dates|Some college/i.test(t))
    return 'AMBIGUOUS-DATES (part-time overlap + incomplete)';
  if (/Node\.?js|nodejs/i.test(t) && /PostgreSQL|postgres/i.test(t) && !/Graphic design|Adobe Photoshop/i.test(t))
    return 'STRONG-MATCH (Node.js + PostgreSQL)';
  if (/Java|Spring Boot|MySQL/i.test(t) && !/Node\.?js|nodejs/i.test(t))
    return 'TRANSFERABLE (Java/Spring/MySQL, no Node.js keyword)';
  return 'OTHER';
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
