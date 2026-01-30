import { Redis } from 'ioredis';

export const bullRedis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // ✅ Must be null for BullMQ
  enableReadyCheck: true,
  lazyConnect: false,
});
