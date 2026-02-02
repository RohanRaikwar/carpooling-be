import redis from '../../cache/redis.js';
import { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SEC } from './otp.constants';

const otpKey = (identifier: string, purpose: string, method: string) =>
  `otp:${purpose}:${identifier}:${method}`;

export const createOtp = async (
  identifier: string,
  purpose: 'signup' | 'login' | 'reset_password',
  method: string,
) => {
  const key = otpKey(identifier, purpose, method);

  const ttl = await redis.ttl(key);

  // Cooldown check
  if (ttl > OTP_EXPIRY_MINUTES * 60 - OTP_RESEND_COOLDOWN_SEC) {
    return { success: false, reason: 'cooldown', code: null };
  }

  // 🔢 4-digit OTP
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  await redis.set(key, JSON.stringify({ code, attempts: 0 }), 'EX', OTP_EXPIRY_MINUTES * 60);

  return { success: true, code, reason: null };
};

export const verifyOtp = async (
  identifier: string,
  purpose: 'signup' | 'login' | 'reset_password',
  code: string,
  method: string,
) => {
  const key = otpKey(identifier, purpose, method);
  const data = await redis.get(key);
  console.log(data);

  if (!data) return { success: false, reason: 'expired' };

  const parsed = JSON.parse(data);

  if (parsed.attempts >= OTP_MAX_ATTEMPTS) {
    await redis.del(key);
    return { success: false, reason: 'too_many_attempts' };
  }

  if (parsed.code !== code) {
    parsed.attempts += 1;
    await redis.set(key, JSON.stringify(parsed), 'KEEPTTL');
    return { success: false, reason: 'invalid_otp' };
  }

  await redis.del(key);
  return { success: true };
};

export const resendOtp = async (
  identifier: string,
  purpose: 'signup' | 'login' | 'reset_password',
  method: string,
) => {
  const key = otpKey(identifier, purpose, method);
  const ttl = await redis.ttl(key);

  // No OTP exists → create fresh
  if (ttl <= 0) {
    const otp = await createOtp(identifier, purpose, method);
    return { success: true, otp, reused: false };
  }

  // Cooldown still active
  if (ttl > OTP_EXPIRY_MINUTES * 60 - OTP_RESEND_COOLDOWN_SEC) {
    return { success: false, reason: 'cooldown' };
  }

  // Reuse existing OTP
  const data = await redis.get(key);
  if (!data) {
    const otp = await createOtp(identifier, purpose, method);
    return { success: true, otp, reused: false };
  }

  const parsed = JSON.parse(data);

  return {
    success: true,
    otp: parsed.code,
    reused: true,
  };
};
