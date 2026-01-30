if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}
import { Worker } from 'bullmq';
import transporter from '@config/mailer';
import { bullRedis } from '@queue/redisConnection';
import { SendMailPayload } from './mail.types';

console.log('📨 Mail worker booting...');

bullRedis.ping();
console.log('🟢 Redis connected');

const worker = new Worker(
  'mail-queue',
  async (job) => {
    console.log('📩 Job received:', job.id);

    const { to, subject, html, text } = job.data as SendMailPayload;

    const result = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    console.log('✅ Mail sent:', result.messageId);
  },
  {
    connection: bullRedis,
  },
);

worker.on('ready', () => {
  console.log('✅ Mail worker is ready');
});

worker.on('failed', (job, err) => {
  console.error('❌ Job failed:', job?.id, err);
});

process.stdin.resume();
