'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function formatInvoice(inv: any) {
  if (!inv) return null;
  return {
    ...inv,
    _id: inv.id,
    customer: {
      name: inv.customerName,
      phone: inv.customerPhone || '',
      email: inv.customerEmail || '',
      address: inv.customerAddress || '',
      gstin: inv.customerGstin || '',
    },
    items: (inv.items || []).map((item: any) => ({
      ...item,
      _id: item.id,
      product: item.productId,
    })),
  };
}

export async function getInvoices(status?: string) {
  try {
    const where: any = {};
    if (status && status !== 'All') {
      where.paymentStatus = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(formatInvoice);
  } catch (error: any) {
    console.error('getInvoices error:', error);
    return [];
  }
}

export async function createInvoice(data: any) {
  try {
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(3, '0')}`;

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName: data.customer.name,
        customerPhone: data.customer.phone || '',
        customerEmail: data.customer.email || '',
        customerAddress: data.customer.address || '',
        customerGstin: data.customer.gstin || '',
        subtotal: Number(data.subtotal) || 0,
        gstAmount: Number(data.gstAmount) || 0,
        discountTotal: Number(data.discountTotal) || 0,
        grandTotal: Number(data.grandTotal) || 0,
        paymentStatus: data.paymentStatus || 'Paid',
        paymentMethod: data.paymentMethod || 'Cash',
        notes: data.notes || '',
        items: {
          create: (data.items || []).map((item: any) => ({
            productId: item.product || null,
            productName: item.productName || 'Item',
            sku: item.sku || '',
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            discountPercent: Number(item.discountPercent) || 0,
            lineTotal: Number(item.lineTotal) || 0,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    for (const item of data.items || []) {
      if (item.product) {
        const product = await prisma.product
          .findUnique({ where: { id: item.product } })
          .catch(() => null);

        if (product) {
          const newStock = Math.max(0, product.currentStock - Number(item.quantity));
          await prisma.product
            .update({
              where: { id: product.id },
              data: { currentStock: newStock },
            })
            .catch(() => {});

          await prisma.inventoryLog
            .create({
              data: {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                type: 'Stock Out',
                quantity: Number(item.quantity),
                remaining: newStock,
                reason: `Sale #${invoiceNumber}`,
                performedBy: 'Admin User',
              },
            })
            .catch(() => {});
        }
      }
    }

    revalidatePath('/invoices');
    revalidatePath('/products');
    revalidatePath('/');

    return formatInvoice(newInvoice);
  } catch (error: any) {
    console.error('createInvoice error:', error);
    throw error;
  }
}

export async function updateInvoiceStatus(id: string, status: string) {
  try {
    const updated = await prisma.invoice.update({
      where: { id },
      data: { paymentStatus: status },
      include: { items: true },
    });

    revalidatePath('/invoices');
    revalidatePath('/');

    return formatInvoice(updated);
  } catch (error: any) {
    console.error('updateInvoiceStatus error:', error);
    throw error;
  }
}
