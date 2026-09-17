import React from 'react';
import { Package, TrendingUp, AlertTriangle, PackageX, Home } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import LowStockWidget from '@/components/dashboard/LowStockWidget';
import ActivityLog from '@/components/dashboard/ActivityLog';
import CategoriesOverview from '@/components/dashboard/CategoriesOverview';
import { getDashboardStats } from '@/lib/actions/dashboard';

export const revalidate = 0; // Fresh server metrics on load

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const formattedTotalValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(stats.totalValue);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Dashboard</span>
      </div>

      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Overview of your inventory status, department categories, low stock alerts, and recent transactions
        </p>
      </div>

      {/* Top 4 KPI Clickable Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Products"
          value={stats.totalProducts}
          badge="+5 this week"
          badgeColor="cyan"
          icon={Package}
          href="/products"
        />
        <MetricCard
          title="Total Value"
          value={formattedTotalValue}
          subtitle="Inventory worth"
          badgeColor="cyan"
          icon={TrendingUp}
          href="/products"
        />
        <MetricCard
          title="Low Stock"
          value={stats.lowStockCount}
          badge={stats.lowStockCount > 0 ? 'Needs attention' : 'Healthy'}
          badgeColor={stats.lowStockCount > 0 ? 'amber' : 'emerald'}
          icon={AlertTriangle}
          href="/products?stockStatus=low-stock"
        />
        <MetricCard
          title="Out of Stock"
          value={stats.outOfStockCount}
          badge={stats.outOfStockCount > 0 ? 'Immediate action' : 'All good'}
          badgeColor={stats.outOfStockCount > 0 ? 'red' : 'emerald'}
          icon={PackageX}
          href="/products?stockStatus=out-of-stock"
        />
      </div>

      {/* Categories Overview Section */}
      <CategoriesOverview categories={stats.categoriesOverview} />

      {/* Grid: Low Stock Alert Widget & Recent Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockWidget items={stats.lowStockItems} />
        <ActivityLog activities={stats.recentActivity} />
      </div>
    </div>
  );
}
