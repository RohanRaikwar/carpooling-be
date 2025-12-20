import { createClient } from 'redis';
import logger from '../utils/logger';

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export const connectRedis = async (): Promise<void> => {
    await redisClient.connect();
};

export default redisClient;
