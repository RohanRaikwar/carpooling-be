import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import logger from '../utils/logger.js';

const connection = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    };

export const notificationQueue = new Queue('notifications', { connection });

const worker = new Worker(
    'notifications',
    async (job) => {
        logger.info(`Processing job ${job.id}: ${job.name}`);
        // Simulate sending notification
        await new Promise((resolve) => setTimeout(resolve, 1000));
        logger.info(`Job ${job.id} completed`);
    },
    { connection }
);

worker.on('completed', (job) => {
    logger.info(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} has failed with ${err.message}`);
});
