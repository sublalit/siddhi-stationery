'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Banknote,
  QrCode,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { closeBackdatedDay } from '@/lib/actions/sales';
import { useAuth } from '@/lib/authContext';

interface BackdatedCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: {
    date: string;
    formattedDate: string;
    openingBalance: number;
    totalCash: number;
    totalUPI: number;
    totalSales: number;
    totalExpenses: number;
    netExpectedCash: number;
    transactionCount: number;
  } | null;
  onSuccess?: () => void;
}

export default function BackdatedCloseModal({
  isOpen,
  onClose,
  dayData,
  onSuccess,
}: BackdatedCloseModalProps) {
  const { role } = useAuth();
  const [openingBalance, setOpeningBalance] = useState('0');
  const [isManual, setIsManual] = useState(false);
  const [overrideCash, setOverrideCash] = useState('');
  const [overrideUPI, setOverrideUPI] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (dayData) {
      setOpeningBalance(String(dayData.openingBalance || 0));
      setOverrideCash(String(dayData.totalCash));
      setOverrideUPI(String(dayData.totalUPI));
      setIsManual(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [dayData]);

  if (!isOpen || !dayData) return null;

  const currentCash = isManual ? (parseFloat(overrideCash) || 0) : dayData.totalCash;
  const currentUPI = isManual ? (parseFloat(overrideUPI) || 0) : dayData.totalUPI;
  const currentOpenBal = parseFloat(openingBalance) || 0;
  const calculatedNetCash = (currentOpenBal + currentCash) - dayData.totalExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setLoading(true);

      const res = await closeBackdatedDay(
        {
          date: dayData.date,
          openingBalance: currentOpenBal,
          totalCash: currentCash,
          totalUPI: currentUPI,
          isManualEntry: isManual,
          closedByRole: role,
        },
        role
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to close backdated day');
        return;
      }

      setSuccessMessage(`Backdated closing complete for ${dayData.formattedDate}!`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 750);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to close backdated day');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-red-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header - Red Alert Style */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Backdated Day-End Close
              </h2>
              <p className="text-[11px] text-red-100 font-medium">
                Reconciling missed register for {dayData.formattedDate}
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
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Day Figures Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
              <span>Date: {dayData.formattedDate}</span>
              <span className="text-slate-500">{dayData.transactionCount} Counter Sales</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">CASH SALES</span>
                <span className="font-extrabold text-slate-800">₹{dayData.totalCash.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">UPI SALES</span>
                <span className="font-extrabold text-[#00aeef]">₹{dayData.totalUPI.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-rose-50/50 rounded-xl border border-rose-100">
                <span className="text-[10px] text-rose-500 block font-bold">EXPENSES</span>
                <span className="font-extrabold text-rose-600">-₹{dayData.totalExpenses.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Opening Balance Input for that Missed Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Opening Cash Drawer Float (₹)</span>
              <span className="text-[10px] text-slate-400">Cash in drawer at start of that day</span>
            </label>
            <div className="relative rounded-xl border border-slate-300 focus-within:border-[#00aeef] bg-white shadow-2xs">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-bold text-slate-900 rounded-xl focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Net Cash in Drawer preview */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900">
              Net Cash in Drawer to Lock:
            </span>
            <span className="font-black text-emerald-800 text-sm">
              ₹{calculatedNetCash.toFixed(2)}
            </span>
          </div>

          {/* Toggle Manual Override */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isManual}
                onChange={(e) => setIsManual(e.target.checked)}
                className="rounded border-slate-300 text-[#00aeef] focus:ring-[#00aeef]"
              />
              <span>Use Rush Mode / Manual Count Override for this missed day</span>
            </label>
          </div>

          {isManual && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Actual Cash (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={overrideCash}
                  onChange={(e) => setOverrideCash(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Actual UPI (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={overrideUPI}
                  onChange={(e) => setOverrideUPI(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                  required
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md shadow-red-700/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarCheck className="w-4 h-4" />
              )}
              <span>{loading ? 'Processing...' : 'Lock & Close Missed Day'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
