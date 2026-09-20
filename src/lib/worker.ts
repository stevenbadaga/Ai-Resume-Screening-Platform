import 'dotenv/config';
import { Worker } from 'bullmq';
import { processResume } from './resumeProcessor'; // Assuming resumeProcessor is exported from lib
import prisma from './prisma';
import { scoreCandidateProfile } from './scoringEngine';
import { scanDocumentForMalware } from './malwareScan';
import { readForProcessing } from './storage';

let connection: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
};

if (process.env.REDIS_URL) {
  const url = new URL(process.env.REDIS_URL);
  connection = {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

const worker = new Worker('ResumeProcessingQueue', async job => {
  console.log(`Processing job ${job.id} for application ${job.data.applicationId}`);
  const resume = await prisma.resumeDocument.findUnique({
    where: { id: job.data.resumeDocumentId },
    include: { application: { include: { job: { include: { rubrics: true } } } } }
  });

  if (!resume) throw new Error('Resume document not found');

  // Read the document through the storage abstraction (cloud bucket, or a
  // legacy local row) — the host filesystem is never the source of truth.
  const fileBytes = await readForProcessing(resume.fileReference);

  // §6.4 defense in depth: re-scan the stored document before it reaches the
  // extraction/AI services (covers files queued by older code paths or retry).
  const scan = await scanDocumentForMalware(fileBytes);
  if (!scan.clean) {
    await prisma.resumeDocument.update({
      where: { id: resume.id },
      data: {
        processingStatus: 'FAILED',
        safeMetadata: JSON.stringify({ error: 'Malware scan failed', threats: scan.threats }),
      },
    });
    throw new Error(`Malware scan failed: ${scan.threats.join(', ')}`);
  }

  await processResume(job.data.applicationId, job.data.resumeDocumentId, fileBytes, resume.fileReference);

  const processedResume = await prisma.resumeDocument.findUnique({ where: { id: resume.id } });
  const rubricId = job.data.rubricId || resume.application.job.rubrics.find((rubric) => rubric.status === 'APPROVED')?.id;
  if (processedResume?.processingStatus === 'COMPLETED' && rubricId) {
    await scoreCandidateProfile(job.data.applicationId, rubricId);
  }
  console.log(`Job ${job.id} completed successfully`);
}, { connection });

worker.on('failed', (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error ${err.message}`);
  } else {
    console.error(`Job failed with error ${err.message}`);
  }
});

console.log('BullMQ Resume Processing Worker started...');
