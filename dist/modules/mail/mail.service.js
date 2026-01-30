"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const mail_queue_1 = require("./mail.queue");
const sendMail = async (payload) => {
    const result = await mail_queue_1.mailQueue.add('send-mail', payload, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    });
};
exports.sendMail = sendMail;
