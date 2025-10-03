import mongoose, { Schema, Document } from 'mongoose';
import { IInvestment, InvestmentType, InvestmentStatus, RiskLevel } from '@/types';

export interface InvestmentDocument extends IInvestment, Document {
  _id: string;
}

const InvestorSchema = new Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
});

const InvestmentSchema = new Schema<InvestmentDocument>(
  {
    investorId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(InvestmentType),
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 200, trim: true },
    description: { type: String, required: true, maxlength: 2000, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, required: true, default: 'RUB' },
    terms: {
      duration: { type: Number, required: true, min: 1 }, // months
      expectedROI: { type: Number, required: true, min: 0 }, // percentage
      minimumInvestment: { type: Number, required: true, min: 0 },
      riskLevel: {
        type: String,
        enum: Object.values(RiskLevel),
        required: true,
      },
    },
    status: {
      type: String,
      enum: Object.values(InvestmentStatus),
      default: InvestmentStatus.FUNDRAISING,
      index: true,
    },
    investors: [InvestorSchema],
    documents: [String],
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

// Индексы
InvestmentSchema.index({ investorId: 1, createdAt: -1 });
InvestmentSchema.index({ type: 1, status: 1 });
InvestmentSchema.index({ 'terms.riskLevel': 1 });
InvestmentSchema.index({ targetAmount: -1 });

// Удаляем существующую модель из кэша
if (mongoose.models.Investment) {
  delete mongoose.models.Investment;
}

export const Investment = mongoose.model<InvestmentDocument>('Investment', InvestmentSchema);
