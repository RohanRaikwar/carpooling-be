"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.travelPreferenceSchema = void 0;
const zod_1 = require("zod");
const travelPreference_types_1 = require("./travelPreference.types");
exports.travelPreferenceSchema = zod_1.z.object({
    chattiness: zod_1.z.nativeEnum(travelPreference_types_1.Chattiness).describe('Chattiness is required'),
    pets: zod_1.z.nativeEnum(travelPreference_types_1.PetsPreference).describe('Pets preference is required'),
});
