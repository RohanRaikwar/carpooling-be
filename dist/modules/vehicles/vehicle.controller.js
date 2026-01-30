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
const _utils_1 = require("@utils");
/* ================= CREATE VEHICLE ================= */
const createVehicle = async (req, res, next) => {
    try {
        const { licenseCountry, licenseNumber } = req.body;
        const vehicle = await VehicleService.createVehicle(req.user.id, licenseCountry, licenseNumber);
        return (0, _utils_1.sendSuccess)(res, {
            status: _utils_1.HttpStatus.CREATED,
            message: 'Vehicle created successfully',
            data: { vehicleId: vehicle.uuid },
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            status: _utils_1.HttpStatus.INTERNAL_ERROR,
            message: 'Failed to create vehicle',
            error,
        });
    }
};
exports.createVehicle = createVehicle;
/* ================= UPDATE BRAND & MODEL ================= */
const updateBrandModel = async (req, res) => {
    try {
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            brand: req.body.brand,
            model: req.body.model,
        });
        return (0, _utils_1.sendSuccess)(res, {
            message: 'Vehicle brand and model updated',
            data: { vehicleId: req.params.id },
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            message: 'Failed to update brand and model',
            error,
        });
    }
};
exports.updateBrandModel = updateBrandModel;
/* ================= UPDATE TYPE ================= */
const updateType = async (req, res) => {
    try {
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            type: req.body.type,
        });
        return (0, _utils_1.sendSuccess)(res, {
            message: 'Vehicle type updated',
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            message: 'Failed to update vehicle type',
            error,
        });
    }
};
exports.updateType = updateType;
/* ================= UPDATE COLOR ================= */
const updateColor = async (req, res) => {
    try {
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            color: req.body.color,
        });
        return (0, _utils_1.sendSuccess)(res, {
            message: 'Vehicle color updated',
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            message: 'Failed to update vehicle color',
            error,
        });
    }
};
exports.updateColor = updateColor;
/* ================= UPDATE YEAR ================= */
const updateYear = async (req, res) => {
    try {
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            year: req.body.year,
        });
        return (0, _utils_1.sendSuccess)(res, {
            message: 'Vehicle year updated',
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            message: 'Failed to update vehicle year',
            error,
        });
    }
};
exports.updateYear = updateYear;
/* ================= UPLOAD IMAGE ================= */
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.BAD_REQUEST,
                message: 'Image file required',
            });
        }
        const imageUrl = req.file.location || req.file.path;
        await VehicleService.updateVehicle(req.user.id, req.params.id, {
            imageUrl,
        });
        return (0, _utils_1.sendSuccess)(res, {
            message: 'Vehicle image uploaded successfully',
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            message: 'Failed to upload vehicle image',
            error,
        });
    }
};
exports.uploadImage = uploadImage;
/* ================= GET VEHICLE ================= */
const getVehicle = async (req, res) => {
    try {
        const vehicle = await VehicleService.getVehicle(req.user.id, req.params.id);
        if (!vehicle) {
            return (0, _utils_1.sendError)(res, {
                status: _utils_1.HttpStatus.NOT_FOUND,
                message: 'Vehicle not found',
            });
        }
        return (0, _utils_1.sendSuccess)(res, {
            message: 'Vehicle fetched successfully',
            data: vehicle,
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            message: 'Failed to fetch vehicle',
            error,
        });
    }
};
exports.getVehicle = getVehicle;
/* ================= DELETE VEHICLE ================= */
const deleteVehicle = async (req, res) => {
    try {
        await VehicleService.deleteVehicle(req.user.id, req.params.id);
        return (0, _utils_1.sendSuccess)(res, {
            message: 'Vehicle deleted successfully',
        });
    }
    catch (error) {
        return (0, _utils_1.sendError)(res, {
            message: 'Failed to delete vehicle',
            error,
        });
    }
};
exports.deleteVehicle = deleteVehicle;
