"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.otpVerifySchema = exports.otpRequestSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z
    .object({
    method: zod_1.z.enum(['email', 'phone']),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(10).optional(),
})
    .refine((data) => {
    if (data.method === 'email' && !data.email)
        return false;
    if (data.method === 'phone' && !data.phone)
        return false;
    return true;
}, {
    message: 'Email is required for email method, Phone is required for phone method',
    path: ['method'],
});
exports.otpRequestSchema = zod_1.z.object({
    method: zod_1.z.enum(['email', 'phone']),
    identifier: zod_1.z.string(),
    purpose: zod_1.z.enum(['signup', 'login', 'reset']),
});
exports.otpVerifySchema = zod_1.z.object({
    otpId: zod_1.z.string().optional(),
    code: zod_1.z.string().length(4),
    method: zod_1.z.enum(['email', 'phone']),
    identifier: zod_1.z.string(),
});
exports.loginSchema = zod_1.z.object({
    method: zod_1.z.enum(['email', 'phone']),
    identifier: zod_1.z.string(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
