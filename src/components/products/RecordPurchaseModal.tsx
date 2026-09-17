'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface RecordPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  products?: any[];
  onSave: (productId: string, quantity: number, costPrice: number, supplier?: string) => Promise<void>;
}

export default function RecordPurchaseModal({
  isOpen,
  onClose,
  product,
  products = [],
  onSave,
}: RecordPurchaseModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [costPrice, setCostPrice] = useState('0');
  const [supplier, setSupplier] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedProductId(product._id || '');
      setCostPrice(product.costPrice ? String(product.costPrice) : '0');
    } else if (products.length > 0) {
      setSelectedProductId(products[0]._id || '');
      setCostPrice(products[0].costPrice ? String(products[0].costPrice) : '0');
    }
  }, [product, products, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedProductId || product?._id;
    if (!targetId) return;

    try {
      setLoading(true);
      await onSave(targetId, Number(quantity), Number(costPrice), supplier);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Top Header matching Image 4 */}
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-base font-bold text-slate-900">Record Purchase</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Card Block matching Image 4 */}
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-4 my-2">
          <h4 className="text-lg font-extrabold text-slate-900">Record New Purchase</h4>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Product Dropdown */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const p = products.find((item) => item._id === e.target.value);
                  if (p) setCostPrice(String(p.costPrice || 0));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-slate-700 bg-white font-medium"
              >
                {products.length > 0 ? (
                  products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value={product?._id}>{product?.name || 'Select a product'}</option>
                )}
              </select>
            </div>

            {/* Quantity & Purchase Price Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-[#00aeef]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Purchase Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-[#00aeef]"
                />
              </div>
            </div>

            {/* Supplier Input */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Supplier</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Enter supplier name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-[#00aeef]"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions matching Image 4 */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="py-2.5 px-4 rounded-xl bg-[#00aeef] hover:bg-[#0284c7] text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Recording...' : 'Record Purchase'}
          </button>
        </div>

      </div>
    </div>
  );
}
