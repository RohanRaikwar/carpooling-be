import { z } from 'zod';

export const signupSchema = z
  .object({
    method: z.enum(['email', 'phone']),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'email' && !data.email) return false;
      if (data.method === 'phone' && !data.phone) return false;
      return true;
    },
    {
      message: 'Email is required for email method, Phone is required for phone method',
      path: ['method'],
    },
  );

export const otpRequestSchema = z.object({
  method: z.enum(['email', 'phone']),
  identifier: z.string(),
  purpose: z.enum(['signup', 'login', 'reset']),
});

export const otpVerifySchema = z.object({
  otpId: z.string().optional(),
  code: z.string().length(4),
  method: z.enum(['email', 'phone']),
  identifier: z.string(),
});

export const loginSchema = z.object({
  method: z.enum(['email', 'phone']),
  identifier: z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});
