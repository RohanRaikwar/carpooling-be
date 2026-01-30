"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const httpStatus_1 = require("./httpStatus");
const statusMap_1 = require("./statusMap");
const sendSuccess = (res, { status = httpStatus_1.HttpStatus.OK, message = 'Success', data = null }) => {
    return res.status(statusMap_1.statusMap[status]).json({
        success: true,
        status,
        message,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, { status = httpStatus_1.HttpStatus.INTERNAL_ERROR, message = 'Something went wrong', error = undefined, }) => {
    return res.status(statusMap_1.statusMap[status]).json({
        success: false,
        status,
        message,
        error,
    });
};
exports.sendError = sendError;
