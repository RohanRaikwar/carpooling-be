import { VehicleModel } from './vehicle.model';

const MAX_VEHICLES_PER_USER = 5;

export const createVehicle = async (
  userId: string,
  licenseCountry: string,
  licenseNumber: string,
) => {
  const count = await VehicleModel.countDocuments({
    userId,
    deletedAt: null,
  });

  if (count >= MAX_VEHICLES_PER_USER) {
    throw new Error('Maximum vehicle limit reached');
  }

  return VehicleModel.create({
    userId,
    licenseCountry,
    licenseNumber,
  });
};

export const updateVehicle = async (
  userId: string,
  vehicleId: string,
  update: Record<string, any>,
) => {
  const vehicle = await VehicleModel.findOneAndUpdate(
    { uuid: vehicleId, userId, deletedAt: null },
    update,
    { new: true },
  );

  if (!vehicle) throw new Error('Vehicle not found');

  return vehicle;
};

export const getVehicle = async (userId: string, vehicleId: string) => {
  const vehicle = await VehicleModel.findOne({
    uuid: vehicleId,
    userId,
    deletedAt: null,
  }).lean();

  if (!vehicle) throw new Error('Vehicle not found');

  return vehicle;
};

export const deleteVehicle = async (userId: string, vehicleId: string) => {
  const vehicle = await VehicleModel.findOneAndUpdate(
    { uuid: vehicleId, userId, deletedAt: null },
    { deletedAt: new Date() },
    { new: true },
  );

  if (!vehicle) throw new Error('Vehicle not found');

  return true;
};
