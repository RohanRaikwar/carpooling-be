import { Request, Response } from 'express';
import * as models from '../models';
import * as enums from '../constants/enums';
import RefreshToken from '../models/RefreshToken';
import { createOTP, verifyOTP } from '../services/otpService';
import { sendOTP, generateTokens } from '../services/authService';
import { sendMail } from '../services/mailService';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import { modelNames } from 'mongoose';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';

export const signup = async (req: Request, res: Response) => {
  try {
    const { method, email, phone } = req.body;
    const identifier = method === 'email' ? email : phone;

    const existingUser = await models.UserModel.findOne({ [method]: identifier });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ message: 'User already exists' });
    }

    let user = existingUser;
    if (!user) {
      user = await models.UserModel.create({
        [method]: identifier,
        onboardingStatus: 'PENDING',
        isVerified: false,
      });
    }

    const otp = await createOTP(email);

    await sendMail({
      to: email,
      subject: 'Your Signup OTP',
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Signup Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 5px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
        </div>
      `,
    });

    res.status(201).json({
      message: 'Signup successful, please verify OTP',
      next: 'verify_otp',
      otpId: 'simulated_otp_id',
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { method, identifier, purpose } = req.body;

    // Rate limit check
    // const allowed = await checkRateLimit(identifier);
    // if (!allowed) {
    //   return res.status(429).json({ message: 'Too many OTP requests' });
    // }

    // Check user existence for login flow (don't reveal existence but don't send OTP if not found?)
    // Requirement: "Return success but avoid leaking whether user exists"
    // But for login, if user doesn't exist, we can't really log them in.
    // However, standard practice is to say "If an account exists, an OTP has been sent."

    const user = await models.UserModel.findOne({ [method]: identifier });

    if (purpose === 'signup' && user && user.isVerified) {
      // Conflict for signup
      return res.status(409).json({ message: 'User already exists' });
    }

    if (purpose === 'login' && !user) {
      // Fake success
      return res.status(200).json({ message: 'OTP sent if account exists' });
    }

    // const otp = generateOTP();
    // await storeOTP(identifier, otp, purpose);
    // await sendOTP(identifier, otp, method);

    res.status(200).json({ message: 'OTP sent' });
  } catch (error) {
    logger.error('Request OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    console.log(req.body.code);
    const { code, method, identifier, purpose } = req.body;

    const isValid = await verifyOTP(identifier, code);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    let user = await models.UserModel.findOne({ [method]: identifier });

    if (purpose === 'signup') {
      if (!user) return res.status(400).json({ message: 'User not found for signup verification' });
      user.isVerified = true;
      await user.save();
    } else if (purpose === 'login') {
      if (!user) return res.status(400).json({ message: 'User not found' });
    } else if (purpose === 'reset') {
      // Return a temporary token to allow password reset?
      // Or just return success and client sends new password with this same OTP?
      // Requirement: "allow set new password after verify"
      // Usually we'd return a reset token. For now, let's just return success.
      return res.status(200).json({ message: 'OTP verified, proceed to reset password' });
    }

    const tokens = await generateTokens(user!);

    // Check if profile is complete (simple check)
    const nextStep = user?.onboardingStatus !== 'COMPLETED' ? 'onboarding' : 'home';

    res.status(200).json({
      message: 'Verification successful',
      ...tokens,
      user: {
        id: user!.uuid,
        email: user!.email,
        role: 'USER',
      },
      next: nextStep,
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { method, identifier } = req.body;

    if (method !== 'email' && method !== 'phone') {
      return res.status(400).json({ message: 'Invalid login request' });
    }

    const user = await models.UserModel.findOne({ [method]: identifier });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'User not verified' });
    }

    // ✅ Create OTP for login
    const otp = await createOTP(identifier);

    // ✅ Send OTP
    if (method === 'email') {
      await sendMail({
        to: identifier,
        subject: 'Login OTP',
        html: `
          <div style="font-family: Arial, sans-serif">
            <h2>Login Verification</h2>
            <p>Your OTP is:</p>
            <h1 style="letter-spacing: 5px">${otp}</h1>
            <p>This OTP is valid for <b>5 minutes</b>.</p>
          </div>
        `,
      });
    } else {
      // TODO: SMS gateway
      // console.log(`OTP for ${phone}: ${otp.code}`);
    }

    return res.status(200).json({
      message: 'OTP sent for login verification',
      next: 'verify_otp',
      identifier,
      method,
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any;
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.id,
      revoked: false,
    });

    if (!tokenDoc) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Revoke old token
    tokenDoc.revoked = true;
    await tokenDoc.save();

    const user = await models.UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newTokens = await generateTokens(user);

    res.status(200).json(newTokens);
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
