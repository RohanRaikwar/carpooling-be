"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mail_service_1 = require("./mail.service");
const mail_templates_1 = require("./mail.templates");
exports.default = {
    sendMail: mail_service_1.sendMail,
    signupOtpTemplate: mail_templates_1.signupOtpTemplate,
    loginOtpTemplate: mail_templates_1.loginOtpTemplate,
    resetOtpTemplate: mail_templates_1.resetOtpTemplate,
    signupWelcomeTemplate: mail_templates_1.signupWelcomeTemplate,
};
