"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUploadSchema = exports.updateYearSchema = exports.updateColorSchema = exports.updateTypeSchema = exports.updateBrandModelSchema = exports.createVehicleSchema = void 0;
const zod_1 = require("zod");
exports.createVehicleSchema = zod_1.z.object({
    licenseCountry: zod_1.z.string().min(1),
    licenseNumber: zod_1.z.string().min(1),
});
exports.updateBrandModelSchema = zod_1.z.object({
    brand: zod_1.z.string().min(1),
    model: zod_1.z.string().min(1),
});
exports.updateTypeSchema = zod_1.z.object({
    type: zod_1.z.enum(['sedan', 'hatchback', 'minibus']),
});
exports.updateColorSchema = zod_1.z.object({
    color: zod_1.z.string().min(1),
});
exports.updateYearSchema = zod_1.z.object({
    year: zod_1.z.number().min(1990).max(new Date().getFullYear()),
});
exports.imageUploadSchema = zod_1.z.object({
    fieldname: zod_1.z.literal('image'),
    mimetype: zod_1.z.string().startsWith('image/', {
        message: 'Only image files are allowed',
    }),
    size: zod_1.z.number().max(5 * 1024 * 1024, {
        message: 'Image must be less than 5MB',
    }),
    path: zod_1.z.string(),
});
