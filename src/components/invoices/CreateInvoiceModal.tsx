'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onSave: (invoiceData: any) => Promise<void>;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  products,
  onSave,
}: CreateInvoiceModalProps) {
  const [customer, setCustomer] = useState({
    name: 'Walk-in Customer',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  const [items, setItems] = useState<any[]>([
    {
      product: '',
      productName: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      lineTotal: 0,
    },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Credit'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Draft'>('Paid');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (products.length > 0 && (!items[0] || !items[0].product)) {
      const p = products[0];
      setItems([
        {
          product: p._id,
          productName: p.name,
          sku: p.sku,
          quantity: 1,
          unitPrice: p.sellingPrice || 0,
          discountPercent: 0,
          lineTotal: p.sellingPrice || 0,
        },
      ]);
    }
  }, [products, isOpen]);

  if (!isOpen) return null;

  const handleProductSelect = (index: number, productId: string) => {
    const p = products.find((prod) => prod._id === productId);
    if (!p) return;

    const newItems = [...items];
    const qty = newItems[index].quantity || 1;
    const disc = newItems[index].discountPercent || 0;
    const price = p.sellingPrice || 0;
    const lineTotal = price * qty * (1 - disc / 100);

    newItems[index] = {
      product: p._id,
      productName: p.name,
      sku: p.sku,
      quantity: qty,
      unitPrice: price,
      discountPercent: disc,
      lineTotal,
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, val: number) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: val };
    const price = item.unitPrice || 0;
    const qty = item.quantity || 1;
    const disc = item.discountPercent || 0;
    item.lineTotal = price * qty * (1 - disc / 100);
    newItems[index] = item;
    setItems(newItems);
  };

  const addItemRow = () => {
    const p = products[0] || {};
    setItems([
      ...items,
      {
        product: p._id || '',
        productName: p.name || '',
        sku: p.sku || '',
        quantity: 1,
        unitPrice: p.sellingPrice || 0,
        discountPercent: 0,
        lineTotal: p.sellingPrice || 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Computations
  const subtotal = items.reduce((acc, curr) => acc + (curr.lineTotal || 0), 0);
  const gstAmount = subtotal * 0.18; // 18% GST standard for stationery & paper
  const discountTotal = items.reduce((acc, curr) => {
    const orig = (curr.unitPrice || 0) * (curr.quantity || 1);
    return acc + (orig - (curr.lineTotal || 0));
  }, 0);
  const grandTotal = subtotal + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        customer,
        items,
        subtotal,
        gstAmount,
        discountTotal,
        grandTotal,
        paymentMethod,
        paymentStatus,
      });

      // Confetti burst for successful sale!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 text-[#00aeef] rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">POS Invoice Generator</h3>
              <p className="text-xs text-slate-500 font-medium">
                Create new tax invoice with automatic stock deduction
              </p>
            </div>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Customer Details */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Customer Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="e.g. Apex Infotech"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#00aeef] bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="+91 98200 00000"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#00aeef] bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={customer.gstin}
                  onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#00aeef] bg-white"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Invoice Line Items
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs font-bold text-[#00aeef] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                >
                  <div className="col-span-5">
                    <select
                      value={item.product}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#00aeef]"
                    >
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Stock: {p.currentStock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      placeholder="Price"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-right"
                    />
                  </div>
                  <div className="col-span-2 text-right font-bold text-[#00aeef]">
                    ₹{item.lineTotal?.toFixed(2)}
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Computations & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <div className="flex gap-2">
                  {(['Cash', 'UPI', 'Card', 'Credit'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        paymentMethod === m
                          ? 'bg-[#00aeef] text-white border-[#00aeef]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                <div className="flex gap-2">
                  {(['Paid', 'Pending', 'Draft'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setPaymentStatus(st)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        paymentStatus === st
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Breakdown Card */}
            <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">-₹{discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-[#00aeef] pt-2 border-t border-cyan-200">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Processing...' : 'Complete & Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
