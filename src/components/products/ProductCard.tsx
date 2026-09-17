'use client';

import React from 'react';
import { Eye, Edit3, Trash2, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: any;
  onView: (product: any) => void;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onRecordPurchase: (product: any) => void;
}

export default function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  onRecordPurchase,
}: ProductCardProps) {
  const stock = product.currentStock;
  const minStock = product.minStock || 5;

  let stockBadgeColor = 'bg-[#00aeef] text-white';
  let stockBadgeText = 'In Stock';

  if (stock === 0) {
    stockBadgeColor = 'bg-red-500 text-white';
    stockBadgeText = 'Out of Stock';
  } else if (stock <= minStock) {
    stockBadgeColor = 'bg-amber-500 text-white';
    stockBadgeText = 'Low Stock';
  }

  const categoryName = product.category?.name || 'General';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <div>
        {/* Product Image & Stock Badge Overlay */}
        <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs ${stockBadgeColor}`}
          >
            {stockBadgeText}
          </span>
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-700 text-[11px] font-bold shadow-xs">
            {stock} {product.unit || 'units'}
          </span>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{product.name}</h3>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>SKU: {product.sku}</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-sans font-medium">
              {product.rackLocation || 'A1-B1-S1'}
            </span>
          </div>

          {/* Price */}
          <div className="pt-2 flex items-baseline justify-between border-t border-slate-100">
            <div>
              <span className="text-lg font-extrabold text-[#00aeef]">
                ₹{product.sellingPrice?.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">/ {product.unit}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Cat: {categoryName}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons matching Lovable prototype */}
      <div className="p-4 pt-0 space-y-2 border-t border-slate-100 bg-slate-50/50">
        <div className="grid grid-cols-3 gap-2 pt-3">
          <button
            onClick={() => onView(product)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-cyan-50 hover:text-[#00aeef] transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>View</span>
          </button>
          <button
            onClick={() => onEdit(product)}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(product._id)}
            className="flex items-center justify-center py-1.5 px-2 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onRecordPurchase(product)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-[#00aeef] rounded-lg text-xs font-bold transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Record Purchase</span>
        </button>
      </div>
    </div>
  );
}
