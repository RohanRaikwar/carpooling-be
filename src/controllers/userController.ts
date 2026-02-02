import { Request, Response } from 'express';
import * as Models from '../models/index.js';
import { AuthRequest } from '../types/auth.js';
import * as enums from '../constants/enums.js';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await Models.UserModel.findOne({ uuid: req.user.id }).select('-password');
    if (user) {
      res.status(200).json({
        message: 'User fetched successfully',
        user: {
          id: user.uuid,
          email: user.email,
          name: user.name,
          role: 'USER',
          onboardingStatus: user.onboardingStatus,
          salutation: user.salutation,
          dob: user.dob,
        },
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeOnBoardingStep1 = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, salutation, dob } = req.body;
    console.log('user before update:', userId);
    const user = await Models.UserModel.findOne(
      { uuid: userId },
      { _id: 0, uuid: 1, email: 1, name: 1, salutation: 1, dob: 1, onboardingStatus: 1 },
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.onboardingStatus === enums.OnboardingStatus.COMPLETED) {
      return res.status(400).json({ message: 'Onboarding already completed' });
    }

    user.name = name;
    user.salutation = salutation;
    user.dob = new Date(dob);
    user.onboardingStatus = enums.OnboardingStatus.COMPLETED;
    await user.save();
    res.status(200).json({
      message: 'Onboarding completed successfully',
      user: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        role: 'USER',
        onboardingStatus: user.onboardingStatus,
      },
      next: 'home',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { bio, username, gender, dob, preferences } = req.body;
    const userId = req.user.id;

    // Check username uniqueness if updating
    if (username) {
      const existingUser = await Models.UserModel.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
      }
    }

    const updatedUser = await Models.UserModel.findByIdAndUpdate(
      userId,
      {
        bio,
        username,
        gender,
        dob,
        preferences,
      },
      { new: true, runValidators: true },
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
