import mongoose, { Schema, Document } from 'mongoose';
import { Lot as ILot, LotStatus, AuctionType } from '@/types';

export interface LotDocument extends Omit<ILot, '_id'>, Document {}

const LotSchema = new Schema<LotDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    producerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'KZT',
      uppercase: true,
    },
    auction: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      type: {
        type: String,
        enum: Object.values(AuctionType),
        required: true,
      },
      minBidIncrement: { type: Number, min: 0 },
    },
    location: {
      city: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      street: { type: String, required: true, trim: true },
      house: { type: String, required: true, trim: true },
      coordinates: [Number],
    },
    status: {
      type: String,
      enum: Object.values(LotStatus),
      default: LotStatus.DRAFT,
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    bidsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        ret._id = ret._id.toString();
        return ret;
      },
    },
  }
);


// Валидация дат
LotSchema.pre('save', function (next) {
  const lot = this as any;
  if (lot.auction.endDate <= lot.auction.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

// Индексы
LotSchema.index({ status: 1, 'auction.endDate': 1 });
LotSchema.index({ producerId: 1 });
LotSchema.index({ productId: 1 });
LotSchema.index({ 'auction.type': 1 });
LotSchema.index({ 'location.city': 1, 'location.country': 1 });
LotSchema.index({ currentPrice: 1 });
LotSchema.index({ createdAt: -1 });
LotSchema.index({ title: 'text', description: 'text' });

// Удаляем существующую модель из кэша
if (mongoose.models.Lot) {
  delete mongoose.models.Lot;
}

export const Lot = mongoose.model<LotDocument>('Lot', LotSchema);
