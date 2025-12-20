import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import logger from '../utils/logger';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRY = '1y';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export const generateTokens = async (user: IUser) => {
  const accessToken = jwt.sign({ id: user.uuid, role: 'User' }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ id: user.uuid }, REFRESH_TOKEN_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await RefreshToken.create({
    userId: user.uuid,
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const sendOTP = async (identifier: string, otp: string, method: 'email' | 'phone') => {
  // Mock sending OTP
  logger.info(`[MOCK] Sending OTP ${otp} to ${identifier} via ${method}`);
  // In a real app, integrate with Twilio/SendGrid here
};
