"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const OTPSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        index: true,
        trim: true,
        lowercase: true,
    },
    otp: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 6, // allows flexibility (4–6 digits)
    },
    purpose: {
        type: String,
        enum: ['signup', 'login', 'reset_password'],
        required: true,
        index: true,
    },
    verified: {
        type: Boolean,
        default: false,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true, // TTL index applied below
    },
    // --- Rate-limit helpers ---
    resendCount: {
        type: Number,
        default: 0,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    lastSentAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
/**
 * TTL auto-delete after expiresAt
 */
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
/**
 * Ensure only ONE active OTP per user per purpose
 * (new OTP overwrites old one)
 */
OTPSchema.index({ email: 1, purpose: 1, verified: 1 }, { unique: false });
exports.default = mongoose_1.default.model('OTP', OTPSchema);
