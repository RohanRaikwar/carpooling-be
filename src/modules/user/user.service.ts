import * as Models from '@models';
import * as enums from './user.constants';

export const getMeService = async (userId: string) => {
  try {
    const user = await Models.UserModel.findOne({ uuid: userId }).select('-password');
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
    const user = await Models.UserModel.findOne({ uuid: userId });
    if (!user) {
      return { success: false, user: null, reason: 'User not found' };
    }

    if (user.onboardingStatus === enums.OnboardingStatus.COMPLETED) {
      return { success: false, reason: 'Onboarding already completed' };
    }

    user.name = data.name;
    user.salutation = data.salutation;
    user.dob = new Date(data.dob);
    user.onboardingStatus = enums.OnboardingStatus.COMPLETED;

    await user.save();
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
      const exists = await Models.UserModel.findOne({
        username,
        uuid: { $ne: userId },
      });

      if (exists) {
        return { success: false, reason: 'USERNAME_EXISTS' };
      }
    }

    const updatedUser = await Models.UserModel.findOneAndUpdate({ uuid: userId }, payload, {
      new: true,
      runValidators: true,
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
