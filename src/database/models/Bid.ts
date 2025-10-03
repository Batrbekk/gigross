import mongoose, { Schema, Document } from 'mongoose';
import { IBid, BidStatus } from '@/types';

export interface BidDocument extends IBid, Document {
  _id: string;
}

const BidSchema = new Schema<BidDocument>(
  {
    lotId: { type: Schema.Types.ObjectId as any, ref: 'Lot', required: true, index: true },
    bidderId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'RUB' },
    message: { type: String, maxlength: 500, trim: true },
    status: {
      type: String,
      enum: Object.values(BidStatus),
      default: BidStatus.ACTIVE,
      index: true,
    },
    automaticBid: {
      maxAmount: { type: Number, min: 0 },
      increment: { type: Number, min: 0 },
    },
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
BidSchema.index({ lotId: 1, createdAt: -1 });
BidSchema.index({ bidderId: 1, createdAt: -1 });
BidSchema.index({ amount: -1 });
BidSchema.index({ status: 1, createdAt: -1 });

// Удаляем существующую модель из кэша
if (mongoose.models.Bid) {
  delete mongoose.models.Bid;
}

export const Bid = mongoose.model<BidDocument>('Bid', BidSchema);
