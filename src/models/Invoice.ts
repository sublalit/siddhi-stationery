import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoiceItem {
  product?: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
  };
  items: IInvoiceItem[];
  subtotal: number;
  gstAmount: number;
  discountTotal: number;
  grandTotal: number;
  paymentStatus: 'Draft' | 'Pending' | 'Paid' | 'Cancelled';
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Credit';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
});

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String },
      email: { type: String },
      address: { type: String },
      gstin: { type: String },
    },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['Draft', 'Pending', 'Paid', 'Cancelled'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Credit'],
      default: 'Cash',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;
