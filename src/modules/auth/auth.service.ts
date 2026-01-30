import * as models from '@models';
import { generateTokens, verifyRefreshToken } from '../token/tokens.service';
import { Role } from '@modules/user/user.constants';

export const signupService = async (method: string, identifier: string) => {
  let user = await models.UserModel.findOne({ [method]: identifier });
  console.log(user);

  if (user && user.isVerified) {
    return { success: false, reason: 'USER_EXISTS' };
  }

  if (!user) {
    user = await models.UserModel.create({
      [method]: identifier,
      onboardingStatus: 'PENDING',
      isVerified: false,
    });
  }

  return { success: true, user, reason: 'USER_CREATED' };
};

export const verifyOtpService = async (
  identifier: string,
  code: string,
  purpose: 'signup' | 'login' | 'reset_password',
  method: string,
) => {
  try {
    console.log('verifyOtpService started');
    const user = await models.UserModel.findOne({ [method]: identifier });

    if (!user) return { success: false, reason: 'USER_NOT_FOUND' };

    if (purpose === 'signup') {
      user.isVerified = true;
      await user.save();
    }

    if (purpose === 'login' && !user.isVerified) {
      return { success: false, reason: 'USER_NOT_VERIFIED' };
    }

    const tokens = await generateTokens({ id: user.uuid, role: Role.USER });
    const nextStep = user?.onboardingStatus === 'COMPLETED' ? 'home' : 'onboarding';

    console.log('verifyOtpService success');
    return { success: true, user, tokens, next: nextStep };
  } catch (error: any) {
    console.error('verifyOtpService error:', error);
    return { success: false, reason: error?.message || 'UNKNOWN_ERROR' };
  }
};

export const refreshTokenService = async (refreshToken: string) => {
  try {
    const decoded = await verifyRefreshToken(refreshToken);

    if (!decoded) {
      return { success: false, reason: 'INVALID_REFRESH' };
    }

    const tokenDoc = await models.RefreshToken.findOne({
      token: refreshToken,
      uuid: decoded.id,
      revoked: false,
    });

    if (!tokenDoc) {
      return { success: false, reason: 'INVALID_REFRESH' };
    }
    tokenDoc.revoked = true;
    await tokenDoc.save();

    // ❗ FIX: Use uuid, not _id
    const user = await models.UserModel.findOne({ uuid: decoded.id });

    if (!user) {
      return { success: false, reason: 'USER_NOT_FOUND' };
    }

    const tokens = await generateTokens({
      id: user.uuid,
      role: Role.USER,
    });

    return { success: true, tokens };
  } catch (error) {
    console.error('refreshTokenService error:', error);
    return {
      success: false,
      reason: 'INTERNAL_ERROR',
    };
  }
};

export const requestOtpService = async (
  identifier: string,
  purpose: 'signup' | 'login' | 'reset_password',
  method: string,
) => {
  const user = await models.UserModel.findOne({ [method]: identifier });

  if (purpose === 'signup' && user && user.isVerified) {
    return { success: false, reason: 'USER_EXISTS' };
  }

  if (purpose === 'login' && !user) {
    return { success: true, message: 'OTP sent if account exists' };
  }

  return { success: true, user };
};

export const logoutService = async (refreshToken: string) => {
  try {
    await models.RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    return { success: false, reason: 'LOGOUT_FAILED' };
  }
};

export const loginService = async (method: string, identifier: string) => {
  const user = await models.UserModel.findOne({ [method]: identifier });

  if (!user || !user.isVerified) {
    return { success: false, reason: 'USER_NOT_FOUND_OR_VERIFIED' };
  }

  return { success: true, user };
};
