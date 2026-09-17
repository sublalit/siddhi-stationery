import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPrintingRequest extends Document {
  customerName: string;
  customerContact: string;
  serviceType: 'Business Cards' | 'Letterheads' | 'Custom Stamps' | 'Brochures' | 'Banners';
  quantity: number;
  paperGsm?: string;
  printSides?: string; // Single-Sided, Double-Sided
  finishType?: string; // Matte, Glossy, Laminated
  estimatedCost: number;
  status: 'Pending' | 'In Production' | 'Ready' | 'Delivered';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrintingRequestSchema = new Schema<IPrintingRequest>(
  {
    customerName: { type: String, required: true },
    customerContact: { type: String, required: true },
    serviceType: {
      type: String,
      enum: ['Business Cards', 'Letterheads', 'Custom Stamps', 'Brochures', 'Banners'],
      required: true,
    },
    quantity: { type: Number, required: true },
    paperGsm: { type: String },
    printSides: { type: String },
    finishType: { type: String },
    estimatedCost: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'In Production', 'Ready', 'Delivered'],
      default: 'Pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const PrintingRequest: Model<IPrintingRequest> =
  mongoose.models.PrintingRequest || mongoose.model<IPrintingRequest>('PrintingRequest', PrintingRequestSchema);

export default PrintingRequest;
