'use server';

import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Vendor from '@/models/Vendor';
import InventoryLog from '@/models/InventoryLog';
import { revalidatePath } from 'next/cache';

export async function getProducts(search?: string, categoryId?: string, stockStatus?: string) {
  await dbConnect();

  const query: any = {};

  if (search && search.trim() !== '') {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { sku: regex }, { barcode: regex }];
  }

  if (categoryId && categoryId !== 'all') {
    query.category = categoryId;
  }

  if (stockStatus && stockStatus !== 'all') {
    if (stockStatus === 'in-stock') {
      query.currentStock = { $gt: 5 };
    } else if (stockStatus === 'low-stock') {
      query.currentStock = { $gt: 0, $lte: 5 };
    } else if (stockStatus === 'out-of-stock') {
      query.currentStock = 0;
    }
  }

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('vendor', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(products));
}

export async function createProduct(data: any) {
  await dbConnect();

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

  // Update category product count
  if (data.category) {
    await Category.findByIdAndUpdate(data.category, { $inc: { productCount: 1 } });
  }

  // Create initial log
  await InventoryLog.create({
    product: newProduct._id,
    productName: newProduct.name,
    sku: newProduct.sku,
    type: 'Stock In',
    quantity: newProduct.currentStock,
    reason: 'Initial Product Intake',
    performedBy: 'Admin User',
  });

  revalidatePath('/products');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(newProduct));
}

export async function updateProduct(id: string, data: any) {
  await dbConnect();

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
  await dbConnect();

  const product = await Product.findById(id);
  if (product && product.category) {
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
  }

  await Product.findByIdAndDelete(id);

  revalidatePath('/products');
  revalidatePath('/');
  return { success: true };
}

export async function recordPurchase(productId: string, quantity: number, costPrice: number) {
  await dbConnect();

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
  });

  revalidatePath('/products');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(product));
}
