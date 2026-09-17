'use client';

import React from 'react';
import { Eye, Edit3, Trash2, Clock, TrendingUp } from 'lucide-react';

interface ProductTableProps {
  products: any[];
  onView: (product: any) => void;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onOpenPurchases: (product: any) => void;
  onOpenPrices: (product: any) => void;
}

export default function ProductTable({
  products,
  onView,
  onEdit,
  onDelete,
  onOpenPurchases,
  onOpenPrices,
}: ProductTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4">SKU / Barcode</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Rack Loc</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Selling Price</th>
              <th className="py-3 px-4">Cost Price</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const stock = Number(p.currentStock) || 0;
              const minStock = Number(p.minStock) || 5;
              const sellingPrice = (Number(p.sellingPrice) || 0).toFixed(2);
              const costPrice = (Number(p.costPrice) || 0).toFixed(2);

              let badgeBg = 'bg-[#00aeef] text-white';
              let badgeLabel = 'In Stock';
              if (stock === 0) {
                badgeBg = 'bg-red-500 text-white';
                badgeLabel = 'Out of Stock';
              } else if (stock <= minStock) {
                badgeBg = 'bg-amber-500 text-white';
                badgeLabel = 'Low Stock';
              }

              return (
                <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-3">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=100&auto=format&fit=crop'}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="line-clamp-1 font-bold text-[#00aeef] cursor-pointer hover:underline" onClick={() => onView(p)}>
                        {p.name}
                      </div>
                      {p.isCustomPrinting && (
                        <span className="text-[10px] text-cyan-600 font-semibold">Custom Printing</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    <div>{p.sku}</div>
                    <div className="text-[10px] text-slate-400">{p.barcode}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {p.category?.name || 'Paper Products'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.rackLocation || 'A1-B1'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeBg}`}>
                      {stock} {p.unit || 'units'} ({badgeLabel})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#00aeef]">
                    ₹{sellingPrice}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-500">
                    ₹{costPrice}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(p)}
                        className="p-1.5 rounded-lg bg-cyan-50 text-[#00aeef] hover:bg-cyan-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenPurchases(p)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Purchases History"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenPrices(p)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Price History"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(p)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(p._id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
