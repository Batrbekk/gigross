import mongoose, { Schema, Document } from 'mongoose';
import { IShipment, ShipmentStatus, Address } from '@/types';

export interface ShipmentDocument extends IShipment, Document {
  _id: string;
}

const AddressSchema = new Schema<Address>({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  country: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
});

const TimelineEventSchema = new Schema({
  event: { type: String, required: true, trim: true },
  timestamp: { type: Date, required: true },
  location: { type: String, trim: true },
});

const ShipmentSchema = new Schema<ShipmentDocument>(
  {
    lotId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    trackingNumber: { type: String, required: true, unique: true, trim: true },
    carrier: { type: String, required: true, trim: true },
    origin: { type: AddressSchema, required: true },
    destination: { type: AddressSchema, required: true },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.PENDING,
      index: true,
    },
    timeline: [TimelineEventSchema],
    estimatedDelivery: { type: Date, required: true },
    actualDelivery: { type: Date },
    documents: {
      invoice: { type: String },
      bill_of_lading: { type: String },
      customs: { type: String },
    },
    iotData: {
      temperature: [Number],
      humidity: [Number],
      location: [[Number]],
      lastUpdate: { type: Date },
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
ShipmentSchema.index({ trackingNumber: 1 });
ShipmentSchema.index({ sellerId: 1, createdAt: -1 });
ShipmentSchema.index({ buyerId: 1, createdAt: -1 });
ShipmentSchema.index({ status: 1, estimatedDelivery: 1 });

// Удаляем существующую модель из кэша
if (mongoose.models.Shipment) {
  delete mongoose.models.Shipment;
}

export const Shipment = mongoose.model<ShipmentDocument>('Shipment', ShipmentSchema);
