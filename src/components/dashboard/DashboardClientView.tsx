'use client';

import React from 'react';
import Link from 'next/link';
import { Package, TrendingUp, AlertTriangle, PackageX, Home, ShieldAlert, Zap, CalendarCheck } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import LowStockWidget from '@/components/dashboard/LowStockWidget';
import ActivityLog from '@/components/dashboard/ActivityLog';
import CategoriesOverview from '@/components/dashboard/CategoriesOverview';
import { useAuth } from '@/lib/authContext';

interface DashboardClientViewProps {
  stats: any;
  formattedTotalValue: string;
}

export default function DashboardClientView({ stats, formattedTotalValue }: DashboardClientViewProps) {
  const { isStaff, role } = useAuth();

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Dashboard</span>
      </div>

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isStaff ? 'Staff Inventory Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isStaff
              ? 'View-only access to stationery inventory, stock counts, and department categories.'
              : 'Overview of your inventory status, department categories, low stock alerts, and recent transactions'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Sale Shortcut */}
          <Link
            href="/quick-sale"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00aeef] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Quick Sale</span>
          </Link>

          {/* Day-End Closing Shortcut for Admin/Manager */}
          {!isStaff && (
            <Link
              href="/daily-sales"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Day-End Closing (EOD)</span>
            </Link>
          )}

          {isStaff && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Staff Role (Financial Graphs & Settings Hidden)</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Quick Stats Metric Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isStaff ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-5`}>
        <MetricCard
          title="Total Products"
          value={stats.totalProducts}
          badge="+5 this week"
          badgeColor="cyan"
          icon={Package}
          href="/products"
        />

        {/* Hide Financial Total Value Metric for Staff */}
        {!isStaff && (
          <MetricCard
            title="Total Value"
            value={formattedTotalValue}
            subtitle="Inventory worth"
            badgeColor="cyan"
            icon={TrendingUp}
            href="/products"
          />
        )}

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
