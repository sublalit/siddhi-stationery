'use client';

import React, { useState } from 'react';
import { X, ShoppingCart } from 'lucide-react';

interface RecordPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSave: (productId: string, quantity: number, costPrice: number) => Promise<void>;
}

export default function RecordPurchaseModal({
  isOpen,
  onClose,
  product,
  onSave,
}: RecordPurchaseModalProps) {
  const [quantity, setQuantity] = useState('50');
  const [costPrice, setCostPrice] = useState(product?.costPrice ? String(product.costPrice) : '0');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(product._id, Number(quantity), Number(costPrice));
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 text-[#00aeef] rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Purchase Intake</h3>
              <p className="text-xs text-slate-500 font-medium">Add received inventory units</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 px-3.5 my-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div className="font-bold text-slate-900">{product.name}</div>
          <div className="text-slate-500 font-mono mt-0.5">
            SKU: {product.sku} | Current Stock: {product.currentStock} {product.unit}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Intake Quantity ({product.unit}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Unit Cost Price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white font-bold hover:shadow-md disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Confirm Stock Intake'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
