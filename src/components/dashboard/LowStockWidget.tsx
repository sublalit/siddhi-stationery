import React from 'react';
import Link from 'next/link';
import { AlertTriangle, PackageX, ArrowRight } from 'lucide-react';

interface LowStockItem {
  _id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
}

interface LowStockWidgetProps {
  items: LowStockItem[];
}

export default function LowStockWidget({ items }: LowStockWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Low Stock Items</h2>
          <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
            {items.length} Requires Attention
          </span>
        </div>
        <Link
          href="/products?stockStatus=low-stock"
          className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
          <PackageX className="w-8 h-8 mb-2 opacity-50" />
          All inventory items are healthy!
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
          {items.map((item) => {
            const isZero = item.currentStock === 0;
            return (
              <Link
                key={item._id}
                href={`/products?search=${encodeURIComponent(item.sku)}`}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all group cursor-pointer block ${
                  isZero
                    ? 'bg-red-50/50 border-red-200/60 hover:border-red-400 hover:shadow-xs'
                    : 'bg-amber-50/40 border-amber-200/60 hover:border-amber-400 hover:shadow-xs'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#00aeef] transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isZero ? 'text-red-600 bg-red-100/80' : 'text-amber-600 bg-amber-100/80'
                    }`}
                  >
                    {item.currentStock} left
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Min Required: {item.minStock}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
