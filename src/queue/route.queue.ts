import { Queue, Worker } from 'bullmq';
import { googleService } from '../modules/maps/google.service.js';
import { bullRedis } from './redisConnection.js';

export const routeQueue = new Queue('route-optimization', { connection: bullRedis });

export const routeWorker = new Worker(
  'route-optimization',
  async (job) => {
    // job.data contains origin, destination, waypoints, travelMode
    const result = await googleService.computeRoute(job.data);
    return result;
  },
  { connection: bullRedis, concurrency: 5 }, // adjust concurrency
);

// Optional: Log errors
routeWorker.on('failed', (job: any, err) => {
  console.error('Job failed:', job.id, err);
});
