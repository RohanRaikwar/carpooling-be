"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bullRedis = void 0;
const ioredis_1 = require("ioredis");
exports.bullRedis = new ioredis_1.Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // ✅ Must be null for BullMQ
    enableReadyCheck: true,
    lazyConnect: false,
});
