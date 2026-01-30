"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOtp = exports.verifyOtp = exports.createOtp = void 0;
const redis_1 = __importDefault(require("@cache/redis"));
const otp_constants_1 = require("./otp.constants");
const otpKey = (identifier, purpose, method) => `otp:${purpose}:${identifier}:${method}`;
const createOtp = async (identifier, purpose, method) => {
    const key = otpKey(identifier, purpose, method);
    const ttl = await redis_1.default.ttl(key);
    // Cooldown check
    if (ttl > otp_constants_1.OTP_EXPIRY_MINUTES * 60 - otp_constants_1.OTP_RESEND_COOLDOWN_SEC) {
        return { success: false, reason: 'cooldown', code: null };
    }
    // 🔢 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await redis_1.default.set(key, JSON.stringify({ code, attempts: 0 }), 'EX', otp_constants_1.OTP_EXPIRY_MINUTES * 60);
    return { success: true, code, reason: null };
};
exports.createOtp = createOtp;
const verifyOtp = async (identifier, purpose, code, method) => {
    const key = otpKey(identifier, purpose, method);
    const data = await redis_1.default.get(key);
    if (!data)
        return { success: false, reason: 'expired' };
    const parsed = JSON.parse(data);
    if (parsed.attempts >= otp_constants_1.OTP_MAX_ATTEMPTS) {
        await redis_1.default.del(key);
        return { success: false, reason: 'too_many_attempts' };
    }
    if (parsed.code !== code) {
        parsed.attempts += 1;
        await redis_1.default.set(key, JSON.stringify(parsed), 'KEEPTTL');
        return { success: false, reason: 'invalid_otp' };
    }
    await redis_1.default.del(key);
    return { success: true };
};
exports.verifyOtp = verifyOtp;
const resendOtp = async (identifier, purpose, method) => {
    const key = otpKey(identifier, purpose, method);
    const ttl = await redis_1.default.ttl(key);
    // No OTP exists → create fresh
    if (ttl <= 0) {
        const otp = await (0, exports.createOtp)(identifier, purpose, method);
        return { success: true, otp, reused: false };
    }
    // Cooldown still active
    if (ttl > otp_constants_1.OTP_EXPIRY_MINUTES * 60 - otp_constants_1.OTP_RESEND_COOLDOWN_SEC) {
        return { success: false, reason: 'cooldown' };
    }
    // Reuse existing OTP
    const data = await redis_1.default.get(key);
    if (!data) {
        const otp = await (0, exports.createOtp)(identifier, purpose, method);
        return { success: true, otp, reused: false };
    }
    const parsed = JSON.parse(data);
    return {
        success: true,
        otp: parsed.code,
        reused: true,
    };
};
exports.resendOtp = resendOtp;
