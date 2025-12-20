"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const mailer_1 = __importDefault(require("../config/mailer"));
const sendMail = async ({ to, subject, html, text }) => {
    await mailer_1.default.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        text,
        html,
    });
};
exports.sendMail = sendMail;
