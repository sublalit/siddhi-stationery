'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Zap, ShieldCheck, ArrowUpRight } from 'lucide-react';
import QuickSaleForm from '@/components/sales/QuickSaleForm';
import { useAuth } from '@/lib/authContext';

export default function QuickSalePage() {
  const { role, isStaff } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/" className="hover:text-slate-800 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Quick Sale Entry</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#00aeef]/10 text-[#00aeef] flex items-center justify-center">
              <Zap className="w-5 h-5 fill-[#00aeef]" />
            </span>
            Quick Sale Counter
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rapid cash & UPI entry for fast-moving stationery items, photocopy, printouts, and sundries.
          </p>
        </div>

        {/* EOD Navigation Pill for Manager / Admin */}
        {!isStaff && (
          <Link
            href="/daily-sales"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm group w-fit"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Day-End Closing (EOD)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Quick Sale Form Component */}
      <QuickSaleForm />
    </div>
  );
}
