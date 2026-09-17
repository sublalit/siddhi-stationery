'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function ViewProductModal({
  isOpen,
  onClose,
  product,
}: ViewProductModalProps) {
  if (!isOpen || !product) return null;

  const createdDate = product.createdAt
    ? new Date(product.createdAt).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
    : '1/1/2026';

  const updatedDate = product.updatedAt
    ? new Date(product.updatedAt).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
    : createdDate;

  const categoryName = product.category?.name || 'General';
  const supplierName = product.vendor?.name || 'Century Paper Mills Ltd';
  const minStock = product.minStock ?? 50;
  const maxStock = product.maxStock ?? 500;
  const unit = product.unit || 'units';

  const sellingPrice = (Number(product.sellingPrice) || 0).toFixed(2);
  const costPrice = (Number(product.costPrice) || 0).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Header Title & Circular Close Button matching screenshot */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Product Details</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-cyan-400 text-cyan-500 hover:bg-cyan-50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="py-5 space-y-4 text-xs">
          
          {/* Row 1: Product Name & SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 font-semibold block mb-0.5">Product Name</span>
              <h4 className="text-sm font-extrabold text-slate-900">{product.name}</h4>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block mb-0.5">SKU</span>
              <span className="text-sm font-medium text-slate-700 font-mono">{product.sku}</span>
            </div>
          </div>

          {/* Row 2: Category & Current Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 font-semibold block mb-0.5">Category</span>
              <span className="text-sm font-medium text-slate-800">{categoryName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block mb-0.5">Current Stock</span>
              <span className="text-sm font-extrabold text-slate-900">
                {product.currentStock} {unit}
              </span>
            </div>
          </div>

          {/* Row 3: Selling Price & Cost Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 font-semibold block mb-0.5">Selling Price</span>
              <span className="text-sm font-extrabold text-[#00aeef]">
                ₹{sellingPrice}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block mb-0.5">Cost Price</span>
              <span className="text-sm font-medium text-slate-800">
                ₹{costPrice}
              </span>
            </div>
          </div>

          {/* Row 4: Location & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 font-semibold block mb-0.5">Location</span>
              <span className="text-sm font-medium text-slate-800 font-mono">
                {product.rackLocation || 'A1-B1-S1'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block mb-0.5">Supplier</span>
              <span className="text-sm font-medium text-slate-800">{supplierName}</span>
            </div>
          </div>

          {/* Row 5: Stock Range */}
          <div>
            <span className="text-slate-500 font-semibold block mb-0.5">Stock Range</span>
            <span className="text-sm font-medium text-slate-800">
              {minStock} - {maxStock} {unit}
            </span>
          </div>

          {/* Description Block */}
          <div className="pt-2">
            <span className="text-slate-500 font-semibold block mb-1.5">Description</span>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
              {product.description || '75 GSM A4 size white copy paper - 500 sheets per ream'}
            </div>
          </div>

          {/* Footer Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400 font-medium block">Created</span>
              <span className="text-slate-600 font-semibold">{createdDate}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Last Updated</span>
              <span className="text-slate-600 font-semibold">{updatedDate}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
