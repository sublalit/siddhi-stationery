'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function formatProduct(p: any) {
  if (!p) return null;
  return {
    ...p,
    _id: p.id,
    category: p.category ? { ...p.category, _id: p.category.id } : null,
    vendor: p.vendor ? { ...p.vendor, _id: p.vendor.id } : null,
  };
}

export async function getProducts(
  search?: string,
  categoryId?: string,
  stockStatus?: string,
  vendorId?: string
) {
  try {
    const where: any = {};

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (vendorId && vendorId !== 'all') {
      where.vendorId = vendorId;
    }

    if (stockStatus && stockStatus !== 'all') {
      if (stockStatus === 'in-stock') where.currentStock = { gt: 5 };
      else if (stockStatus === 'low-stock') where.currentStock = { lte: 5 };
      else if (stockStatus === 'out-of-stock') where.currentStock = 0;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(formatProduct);
  } catch (error: any) {
    console.error('getProducts error:', error);
    return [];
  }
}

export async function createProduct(data: any, userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Unauthorized: Staff role has view-only access and cannot create products.');
  }

  try {
    const generatedBarcode =
      data.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        barcode: generatedBarcode,
        categoryId: data.category,
        currentStock: Number(data.currentStock) || 0,
        minStock: Number(data.minStock) || 5,
        maxStock: Number(data.maxStock) || 500,
        sellingPrice: Number(data.sellingPrice) || 0,
        costPrice: Number(data.costPrice) || 0,
        unit: data.unit || 'units',
        rackLocation: data.rackLocation || 'A1-B1-S1',
        vendorId: data.vendor || null,
        imageUrl:
          data.imageUrl ||
          'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop',
        description: data.description || '',
        isCustomPrinting: Boolean(data.isCustomPrinting),
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    if (data.category) {
      await prisma.category
        .update({
          where: { id: data.category },
          data: { productCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    if (newProduct.currentStock > 0) {
      await prisma.inventoryLog
        .create({
          data: {
            productId: newProduct.id,
            productName: newProduct.name,
            sku: newProduct.sku,
            type: 'Stock In',
            quantity: newProduct.currentStock,
            remaining: newProduct.currentStock,
            unitPrice: newProduct.costPrice,
            supplier: 'Initial Supplier',
            batch: `B${Date.now()}`,
            reason: 'Initial Product Intake',
            performedBy: 'Admin User',
          },
        })
        .catch(() => {});
    }

    revalidatePath('/products');
    revalidatePath('/');
    return formatProduct(newProduct);
  } catch (error: any) {
    console.error('createProduct error:', error);
    throw error;
  }
}

export async function updateProduct(id: string, data: any, userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Unauthorized: Staff role has view-only access and cannot edit products.');
  }

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        categoryId: data.category,
        currentStock: Number(data.currentStock),
        minStock: Number(data.minStock),
        sellingPrice: Number(data.sellingPrice),
        costPrice: Number(data.costPrice),
        unit: data.unit,
        rackLocation: data.rackLocation,
        vendorId: data.vendor || null,
        imageUrl: data.imageUrl || undefined,
        description: data.description,
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    revalidatePath('/products');
    revalidatePath('/');
    return formatProduct(updated);
  } catch (error: any) {
    console.error('updateProduct error:', error);
    throw error;
  }
}

export async function deleteProduct(id: string, userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Unauthorized: Staff role has view-only access and cannot delete products.');
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (product && product.categoryId) {
      await prisma.category
        .update({
          where: { id: product.categoryId },
          data: { productCount: { decrement: 1 } },
        })
        .catch(() => {});
    }

    await prisma.product.delete({ where: { id } });

    revalidatePath('/products');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('deleteProduct error:', error);
    throw error;
  }
}

export async function recordPurchase(
  productId: string,
  quantity: number,
  costPrice: number,
  supplier?: string,
  userRole?: string
) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Unauthorized: Staff role cannot record inventory purchases.');
  }
  try {
    const batchCode = `B${Date.now()}`;
    const supplierName = supplier && supplier.trim() !== '' ? supplier.trim() : 'General Supplier';

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: { increment: Number(quantity) },
        costPrice: costPrice > 0 ? Number(costPrice) : product.costPrice,
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type: 'Stock In',
        quantity: Number(quantity),
        remaining: updatedProduct.currentStock,
        unitPrice: Number(costPrice) || product.costPrice,
        supplier: supplierName,
        batch: batchCode,
        reason: 'Purchase Intake',
        performedBy: 'Admin User',
      },
    });

    revalidatePath('/products');
    revalidatePath('/');
    return formatProduct(updatedProduct);
  } catch (error: any) {
    console.error('recordPurchase error:', error);
    throw error;
  }
}

export async function getProductPurchaseHistory(productId: string, sku?: string) {
  try {
    const logs = await prisma.inventoryLog.findMany({
      where: {
        type: 'Stock In',
        OR: [
          { productId: productId },
          { sku: sku || productId },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs.map((l) => ({
      ...l,
      _id: l.id,
      product: l.productId,
    }));
  } catch (error: any) {
    console.error('getProductPurchaseHistory error:', error);
    return [];
  }
}

export async function getProductPriceHistory(productId: string, sku?: string) {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    const purchases = await prisma.inventoryLog.findMany({
      where: {
        type: 'Stock In',
        OR: [
          { productId: productId },
          { sku: sku || productId },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });

    const priceList: any[] = [];
    if (product) {
      priceList.push({
        id: 'sale-current',
        date: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        price: Number(product.sellingPrice) || 0,
        type: 'Sale Price',
      });
    }

    for (const pur of purchases) {
      priceList.push({
        id: pur.id,
        date: new Date(pur.timestamp).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        price: Number(pur.unitPrice) || Number(product?.costPrice) || 0,
        type: 'Purchase Price',
      });
    }

    return priceList;
  } catch (error: any) {
    console.error('getProductPriceHistory error:', error);
    return [];
  }
}
