'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { getProductPriceHistory } from '@/lib/actions/products';

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
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      const targetId = product._id || product.sku;
      getProductPriceHistory(targetId, product.sku)
        .then((records) => {
          setPriceHistory(records || []);
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentSellingPrice = (Number(product.sellingPrice) || 0).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Header Title & Circular Close Button matching Image 2 */}
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
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00aeef] mb-2" />
            Loading price history...
          </div>
        ) : priceHistory.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No price records found.
          </div>
        ) : (
          <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
            {priceHistory.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{item.date}</h4>
                  <div className="text-lg font-extrabold text-[#00aeef] mt-1">
                    ₹{(Number(item.price) || 0).toFixed(2)}
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
        )}

      </div>
    </div>
  );
}
