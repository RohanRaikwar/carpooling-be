"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOTPService = exports.verifyOTP = exports.generateLocalOTP = exports.createOTP = void 0;
const otp_model_1 = __importDefault(require("../models/otp.model"));
const generateOtp_1 = require("../utils/generateOtp");
const OTP_EXPIRY_MS = 2 * 60 * 1000; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_RESENDS_PER_SESSION = 3;
const createOTP = async (email, purpose) => {
    const otp = (0, generateOtp_1.generateOTP)();
    // Remove old OTP for this email + purpose only
    await otp_model_1.default.deleteMany({ email, purpose });
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await otp_model_1.default.create({
        email,
        otp,
        purpose,
        expiresAt,
        verified: false,
        resendCount: 0,
        attempts: 0,
        lastSentAt: new Date(),
    });
    return otp;
};
exports.createOTP = createOTP;
const generateLocalOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
exports.generateLocalOTP = generateLocalOTP;
const verifyOTP = async (email, otp, purpose) => {
    const record = await otp_model_1.default.findOne({
        email,
        purpose,
        verified: false,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
    if (!record)
        return { success: false, reason: 'not_found_or_expired' };
    // too many wrong attempts
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
        return { success: false, reason: 'too_many_attempts' };
    }
    // wrong OTP
    if (record.otp !== otp) {
        record.attempts += 1;
        await record.save();
        return { success: false, reason: 'invalid_otp' };
    }
    // success 🎉
    record.verified = true;
    await record.save();
    return { success: true };
};
exports.verifyOTP = verifyOTP;
const resendOTPService = async (email, purpose) => {
    const normalizedEmail = email.trim().toLowerCase();
    let record = await otp_model_1.default.findOne({
        email: normalizedEmail,
        purpose,
        verified: false,
    }).sort({ createdAt: -1 });
    const now = Date.now();
    // If OTP exists and not expired
    if (record) {
        const lastSent = record.lastSentAt?.getTime() ?? 0;
        // Cool-down window
        if (now - lastSent < OTP_EXPIRY_MS) {
            return { success: false, reason: 'cooldown' };
        }
        // Max resend limit
        if (record.resendCount >= MAX_RESENDS_PER_SESSION) {
            return { success: false, reason: 'limit_reached' };
        }
        // Still valid → reuse same OTP
        if (record.expiresAt > new Date()) {
            record.resendCount += 1;
            record.lastSentAt = new Date();
            await record.save();
            return {
                success: true,
                otp: record.otp,
                reused: true,
            };
        }
    }
    // Expired → create new OTP
    const otp = await (0, exports.createOTP)(normalizedEmail, purpose);
    return {
        success: true,
        otp,
        reused: false,
    };
};
exports.resendOTPService = resendOTPService;
