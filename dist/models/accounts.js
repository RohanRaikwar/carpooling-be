"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const enums_1 = require("../constants/enums");
const AccountSchema = new mongoose_1.default.Schema({
    uuid: {
        type: String,
        default: uuid_1.v4,
        unique: true,
        index: true,
    },
    accountType: {
        type: String,
        enum: Object.values(enums_1.AccountType),
        required: true,
    },
    referenceUuid: {
        type: String,
        required: true,
        index: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(enums_1.AccountStatus),
        default: enums_1.AccountStatus.ACTIVE,
    },
}, {
    timestamps: true,
});
exports.AccountModel = mongoose_1.default.model('Account', AccountSchema);
