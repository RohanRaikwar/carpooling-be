import { Schema, model, Document } from 'mongoose';
import { Chattiness, PetsPreference } from './travelPreference.types';

export interface TravelPreferenceDocument extends Document {
  userId: string;
  chattiness: Chattiness;
  pets: PetsPreference;
}

const TravelPreferenceSchema = new Schema<TravelPreferenceDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    chattiness: {
      type: String,
      enum: Object.values(Chattiness),
      required: true,
    },
    pets: {
      type: String,
      enum: Object.values(PetsPreference),
      required: true,
    },
  },
  { timestamps: true },
);

export const TravelPreference = model<TravelPreferenceDocument>(
  'TravelPreference',
  TravelPreferenceSchema,
);
