'use server';

import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import InventoryLog from '@/models/InventoryLog';
import { revalidatePath } from 'next/cache';
import { mockProducts, mockInventoryLogs } from '@/lib/mockStore';

let memoryProducts = [...mockProducts];
let memoryInventoryLogs: any[] = [
  {
    _id: 'p-log-1',
    product: 'prod-1',
    productName: 'A4 Copy Paper - White (75 GSM)',
    sku: 'PPR-001',
    type: 'Stock In',
    quantity: 250,
    remaining: 250,
    unitPrice: 320.0,
    supplier: 'JK Paper Mills',
    batch: 'B001',
    reason: 'Initial Restock Batch',
    timestamp: new Date('2024-01-01').toISOString(),
  },
  {
    _id: 'p-log-2',
    product: 'prod-2',
    productName: 'Ball Point Pen - Blue',
    sku: 'PEN-002',
    type: 'Stock In',
    quantity: 15,
    remaining: 15,
    unitPrice: 8.0,
    supplier: 'Camlin Stationery Supplies',
    batch: 'B002',
    reason: 'Initial Intake',
    timestamp: new Date('2024-01-01').toISOString(),
  },
  ...mockInventoryLogs,
];

export async function getProducts(search?: string, categoryId?: string, stockStatus?: string) {
  const conn = await dbConnect();

  if (!conn) {
    let result = [...memoryProducts];
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    if (categoryId && categoryId !== 'all') {
      result = result.filter((p) => p.category?._id === categoryId);
    }
    if (stockStatus && stockStatus !== 'all') {
      if (stockStatus === 'in-stock') result = result.filter((p) => p.currentStock > 5);
      if (stockStatus === 'low-stock') result = result.filter((p) => p.currentStock <= (p.minStock || 5));
      if (stockStatus === 'out-of-stock') result = result.filter((p) => p.currentStock === 0);
    }
    return JSON.parse(JSON.stringify(result));
  }

  const query: any = {};
  if (search && search.trim() !== '') {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { sku: regex }, { barcode: regex }];
  }
  if (categoryId && categoryId !== 'all') {
    query.category = categoryId;
  }
  if (stockStatus && stockStatus !== 'all') {
    if (stockStatus === 'in-stock') query.currentStock = { $gt: 5 };
    else if (stockStatus === 'low-stock') query.currentStock = { $lte: 5 };
    else if (stockStatus === 'out-of-stock') query.currentStock = 0;
  }

  try {
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('vendor', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(products));
  } catch (e) {
    return JSON.parse(JSON.stringify(memoryProducts));
  }
}

export async function createProduct(data: any) {
  const conn = await dbConnect();

  const newP: any = {
    _id: `prod-${Date.now()}`,
    name: data.name,
    sku: data.sku,
    barcode: data.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
    category: { _id: data.category || 'cat-1', name: 'General', slug: 'general' },
    currentStock: Number(data.currentStock) || 0,
    minStock: Number(data.minStock) || 5,
    maxStock: Number(data.maxStock) || 500,
    sellingPrice: Number(data.sellingPrice) || 0,
    costPrice: Number(data.costPrice) || 0,
    unit: data.unit || 'units',
    rackLocation: data.rackLocation || 'A1-B1-S1',
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop',
    description: data.description || '',
    isCustomPrinting: data.isCustomPrinting || false,
    createdAt: new Date().toISOString(),
  };

  if (!conn) {
    memoryProducts.unshift(newP);
    if (newP.currentStock > 0) {
      memoryInventoryLogs.unshift({
        _id: `log-${Date.now()}`,
        product: newP._id,
        productName: newP.name,
        sku: newP.sku,
        type: 'Stock In',
        quantity: newP.currentStock,
        remaining: newP.currentStock,
        unitPrice: newP.costPrice,
        supplier: 'Initial Supplier',
        batch: `B${Date.now()}`,
        reason: 'Initial Product Intake',
        timestamp: new Date().toISOString(),
      });
    }
    revalidatePath('/products');
    revalidatePath('/');
    return JSON.parse(JSON.stringify(newP));
  }

  const newProduct = await Product.create({
    name: data.name,
    sku: data.sku,
    barcode: data.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
    category: data.category,
    currentStock: Number(data.currentStock) || 0,
    minStock: Number(data.minStock) || 5,
    maxStock: Number(data.maxStock) || 500,
    sellingPrice: Number(data.sellingPrice) || 0,
    costPrice: Number(data.costPrice) || 0,
    unit: data.unit || 'units',
    rackLocation: data.rackLocation || 'A1-B1-S1',
    vendor: data.vendor || null,
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop',
    description: data.description || '',
    isCustomPrinting: data.isCustomPrinting || false,
  });

  if (data.category) {
    await Category.findByIdAndUpdate(data.category, { $inc: { productCount: 1 } }).catch(() => {});
  }

  await InventoryLog.create({
    product: newProduct._id,
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
  }).catch(() => {});

  revalidatePath('/products');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(newProduct));
}

