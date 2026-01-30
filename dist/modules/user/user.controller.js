"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.completeOnBoardingStep1 = exports.getMe = void 0;
const _utils_1 = require("@utils");
const user_service_1 = require("./user.service");
const getMe = async (req, res) => {
    try {
        const { success, user, reason } = await (0, user_service_1.getMeService)(req.user.id);
        if (!success) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.NOT_FOUND,
                message: reason || 'User not found',
            });
        }
        return (0, _utils_1.sendSuccess)(res, {
            status: _utils_1.HttpStatus.OK,
            message: 'User fetched successfully',
            data: user,
        });
    }
    catch (error) {
        console.error('getMe controller error:', error);
        return (0, _utils_1.sendError)(res, {
            status: _utils_1.HttpStatus.INTERNAL_ERROR,
            message: 'Server error',
            error,
        });
    }
};
exports.getMe = getMe;
const completeOnBoardingStep1 = async (req, res) => {
    try {
        const { success, user, reason } = await (0, user_service_1.completeOnBoardingStep1Service)(req.user.id, req.body);
        if (!success) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.BAD_REQUEST,
                message: reason || 'Unable to complete onboarding',
            });
        }
        return (0, _utils_1.sendSuccess)(res, {
            status: _utils_1.HttpStatus.OK,
            message: 'Onboarding completed successfully',
            data: {
                id: user.uuid,
                name: user.name,
                email: user.email,
                role: 'USER',
            },
        });
    }
    catch (error) {
        console.error('completeOnBoardingStep1 controller error:', error);
        return (0, _utils_1.sendError)(res, {
            status: _utils_1.HttpStatus.INTERNAL_ERROR,
            message: 'Server error',
            error,
        });
    }
};
exports.completeOnBoardingStep1 = completeOnBoardingStep1;
const updateProfile = async (req, res) => {
    try {
        const { success, user, reason } = await (0, user_service_1.updateProfileService)(req.user.id, req.body);
        if (!success) {
            const status = reason === 'USERNAME_EXISTS' ? _utils_1.HttpStatus.CONFLICT : _utils_1.HttpStatus.BAD_REQUEST;
            return (0, _utils_1.sendError)(res, {
                status,
                message: reason || 'Unable to update profile',
            });
        }
        return (0, _utils_1.sendSuccess)(res, {
            status: _utils_1.HttpStatus.OK,
            message: 'Profile updated successfully',
            data: user,
        });
    }
    catch (error) {
        console.error('updateProfile controller error:', error);
        return (0, _utils_1.sendError)(res, {
            status: _utils_1.HttpStatus.INTERNAL_ERROR,
            message: 'Server error',
            error,
        });
    }
};
exports.updateProfile = updateProfile;
