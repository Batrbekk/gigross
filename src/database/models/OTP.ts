import mongoose, { Schema, Document } from 'mongoose';

export interface OTPDocument extends Document {
  email: string;
  code: string;
  type: 'registration' | 'password-reset';
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}

const OTPSchema = new Schema<OTPDocument>(
  {
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true 
    },
    code: { 
      type: String, 
      required: true, 
      length: 6 
    },
    type: { 
      type: String, 
      enum: ['registration', 'password-reset'], 
      required: true 
    },
    verified: { 
      type: Boolean, 
      default: false 
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 минут
      expires: 0, // MongoDB автоматически удалит документ после истечения
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = (ret._id as any).toString();
        delete (ret as any)._id;
        delete (ret as any).__v;
        delete (ret as any).code; // Не возвращаем код в JSON
      },
    },
  }
);

// Индексы для оптимизации
OTPSchema.index({ email: 1, type: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Удаляем существующую модель из кэша
if (mongoose.models.OTP) {
  delete mongoose.models.OTP;
}

export const OTP = mongoose.model<OTPDocument>('OTP', OTPSchema);
