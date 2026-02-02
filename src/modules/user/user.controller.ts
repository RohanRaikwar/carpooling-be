import { Response } from 'express';
import { AuthRequest } from '../../types/auth';
import { HttpStatus, sendSuccess, sendError } from '../../utils/index.js';
import { uploadToS3 } from '../../services/s3.service';
import { getCache, setCache, deleteCache, cacheKeys } from '../../services/cache.service';

import { getMeService, completeOnBoardingStep1Service, updateProfileService, updateAvatarService } from './user.service';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const cacheKey = cacheKeys.user(userId);

    // Try cache first
    const cachedUser = await getCache(cacheKey);
    if (cachedUser) {
      return sendSuccess(res, {
        status: HttpStatus.OK,
        message: 'User fetched successfully',
        data: cachedUser,
      });
    }

    // Cache miss - fetch from DB
    const { success, user, reason } = await getMeService(userId);

    if (!success) {
      return sendError(res, {
        status: HttpStatus.NOT_FOUND,
        message: reason || 'User not found',
      });
    }

    // Cache the result
    await setCache(cacheKey, user);

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
    const userId = req.user.id;
    const { success, user, reason } = await completeOnBoardingStep1Service(userId, req.body);

    if (!success) {
      return sendError(res, {
        status: HttpStatus.BAD_REQUEST,
        message: reason || 'Unable to complete onboarding',
      });
    }

    // Invalidate user cache after update
    await deleteCache(cacheKeys.user(userId));

    return sendSuccess(res, {
      status: HttpStatus.OK,
      message: 'Onboarding completed successfully',
      data: {
        id: user!.id,
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
    const userId = req.user.id;
    const { success, user, reason } = await updateProfileService(userId, req.body);

    if (!success) {
      const status = reason === 'USERNAME_EXISTS' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;

      return sendError(res, {
        status,
        message: reason || 'Unable to update profile',
      });
    }

    // Invalidate user cache after update
    await deleteCache(cacheKeys.user(userId));

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

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, {
        status: HttpStatus.BAD_REQUEST,
        message: 'Avatar image file required',
      });
    }

    // Upload to S3 using the reusable service
    const uploadResult = await uploadToS3({
      folder: 'avatar',
      file: req.file,
    });

    if (!uploadResult.success) {
      return sendError(res, {
        status: HttpStatus.INTERNAL_ERROR,
        message: uploadResult.error || 'Failed to upload avatar to S3',
      });
    }

    // Update user avatar URL in database
    const userId = req.user.id;
    const { success, user, reason } = await updateAvatarService(userId, uploadResult.url!);

    if (!success) {
      return sendError(res, {
        status: HttpStatus.BAD_REQUEST,
        message: reason || 'Unable to update avatar',
      });
    }

    // Invalidate user cache after update
    await deleteCache(cacheKeys.user(userId));

    return sendSuccess(res, {
      status: HttpStatus.OK,
      message: 'Avatar uploaded successfully',
      data: { avatarUrl: user?.avatarUrl },
    });
  } catch (error) {
    console.error('uploadAvatar controller error:', error);
    return sendError(res, {
      status: HttpStatus.INTERNAL_ERROR,
      message: 'Server error',
      error,
    });
  }
};

