"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeRefreshToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const _models_1 = require("@models");
const tokens_constants_1 = require("./tokens.constants");
/**
 * Generate JWT access and refresh tokens
 */
const generateTokens = async (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, tokens_constants_1.ACCESS_TOKEN_SECRET, {
        expiresIn: tokens_constants_1.ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, tokens_constants_1.REFRESH_TOKEN_SECRET, {
        expiresIn: tokens_constants_1.REFRESH_TOKEN_EXPIRES_IN,
    });
    // Save refresh token to DB
    await _models_1.RefreshToken.create({
        token: refreshToken,
        uuid: payload.id,
        revoked: false,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 7 days
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, tokens_constants_1.ACCESS_TOKEN_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verify Refresh Token
 */
const verifyRefreshToken = async (token) => {
    console.log(token, tokens_constants_1.REFRESH_TOKEN_SECRET, 'jj');
    const decoded = jsonwebtoken_1.default.verify(token, tokens_constants_1.REFRESH_TOKEN_SECRET);
    return decoded;
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Revoke Refresh Token
 */
const revokeRefreshToken = async (token) => {
    await _models_1.RefreshToken.findOneAndUpdate({ token }, { revoked: true });
};
exports.revokeRefreshToken = revokeRefreshToken;
