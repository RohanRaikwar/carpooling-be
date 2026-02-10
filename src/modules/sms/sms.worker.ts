import { Worker } from 'bullmq';
import twilio from 'twilio';
import { bullRedis } from '../../queue/redisConnection.js';
import { SendSmsPayload } from './sms.types.js';

console.log('📱 SMS worker booting...');

bullRedis.ping();
console.log('🟢 Redis connected');

const accountSid = process.env.TWILIO_ACCOUNT_SID ;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "+19789177768";

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

const worker = new Worker(
    'sms-queue',
    async (job) => {
        console.log('📲 SMS Job received:', job.id);

        const { to, body } = job.data as SendSmsPayload;

        // Development mode - just log
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[SMS DEV] To: ${to}, Message: ${body}`);
            return { success: true, messageId: 'dev-mode' };
        }

        // Check if Twilio is configured
        if (!client || !twilioPhoneNumber) {
            throw new Error('Twilio not configured. Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER');
        }

        const message = await client.messages.create({
            body,
            from: twilioPhoneNumber,
            to,
        });

        console.log('✅ SMS sent:', message.sid);
        return { success: true, messageId: message.sid };
    },
    {
        connection: bullRedis,
    },
);

worker.on('ready', () => {
    console.log('✅ SMS worker is ready');
});

worker.on('failed', (job, err) => {
    console.error('❌ SMS Job failed:', job?.id, err);
});

process.stdin.resume();
