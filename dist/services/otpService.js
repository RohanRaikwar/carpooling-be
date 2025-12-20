"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.generateLocalOTP = exports.createOTP = void 0;
const otp_model_1 = __importDefault(require("../models/otp.model"));
const generateOtp_1 = require("../utils/generateOtp");
const createOTP = async (email) => {
    const otp = (0, generateOtp_1.generateOTP)();
    await otp_model_1.default.deleteMany({ email }); // remove old OTPs
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await otp_model_1.default.create({
        email,
        otp,
        expiresAt,
    });
    return otp;
};
exports.createOTP = createOTP;
const generateLocalOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
exports.generateLocalOTP = generateLocalOTP;
const verifyOTP = async (email, otp) => {
    const record = await otp_model_1.default.findOne({
        email,
        otp,
        verified: false,
        expiresAt: { $gt: new Date() },
    });
    if (!record)
        return false;
    record.verified = true;
    await record.save();
    return true;
};
exports.verifyOTP = verifyOTP;
