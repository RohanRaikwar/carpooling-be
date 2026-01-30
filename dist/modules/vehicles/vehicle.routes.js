"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_1 = require("@middlewares/upload.middleware");
const validate_1 = require("@middlewares/validate");
const controller = __importStar(require("./vehicle.controller"));
const vehicle_validator_1 = require("./vehicle.validator");
const router = (0, express_1.Router)();
router.post('/', (0, validate_1.validate)({ body: vehicle_validator_1.createVehicleSchema }), controller.createVehicle);
router.put('/:id/brand-model', (0, validate_1.validate)({ body: vehicle_validator_1.updateBrandModelSchema }), controller.updateBrandModel);
router.put('/:id/type', (0, validate_1.validate)({ body: vehicle_validator_1.updateTypeSchema }), controller.updateType);
router.put('/:id/color', (0, validate_1.validate)({ body: vehicle_validator_1.updateColorSchema }), controller.updateColor);
router.put('/:id/year', (0, validate_1.validate)({ body: vehicle_validator_1.updateYearSchema }), controller.updateYear);
router.post('/:id/image', upload_middleware_1.uploadSingleImage, (0, validate_1.validate)({ file: vehicle_validator_1.imageUploadSchema }), controller.uploadImage);
router.get('/:id', controller.getVehicle);
router.delete('/:id', controller.deleteVehicle);
exports.default = router;
