"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const mailer_1 = __importDefault(require("@config/mailer"));
const redisConnection_1 = require("@queue/redisConnection");
console.log('📨 Mail worker booting...');
redisConnection_1.bullRedis.ping();
console.log('🟢 Redis connected');
const worker = new bullmq_1.Worker('mail-queue', async (job) => {
    console.log('📩 Job received:', job.id);
    const { to, subject, html, text } = job.data;
    const result = await mailer_1.default.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
        text,
    });
    console.log('✅ Mail sent:', result.messageId);
}, {
    connection: redisConnection_1.bullRedis,
});
worker.on('ready', () => {
    console.log('✅ Mail worker is ready');
});
worker.on('failed', (job, err) => {
    console.error('❌ Job failed:', job?.id, err);
});
process.stdin.resume();
