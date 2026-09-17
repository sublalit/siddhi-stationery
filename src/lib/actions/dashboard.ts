import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import InventoryLog from '@/models/InventoryLog';

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
}

export async function getDashboardStats(): Promise<IDashboardStats> {
  await dbConnect();

  // Fetch all products
  const products = await Product.find({}).lean();

  let totalProducts = products.length;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const lowStockItems: IDashboardStats['lowStockItems'] = [];

  for (const p of products) {
    const val = (p.currentStock || 0) * (p.sellingPrice || 0);
    totalValue += val;

    if (p.currentStock === 0) {
      outOfStockCount++;
      lowStockItems.push({
        _id: p._id.toString(),
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        minStock: p.minStock || 5,
      });
    } else if (p.currentStock <= (p.minStock || 5)) {
      lowStockCount++;
      lowStockItems.push({
        _id: p._id.toString(),
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        minStock: p.minStock || 5,
      });
    }
  }

  // Fetch recent inventory logs
  const logs = await InventoryLog.find({}).sort({ timestamp: -1 }).limit(10).lean();

  const recentActivity = logs.map((l) => ({
    _id: l._id.toString(),
    productName: l.productName || 'Item',
    sku: l.sku || '',
    type: l.type,
    quantity: l.quantity,
    reason: l.reason || '',
    timestamp: new Date(l.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  return {
    totalProducts,
    totalValue,
    lowStockCount,
    outOfStockCount,
    lowStockItems,
    recentActivity,
  };
}
