import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser, UserRole } from '@/types';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  coordinates: { type: [Number], validate: [arrayLimit, '{PATH} exceeds the limit of 2'] },
});

function arrayLimit(val: number[]) {
  return val.length === 2;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    profile: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      company: { type: String, trim: true },
      phone: { type: String, trim: true },
      avatar: { type: String },
      avatarKey: { type: String },
      address: AddressSchema,
    },
    verification: {
      email: { type: Boolean, default: false },
      identity: { type: Boolean, default: false },
      business: { type: Boolean, default: false },
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      language: { type: String, default: 'ru' },
      currency: { type: String, default: 'RUB' },
    },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        ret._id = ret._id.toString();
        delete ret.password;
        return ret;
      },
    },
  }
);

// Индексы
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ 'verification.email': 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
