import 'dotenv/config';
import { Worker } from 'bullmq';
import { processResume } from './resumeProcessor'; // Assuming resumeProcessor is exported from lib
import prisma from './prisma';
import { scoreCandidateProfile } from './scoringEngine';
import path from 'path';

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

  await processResume(
    job.data.applicationId,
    job.data.resumeDocumentId,
    job.data.filePath || path.join(process.cwd(), resume.fileReference)
  );

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
