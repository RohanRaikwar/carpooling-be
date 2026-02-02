import { Response, NextFunction } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../types/auth.js';
import { sendSuccess, sendError, HttpStatus } from '../../utils/index.js';

/**
 * Save or update travel preference
 */
export const saveTravelPreference = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { chattiness, pets } = req.body;

    const preference = await prisma.travelPreference.upsert({
      where: { userId },
      update: { chattiness, pets },
      create: { userId, chattiness, pets },
    });

    return sendSuccess(res, {
      status: HttpStatus.OK,
      message: 'Travel preference saved successfully',
      data: preference,
    });
  } catch (error) {
    return sendError(res, {
      status: HttpStatus.INTERNAL_ERROR,
      message: 'Failed to save travel preference',
      error,
    });
  }
};

/**
 * Get travel preference
 */
export const getTravelPreference = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const preference = await prisma.travelPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      return sendError(res, {
        status: HttpStatus.NOT_FOUND,
        message: 'Travel preference not found',
      });
    }

    return sendSuccess(res, {
      status: HttpStatus.OK,
      message: 'Travel preference fetched successfully',
      data: preference,
    });
  } catch (error) {
    return sendError(res, {
      status: HttpStatus.INTERNAL_ERROR,
      message: 'Failed to fetch travel preference',
      error,
    });
  }
};
