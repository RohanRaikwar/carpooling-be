import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/index.js';
import logger from '../utils/logger.js';

// ============ FIREBASE INITIALIZATION ============

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK.
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH env variable pointing to the
 * service account JSON file, or GOOGLE_APPLICATION_CREDENTIALS set.
 */
const initFirebase = () => {
    if (firebaseInitialized) return;

    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (serviceAccountPath) {
            // Initialize with explicit service account file (ESM-compatible)
            const resolvedPath = path.resolve(serviceAccountPath);
            const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Initialize with default credentials (env var points to JSON)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        } else {
            logger.warn('⚠️ Firebase not configured — push notifications disabled. Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS.');
            return;
        }

        firebaseInitialized = true;
        logger.info('✅ Firebase Admin SDK initialized');
    } catch (error) {
        logger.error('Firebase initialization error:', error);
    }
};

// Initialize on module load
initFirebase();

// ============ PUSH NOTIFICATION ============

interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

/**
 * Send push notification to a user's registered devices.
 * Automatically removes invalid/expired tokens.
 */
export const sendPushToUser = async (userId: string, payload: PushPayload): Promise<void> => {
    if (!firebaseInitialized) {
        logger.debug('Firebase not initialized, skipping push notification');
        return;
    }

    // Fetch user's device tokens
    const devices = await prisma.deviceToken.findMany({
        where: { userId },
        select: { id: true, token: true, platform: true },
    });

    if (devices.length === 0) {
        logger.debug(`No device tokens for user ${userId}, skipping push`);
        return;
    }

    const tokens = devices.map((d) => d.token);

    // Build the FCM message
    const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: payload.data || {},
        // Android-specific config
        android: {
            priority: 'high',
            notification: {
                channelId: 'default',
                sound: 'default',
            },
        },
        // APNs (iOS) config
        apns: {
            payload: {
                aps: {
                    alert: {
                        title: payload.title,
                        body: payload.body,
                    },
                    sound: 'default',
                    badge: 1,
                },
            },
        },
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);

        logger.info(`Push sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failures`);

        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const invalidTokenIds: string[] = [];

            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error) {
                    const errorCode = resp.error.code;
                    // Remove tokens that are no longer valid
                    if (
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered'
                    ) {
                        invalidTokenIds.push(devices[idx].id);
                        logger.info(`Removing invalid device token: ${devices[idx].token.substring(0, 10)}...`);
                    }
                }
            });

            if (invalidTokenIds.length > 0) {
                await prisma.deviceToken.deleteMany({
                    where: { id: { in: invalidTokenIds } },
                });
                logger.info(`Cleaned up ${invalidTokenIds.length} invalid device tokens`);
            }
        }
    } catch (error) {
        logger.error(`Push notification error for user ${userId}:`, error);
    }
};
