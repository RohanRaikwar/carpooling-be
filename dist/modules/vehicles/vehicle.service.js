"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.getVehicle = exports.updateVehicle = exports.createVehicle = void 0;
const vehicle_model_1 = require("./vehicle.model");
const MAX_VEHICLES_PER_USER = 5;
const createVehicle = async (userId, licenseCountry, licenseNumber) => {
    const count = await vehicle_model_1.VehicleModel.countDocuments({
        userId,
        deletedAt: null,
    });
    if (count >= MAX_VEHICLES_PER_USER) {
        throw new Error('Maximum vehicle limit reached');
    }
    return vehicle_model_1.VehicleModel.create({
        userId,
        licenseCountry,
        licenseNumber,
    });
};
exports.createVehicle = createVehicle;
const updateVehicle = async (userId, vehicleId, update) => {
    const vehicle = await vehicle_model_1.VehicleModel.findOneAndUpdate({ uuid: vehicleId, userId, deletedAt: null }, update, { new: true });
    if (!vehicle)
        throw new Error('Vehicle not found');
    return vehicle;
};
exports.updateVehicle = updateVehicle;
const getVehicle = async (userId, vehicleId) => {
    const vehicle = await vehicle_model_1.VehicleModel.findOne({
        uuid: vehicleId,
        userId,
        deletedAt: null,
    }).lean();
    if (!vehicle)
        throw new Error('Vehicle not found');
    return vehicle;
};
exports.getVehicle = getVehicle;
const deleteVehicle = async (userId, vehicleId) => {
    const vehicle = await vehicle_model_1.VehicleModel.findOneAndUpdate({ uuid: vehicleId, userId, deletedAt: null }, { deletedAt: new Date() }, { new: true });
    if (!vehicle)
        throw new Error('Vehicle not found');
    return true;
};
exports.deleteVehicle = deleteVehicle;
