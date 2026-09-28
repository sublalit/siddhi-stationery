'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Receipt,
  AlertCircle,
  Loader2,
  TrendingDown,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { recordExpense } from '@/lib/actions/sales';
import { useAuth } from '@/lib/authContext';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseRecorded?: () => void;
}

const COMMON_EXPENSE_REASONS = [
  'Tea & Snacks',
  'Transport / Auto',
  'Shop Cleaning',
  'Courier / Parcel',
  'Stationery Packaging',
  'Light & Misc Repair',
];

export default function RecordExpenseModal({
  isOpen,
  onClose,
  onExpenseRecorded,
}: RecordExpenseModalProps) {
  const { role, email } = useAuth();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReason('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setTimeout(() => {
        amountRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid expense amount greater than ₹0');
      amountRef.current?.focus();
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Please provide a reason or note for this expense');
      return;
    }

    try {
      setLoading(true);
      const res = await recordExpense(
        {
          amount: parsedAmount,
          reason: reason.trim(),
          userEmail: email,
        },
        role
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to record expense');
        return;
      }

      setSuccessMessage(`Expense of ₹${parsedAmount.toFixed(2)} recorded!`);
      setTimeout(() => {
        onExpenseRecorded?.();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header - Red / Crimson to contrast against blue sales */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Record Daily Expense</h2>
              <p className="text-[11px] text-rose-100 font-medium">
                Petty cash outflow from cash register
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Amount (₹)
            </label>
            <div className="relative rounded-2xl border-2 border-slate-200 focus-within:border-rose-500 bg-slate-50 focus-within:bg-white transition-all shadow-inner">
              <span className="absolute inset-y-0 left-4 flex items-center text-xl font-bold text-slate-400">
                ₹
              </span>
              <input
                ref={amountRef}
                type="number"
                step="any"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 text-2xl font-black text-slate-900 bg-transparent focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Reason / Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. Afternoon Tea, Parcel shipping, Register tape..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-500 text-sm font-medium text-slate-800 focus:outline-none transition-all"
              required
            />

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_EXPENSE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold border border-rose-100 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{loading ? 'Recording...' : 'Deduct from Petty Cash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
