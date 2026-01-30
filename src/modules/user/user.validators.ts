import { z } from 'zod';
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

export const updateProfileSchemaOnBoarding = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),

  salutation: z.enum(['MR', 'MS', 'MRS', 'MX', 'OTHER']),

  dob: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date of birth must be a valid date'),
});
