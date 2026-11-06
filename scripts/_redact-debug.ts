import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { redactPII } from '../src/lib/resumeProcessor';

async function main() {
  const org = await prisma.organization.findFirst({
    where: { name: 'RecruitAI Demo Workspace' },
  });
  if (!org) { console.error('No demo org'); process.exit(1); }

  const ada = await prisma.resumeDocument.findFirst({
    where: {
      application: {
        job: { organizationId: org.id },
        candidate: { email: 'ada@demo.local' },
      },
    },
    include: { application: { include: { candidate: true } } },
  });

  if (!ada) { console.error('No Ada resume'); process.exit(1); }

  const text = ada.extractedText ?? '';
  console.log('=== Ada stored extractedText ===');
  console.log(JSON.stringify(text));
  console.log('');
  console.log('=== redactPII result ===');
  const redacted = redactPII(text);
  console.log(JSON.stringify(redacted));
  console.log('');
  console.log('Name pattern matches original?', /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text));
  console.log('Name pattern matches redacted?', /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(redacted));
  console.log('');
  console.log('=== Kwame stored extractedText ===');
  const kwame = await prisma.resumeDocument.findFirst({
    where: {
      application: {
        job: { organizationId: org.id },
        candidate: { email: 'kwame@demo.local' },
      },
    },
  });
  console.log(JSON.stringify(kwame?.extractedText));
  console.log('Kwame redacted:');
  console.log(JSON.stringify(redactPII(kwame?.extractedText ?? '')));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
