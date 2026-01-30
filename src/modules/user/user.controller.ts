import { Response } from 'express';
import { AuthRequest } from '../../types/auth';
import { HttpStatus, sendSuccess, sendError } from '@utils';

import { getMeService, completeOnBoardingStep1Service, updateProfileService } from './user.service';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const { success, user, reason } = await getMeService(req.user.id);

    if (!success) {
      return sendError(res, {
        status: HttpStatus.NOT_FOUND,
        message: reason || 'User not found',
      });
    }

    return sendSuccess(res, {
      status: HttpStatus.OK,
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    console.error('getMe controller error:', error);
    return sendError(res, {
      status: HttpStatus.INTERNAL_ERROR,
      message: 'Server error',
      error,
    });
  }
};

export const completeOnBoardingStep1 = async (req: AuthRequest, res: Response) => {
  try {
    const { success, user, reason } = await completeOnBoardingStep1Service(req.user.id, req.body);

    if (!success) {
      return sendError(res, {
        status: HttpStatus.BAD_REQUEST,
        message: reason || 'Unable to complete onboarding',
      });
    }

    return sendSuccess(res, {
      status: HttpStatus.OK,
      message: 'Onboarding completed successfully',
      data: {
        id: user!.uuid,
        name: user!.name,
        email: user!.email,
        role: 'USER',
      },
    });
  } catch (error) {
    console.error('completeOnBoardingStep1 controller error:', error);
    return sendError(res, {
      status: HttpStatus.INTERNAL_ERROR,
      message: 'Server error',
      error,
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { success, user, reason } = await updateProfileService(req.user.id, req.body);

    if (!success) {
      const status = reason === 'USERNAME_EXISTS' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;

      return sendError(res, {
        status,
        message: reason || 'Unable to update profile',
      });
    }

    return sendSuccess(res, {
      status: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('updateProfile controller error:', error);
    return sendError(res, {
      status: HttpStatus.INTERNAL_ERROR,
      message: 'Server error',
      error,
    });
  }
};
