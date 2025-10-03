import mongoose, { Schema, Document } from 'mongoose';
import { ITransaction, TransactionType, TransactionStatus, PaymentMethodType } from '@/types';

export interface TransactionDocument extends ITransaction, Document {
  _id: string;
}

const TransactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'RUB' },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true,
    },
    relatedTo: {
      type: { type: String, enum: ['lot', 'investment', 'fee'] },
      id: { type: String },
    },
    paymentMethod: {
      type: {
        type: String,
        enum: Object.values(PaymentMethodType),
        required: true,
      },
      details: { type: Schema.Types.Mixed },
    },
    metadata: { type: Schema.Types.Mixed },
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
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });
TransactionSchema.index({ amount: -1 });

// Удаляем существующую модель из кэша
if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

export const Transaction = mongoose.model<TransactionDocument>('Transaction', TransactionSchema);
