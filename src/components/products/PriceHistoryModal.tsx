'use client';

import React from 'react';
import { X } from 'lucide-react';

interface PriceRecord {
  id: string;
  date: string;
  price: number;
  type: 'Purchase Price' | 'Sale Price';
}

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function PriceHistoryModal({
  isOpen,
  onClose,
  product,
}: PriceHistoryModalProps) {
  if (!isOpen || !product) return null;

  const currentSellingPrice = (Number(product.sellingPrice) || 0).toFixed(2);

  // Demo price history records matching screenshot Image 2
  const priceHistory: PriceRecord[] = [
    {
      id: '1',
      date: 'September 17th, 2026',
      price: product.costPrice || 10.0,
      type: 'Purchase Price',
    },
    {
      id: '2',
      date: 'January 1st, 2024',
      price: 320.0,
      type: 'Purchase Price',
    },
    {
      id: '3',
      date: 'January 1st, 2024',
      price: Number(product.sellingPrice) || 450.0,
      type: 'Sale Price',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Header Title & Circular Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Price History - {product.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Current Selling Price: ₹{currentSellingPrice}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-cyan-400 text-cyan-500 hover:bg-cyan-50 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price History Cards List matching Image 2 */}
        <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
          {priceHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-slate-800 text-xs">{item.date}</h4>
                <div className="text-lg font-extrabold text-[#00aeef] mt-1">
                  ₹{item.price.toFixed(2)}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  item.type === 'Sale Price'
                    ? 'bg-[#00aeef] text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {item.type}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
