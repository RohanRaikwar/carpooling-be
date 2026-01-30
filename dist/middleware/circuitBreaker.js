"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCircuitBreaker = createCircuitBreaker;
const opossum_1 = __importDefault(require("opossum"));
function createCircuitBreaker(action) {
    const breaker = new opossum_1.default(action, {
        timeout: 15000, // Google can be slow
        errorThresholdPercentage: 50, // % failures before open
        resetTimeout: 30000, // try again after 30s
        rollingCountTimeout: 60000,
        rollingCountBuckets: 10,
        volumeThreshold: 5, // minimum calls before opening
    });
    breaker.on('open', () => {
        console.error('🚨 Google Routes circuit OPEN');
    });
    breaker.on('halfOpen', () => {
        console.warn('🟡 Google Routes circuit HALF-OPEN');
    });
    breaker.on('close', () => {
        console.log('✅ Google Routes circuit CLOSED');
    });
    return breaker;
}
