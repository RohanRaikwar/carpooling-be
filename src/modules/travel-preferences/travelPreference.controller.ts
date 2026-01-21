import { Request, Response, NextFunction } from 'express';
import { TravelPreference } from './travelPreference.model';
import { AuthRequest } from '../../middleware/authMiddleware';

export const saveTravelPreference = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id; // assuming Auth middleware
    const { chattiness, pets } = req.body;

    const preference = await TravelPreference.findOneAndUpdate(
      { userId },
      { chattiness, pets },
      { upsert: true, new: true },
    );

    res.status(200).json({
      success: true,
      message: 'Travel preference saved successfully',
      data: preference,
    });
  } catch (error) {
    next(error);
  }
};

export const getTravelPreference = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const preference = await TravelPreference.findOne({ userId });

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: 'Travel preference not found',
      });
    }

    res.json({ success: true, data: preference });
  } catch (error) {
    next(error);
  }
};
