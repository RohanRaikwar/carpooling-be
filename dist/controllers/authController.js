"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.resendOtp = exports.refreshToken = exports.login = exports.verifyOtp = exports.requestOtp = exports.signup = void 0;
const models = __importStar(require("../models"));
const refreshtoken_model_1 = __importDefault(require("../models/refreshtoken.model"));
const otpService_1 = require("../services/otpService");
const authService_1 = require("../services/authService");
const mailService_1 = require("../services/mailService");
const logger_1 = __importDefault(require("../utils/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const signup = async (req, res) => {
    try {
        const { method, email, phone } = req.body;
        const identifier = method === 'email' ? email : phone;
        const existingUser = await models.UserModel.findOne({ [method]: identifier });
        if (existingUser && existingUser.isVerified) {
            return res.status(409).json({ message: 'User already exists' });
        }
        let user = existingUser;
        if (!user) {
            user = await models.UserModel.create({
                [method]: identifier,
                onboardingStatus: 'PENDING',
                isVerified: false,
            });
        }
        const otp = await (0, otpService_1.createOTP)(email, 'signup');
        await (0, mailService_1.sendMail)({
            to: email,
            subject: 'Your Signup OTP',
            html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Signup Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 5px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
        </div>
      `,
        });
        res.status(201).json({
            message: 'Signup successful, please verify OTP',
            next: 'verify_otp',
            otpId: 'simulated_otp_id',
        });
    }
    catch (error) {
        logger_1.default.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.signup = signup;
const requestOtp = async (req, res) => {
    try {
        const { method, identifier, purpose } = req.body;
        // Rate limit check
        // const allowed = await checkRateLimit(identifier);
        // if (!allowed) {
        //   return res.status(429).json({ message: 'Too many OTP requests' });
        // }
        // Check user existence for login flow (don't reveal existence but don't send OTP if not found?)
        // Requirement: "Return success but avoid leaking whether user exists"
        // But for login, if user doesn't exist, we can't really log them in.
        // However, standard practice is to say "If an account exists, an OTP has been sent."
        const user = await models.UserModel.findOne({ [method]: identifier });
        if (purpose === 'signup' && user && user.isVerified) {
            // Conflict for signup
            return res.status(409).json({ message: 'User already exists' });
        }
        if (purpose === 'login' && !user) {
            // Fake success
            return res.status(200).json({ message: 'OTP sent if account exists' });
        }
        // const otp = generateOTP();
        // await storeOTP(identifier, otp, purpose);
        // await sendOTP(identifier, otp, method);
        res.status(200).json({ message: 'OTP sent' });
    }
    catch (error) {
        logger_1.default.error('Request OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.requestOtp = requestOtp;
const verifyOtp = async (req, res) => {
    try {
        const { code, method, identifier, purpose } = req.body;
        if (!code || !identifier || !purpose || !method) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const result = await (0, otpService_1.verifyOTP)(identifier, code, purpose);
        if (!result.success) {
            switch (result.reason) {
                case 'too_many_attempts':
                    return res.status(429).json({ message: 'Too many incorrect attempts' });
                case 'invalid_otp':
                    return res.status(400).json({ message: 'Invalid OTP' });
                case 'not_found_or_expired':
                default:
                    return res.status(410).json({ message: 'OTP expired or not found' });
            }
        }
        // OTP is valid — now continue flow
        let user = await models.UserModel.findOne({ [method]: identifier });
        /**
         * --- SIGNUP FLOW ---
         */
        if (purpose === 'signup') {
            if (!user) {
                return res.status(400).json({ message: 'User not found for signup verification' });
            }
            user.isVerified = true;
            await user.save();
        }
        /**
         * --- LOGIN FLOW ---
         */
        if (purpose === 'login') {
            if (!user) {
                // don't leak existence — but here user MUST exist to log in
                return res.status(404).json({ message: 'User not found' });
            }
        }
        // Generate login tokens after successful signup/login verification
        const tokens = await (0, authService_1.generateTokens)(user);
        const nextStep = user?.onboardingStatus !== 'COMPLETED' ? 'onboarding' : 'home';
        return res.status(200).json({
            message: 'Verification successful',
            ...tokens,
            user: {
                id: user.uuid,
                email: user.email,
                role: 'USER',
            },
            next: nextStep,
        });
    }
    catch (error) {
        logger_1.default.error('Verify OTP controller error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.verifyOtp = verifyOtp;
const login = async (req, res) => {
    try {
        const { method, identifier } = req.body;
        console.log('kbjv');
        if (method !== 'email' && method !== 'phone') {
            return res.status(400).json({ message: 'Invalid login request' });
        }
        const user = await models.UserModel.findOne({ [method]: identifier });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.isVerified) {
            return res.status(403).json({ message: 'User not verified' });
        }
        // ✅ Create OTP for login
        const otp = await (0, otpService_1.createOTP)(identifier, 'login');
        // ✅ Send OTP
        if (method === 'email') {
            await (0, mailService_1.sendMail)({
                to: identifier,
                subject: 'Login OTP',
                html: `
          <div style="font-family: Arial, sans-serif">
            <h2>Login Verification</h2>
            <p>Your OTP is:</p>
            <h1 style="letter-spacing: 5px">${otp}</h1>
            <p>This OTP is valid for <b>5 minutes</b>.</p>
          </div>
        `,
            });
        }
        else {
            // TODO: SMS gateway
            // console.log(`OTP for ${phone}: ${otp.code}`);
        }
        return res.status(200).json({
            message: 'OTP sent for login verification',
            next: 'verify_otp',
            identifier,
            method,
        });
    }
    catch (error) {
        logger_1.default.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const tokenDoc = await refreshtoken_model_1.default.findOne({
            token: refreshToken,
            userId: decoded.id,
            revoked: false,
        });
        if (!tokenDoc) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        // Revoke old token
        tokenDoc.revoked = true;
        await tokenDoc.save();
        const user = await models.UserModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        const newTokens = await (0, authService_1.generateTokens)(user);
        res.status(200).json(newTokens);
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};
exports.refreshToken = refreshToken;
const resendOtp = async (req, res) => {
    try {
        const { identifier, purpose, method } = req.body;
        if (!identifier || !purpose || !method) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const result = await (0, otpService_1.resendOTPService)(identifier, purpose);
        if (!result.success) {
            switch (result.reason) {
                case 'cooldown':
                    return res.status(429).json({
                        message: 'Please wait before requesting another OTP',
                    });
                case 'limit_reached':
                    return res.status(429).json({
                        message: 'Maximum resend limit reached',
                    });
            }
        }
        if (method === 'email') {
            await (0, mailService_1.sendMail)({
                to: identifier,
                subject: 'Login OTP',
                html: `
          <div style="font-family: Arial, sans-serif">
            <h2>${purpose == 'login' ? 'Login' : 'Signup'} Verification</h2>
            <p>Your OTP is:</p>
            <h1 style="letter-spacing: 5px">${result.otp}</h1>
            <p>This OTP is valid for <b>5 minutes</b>.</p>
          </div>
        `,
            });
        }
        // TODO: send via email/SMS here
        // sendOTP(identifier, result.otp, method);
        return res.status(200).json({
            message: result.reused ? 'OTP resent' : 'New OTP generated',
        });
    }
    catch (err) {
        logger_1.default.error('Resend OTP error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.resendOtp = resendOtp;
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await refreshtoken_model_1.default.findOneAndUpdate({ token: refreshToken }, { revoked: true });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.logout = logout;
