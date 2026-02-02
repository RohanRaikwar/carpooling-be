import { Schema, model, Document } from 'mongoose';
import { Chattiness, PetsPreference } from '../modules/travel-preferences/travelPreference.types.js';
import { v4 as uuidv4 } from 'uuid';

export interface TravelPreferenceDocument extends Document {
  uuid: string;
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
    uuid: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
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
