'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { getProductPurchaseHistory } from '@/lib/actions/products';

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
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      const targetId = product._id || product.sku;
      getProductPurchaseHistory(targetId, product.sku)
        .then((logs) => {
          setHistory(logs || []);
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.currentStock) || 0;
  const unit = product.unit || 'units';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Header Title & Circular Close Button matching Image 1 */}
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
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00aeef] mb-2" />
            Loading purchase history...
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No recorded purchases found for this item.
          </div>
        ) : (
          <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
            {history.map((item, idx) => {
              const formattedDate = item.timestamp
                ? new Date(item.timestamp).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'January 1st, 2026';

              const priceVal = (Number(item.unitPrice) || Number(product.costPrice) || 0).toFixed(2);
              const qty = Number(item.quantity) || 100;
              const remaining = Number(item.remaining) || qty;
              const supplier = item.supplier || product.vendor?.name || 'General Supplier';
              const batchCode = item.batch || `B${1000 + idx}`;

              return (
                <div
                  key={item._id || idx}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs">
                      Purchase Date: {formattedDate}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600 font-medium text-[11px]">
                      {remaining} / {qty} remaining
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400">Purchase Price: </span>
                      <span className="font-bold text-slate-900">₹{priceVal}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Supplier: </span>
                      <span className="font-bold text-slate-900">{supplier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Quantity Purchased: </span>
                      <span className="font-bold text-slate-900">{qty} {unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Batch: </span>
                      <span className="font-bold text-slate-900 font-mono">{batchCode}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