export async function updateProduct(id: string, data: any) {
  const conn = await dbConnect();

  if (!conn) {
    const idx = memoryProducts.findIndex((p) => p._id === id);
    if (idx !== -1) {
      memoryProducts[idx] = {
        ...memoryProducts[idx],
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        currentStock: Number(data.currentStock),
        minStock: Number(data.minStock),
        sellingPrice: Number(data.sellingPrice),
        costPrice: Number(data.costPrice),
        unit: data.unit,
        rackLocation: data.rackLocation,
        imageUrl: data.imageUrl,
        description: data.description,
        updatedAt: new Date().toISOString(),
      };
    }
    revalidatePath('/products');
    revalidatePath('/');
    return JSON.parse(JSON.stringify(memoryProducts[idx] || {}));
  }

  const updated = await Product.findByIdAndUpdate(
    id,
    {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      category: data.category,
      currentStock: Number(data.currentStock),
      minStock: Number(data.minStock),
      sellingPrice: Number(data.sellingPrice),
      costPrice: Number(data.costPrice),
      unit: data.unit,
      rackLocation: data.rackLocation,
      imageUrl: data.imageUrl,
      description: data.description,
    },
    { new: true }
  );

  revalidatePath('/products');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteProduct(id: string) {
  const conn = await dbConnect();

  if (!conn) {
    memoryProducts = memoryProducts.filter((p) => p._id !== id);
    revalidatePath('/products');
    revalidatePath('/');
    return { success: true };
  }

  const product = await Product.findById(id);
  if (product && product.category) {
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } }).catch(() => {});
  }

  await Product.findByIdAndDelete(id);

  revalidatePath('/products');
  revalidatePath('/');
  return { success: true };
}

export async function recordPurchase(
  productId: string,
  quantity: number,
  costPrice: number,
  supplier?: string
) {
  const conn = await dbConnect();
  const batchCode = `B${Date.now()}`;
  const supplierName = supplier && supplier.trim() !== '' ? supplier.trim() : 'General Supplier';

  if (!conn) {
    const p = memoryProducts.find((item) => item._id === productId || item.sku === productId);
    if (p) {
      p.currentStock = (Number(p.currentStock) || 0) + Number(quantity);
      if (costPrice > 0) p.costPrice = Number(costPrice);

      memoryInventoryLogs.unshift({
        _id: `log-${Date.now()}`,
        product: p._id,
        productName: p.name,
        sku: p.sku,
        type: 'Stock In',
        quantity: Number(quantity),
        remaining: Number(quantity),
        unitPrice: Number(costPrice) || p.costPrice || 0,
        supplier: supplierName,
        batch: batchCode,
        reason: 'Purchase Intake',
        timestamp: new Date().toISOString(),
      });
    }
    revalidatePath('/products');
    revalidatePath('/');
    return JSON.parse(JSON.stringify(p || {}));
  }

  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  product.currentStock += Number(quantity);
  if (costPrice > 0) {
    product.costPrice = Number(costPrice);
  }
  await product.save();

  await InventoryLog.create({
    product: product._id,
    productName: product.name,
    sku: product.sku,
    type: 'Stock In',
    quantity: Number(quantity),
    remaining: Number(quantity),
    unitPrice: Number(costPrice) || product.costPrice,
    supplier: supplierName,
    batch: batchCode,
    reason: 'Purchase Intake',
    performedBy: 'Admin User',
  });

  revalidatePath('/products');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(product));
}

export async function getProductPurchaseHistory(productId: string, sku?: string) {
  const conn = await dbConnect();

  if (!conn) {
    const filtered = memoryInventoryLogs.filter(
      (l) =>
        l.type === 'Stock In' &&
        (l.product === productId || (sku && l.sku === sku) || (l.sku && l.sku === productId))
    );
    return JSON.parse(JSON.stringify(filtered));
  }

  try {
    const query: any = { type: 'Stock In' };
    if (productId) {
      query.$or = [{ product: productId }, { sku: sku || productId }];
    }

    const logs = await InventoryLog.find(query).sort({ timestamp: -1 }).lean();
    return JSON.parse(JSON.stringify(logs));
  } catch (e) {
    const filtered = memoryInventoryLogs.filter(
      (l) =>
        l.type === 'Stock In' &&
        (l.product === productId || (sku && l.sku === sku) || (l.sku && l.sku === productId))
    );
    return JSON.parse(JSON.stringify(filtered));
  }
}

export async function getProductPriceHistory(productId: string, sku?: string) {
  const conn = await dbConnect();

  if (!conn) {
    const p = memoryProducts.find((item) => item._id === productId || item.sku === productId);
    const purchases = memoryInventoryLogs.filter(
      (l) =>
        l.type === 'Stock In' &&
        (l.product === productId || (sku && l.sku === sku) || (l.sku && l.sku === productId))
    );

    const priceList: any[] = [];
    if (p) {
      priceList.push({
        id: 'sale-current',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        price: Number(p.sellingPrice) || 0,
        type: 'Sale Price',
      });
    }

    for (const pur of purchases) {
      priceList.push({
        id: pur._id,
        date: new Date(pur.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        price: Number(pur.unitPrice) || Number(p?.costPrice) || 0,
        type: 'Purchase Price',
      });
    }

    return JSON.parse(JSON.stringify(priceList));
  }

  try {
    const product = await Product.findById(productId).lean();
    const purchases = await InventoryLog.find({
      type: 'Stock In',
      $or: [{ product: productId }, { sku: sku || productId }],
    })
      .sort({ timestamp: -1 })
      .lean();

    const priceList: any[] = [];
    if (product) {
      priceList.push({
        id: 'sale-current',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        price: Number(product.sellingPrice) || 0,
        type: 'Sale Price',
      });
    }

    for (const pur of purchases) {
      priceList.push({
        id: pur._id.toString(),
        date: new Date(pur.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        price: Number(pur.unitPrice) || Number(product?.costPrice) || 0,
        type: 'Purchase Price',
      });
    }

    return JSON.parse(JSON.stringify(priceList));
  } catch (e) {
    return JSON.parse(JSON.stringify([]));
  }
}
