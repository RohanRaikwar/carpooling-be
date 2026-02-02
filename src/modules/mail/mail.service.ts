import { SendMailPayload } from './mail.types.js';
import { mailQueue } from './mail.queue.js';

export const sendMail = async (payload: SendMailPayload) => {
  const result = await mailQueue.add('send-mail', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
};
