'use client';

import React from 'react';
import Link from 'next/link';
import { FolderTree, ArrowRight, Package } from 'lucide-react';
import { ICategoryOverview } from '@/lib/actions/dashboard';
import { useAuth } from '@/lib/authContext';

interface CategoriesOverviewProps {
  categories: ICategoryOverview[];
}

export default function CategoriesOverview({ categories }: CategoriesOverviewProps) {
  const { isStaff } = useAuth();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#00aeef]" />
            <h2 className="text-base font-bold text-slate-900">Categories Overview</h2>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-[#00aeef] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const formattedValue = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(cat.totalValue);

            return (
              <Link
                key={cat._id}
                href={`/products?categoryId=${cat._id}`}
                className="p-4 rounded-xl bg-slate-50/70 hover:bg-cyan-50/60 border border-slate-200/80 hover:border-[#00aeef]/60 transition-all group block cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#00aeef] transition-colors line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                    <Package className="w-3 h-3 text-[#00aeef]" />
                    {cat.productCount}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  {isStaff ? (
                    <>
                      <span className="text-xs text-slate-400 font-medium">Total Items</span>
                      <span className="text-sm font-extrabold text-slate-700">{cat.productCount}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-slate-400 font-medium">Category Value</span>
                      <span className="text-sm font-extrabold text-[#00aeef]">{formattedValue}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
