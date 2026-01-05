import mongoose, { Document } from 'mongoose';

export interface OTPDocument extends Document {
  email: string;
  otp: string;
  purpose: 'signup' | 'login' | 'reset_password';
  verified: boolean;
  expiresAt: Date;

  resendCount: number;
  attempts: number;

  lastSentAt: Date;
}

const OTPSchema = new mongoose.Schema<OTPDocument>(
  {
    email: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    otp: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 6, // allows flexibility (4–6 digits)
    },

    purpose: {
      type: String,
      enum: ['signup', 'login', 'reset_password'],
      required: true,
      index: true,
    },

    verified: {
      type: Boolean,
      default: false,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true, // TTL index applied below
    },

    // --- Rate-limit helpers ---

    resendCount: {
      type: Number,
      default: 0,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

/**
 * TTL auto-delete after expiresAt
 */
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Ensure only ONE active OTP per user per purpose
 * (new OTP overwrites old one)
 */
OTPSchema.index({ email: 1, purpose: 1, verified: 1 }, { unique: false });

export default mongoose.model<OTPDocument>('OTP', OTPSchema);
