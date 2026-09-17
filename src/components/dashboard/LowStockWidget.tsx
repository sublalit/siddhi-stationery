import React from 'react';
import { AlertTriangle, PackageX } from 'lucide-react';

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
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-bold text-slate-900">Low Stock Items</h2>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
          {items.length} Requires Attention
        </span>
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
              <div
                key={item._id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isZero
                    ? 'bg-red-50/50 border-red-200/60'
                    : 'bg-amber-50/40 border-amber-200/60'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold ${
                      isZero ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {item.currentStock} left
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Min: {item.minStock}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
