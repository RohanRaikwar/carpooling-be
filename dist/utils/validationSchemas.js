"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.refreshTokenSchema = exports.loginSchema = exports.otpVerifySchema = exports.otpRequestSchema = exports.updateProfileSchemaOnBoarding = exports.signupSchema = void 0;
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
exports.updateProfileSchemaOnBoarding = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be at most 50 characters'),
    salutation: zod_1.z.enum(['MR', 'MS', 'MRS', 'MX', 'OTHER']).optional(),
    dob: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), 'Date of birth must be a valid date')
        .optional(),
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
exports.updateProfileSchema = zod_1.z.object({
    bio: zod_1.z.string().max(150).optional(),
    username: zod_1.z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/)
        .optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
    dob: zod_1.z.string().datetime().optional(), // ISO string
    preferences: zod_1.z
        .object({
        smoking: zod_1.z.boolean().optional(),
        pets: zod_1.z.boolean().optional(),
        music: zod_1.z.boolean().optional(),
    })
        .optional(),
});
