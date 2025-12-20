import mongoose, { Document } from 'mongoose';

export interface OTPDocument extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
}

const OTPSchema = new mongoose.Schema<OTPDocument>(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      length: 4,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model<OTPDocument>('OTP', OTPSchema);
