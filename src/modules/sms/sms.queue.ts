import { Queue } from 'bullmq';
import { bullRedis } from '../../queue/redisConnection.js';

export const smsQueue = new Queue('sms-queue', {
    connection: bullRedis,
});
