"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelPreference = void 0;
const mongoose_1 = require("mongoose");
const travelPreference_types_1 = require("./travelPreference.types");
const TravelPreferenceSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    chattiness: {
        type: String,
        enum: Object.values(travelPreference_types_1.Chattiness),
        required: true,
    },
    pets: {
        type: String,
        enum: Object.values(travelPreference_types_1.PetsPreference),
        required: true,
    },
}, { timestamps: true });
exports.TravelPreference = (0, mongoose_1.model)('TravelPreference', TravelPreferenceSchema);
