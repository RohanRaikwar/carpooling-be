import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export enum OnboardingStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export interface IUser {
  uuid: string;
  name?: string;
  nickName?: string;
  dob?: Date;
  email?: string;
  phone?: string;
  salutation?: 'MR' | 'MS' | 'MRS' | 'MX' | 'OTHER' | null;
  onboardingStatus: OnboardingStatus;
  isVerified: boolean;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    uuid: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
    },

    salutation: {
      type: String,
      enum: ['MR', 'MS', 'MRS', 'MX', 'OTHER'],
      default: null,
    },
    dob: {
      type: Date,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows multiple nulls
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows multiple nulls
    },

    onboardingStatus: {
      type: String,
      enum: Object.values(OnboardingStatus),
      default: OnboardingStatus.PENDING,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// No pre-save validation needed since both email and phone are optional

export const UserModel = mongoose.model<IUser>('User', UserSchema);
