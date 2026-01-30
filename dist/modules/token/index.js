"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokens_service_1 = require("./tokens.service");
exports.default = { revokeRefreshToken: tokens_service_1.revokeRefreshToken, generateTokens: tokens_service_1.generateTokens, verifyAccessToken: tokens_service_1.verifyAccessToken, verifyRefreshToken: tokens_service_1.verifyRefreshToken };
