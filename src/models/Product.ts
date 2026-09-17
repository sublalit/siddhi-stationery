import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode?: string;
  category: mongoose.Types.ObjectId;
  currentStock: number;
  minStock: number;
  maxStock: number;
  sellingPrice: number;
  costPrice: number;
  unit: string;
  rackLocation?: string;
  vendor?: mongoose.Types.ObjectId;
  imageUrl?: string;
  description?: string;
  isCustomPrinting?: boolean;
  printingOptions?: {
    paperGsmOptions?: number[];
    printSides?: string[];
    finishTypes?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    barcode: { type: String, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    currentStock: { type: Number, required: true, default: 0 },
    minStock: { type: Number, default: 5 },
    maxStock: { type: Number, default: 500 },
    sellingPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    unit: { type: String, default: 'units' },
    rackLocation: { type: String, default: 'A1-B1-S1' },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    imageUrl: { type: String },
    description: { type: String },
    isCustomPrinting: { type: Boolean, default: false },
    printingOptions: {
      paperGsmOptions: [{ type: Number }],
      printSides: [{ type: String }],
      finishTypes: [{ type: String }],
    },
  },
  { timestamps: true }
);

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
