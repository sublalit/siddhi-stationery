'use server';

import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import InventoryLog from '@/models/InventoryLog';
import { revalidatePath } from 'next/cache';
import { mockInvoices } from '@/lib/mockStore';

let memoryInvoices = [...mockInvoices];

export async function getInvoices(status?: string) {
  const conn = await dbConnect();

  if (!conn) {
    let result = [...memoryInvoices];
    if (status && status !== 'All') {
      result = result.filter((i) => i.paymentStatus === status);
    }
    return JSON.parse(JSON.stringify(result));
  }

  const query: any = {};
  if (status && status !== 'All') {
    query.paymentStatus = status;
  }

  try {
    const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(invoices));
  } catch (e) {
    return JSON.parse(JSON.stringify(memoryInvoices));
  }
}

export async function createInvoice(data: any) {
  const conn = await dbConnect();

  const count = memoryInvoices.length + 1;
  const invoiceNumber = `INV-2026-${String(count).padStart(3, '0')}`;

  if (!conn) {
    const newInv: any = {
      _id: `inv-${Date.now()}`,
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
      createdAt: new Date().toISOString(),
    };
    memoryInvoices.unshift(newInv);
    revalidatePath('/invoices');
    revalidatePath('/products');
    revalidatePath('/');
    return JSON.parse(JSON.stringify(newInv));
  }

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

  for (const item of data.items) {
    if (item.product) {
      const product = await Product.findById(item.product).catch(() => null);
      if (product) {
        product.currentStock = Math.max(0, product.currentStock - item.quantity);
        await product.save().catch(() => {});

        await InventoryLog.create({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          type: 'Stock Out',
          quantity: item.quantity,
          reason: `Sale #${invoiceNumber}`,
          performedBy: 'Admin User',
        }).catch(() => {});
      }
    }
  }

  revalidatePath('/invoices');
  revalidatePath('/products');
  revalidatePath('/');

  return JSON.parse(JSON.stringify(newInvoice));
}

export async function updateInvoiceStatus(id: string, status: string) {
  const conn = await dbConnect();

  if (!conn) {
    const inv = memoryInvoices.find((i) => i._id === id);
    if (inv) inv.paymentStatus = status as any;
    revalidatePath('/invoices');
    revalidatePath('/');
    return JSON.parse(JSON.stringify(inv || {}));
  }

  const updated = await Invoice.findByIdAndUpdate(
    id,
    { paymentStatus: status },
    { new: true }
  );

  revalidatePath('/invoices');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(updated));
}
