import { Queue } from 'bullmq';
import { buildQueueConnection } from './queueConnection';

export const resumeQueue = new Queue('ResumeProcessingQueue', {
  connection: buildQueueConnection('server'),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});
