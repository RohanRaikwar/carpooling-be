"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const tokens_service_1 = require("../modules/token/tokens.service");
const apiResponse_1 = require("../utils/apiResponse");
const httpStatus_1 = require("../utils/httpStatus");
const protect = (req, res, next) => {
    const authReq = req;
    let token;
    if (authReq.headers.authorization?.startsWith('Bearer')) {
        token = authReq.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return (0, apiResponse_1.sendError)(res, {
            message: 'Not authorized, no token',
            status: httpStatus_1.HttpStatus.UNAUTHORIZED,
        });
    }
    try {
        const decoded = (0, tokens_service_1.verifyAccessToken)(token);
        authReq.user = decoded; // safely assign to AuthRequest
        next();
    }
    catch (error) {
        return (0, apiResponse_1.sendError)(res, {
            message: 'Not authorized, token failed',
            status: httpStatus_1.HttpStatus.UNAUTHORIZED,
        });
    }
};
exports.protect = protect;
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        (0, apiResponse_1.sendError)(res, { message: 'Forbidden', status: httpStatus_1.HttpStatus.FORBIDDEN });
        return;
    }
    next();
};
exports.authorize = authorize;
