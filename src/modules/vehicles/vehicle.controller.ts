import { Request, Response, NextFunction } from 'express';
import * as VehicleService from './vehicle.service';
import { AuthRequest } from '../../middleware/authMiddleware';
/* ================= CREATE VEHICLE ================= */
export const createVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { licenseCountry, licenseNumber } = req.body;

    const vehicle = await VehicleService.createVehicle(req.user.id, licenseCountry, licenseNumber);

    res.status(201).json({
      success: true,
      data: { vehicleId: vehicle.uuid },
    });
  } catch (err) {
    next(err);
  }
};

/* ================= UPDATE BRAND & MODEL ================= */
export const updateBrandModel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await VehicleService.updateVehicle(req.user.id, req.params.id, {
      brand: req.body.brand,
      model: req.body.model,
    });

    res.json({ success: true, vehicleId: req.params.id });
  } catch (err) {
    next(err);
  }
};

/* ================= UPDATE TYPE ================= */
export const updateType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await VehicleService.updateVehicle(req.user.id, req.params.id, {
      type: req.body.type,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ================= UPDATE COLOR ================= */
export const updateColor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await VehicleService.updateVehicle(req.user.id, req.params.id, {
      color: req.body.color,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ================= UPDATE YEAR ================= */
export const updateYear = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await VehicleService.updateVehicle(req.user.id, req.params.id, {
      year: req.body.year,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ================= UPLOAD IMAGE ================= */
export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file required',
      });
    }

    const imageUrl = (req.file as any).location || req.file.path;

    await VehicleService.updateVehicle(req.user.id, req.params.id, {
      imageUrl,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ================= GET VEHICLE ================= */
export const getVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
  } catch (err) {
    next(err);
  }
};

/* ================= DELETE VEHICLE (SOFT DELETE) ================= */
export const deleteVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await VehicleService.deleteVehicle(req.user.id, req.params.id);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
