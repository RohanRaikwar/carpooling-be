"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailSchema = void 0;
const zod_1 = require("zod");
exports.emailSchema = zod_1.z.object({
    email: zod_1.z.string().min(1, 'Email is required').email('Invalid email address'),
});
