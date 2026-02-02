import { Response } from 'express';
import * as VehicleService from './vehicle.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';
import { sendSuccess, sendError, HttpStatus } from '../../utils/index.js';
import { uploadToS3 } from '../../services/s3.service.js';
import { getCache, setCache, deleteCache, cacheKeys } from '../../services/cache.service.js';

/* ================= CREATE VEHICLE ================= */
export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { licenseCountry, licenseNumber } = req.body;

    const vehicle = await VehicleService.createVehicle(req.user.id, licenseCountry, licenseNumber);

    // Invalidate user vehicles list cache
    await deleteCache(cacheKeys.userVehicles(req.user.id));

    return sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Vehicle created successfully',
      data: { vehicleId: vehicle.id },
    });
  } catch (error: any) {
    return sendError(res, {
      status:
        error.message === 'MAX_VEHICLE_LIMIT_REACHED'
          ? HttpStatus.CONFLICT
          : HttpStatus.INTERNAL_ERROR,
      message:
        error.message === 'MAX_VEHICLE_LIMIT_REACHED'
          ? 'Maximum vehicle limit reached'
          : 'Failed to create vehicle',
    });
  }
};

/* ================= UPDATE VEHICLE DETAILS ================= */
export const updateVehicleDetails = async (req: AuthRequest, res: Response) => {
  try {
    const vehicleId = req.params.id as string;

    await VehicleService.updateVehicleDetailService(req.user.id, vehicleId, {
      brand: req.body.brand,
      model_num: req.body.model_num,
      type: req.body.type,
      color: req.body.color,
      year: req.body.year,
    });

    // Invalidate vehicle cache after update
    await deleteCache(cacheKeys.vehicle(vehicleId));

    return sendSuccess(res, {
      message: 'Vehicle details updated successfully',
    });
  } catch (error: any) {
    return sendError(res, {
      status:
        error.message === 'VEHICLE_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_ERROR,
      message:
        error.message === 'VEHICLE_NOT_FOUND' ? 'Vehicle not found' : 'Failed to update vehicle',
    });
  }
};

/* ================= UPLOAD IMAGE ================= */
export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, {
        status: HttpStatus.BAD_REQUEST,
        message: 'Image file required',
      });
    }

    const vehicleId = req.params.id as string;
    const uploadResult = await uploadToS3({ folder: 'vehicle', file: req.file });

    if (!uploadResult.success) {
      return sendError(res, {
        status: HttpStatus.INTERNAL_ERROR,
        message: 'Failed to upload image',
      });
    }

    const imageUrl = uploadResult.url;

    const data = await VehicleService.updateVehicle(req.user.id, vehicleId, {
      imageUrl,
    });

    if (!data.success) {
      return sendError(res, {
        status: HttpStatus.NOT_FOUND,
        message: data.message,
      });
    }

    // Invalidate vehicle cache after update
    await deleteCache(cacheKeys.vehicle(vehicleId));

    return sendSuccess(res, {
      message: 'Vehicle image uploaded successfully',
      data
    });
  } catch (error) {
    return sendError(res, {
      message: 'Failed to upload vehicle image',
    });
  }
};

/* ================= GET VEHICLE ================= */
export const getVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const vehicleId = req.params.id as string;
    const cacheKey = cacheKeys.vehicle(vehicleId);

    // Try cache first
    const cachedVehicle = await getCache(cacheKey);
    if (cachedVehicle) {
      return sendSuccess(res, {
        message: 'Vehicle fetched successfully',
        data: cachedVehicle,
      });
    }

    // Cache miss - fetch from DB
    const vehicle = await VehicleService.getVehicle(req.user.id, vehicleId);

    // Cache the result
    await setCache(cacheKey, vehicle);

    return sendSuccess(res, {
      message: 'Vehicle fetched successfully',
      data: vehicle,
    });
  } catch (error: any) {
    return sendError(res, {
      status:
        error.message === 'VEHICLE_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_ERROR,
      message:
        error.message === 'VEHICLE_NOT_FOUND' ? 'Vehicle not found' : 'Failed to fetch vehicle',
    });
  }
};

/* ================= DELETE VEHICLE ================= */
export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const vehicleId = req.params.id as string;

    await VehicleService.deleteVehicle(req.user.id, vehicleId);

    // Invalidate vehicle cache after delete
    await deleteCache(cacheKeys.vehicle(vehicleId));
    await deleteCache(cacheKeys.userVehicles(req.user.id));

    return sendSuccess(res, {
      message: 'Vehicle deleted successfully',
    });
  } catch (error: any) {
    return sendError(res, {
      status:
        error.message === 'VEHICLE_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_ERROR,
      message:
        error.message === 'VEHICLE_NOT_FOUND' ? 'Vehicle not found' : 'Failed to delete vehicle',
    });
  }
};

