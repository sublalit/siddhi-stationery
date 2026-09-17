'use server';

import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import InventoryLog from '@/models/InventoryLog';
import { revalidatePath } from 'next/cache';

export async function getInvoices(status?: string) {
  await dbConnect();

  const query: any = {};
  if (status && status !== 'All') {
    query.paymentStatus = status;
  }

  const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(invoices));
}

export async function createInvoice(data: any) {
  await dbConnect();

  const count = await Invoice.countDocuments();
  const invoiceNumber = `INV-2026-${String(count + 1).padStart(3, '0')}`;

  const newInvoice = await Invoice.create({
    invoiceNumber,
    customer: {
      name: data.customer.name,
      phone: data.customer.phone || '',
      email: data.customer.email || '',
      address: data.customer.address || '',
      gstin: data.customer.gstin || '',
    },
    items: data.items,
    subtotal: data.subtotal,
    gstAmount: data.gstAmount,
    discountTotal: data.discountTotal,
    grandTotal: data.grandTotal,
    paymentStatus: data.paymentStatus || 'Paid',
    paymentMethod: data.paymentMethod || 'Cash',
    notes: data.notes || '',
  });

  // Automatically deduct stock and log Inventory Activity
  for (const item of data.items) {
    if (item.product) {
      const product = await Product.findById(item.product);
      if (product) {
        product.currentStock = Math.max(0, product.currentStock - item.quantity);
        await product.save();

        await InventoryLog.create({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          type: 'Stock Out',
          quantity: item.quantity,
          reason: `Sale #${invoiceNumber}`,
          performedBy: 'Admin User',
        });
      }
    }
  }

  revalidatePath('/invoices');
  revalidatePath('/products');
  revalidatePath('/');

  return JSON.parse(JSON.stringify(newInvoice));
}

export async function updateInvoiceStatus(id: string, status: string) {
  await dbConnect();

  const updated = await Invoice.findByIdAndUpdate(
    id,
    { paymentStatus: status },
    { new: true }
  );

  revalidatePath('/invoices');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(updated));
}
