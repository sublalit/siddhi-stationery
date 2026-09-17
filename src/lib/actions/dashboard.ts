import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import InventoryLog from '@/models/InventoryLog';
import { mockProducts, mockCategories, mockInventoryLogs } from '@/lib/mockStore';

export interface ICategoryOverview {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
  totalValue: number;
}

export interface IDashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockItems: Array<{
    _id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
  }>;
  recentActivity: Array<{
    _id: string;
    productName: string;
    sku: string;
    type: string;
    quantity: number;
    reason: string;
    timestamp: string;
  }>;
  categoriesOverview: ICategoryOverview[];
}

export async function getDashboardStats(): Promise<IDashboardStats> {
  const conn = await dbConnect();

  let products: any[] = [];
  let categories: any[] = [];
  let logs: any[] = [];

  if (conn) {
    try {
      products = await Product.find({}).populate('category').lean();
      categories = await Category.find({}).lean();
      logs = await InventoryLog.find({}).sort({ timestamp: -1 }).limit(10).lean();
    } catch (e) {
      console.warn('DB query error, using mock data');
      products = mockProducts;
      categories = mockCategories;
      logs = mockInventoryLogs;
    }
  } else {
    products = mockProducts;
    categories = mockCategories;
    logs = mockInventoryLogs;
  }

  let totalProducts = products.length;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const lowStockItems: IDashboardStats['lowStockItems'] = [];

  // Group stats by category
  const categoryStatsMap = new Map<string, { count: number; value: number; name: string; slug: string }>();

  for (const c of categories) {
    const cId = c._id ? c._id.toString() : c.slug;
    categoryStatsMap.set(cId, {
      count: 0,
      value: 0,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
    });
  }

  for (const p of products) {
    const val = (p.currentStock || 0) * (p.sellingPrice || 0);
    totalValue += val;

    const id = p._id ? p._id.toString() : p.sku;

    if (p.currentStock === 0) {
      outOfStockCount++;
      lowStockItems.push({
        _id: id,
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        minStock: p.minStock || 5,
      });
    } else if (p.currentStock <= (p.minStock || 5)) {
      lowStockCount++;
      lowStockItems.push({
        _id: id,
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        minStock: p.minStock || 5,
      });
    }

    // Accumulate category stats
    const catObj = p.category;
    if (catObj) {
      const catId = typeof catObj === 'object' && catObj._id ? catObj._id.toString() : catObj.toString();
      const existing = categoryStatsMap.get(catId);
      if (existing) {
        existing.count += 1;
        existing.value += val;
      } else {
        categoryStatsMap.set(catId, {
          count: 1,
          value: val,
          name: typeof catObj === 'object' ? catObj.name : 'Stationery',
          slug: typeof catObj === 'object' ? catObj.slug : 'stationery',
        });
      }
    }
  }

  const categoriesOverview: ICategoryOverview[] = Array.from(categoryStatsMap.entries()).map(([id, stat]) => ({
    _id: id,
    name: stat.name,
    slug: stat.slug,
    productCount: stat.count,
    totalValue: stat.value,
  }));

  const recentActivity = logs.map((l) => ({
    _id: l._id ? l._id.toString() : Math.random().toString(),
    productName: l.productName || 'Item',
    sku: l.sku || '',
    type: l.type,
    quantity: l.quantity,
    reason: l.reason || '',
    timestamp: typeof l.timestamp === 'string' ? l.timestamp : new Date(l.timestamp).toLocaleString(),
  }));

  return {
    totalProducts,
    totalValue,
    lowStockCount,
    outOfStockCount,
    lowStockItems,
    recentActivity,
    categoriesOverview,
  };
}
