'use client';

import React from 'react';
import { X } from 'lucide-react';

interface PurchaseRecord {
  id: string;
  date: string;
  price: number;
  quantity: number;
  remaining: number;
  supplier: string;
  batch: string;
}

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function PurchaseHistoryModal({
  isOpen,
  onClose,
  product,
}: PurchaseHistoryModalProps) {
  if (!isOpen || !product) return null;

  const currentStock = Number(product.currentStock) || 0;
  const unit = product.unit || 'units';

  // Demo purchase history records matching screenshot Image 1
  const history: PurchaseRecord[] = [
    {
      id: '1',
      date: 'September 17th, 2026',
      price: product.costPrice || 10.0,
      quantity: 100,
      remaining: 100,
      supplier: 'mohit',
      batch: 'B1789630503730',
    },
    {
      id: '2',
      date: 'January 1st, 2024',
      price: 320.0,
      quantity: 250,
      remaining: 250,
      supplier: product.vendor?.name || 'JK Paper Mills',
      batch: 'B001',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Header Title & Circular Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Purchase History - {product.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Current Stock: {currentStock} {unit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-cyan-400 text-cyan-500 hover:bg-cyan-50 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Purchase History Cards List matching Image 1 */}
        <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">
                  Purchase Date: {item.date}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600 font-medium text-[11px]">
                  {item.remaining} / {item.quantity} remaining
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400">Purchase Price: </span>
                  <span className="font-bold text-slate-900">₹{item.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Supplier: </span>
                  <span className="font-bold text-slate-900">{item.supplier}</span>
                </div>
                <div>
                  <span className="text-slate-400">Quantity Purchased: </span>
                  <span className="font-bold text-slate-900">{item.quantity} {unit}</span>
                </div>
                <div>
                  <span className="text-slate-400">Batch: </span>
                  <span className="font-bold text-slate-900 font-mono">{item.batch}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
