'use server';

import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import InventoryLog from '@/models/InventoryLog';
import { revalidatePath } from 'next/cache';
import { mockProducts } from '@/lib/mockStore';

let memoryProducts = [...mockProducts];

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

  if (!conn) {
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
    };
    memoryProducts.unshift(newP);
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
      memoryProducts[idx] = { ...memoryProducts[idx], ...data };
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

export async function recordPurchase(productId: string, quantity: number, costPrice: number) {
  const conn = await dbConnect();

  if (!conn) {
    const p = memoryProducts.find((item) => item._id === productId);
    if (p) {
      p.currentStock += Number(quantity);
      if (costPrice > 0) p.costPrice = Number(costPrice);
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
    reason: 'Purchase Intake',
    performedBy: 'Admin User',
  }).catch(() => {});

  revalidatePath('/products');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(product));
}
