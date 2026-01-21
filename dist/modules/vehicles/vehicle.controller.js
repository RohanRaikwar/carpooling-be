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
exports.deleteVehicle = exports.getVehicle = exports.uploadImage = exports.updateYear = exports.updateColor = exports.updateType = exports.updateBrandModel = exports.createVehicle = void 0;
const VehicleService = __importStar(require("./vehicle.service"));
/* ================= CREATE VEHICLE ================= */
const createVehicle = async (req, res, next) => {
    try {
        const { licenseCountry, licenseNumber } = req.body;
        const vehicle = await VehicleService.createVehicle(req.user.id, licenseCountry, licenseNumber);
        res.status(201).json({
            success: true,
            data: { vehicleId: vehicle.uuid },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createVehicle = createVehicle;
/* ================= UPDATE BRAND & MODEL ================= */
const updateBrandModel = async (req, res, next) => {
    try {
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            brand: req.body.brand,
            model: req.body.model,
        });
        res.json({ success: true, vehicleId: req.params.id });
    }
    catch (err) {
        next(err);
    }
};
exports.updateBrandModel = updateBrandModel;
/* ================= UPDATE TYPE ================= */
const updateType = async (req, res, next) => {
    try {
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            type: req.body.type,
        });
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
};
exports.updateType = updateType;
/* ================= UPDATE COLOR ================= */
const updateColor = async (req, res, next) => {
    try {
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            color: req.body.color,
        });
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
};
exports.updateColor = updateColor;
/* ================= UPDATE YEAR ================= */
const updateYear = async (req, res, next) => {
    try {
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            year: req.body.year,
        });
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
};
exports.updateYear = updateYear;
/* ================= UPLOAD IMAGE ================= */
const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image file required',
            });
        }
        const imageUrl = req.file.location || req.file.path;
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            imageUrl,
        });
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
};
exports.uploadImage = uploadImage;
/* ================= GET VEHICLE ================= */
const getVehicle = async (req, res, next) => {
    try {
        const vehicle = await VehicleService.getVehicle(req.user.id, req.params.id);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found',
            });
        }
        res.status(200).json({
            success: true,
            data: vehicle,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getVehicle = getVehicle;
/* ================= DELETE VEHICLE (SOFT DELETE) ================= */
const deleteVehicle = async (req, res, next) => {
    try {
        await VehicleService.deleteVehicle(req.user.id, req.params.id);
        res.json({
            success: true,
            message: 'Vehicle deleted successfully',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteVehicle = deleteVehicle;
