import prisma from '@/lib/prisma';

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
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
    });

    const categories = await prisma.category.findMany();
    const logs = await prisma.inventoryLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    let totalProducts = products.length;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const lowStockItems: IDashboardStats['lowStockItems'] = [];
    const categoryStatsMap = new Map<string, { count: number; value: number; name: string; slug: string }>();

    for (const c of categories) {
      categoryStatsMap.set(c.id, {
        count: 0,
        value: 0,
        name: c.name,
        slug: c.slug,
      });
    }

    for (const p of products) {
      const val = (p.currentStock || 0) * (p.sellingPrice || 0);
      totalValue += val;

      if (p.currentStock === 0) {
        outOfStockCount++;
        lowStockItems.push({
          _id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: p.currentStock,
          minStock: p.minStock || 5,
        });
      } else if (p.currentStock <= (p.minStock || 5)) {
        lowStockCount++;
        lowStockItems.push({
          _id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: p.currentStock,
          minStock: p.minStock || 5,
        });
      }

      if (p.category) {
        const existing = categoryStatsMap.get(p.categoryId);
        if (existing) {
          existing.count += 1;
          existing.value += val;
        } else {
          categoryStatsMap.set(p.categoryId, {
            count: 1,
            value: val,
            name: p.category.name,
            slug: p.category.slug,
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
      _id: l.id,
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
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    return {
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      lowStockItems: [],
      recentActivity: [],
      categoriesOverview: [],
    };
  }
}
