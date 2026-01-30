"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.transporter = void 0;
const mailer_1 = __importDefault(require("./mailer"));
exports.transporter = mailer_1.default;
const database_1 = __importDefault(require("./database"));
exports.connectDB = database_1.default;
