"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.OnboardingStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
var OnboardingStatus;
(function (OnboardingStatus) {
    OnboardingStatus["PENDING"] = "PENDING";
    OnboardingStatus["COMPLETED"] = "COMPLETED";
})(OnboardingStatus || (exports.OnboardingStatus = OnboardingStatus = {}));
const UserSchema = new mongoose_1.default.Schema({
    uuid: {
        type: String,
        default: () => (0, uuid_1.v4)(),
        unique: true,
        index: true,
    },
    name: {
        type: String,
        trim: true,
    },
    salutation: {
        type: String,
        enum: ['MR', 'MS', 'MRS', 'MX', 'OTHER'],
        default: null,
    },
    dob: {
        type: Date,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true, // allows multiple nulls
    },
    phone: {
        type: String,
        trim: true,
        unique: true,
        sparse: true, // allows multiple nulls
    },
    onboardingStatus: {
        type: String,
        enum: Object.values(OnboardingStatus),
        default: OnboardingStatus.PENDING,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
// No pre-save validation needed since both email and phone are optional
exports.UserModel = mongoose_1.default.model('User', UserSchema);
