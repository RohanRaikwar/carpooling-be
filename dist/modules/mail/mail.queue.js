"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailQueue = void 0;
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("@queue/redisConnection");
exports.mailQueue = new bullmq_1.Queue('mail-queue', {
    connection: redisConnection_1.bullRedis,
});
