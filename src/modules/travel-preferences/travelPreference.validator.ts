import { z } from 'zod';
import { Chattiness, PetsPreference } from './travelPreference.types.js';

export const travelPreferenceSchema = z.object({
  chattiness: z.nativeEnum(Chattiness).describe('Chattiness is required'),
  pets: z.nativeEnum(PetsPreference).describe('Pets preference is required'),
});
