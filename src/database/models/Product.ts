import mongoose, { Schema, Document } from 'mongoose';
import { Product as IProduct, ProductStatus, CertificateStatus } from '@/types';

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const ProductSchema = new Schema<ProductDocument>(
  {
    producerId: {
      type: String,
      required: true,
    },
    name: {
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
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    originCountry: {
      type: String,
      required: true,
      trim: true,
    },
    certificationStatus: {
      type: String,
      enum: ['certified', 'haram', 'no-certificate'],
      required: true,
    },
    certificateIds: [{
      type: String,
      ref: 'Certificate',
    }],
    specifications: {
      volume: {
        type: Number,
        required: true,
        min: 0,
      },
      alcoholContent: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      ingredients: [{
        type: String,
        trim: true,
      }],
      nutritionFacts: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE,
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

// Индексы
ProductSchema.index({ producerId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ certificationStatus: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ createdAt: -1 });

export const Product =
  mongoose.models.Product || mongoose.model<ProductDocument>('Product', ProductSchema);
