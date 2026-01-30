"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.resendOtpCont = exports.refreshToken = exports.login = exports.verifyOtpCont = exports.requestOtp = exports.signup = void 0;
const _utils_1 = require("@utils");
const auth_service_1 = require("./auth.service");
const mail_service_1 = require("../mail/mail.service");
const mail_templates_1 = require("../mail/mail.templates");
const otp_service_1 = require("../otp/otp.service");
const signup = async (req, res) => {
    try {
        const { method, email, phone } = req.body;
        const identifier = method === 'email' ? email : phone;
        const result = await (0, auth_service_1.signupService)(method, identifier);
        if (result.success === false) {
            return (0, _utils_1.sendError)(res, {
                message: result.reason || 'Failed to create user',
                status: _utils_1.HttpStatus.CONFLICT,
            });
        }
        const { code, success, reason } = await (0, otp_service_1.createOtp)(identifier, 'signup', method);
        if (success === false || code === undefined || code === null) {
            return (0, _utils_1.sendError)(res, {
                message: reason || 'Failed to generate OTP',
                status: _utils_1.HttpStatus.INTERNAL_ERROR,
            });
        }
        await (0, mail_service_1.sendMail)({
            to: identifier,
            subject: 'Signup OTP',
            html: (0, mail_templates_1.signupOtpTemplate)(code),
        });
        return (0, _utils_1.sendSuccess)(res, {
            status: _utils_1.HttpStatus.CREATED,
            message: 'Signup successful, verify OTP',
            data: { next: 'verify_otp' },
        });
    }
    catch (err) {
        if (err.message === 'USER_EXISTS') {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.CONFLICT,
                message: 'User already exists',
            });
        }
        return (0, _utils_1.sendError)(res, { message: err.message || 'Server error' });
    }
};
exports.signup = signup;
const requestOtp = async (req, res) => {
    try {
        const { method, identifier, purpose } = req.body;
        const { user, success } = await (0, auth_service_1.requestOtpService)(identifier, purpose, method);
        if (!success) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.CONFLICT,
                message: 'User already exists',
            });
        }
        const otp = await (0, otp_service_1.createOtp)(identifier, purpose, method);
        if (otp.success === false || otp.code === undefined || otp.code === null) {
            return (0, _utils_1.sendError)(res, { message: otp.reason || 'Failed to generate OTP' });
        }
        const code = otp.code;
        if (method === 'email') {
            await (0, mail_service_1.sendMail)({
                to: identifier,
                subject: 'Your OTP',
                html: (0, mail_templates_1.resetOtpTemplate)(code),
            });
        }
        return (0, _utils_1.sendSuccess)(res, {
            message: 'OTP sent successfully',
            data: { next: 'verify_otp' },
        });
    }
    catch (err) {
        console.error('Request OTP error:', err);
        return (0, _utils_1.sendError)(res, { message: 'Server error' });
    }
};
exports.requestOtp = requestOtp;
const verifyOtpCont = async (req, res) => {
    try {
        const { identifier, code, purpose, method } = req.body;
        const verifyResult = await (0, otp_service_1.verifyOtp)(identifier, purpose, code, method);
        if (!verifyResult.success) {
            let errorMessage;
            if (verifyResult.reason === 'expired') {
                errorMessage = 'OTP expired';
            }
            else if (verifyResult.reason === 'too_many_attempts') {
                errorMessage = 'Too many wrong attempts';
            }
            else {
                errorMessage = 'Invalid OTP';
            }
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.BAD_REQUEST,
                message: errorMessage,
            });
        }
        console.log(verifyResult, 'ufgu');
        const result = await (0, auth_service_1.verifyOtpService)(identifier, code, purpose, method);
        console.log(result, 'ufgu');
        if ('success' in result && !result.success) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.BAD_REQUEST,
                message: 'Invalid or expired OTP',
            });
        }
        if ('tokens' in result && result.user && result.success) {
            return (0, _utils_1.sendSuccess)(res, {
                message: 'Verification successful',
                data: {
                    ...result.tokens,
                    user: {
                        id: result.user.uuid,
                        email: result.user.email,
                        role: 'USER',
                    },
                    next: result.next,
                },
            });
        }
        return (0, _utils_1.sendError)(res, { message: 'Server error' });
    }
    catch {
        return (0, _utils_1.sendError)(res, { message: 'Server error' });
    }
};
exports.verifyOtpCont = verifyOtpCont;
const login = async (req, res) => {
    try {
        const { method, identifier } = req.body;
        if (method !== 'email' && method !== 'phone') {
            return res.status(400).json({ message: 'Invalid login request' });
        }
        const { user } = await (0, auth_service_1.loginService)(method, identifier);
        if (!user) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.NOT_FOUND,
                message: 'User not found',
            });
        }
        if (!user.isVerified) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.FORBIDDEN,
                message: 'User not verified',
            });
        }
        const otp = await (0, otp_service_1.createOtp)(identifier, 'login', method);
        if (otp.success === false || otp.code === undefined || otp.code === null) {
            return (0, _utils_1.sendError)(res, { message: otp.reason || 'Failed to generate OTP' });
        }
        const code = otp.code;
        if (method === 'email') {
            await (0, mail_service_1.sendMail)({
                to: identifier,
                subject: 'Login OTP',
                html: (0, mail_templates_1.signupOtpTemplate)(code),
            });
            return (0, _utils_1.sendSuccess)(res, {
                message: 'OTP sent for login',
                data: { next: 'verify_otp' },
            });
        }
    }
    catch (err) {
        console.error('Login error:', err);
        return (0, _utils_1.sendError)(res, { message: 'Server error' });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const tokens = await (0, auth_service_1.refreshTokenService)(req.body.refreshToken);
        if (!tokens.success) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.UNAUTHORIZED,
                message: tokens.reason || 'Invalid refresh token',
            });
        }
        return (0, _utils_1.sendSuccess)(res, { data: tokens.tokens });
    }
    catch (err) {
        console.error('Refresh token error:', err);
        return (0, _utils_1.sendError)(res, {
            status: _utils_1.HttpStatus.UNAUTHORIZED,
            message: 'Invalid refresh token',
        });
    }
};
exports.refreshToken = refreshToken;
const resendOtpCont = async (req, res) => {
    try {
        const { identifier, purpose, method } = req.body;
        const resendOtpResult = await (0, otp_service_1.resendOtp)(identifier, purpose, method);
        if (!resendOtpResult.success) {
            let errorMessage;
            if (resendOtpResult.reason === 'cooldown') {
                errorMessage = 'Please wait before requesting another OTP';
            }
            else {
                errorMessage = 'Unable to resend OTP';
            }
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.TOO_MANY_REQUESTS,
                message: errorMessage,
            });
        }
        const result = resendOtpResult;
        if (method === 'email') {
            await (0, mail_service_1.sendMail)({
                to: identifier,
                subject: 'Resend OTP',
                html: purpose === 'signup' ? (0, mail_templates_1.signupOtpTemplate)(result.otp) : (0, mail_templates_1.loginOtpTemplate)(result.otp),
            });
        }
        return (0, _utils_1.sendSuccess)(res, {
            message: result.reused ? 'OTP resent' : 'New OTP generated',
            status: _utils_1.HttpStatus.OK,
        });
    }
    catch {
        return (0, _utils_1.sendError)(res, { message: 'Server error' });
    }
};
exports.resendOtpCont = resendOtpCont;
const logout = async (req, res) => {
    const { refreshToken } = req.body;
    const result = await (0, auth_service_1.logoutService)(refreshToken);
    if (!result.success) {
        return (0, _utils_1.sendError)(res, {
            status: _utils_1.HttpStatus.BAD_REQUEST,
            message: `Invalid refresh token: ${result.reason}`,
        });
    }
    return (0, _utils_1.sendSuccess)(res, { message: 'Logged out successfully' });
};
exports.logout = logout;
