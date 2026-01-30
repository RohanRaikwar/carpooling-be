"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
// Create Redis client
const redis = new ioredis_1.default({
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD,
    retryStrategy(times) {
        return Math.min(times * 50, 2000);
    },
});
exports.default = redis;
// Event listeners
redis.on('connect', () => {
    console.log('✅ Redis connected');
});
redis.on('ready', () => {
    console.log('✅ Redis ready to use');
});
redis.on('error', (err) => {
    console.error('❌ Redis error', err);
});
redis.on('close', () => {
    console.warn('⚠️ Redis connection closed');
});
redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});
