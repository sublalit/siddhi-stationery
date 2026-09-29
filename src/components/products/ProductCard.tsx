'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Edit3, Trash2, Clock, TrendingUp, ShieldAlert, X, ZoomIn } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface ProductCardProps {
  product: any;
  onView: (product: any) => void;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onOpenPurchases: (product: any) => void;
  onOpenPrices: (product: any) => void;
}

export default function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  onOpenPurchases,
  onOpenPrices,
}: ProductCardProps) {
  const { isStaff } = useAuth();
  const [isImageOpen, setIsImageOpen] = useState(false);

  useEffect(() => {
    if (!isImageOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageOpen]);

  const stock = Number(product.currentStock) || 0;
  const minStock = Number(product.minStock) || 5;
  const sellingPrice = (Number(product.sellingPrice) || 0).toFixed(2);

  let stockBadgeColor = 'bg-[#00aeef] text-white';
  let stockBadgeText = 'In Stock';

  if (stock === 0) {
    stockBadgeColor = 'bg-red-500 text-white';
    stockBadgeText = 'Out of Stock';
  } else if (stock <= minStock) {
    stockBadgeColor = 'bg-amber-500 text-white';
    stockBadgeText = 'Low Stock';
  }

  const categoryName = product.category?.name || 'Paper Products';
  const imageUrl = product.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop';

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
        <div>
          {/* Product Image - Clickable to open zoom modal */}
          <div
            className="relative w-full h-44 bg-slate-100 overflow-hidden cursor-pointer group"
            onClick={() => setIsImageOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsImageOpen(true);
              }
            }}
            title="Click to zoom image"
          >
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Subtle zoom hint overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm backdrop-blur-xs">
                <ZoomIn className="w-3.5 h-3.5" />
                Zoom
              </span>
            </div>
          </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <h3 className="text-base font-bold text-[#00aeef] hover:underline cursor-pointer line-clamp-1" onClick={() => onView(product)}>
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 font-mono">SKU: {product.sku}</p>

          {/* Badge & Stock Count */}
          <div className="flex items-center justify-between pt-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs ${stockBadgeColor}`}
            >
              {stockBadgeText}
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {stock} {product.unit || 'units'}
            </span>
          </div>

          {/* Price & Location */}
          <div className="pt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-[#00aeef]">
              ₹{sellingPrice}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {product.rackLocation || 'A1-B1-S1'}
            </span>
          </div>

          {/* Category */}
          <p className="text-xs text-slate-500 pt-1">
            Category: <span className="font-medium">{categoryName}</span>
          </p>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="p-4 pt-0 space-y-3 bg-white">
        {/* Row 1: View, Edit, Trash (or View-Only for Staff) */}
        {isStaff ? (
          <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
            <button
              onClick={() => onView(product)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <Eye className="w-4 h-4 text-[#00aeef]" />
              <span>View Details</span>
            </button>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" /> Staff
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-2">
            <button
              onClick={() => onView(product)}
              className="col-span-5 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-slate-700" />
              <span>View</span>
            </button>

            <button
              onClick={() => onEdit(product)}
              className="col-span-5 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-slate-700" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => onDelete(product._id)}
              className="col-span-2 flex items-center justify-center py-2 px-2 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Row 2: Purchases & Prices */}
        <div className="grid grid-cols-2 gap-4 pt-1 text-xs font-bold text-slate-800">
          <button
            onClick={() => onOpenPurchases(product)}
            className="flex items-center justify-center gap-1.5 py-1 hover:text-[#00aeef] transition-colors"
          >
            <Clock className="w-4 h-4 text-slate-700" />
            <span>Purchases</span>
          </button>

          <button
            onClick={() => onOpenPrices(product)}
            className="flex items-center justify-center gap-1.5 py-1 hover:text-[#00aeef] transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <span>Prices</span>
          </button>
        </div>
      </div>
    </div>

    {/* Lightbox / Zoom Modal */}
    {isImageOpen && (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setIsImageOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged image of ${product.name}`}
        >
          {/* Close (X) Button in Top-Right Corner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsImageOpen(false);
            }}
            className="absolute top-4 right-4 p-2.5 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors cursor-pointer z-10 focus:outline-hidden"
            aria-label="Close image zoom"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Centered Image Keeping Aspect Ratio Intact */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={product.name}
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl select-none"
            />
            {product.name && (
              <p className="mt-3 px-3 py-1.5 bg-black/60 rounded-lg text-white text-xs sm:text-sm font-medium text-center truncate max-w-md">
                {product.name}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
