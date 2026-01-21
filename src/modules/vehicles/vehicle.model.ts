import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type VehicleType = 'sedan' | 'hatchback' | 'minibus';

export interface IVehicle extends Document {
  uuid: string;
  userId: string;
  licenseCountry: string;
  licenseNumber: string;
  brand?: string;
  vehicleModel?: string;
  type?: VehicleType;
  color?: string;
  year?: number;
  imageUrl?: string;
  deletedAt?: Date | null;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    uuid: { type: String, default: () => uuidv4(), unique: true },
    userId: { type: String, required: true, index: true },

    licenseCountry: { type: String, required: true },
    licenseNumber: { type: String, required: true },

    brand: String,
    vehicleModel: String,
    type: {
      type: String,
      enum: ['sedan', 'hatchback', 'minibus'],
    },
    color: String,
    year: Number,
    imageUrl: String,

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Automatically ignore soft-deleted records
vehicleSchema.index({ userId: 1, deletedAt: 1 });

export const VehicleModel = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
