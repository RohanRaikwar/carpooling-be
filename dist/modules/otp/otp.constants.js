"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTP_RESEND_COOLDOWN_SEC = exports.OTP_RESEND_LIMIT = exports.OTP_MAX_ATTEMPTS = exports.OTP_EXPIRY_MINUTES = exports.OtpPurpose = void 0;
var OtpPurpose;
(function (OtpPurpose) {
    OtpPurpose["SIGNUP"] = "signup";
    OtpPurpose["LOGIN"] = "login";
    OtpPurpose["RESET_PASSWORD"] = "reset_password";
})(OtpPurpose || (exports.OtpPurpose = OtpPurpose = {}));
exports.OTP_EXPIRY_MINUTES = 5;
exports.OTP_MAX_ATTEMPTS = 5;
exports.OTP_RESEND_LIMIT = 3;
exports.OTP_RESEND_COOLDOWN_SEC = 60;
