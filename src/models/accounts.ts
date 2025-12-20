import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AccountType, AccountStatus } from '../constants/enums';

const AccountSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },

    accountType: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
    },

    referenceUuid: {
      type: String,
      required: true,
      index: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
);

export const AccountModel = mongoose.model('Account', AccountSchema);
