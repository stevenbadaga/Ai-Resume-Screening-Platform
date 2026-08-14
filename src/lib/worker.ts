import 'dotenv/config';
import { Worker } from 'bullmq';
import { processResume } from './resumeProcessor'; // Assuming resumeProcessor is exported from lib

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
  await processResume(job.data.applicationId, job.data.resumeDocumentId, job.data.filePath);
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
