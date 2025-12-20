import OTP from '../models/otp.model';
import { generateOTP } from '../utils/generateOtp';

export const createOTP = async (email: string) => {
  const otp = generateOTP();

  await OTP.deleteMany({ email }); // remove old OTPs

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await OTP.create({
    email,
    otp,
    expiresAt,
  });

  return otp;
};
export const generateLocalOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const verifyOTP = async (email: string, otp: string) => {
  const record = await OTP.findOne({
    email,
    otp,
    verified: false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return false;

  record.verified = true;
  await record.save();

  return true;
};
