import { Worker } from 'bullmq';
import { processResume } from './resumeProcessor'; // Assuming resumeProcessor is exported from lib

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

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
