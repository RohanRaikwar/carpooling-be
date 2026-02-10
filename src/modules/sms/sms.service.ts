import { SendSmsPayload } from './sms.types.js';
import { smsQueue } from './sms.queue.js';

export interface SendSmsResult {
    success: boolean;
    jobId?: string;
    error?: string;
}

/**
 * Queue SMS for sending via BullMQ worker
 * @param to - Phone number with country code (e.g., +919876543210)
 * @param body - Message content
 */
export const sendSms = async (to: string, body: string): Promise<SendSmsResult> => {
    try {
        const payload: SendSmsPayload = { to, body };

        const job = await smsQueue.add('send-sms', payload, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });

        console.log(`[SMS] Queued job ${job.id} for ${to}`);
        return { success: true, jobId: job.id };
    } catch (error: any) {
        console.error('[SMS ERROR] Failed to queue SMS:', error?.message || error);
        return { success: false, error: error?.message || 'Failed to queue SMS' };
    }
};
