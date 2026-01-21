"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTravelPreference = exports.saveTravelPreference = void 0;
const travelPreference_model_1 = require("./travelPreference.model");
const saveTravelPreference = async (req, res, next) => {
    try {
        const userId = req.user.id; // assuming Auth middleware
        const { chattiness, pets } = req.body;
        const preference = await travelPreference_model_1.TravelPreference.findOneAndUpdate({ userId }, { chattiness, pets }, { upsert: true, new: true });
        res.status(200).json({
            success: true,
            message: 'Travel preference saved successfully',
            data: preference,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.saveTravelPreference = saveTravelPreference;
const getTravelPreference = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const preference = await travelPreference_model_1.TravelPreference.findOne({ userId });
        if (!preference) {
            return res.status(404).json({
                success: false,
                message: 'Travel preference not found',
            });
        }
        res.json({ success: true, data: preference });
    }
    catch (error) {
        next(error);
    }
};
exports.getTravelPreference = getTravelPreference;
