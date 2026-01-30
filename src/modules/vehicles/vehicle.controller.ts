import { Response, NextFunction } from 'express';
import * as VehicleService from './vehicle.service';
import { AuthRequest } from '@middlewares/authMiddleware';
import { sendSuccess, sendError, HttpStatus } from '@utils';

/* ================= CREATE VEHICLE ================= */
export const createVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { licenseCountry, licenseNumber } = req.body;

    const vehicle = await VehicleService.createVehicle(req.user.id, licenseCountry, licenseNumber);

    return sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Vehicle created successfully',
      data: { vehicleId: vehicle.uuid },
    });
  } catch (error) {
    return sendError(res, {
      status: HttpStatus.INTERNAL_ERROR,
      message: 'Failed to create vehicle',
      error,
    });
  }
};

/* ================= UPDATE BRAND & MODEL ================= */
export const updateBrandModel = async (req: AuthRequest, res: Response) => {
  try {
    await VehicleService.updateVehicle(req.user.id, req.params.id as string, {
      brand: req.body.brand,
      model: req.body.model,
    });

    return sendSuccess(res, {
      message: 'Vehicle brand and model updated',
      data: { vehicleId: req.params.id },
    });
  } catch (error) {
    return sendError(res, {
      message: 'Failed to update brand and model',
      error,
    });
  }
};

/* ================= UPDATE TYPE ================= */
export const updateType = async (req: AuthRequest, res: Response) => {
  try {
    await VehicleService.updateVehicle(req.user.id, req.params.id as string, {
      type: req.body.type,
    });

    return sendSuccess(res, {
      message: 'Vehicle type updated',
    });
  } catch (error) {
    return sendError(res, {
      message: 'Failed to update vehicle type',
      error,
    });
  }
};

/* ================= UPDATE COLOR ================= */
export const updateColor = async (req: AuthRequest, res: Response) => {
  try {
    await VehicleService.updateVehicle(req.user.id, req.params.id as string, {
      color: req.body.color,
    });

    return sendSuccess(res, {
      message: 'Vehicle color updated',
    });
  } catch (error) {
    return sendError(res, {
      message: 'Failed to update vehicle color',
      error,
    });
  }
};

/* ================= UPDATE YEAR ================= */
export const updateYear = async (req: AuthRequest, res: Response) => {
  try {
    await VehicleService.updateVehicle(req.user.id, req.params.id as string, {
      year: req.body.year,
    });

    return sendSuccess(res, {
      message: 'Vehicle year updated',
    });
  } catch (error) {
    return sendError(res, {
      message: 'Failed to update vehicle year',
      error,
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

    const imageUrl = (req.file as any).location || req.file.path;

    await VehicleService.updateVehicle(req.user.id, req.params.id as string, {
      imageUrl,
    });

    return sendSuccess(res, {
      message: 'Vehicle image uploaded successfully',
    });
  } catch (error) {
    return sendError(res, {
      message: 'Failed to upload vehicle image',
      error,
    });
  }
};

/* ================= GET VEHICLE ================= */
export const getVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await VehicleService.getVehicle(req.user.id, req.params.id as string);

    if (!vehicle) {
      return sendError(res, {
        status: HttpStatus.NOT_FOUND,
        message: 'Vehicle not found',
      });
    }

    return sendSuccess(res, {
      message: 'Vehicle fetched successfully',
      data: vehicle,
    });
  } catch (error) {
    return sendError(res, {
      message: 'Failed to fetch vehicle',
      error,
    });
  }
};

/* ================= DELETE VEHICLE ================= */
export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    await VehicleService.deleteVehicle(req.user.id, req.params.id as string);

    return sendSuccess(res, {
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    return sendError(res, {
      message: 'Failed to delete vehicle',
      error,
    });
  }
};
