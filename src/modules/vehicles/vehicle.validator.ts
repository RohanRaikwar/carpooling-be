import { z } from 'zod';

export const createVehicleSchema = z.object({
  licenseCountry: z.string().min(1),
  licenseNumber: z.string().min(1),
});

export const updateBrandModelSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
});

export const updateTypeSchema = z.object({
  type: z.enum(['sedan', 'hatchback', 'minibus']),
});

export const updateColorSchema = z.object({
  color: z.string().min(1),
});

export const updateYearSchema = z.object({
  year: z.number().min(1990).max(new Date().getFullYear()),
});

export const imageUploadSchema = z.object({
  fieldname: z.literal('image'),
  mimetype: z.string().startsWith('image/', {
    message: 'Only image files are allowed',
  }),
  size: z.number().max(5 * 1024 * 1024, {
    message: 'Image must be less than 5MB',
  }),
  path: z.string(),
});
