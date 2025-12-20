"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const OTPSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
        length: 4,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
    verified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model('OTP', OTPSchema);
