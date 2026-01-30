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
export const updateProfileSchemaOnBoarding = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),

  salutation: z.enum(['MR', 'MS', 'MRS', 'MX', 'OTHER']),

  dob: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date of birth must be a valid date'),
});
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

export const updateProfileSchema = z.object({
  bio: z.string().max(150).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dob: z.string().datetime().optional(), // ISO string
  preferences: z
    .object({
      smoking: z.boolean().optional(),
      pets: z.boolean().optional(),
      music: z.boolean().optional(),
    })
    .optional(),
});
