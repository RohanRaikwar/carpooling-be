import { Queue } from 'bullmq';
import { bullRedis } from '../../queue/redisConnection.js';

export const mailQueue = new Queue('mail-queue', {
  connection: bullRedis,
});
