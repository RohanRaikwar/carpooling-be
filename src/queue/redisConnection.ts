import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

const bullRedisOptions = {
  maxRetriesPerRequest: null as null, // Must be null for BullMQ
  enableReadyCheck: true,
  lazyConnect: false,
};

export const bullRedis = REDIS_URL
  ? new Redis(REDIS_URL, bullRedisOptions)
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      ...bullRedisOptions,
    });
