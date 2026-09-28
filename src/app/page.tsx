import React from 'react';
import DashboardClientView from '@/components/dashboard/DashboardClientView';
import { getDashboardStats } from '@/lib/actions/dashboard';

export const revalidate = 0; // Fresh server metrics on load

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const formattedTotalValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(stats.totalValue);

  return <DashboardClientView stats={stats} formattedTotalValue={formattedTotalValue} />;
}

