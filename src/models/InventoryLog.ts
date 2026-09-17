import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInventoryLog extends Document {
  product: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  type: 'Stock In' | 'Stock Out' | 'Adjustment';
  quantity: number;
  remaining?: number;
  unitPrice?: number;
  supplier?: string;
  batch?: string;
  reason: string;
  referenceId?: string;
  performedBy: string;
  timestamp: Date;
}

const InventoryLogSchema = new Schema<IInventoryLog>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    type: { type: String, enum: ['Stock In', 'Stock Out', 'Adjustment'], required: true },
    quantity: { type: Number, required: true },
    remaining: { type: Number },
    unitPrice: { type: Number },
    supplier: { type: String, default: 'General Supplier' },
    batch: { type: String },
    reason: { type: String, required: true },
    referenceId: { type: String },
    performedBy: { type: String, default: 'Admin User' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const InventoryLog: Model<IInventoryLog> =
  mongoose.models.InventoryLog || mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);

export default InventoryLog;
