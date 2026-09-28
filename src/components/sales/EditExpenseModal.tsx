'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Pencil,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { updateExpense } from '@/lib/actions/sales';
import { useAuth } from '@/lib/authContext';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    amount: number;
    reason: string;
  } | null;
  onSuccess?: () => void;
}

export default function EditExpenseModal({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: EditExpenseModalProps) {
  const { role } = useAuth();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setReason(expense.reason);
      setErrorMessage(null);
      setSuccessMessage(null);
      setTimeout(() => amountRef.current?.focus(), 100);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than ₹0');
      amountRef.current?.focus();
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Reason cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const res = await updateExpense(
        expense.id,
        { amount: parsedAmount, reason: reason.trim() },
        role
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update expense voucher');
        return;
      }

      setSuccessMessage('Voucher updated successfully!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update expense voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Edit Petty Cash Voucher</h2>
              <p className="text-[11px] text-slate-400 font-medium">Update expense amount or note</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Amount (₹)
            </label>
            <div className="relative rounded-xl border border-slate-300 focus-within:border-[#00aeef] bg-white shadow-2xs">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold">
                ₹
              </span>
              <input
                ref={amountRef}
                type="number"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-bold text-slate-900 rounded-xl focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Reason / Purpose
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#00aeef] text-sm text-slate-900 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00aeef] hover:bg-[#0284c7] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
