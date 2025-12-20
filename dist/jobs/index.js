"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = void 0;
const bullmq_1 = require("bullmq");
const logger_1 = __importDefault(require("../utils/logger"));
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
exports.notificationQueue = new bullmq_1.Queue('notifications', { connection });
const worker = new bullmq_1.Worker('notifications', async (job) => {
    logger_1.default.info(`Processing job ${job.id}: ${job.name}`);
    // Simulate sending notification
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger_1.default.info(`Job ${job.id} completed`);
}, { connection });
worker.on('completed', (job) => {
    logger_1.default.info(`Job ${job.id} has completed!`);
});
worker.on('failed', (job, err) => {
    logger_1.default.error(`Job ${job?.id} has failed with ${err.message}`);
});
