import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import sendMail from '../config/sendmail.js';

const connection = process.env.REDIS_URL 
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null
    });

export const emailQueue = new Queue('email-queue', { connection });

const worker = new Worker('email-queue', async (job) => {
  const { email, subject, html } = job.data;
  try {
    await sendMail({ email, subject, html });
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    throw error;
  }
}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with ${err.message}`);
});

export { connection };
