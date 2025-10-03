import mongoose, { Schema, Document } from 'mongoose';
import { ICertificate, CertificateStatus } from '@/types';

export interface CertificateDocument extends ICertificate, Document {
  _id: string;
}

const CertificateSchema = new Schema<CertificateDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 200, trim: true },
    issuedBy: { type: String, required: true, maxlength: 200, trim: true },
    certificateNumber: { type: String, required: true, maxlength: 100, trim: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(CertificateStatus),
      default: CertificateStatus.PENDING,
      index: true,
    },
    documents: {
      original: { type: String, required: true },
      thumbnail: { type: String },
    },
    verificationNotes: { type: String, maxlength: 1000, trim: true },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret._id = (ret._id as any).toString();
        return ret;
      },
    },
  }
);

// Валидация дат
CertificateSchema.pre('save', function (next) {
  const certificate = this as any;
  if (certificate.expiryDate <= certificate.issueDate) {
    next(new Error('Expiry date must be after issue date'));
  } else {
    next();
  }
});

// Индексы
CertificateSchema.index({ userId: 1, status: 1 });
CertificateSchema.index({ status: 1, expiryDate: 1 });
CertificateSchema.index({ certificateNumber: 1 });
CertificateSchema.index({ expiryDate: 1 });

// Удаляем существующую модель из кэша
if (mongoose.models.Certificate) {
  delete mongoose.models.Certificate;
}

export const Certificate = mongoose.model<CertificateDocument>('Certificate', CertificateSchema);
