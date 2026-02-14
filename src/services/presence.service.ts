import redis from '../cache/redis.js';
import logger from '../utils/logger.js';

const PRESENCE_TTL = 60; // seconds — key expires if no heartbeat
const PRESENCE_PREFIX = 'presence:user:';

/**
 * Set user as online with a TTL-based key.
 * Called on connect + every heartbeat ping.
 */
export const setOnline = async (userId: string, socketId: string): Promise<void> => {
    try {
        const value = JSON.stringify({ socketId, ts: Date.now() });
        await redis.setex(`${PRESENCE_PREFIX}${userId}`, PRESENCE_TTL, value);
    } catch (error) {
        logger.error(`Presence SET error for user ${userId}:`, error);
    }
};

/**
 * Check if a user is currently online.
 * Returns the presence data or null.
 */
export const isOnline = async (userId: string): Promise<{ socketId: string; ts: number } | null> => {
    try {
        const data = await redis.get(`${PRESENCE_PREFIX}${userId}`);
        if (!data) return null;
        return JSON.parse(data);
    } catch (error) {
        logger.error(`Presence GET error for user ${userId}:`, error);
        return null;
    }
};

/**
 * Remove user's presence key (on disconnect).
 */
export const setOffline = async (userId: string): Promise<void> => {
    try {
        await redis.del(`${PRESENCE_PREFIX}${userId}`);
    } catch (error) {
        logger.error(`Presence DEL error for user ${userId}:`, error);
    }
};

/**
 * Refresh presence TTL (heartbeat).
 */
export const refreshPresence = async (userId: string, socketId: string): Promise<void> => {
    await setOnline(userId, socketId);
};
