"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchemaOnBoarding = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
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
exports.updateProfileSchemaOnBoarding = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be at most 50 characters'),
    salutation: zod_1.z.enum(['MR', 'MS', 'MRS', 'MX', 'OTHER']),
    dob: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), 'Date of birth must be a valid date'),
});
