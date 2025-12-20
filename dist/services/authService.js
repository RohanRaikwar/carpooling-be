"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const logger_1 = __importDefault(require("../utils/logger"));
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRY = '1y';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const generateTokens = async (user) => {
    const accessToken = jsonwebtoken_1.default.sign({ id: user.uuid, role: 'User' }, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.uuid }, REFRESH_TOKEN_SECRET, {
        expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    await RefreshToken_1.default.create({
        userId: user.uuid,
        token: refreshToken,
        expiresAt,
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const sendOTP = async (identifier, otp, method) => {
    // Mock sending OTP
    logger_1.default.info(`[MOCK] Sending OTP ${otp} to ${identifier} via ${method}`);
    // In a real app, integrate with Twilio/SendGrid here
};
exports.sendOTP = sendOTP;
