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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginService = exports.logoutService = exports.requestOtpService = exports.refreshTokenService = exports.verifyOtpService = exports.signupService = void 0;
const models = __importStar(require("@models"));
const tokens_service_1 = require("../token/tokens.service");
const user_constants_1 = require("@modules/user/user.constants");
const signupService = async (method, identifier) => {
    let user = await models.UserModel.findOne({ [method]: identifier });
    console.log(user);
    if (user && user.isVerified) {
        return { success: false, reason: 'USER_EXISTS' };
    }
    if (!user) {
        user = await models.UserModel.create({
            [method]: identifier,
            onboardingStatus: 'PENDING',
            isVerified: false,
        });
    }
    return { success: true, user, reason: 'USER_CREATED' };
};
exports.signupService = signupService;
const verifyOtpService = async (identifier, code, purpose, method) => {
    try {
        console.log('verifyOtpService started');
        const user = await models.UserModel.findOne({ [method]: identifier });
        if (!user)
            return { success: false, reason: 'USER_NOT_FOUND' };
        if (purpose === 'signup') {
            user.isVerified = true;
            await user.save();
        }
        if (purpose === 'login' && !user.isVerified) {
            return { success: false, reason: 'USER_NOT_VERIFIED' };
        }
        const tokens = await (0, tokens_service_1.generateTokens)({ id: user.uuid, role: user_constants_1.Role.USER });
        const nextStep = user?.onboardingStatus === 'COMPLETED' ? 'home' : 'onboarding';
        console.log('verifyOtpService success');
        return { success: true, user, tokens, next: nextStep };
    }
    catch (error) {
        console.error('verifyOtpService error:', error);
        return { success: false, reason: error?.message || 'UNKNOWN_ERROR' };
    }
};
exports.verifyOtpService = verifyOtpService;
const refreshTokenService = async (refreshToken) => {
    try {
        const decoded = await (0, tokens_service_1.verifyRefreshToken)(refreshToken);
        if (!decoded) {
            return { success: false, reason: 'INVALID_REFRESH' };
        }
        const tokenDoc = await models.RefreshToken.findOne({
            token: refreshToken,
            uuid: decoded.id,
            revoked: false,
        });
        if (!tokenDoc) {
            return { success: false, reason: 'INVALID_REFRESH' };
        }
        tokenDoc.revoked = true;
        await tokenDoc.save();
        // ❗ FIX: Use uuid, not _id
        const user = await models.UserModel.findOne({ uuid: decoded.id });
        if (!user) {
            return { success: false, reason: 'USER_NOT_FOUND' };
        }
        const tokens = await (0, tokens_service_1.generateTokens)({
            id: user.uuid,
            role: user_constants_1.Role.USER,
        });
        return { success: true, tokens };
    }
    catch (error) {
        console.error('refreshTokenService error:', error);
        return {
            success: false,
            reason: 'INTERNAL_ERROR',
        };
    }
};
exports.refreshTokenService = refreshTokenService;
const requestOtpService = async (identifier, purpose, method) => {
    const user = await models.UserModel.findOne({ [method]: identifier });
    if (purpose === 'signup' && user && user.isVerified) {
        return { success: false, reason: 'USER_EXISTS' };
    }
    if (purpose === 'login' && !user) {
        return { success: true, message: 'OTP sent if account exists' };
    }
    return { success: true, user };
};
exports.requestOtpService = requestOtpService;
const logoutService = async (refreshToken) => {
    try {
        await models.RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
        return { success: true, message: 'Logged out successfully' };
    }
    catch (error) {
        return { success: false, reason: 'LOGOUT_FAILED' };
    }
};
exports.logoutService = logoutService;
const loginService = async (method, identifier) => {
    const user = await models.UserModel.findOne({ [method]: identifier });
    if (!user || !user.isVerified) {
        return { success: false, reason: 'USER_NOT_FOUND_OR_VERIFIED' };
    }
    return { success: true, user };
};
exports.loginService = loginService;
