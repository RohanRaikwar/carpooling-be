import { Request, Response } from 'express';
import * as models from '../models';
import * as enums from '../constants/enums';
import RefreshToken from '../models/refreshtoken.model';
import { createOTP, verifyOTP, resendOTPService } from '../services/otpService';
import { sendOTP, generateTokens } from '../services/authService';
import { sendMail } from '../services/mailService';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

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

    const otp = await createOTP(email, 'signup');

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
    const { code, method, identifier, purpose } = req.body;

    if (!code || !identifier || !purpose || !method) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await verifyOTP(
      identifier,
      code,
      purpose, // <-- now passed to service
    );

    if (!result.success) {
      switch (result.reason) {
        case 'too_many_attempts':
          return res.status(429).json({ message: 'Too many incorrect attempts' });

        case 'invalid_otp':
          return res.status(400).json({ message: 'Invalid OTP' });

        case 'not_found_or_expired':
        default:
          return res.status(410).json({ message: 'OTP expired or not found' });
      }
    }

    // OTP is valid — now continue flow
    let user = await models.UserModel.findOne({ [method]: identifier });

    /**
     * --- SIGNUP FLOW ---
     */
    if (purpose === 'signup') {
      if (!user) {
        return res.status(400).json({ message: 'User not found for signup verification' });
      }

      user.isVerified = true;
      await user.save();
    }

    /**
     * --- LOGIN FLOW ---
     */
    if (purpose === 'login') {
      if (!user) {
        // don't leak existence — but here user MUST exist to log in
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Generate login tokens after successful signup/login verification
    const tokens = await generateTokens(user!);

    const nextStep = user?.onboardingStatus !== 'COMPLETED' ? 'onboarding' : 'home';

    return res.status(200).json({
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
    logger.error('Verify OTP controller error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { method, identifier } = req.body;
    console.log('kbjv');

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
    const otp = await createOTP(identifier, 'login');

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
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { identifier, purpose, method } = req.body;

    if (!identifier || !purpose || !method) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await resendOTPService(identifier, purpose);

    if (!result.success) {
      switch (result.reason) {
        case 'cooldown':
          return res.status(429).json({
            message: 'Please wait before requesting another OTP',
          });

        case 'limit_reached':
          return res.status(429).json({
            message: 'Maximum resend limit reached',
          });
      }
    }
    if (method === 'email') {
      await sendMail({
        to: identifier,
        subject: 'Login OTP',
        html: `
          <div style="font-family: Arial, sans-serif">
            <h2>${purpose == 'login' ? 'Login' : 'Signup'} Verification</h2>
            <p>Your OTP is:</p>
            <h1 style="letter-spacing: 5px">${result.otp}</h1>
            <p>This OTP is valid for <b>5 minutes</b>.</p>
          </div>
        `,
      });
    }
    // TODO: send via email/SMS here
    // sendOTP(identifier, result.otp, method);

    return res.status(200).json({
      message: result.reused ? 'OTP resent' : 'New OTP generated',
    });
  } catch (err) {
    logger.error('Resend OTP error:', err);
    return res.status(500).json({ message: 'Server error' });
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
