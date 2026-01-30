"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTravelPreference = exports.saveTravelPreference = void 0;
const travelPreference_model_1 = require("@models/travelPreference.model");
const _utils_1 = require("@utils");
/**
 * Save or update travel preference
 */
const saveTravelPreference = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { chattiness, pets } = req.body;
        const preference = await travelPreference_model_1.TravelPreference.findOneAndUpdate({ userId }, { chattiness, pets }, { upsert: true, new: true });
        return (0, _utils_1.sendSuccess)(res, {
            status: _utils_1.HttpStatus.OK,
            message: 'Travel preference saved successfully',
            data: preference,
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            status: _utils_1.HttpStatus.INTERNAL_ERROR,
            message: 'Failed to save travel preference',
            error,
        });
    }
};
exports.saveTravelPreference = saveTravelPreference;
/**
 * Get travel preference
 */
const getTravelPreference = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const preference = await travelPreference_model_1.TravelPreference.findOne({ userId });
        if (!preference) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.NOT_FOUND,
                message: 'Travel preference not found',
            });
        }
        return (0, _utils_1.sendSuccess)(res, {
            status: _utils_1.HttpStatus.OK,
            message: 'Travel preference fetched successfully',
            data: preference,
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            status: _utils_1.HttpStatus.INTERNAL_ERROR,
            message: 'Failed to fetch travel preference',
            error,
        });
    }
};
exports.getTravelPreference = getTravelPreference;
