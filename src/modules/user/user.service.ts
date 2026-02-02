import { prisma } from '../../config/index.js';
import * as enums from './user.constants.js';

export const getMeService = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nickName: true,
        salutation: true,
        dob: true,
        email: true,
        phone: true,
        avatarUrl: true,
        onboardingStatus: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return { success: false, user: null, reason: 'User not found' };
    }
    return { success: true, user };
  } catch (error) {
    console.error('getMeService error:', error);
    return { success: false, user: null, reason: 'Internal server error' };
  }
};

export const completeOnBoardingStep1Service = async (
  userId: string,
  data: { name: string; salutation: 'MS' | 'MR' | 'MRS' | 'MX' | 'OTHER'; dob: string },
) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, user: null, reason: 'User not found' };
    }

    if (existingUser.onboardingStatus === enums.OnboardingStatus.COMPLETED) {
      return { success: false, reason: 'Onboarding already completed' };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        salutation: data.salutation,
        dob: new Date(data.dob),
        onboardingStatus: 'COMPLETED',
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error('completeOnBoardingStep1Service error:', error);
    return { success: false, user: null, reason: 'Internal server error' };
  }
};

export const updateProfileService = async (userId: string, payload: any) => {
  try {
    const { username } = payload;

    if (username) {
      const exists = await prisma.user.findFirst({
        where: {
          nickName: username,
          NOT: { id: userId },
        },
      });

      if (exists) {
        return { success: false, reason: 'USERNAME_EXISTS' };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: payload,
    });

    if (!updatedUser) {
      return { success: false, reason: 'User not found' };
    }

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('updateProfileService error:', error);
    return { success: false, reason: 'Internal server error' };
  }
};

export const updateAvatarService = async (userId: string, avatarUrl: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, reason: 'User not found' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('updateAvatarService error:', error);
    return { success: false, reason: 'Internal server error' };
  }
};
