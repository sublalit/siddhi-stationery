'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Home,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Banknote,
  QrCode,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
  Lock,
  Clock,
  FileCheck2,
  Receipt,
  User,
  AlertTriangle,
  Pencil,
  Trash2,
  Calendar,
  Save,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import {
  getTodaySalesStats,
  getDailyLedgerHistory,
  closeDayEndLedger,
  checkPendingDayClosings,
  setOpeningCashBalance,
  deleteExpense,
  getDailyLedgerDetails,
} from '@/lib/actions/sales';
import QuickSaleForm from '@/components/sales/QuickSaleForm';
import RecordExpenseModal from '@/components/sales/RecordExpenseModal';
import EditExpenseModal from '@/components/sales/EditExpenseModal';
import BackdatedCloseModal from '@/components/sales/BackdatedCloseModal';
import MonthYearPicker from '@/components/sales/MonthYearPicker';
import {
  TableSkeleton,
  PETTY_CASH_SKELETON_COLUMNS,
  CLOSING_HISTORY_SKELETON_COLUMNS,
} from '@/components/sales/TableSkeleton';

const HISTORY_MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
] as const;

const HISTORY_START_YEAR = 2026;

function getHistoryYearOptions() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = HISTORY_START_YEAR; year <= Math.max(HISTORY_START_YEAR, currentYear); year++) {
    years.push(year);
  }
  return years;
}

export default function DailySalesPage() {
  const { role, isStaff } = useAuth();

  const [stats, setStats] = useState<{
    openingBalance: number;
    totalCash: number;
    totalUPI: number;
    totalSales: number;
    totalExpenses: number;
    netExpectedCash: number;
    totalCount: number;
    cashCount: number;
    upiCount: number;
    transactions: any[];
    expenses: any[];
    isClosed: boolean;
    closedLedger: any | null;
  } | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [historyMonth, setHistoryMonth] = useState(() => new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(() => new Date().getFullYear());
  const [pendingDays, setPendingDays] = useState<any[]>([]);
  const [selectedPendingDay, setSelectedPendingDay] = useState<any | null>(null);
  const [isBackdatedModalOpen, setIsBackdatedModalOpen] = useState(false);

  // Accordion Expandable History Row State
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [rowDetailsCache, setRowDetailsCache] = useState<
    Record<
      string,
      {
        loading: boolean;
        transactions: any[];
        expenses: any[];
        error?: string;
      }
    >
  >({});

  const [loading, setLoading] = useState(true);
  const [closingActionLoading, setClosingActionLoading] = useState(false);
  const [closingSuccessMsg, setClosingSuccessMsg] = useState<string | null>(null);
  const [closingErrorMsg, setClosingErrorMsg] = useState<string | null>(null);

  // Opening Balance State
  const [openingBalanceInput, setOpeningBalanceInput] = useState<string>('0');
  const [savingOpeningBalance, setSavingOpeningBalance] = useState(false);

  // Manual Override Form State (Option B)
  const [manualCash, setManualCash] = useState<string>('');
  const [manualUPI, setManualUPI] = useState<string>('');
  const [activeClosingTab, setActiveClosingTab] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [showQuickSaleDrawer, setShowQuickSaleDrawer] = useState(false);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (isStaff) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setClosingErrorMsg(null);

      // 1. Today's stats
      const statsRes = await getTodaySalesStats(role);
      if (statsRes.success) {
        setStats(statsRes as any);
        setOpeningBalanceInput(String((statsRes as any).openingBalance ?? 0));
      }

      // 2. Historical ledger records for the selected month/year
      const historyRes = await getDailyLedgerHistory(role, historyMonth, historyYear);
      setHistory(historyRes);

      // 3. Prompt 1: Check for missed past days
      const pendingRes = await checkPendingDayClosings(role);
      if (pendingRes.success) {
        setPendingDays(pendingRes.pendingDays || []);
      }
    } catch (err: any) {
      setClosingErrorMsg(err?.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, [role, isStaff, historyMonth, historyYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Opening Balance
  const handleSaveOpeningBalance = async () => {
    const val = parseFloat(openingBalanceInput);
    if (isNaN(val) || val < 0) {
      setClosingErrorMsg('Opening cash drawer balance must be a valid non-negative number.');
      return;
    }

    try {
      setSavingOpeningBalance(true);
      setClosingErrorMsg(null);
      const res = await setOpeningCashBalance({ openingBalance: val }, role);
      if (!res.success) {
        setClosingErrorMsg(res.error || 'Failed to save opening balance');
        return;
      }
      setClosingSuccessMsg(`Opening cash balance set to ₹${val.toFixed(2)}.`);
      await fetchData();
    } catch (err: any) {
      setClosingErrorMsg(err?.message || 'Failed to update opening balance');
    } finally {
      setSavingOpeningBalance(false);
    }
  };

  // Option A: Close Day with Auto Totals
  const handleAutoClose = async () => {
    if (!stats) return;
    try {
      setClosingActionLoading(true);
      setClosingErrorMsg(null);
      setClosingSuccessMsg(null);

      const res = await closeDayEndLedger(
        {
          openingBalance: stats.openingBalance,
          totalCash: stats.totalCash,
          totalUPI: stats.totalUPI,
          totalExpenses: stats.totalExpenses,
          netExpectedCash: stats.netExpectedCash,
          isManualEntry: false,
          closedByRole: role,
        },
        role
      );

      if (!res.success) {
        setClosingErrorMsg(res.error || 'Failed to close day');
        return;
      }

      setClosingSuccessMsg(
        `Day successfully closed with Auto Totals! Net Cash: ₹${stats.netExpectedCash.toFixed(2)}, Total Sales: ₹${stats.totalSales.toFixed(2)}.`
      );
      await fetchData();
    } catch (err: any) {
      setClosingErrorMsg(err?.message || 'Failed to close day');
    } finally {
      setClosingActionLoading(false);
    }
  };

  // Option B: Close Day with Manual Override (Rush Mode)
  const handleManualClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setClosingErrorMsg(null);
    setClosingSuccessMsg(null);

    const parsedCash = parseFloat(manualCash);
    const parsedUPI = parseFloat(manualUPI);

    if (isNaN(parsedCash) || parsedCash < 0 || isNaN(parsedUPI) || parsedUPI < 0) {
      setClosingErrorMsg('Please enter valid, non-negative amounts for Cash and UPI.');
      return;
    }

    try {
      setClosingActionLoading(true);
      const openBal = stats?.openingBalance || 0;
      const res = await closeDayEndLedger(
        {
          openingBalance: openBal,
          totalCash: parsedCash,
          totalUPI: parsedUPI,
          totalExpenses: stats?.totalExpenses || 0,
          netExpectedCash: (openBal + parsedCash) - (stats?.totalExpenses || 0),
          isManualEntry: true,
          closedByRole: role,
        },
        role
      );

      if (!res.success) {
        setClosingErrorMsg(res.error || 'Failed to close day');
        return;
      }

      const total = parsedCash + parsedUPI;
      setClosingSuccessMsg(`Day closed via Manual Override! Total: ₹${total.toFixed(2)}`);
      setManualCash('');
      setManualUPI('');
      await fetchData();
    } catch (err: any) {
      setClosingErrorMsg(err?.message || 'Failed to close day');
    } finally {
      setClosingActionLoading(false);
    }
  };

  // Delete Expense Handler with confirmation & Time-Lock check
  const handleDeleteExpense = async (expense: any) => {
    if (stats?.isClosed) {
      setClosingErrorMsg('Locked: Day has already been closed. Petty cash vouchers cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the voucher of ₹${expense.amount} for "${expense.reason}"?`)) {
      return;
    }

    try {
      setDeletingExpenseId(expense.id);
      const res = await deleteExpense(expense.id, role);
      if (!res.success) {
        setClosingErrorMsg(res.error || 'Failed to delete expense');
        return;
      }
      setClosingSuccessMsg('Petty cash voucher deleted.');
      await fetchData();
    } catch (err: any) {
      setClosingErrorMsg(err?.message || 'Failed to delete expense');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  // Toggle Accordion Row & Fetch Details On-Demand
  const handleToggleRow = async (recordId: string, recordDate: string | Date) => {
    if (expandedRowId === recordId) {
      setExpandedRowId(null);
      return;
    }

    setExpandedRowId(recordId);

    // If details already cached and not loading, skip refetching
    if (rowDetailsCache[recordId] && !rowDetailsCache[recordId].loading) {
      return;
    }

    // Set loading indicator in cache
    setRowDetailsCache((prev) => ({
      ...prev,
      [recordId]: { loading: true, transactions: [], expenses: [] },
    }));

    try {
      const res = await getDailyLedgerDetails(recordDate, role);
      if (res.success) {
        setRowDetailsCache((prev) => ({
          ...prev,
          [recordId]: {
            loading: false,
            transactions: res.transactions || [],
            expenses: res.expenses || [],
          },
        }));
      } else {
        setRowDetailsCache((prev) => ({
          ...prev,
          [recordId]: {
            loading: false,
            transactions: [],
            expenses: [],
            error: res.error || 'Failed to load details',
          },
        }));
      }
    } catch (err: any) {
      setRowDetailsCache((prev) => ({
        ...prev,
        [recordId]: {
          loading: false,
          transactions: [],
          expenses: [],
          error: err?.message || 'Failed to load details',
        },
      }));
    }
  };

  // RBAC Guard: Strictly block STAFF from accessing this dashboard
  if (isStaff) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-red-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-extrabold text-red-700 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>403 Access Denied — RBAC Protected</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Restricted Financial Dashboard
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Day-End Closing (EOD) metrics, opening cash float, and ledger reconciliations are strictly restricted to <strong>Manager</strong> and <strong>Admin</strong> roles.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Cashier & Staff Instructions:
          </p>
          <p className="text-slate-600">
            You can enter instant counter sales on the Quick Sale Counter. All recorded sales are automatically forwarded to management for end-of-day reconciliation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/quick-sale"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00aeef] hover:bg-[#0284c7] text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Go to Quick Sale Counter</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
          >
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculated variance for manual override vs Net Cash In Drawer
  const manualCashNum = parseFloat(manualCash) || 0;
  const manualUPINum = parseFloat(manualUPI) || 0;
  const manualTotal = manualCashNum + manualUPINum;
  const cashVariance = stats ? manualCashNum - stats.netExpectedCash : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/" className="hover:text-slate-800 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Day-End Closing (EOD)</span>
      </div>

      {/* PROMPT 1: PROMINENT RED WARNING BANNER FOR MISSED / UNCLOSED PAST DAYS */}
      {pendingDays.length > 0 && (
        <div className="space-y-3 animate-in slide-in-from-top-3 duration-200">
          {pendingDays.map((missedDay) => (
            <div
              key={missedDay.dateKey}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg shadow-red-700/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-red-400/40"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                    ⚠️ You have missed a Day-End Close for {missedDay.formattedDate}.
                  </h3>
                  <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
                    This past day has <strong>{missedDay.transactionCount} counter sales</strong> (Cash: ₹{missedDay.totalCash.toFixed(2)}, UPI: ₹{missedDay.totalUPI.toFixed(2)}, Expenses: ₹{missedDay.totalExpenses.toFixed(2)}) without a finalized ledger entry. Please close it first to keep audit books accurate.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPendingDay(missedDay);
                  setIsBackdatedModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-red-700 hover:bg-red-50 text-xs font-black shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-red-600" />
                <span>Backdated Close for {missedDay.formattedDate}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Backdated Close Modal */}
      <BackdatedCloseModal
        isOpen={isBackdatedModalOpen}
        onClose={() => {
          setIsBackdatedModalOpen(false);
          setSelectedPendingDay(null);
        }}
        dayData={selectedPendingDay}
        onSuccess={fetchData}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Daily Sales, Expenses & EOD Closing
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-[#0284c7]">
              <ShieldCheck className="w-3.5 h-3.5" />
              {role} View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reconcile opening cash float, counter sales, petty cash payouts, and execute time-locked day closing.
          </p>
        </div>

        {/* Action Buttons: Red "Record Expense", Quick Sale, and Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all shadow-sm shadow-rose-700/25 active:scale-95 cursor-pointer"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => setShowQuickSaleDrawer(!showQuickSaleDrawer)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 text-[#00aeef]" />
            <span>{showQuickSaleDrawer ? 'Hide Quick Sale' : '+ Log Quick Sale'}</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Record Expense Modal */}
      <RecordExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseRecorded={fetchData}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        onSuccess={fetchData}
      />

      {/* Collapsible Quick Sale Entry Area */}
      {showQuickSaleDrawer && (
        <div className="p-6 bg-cyan-50/50 rounded-2xl border-2 border-cyan-200/80 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00aeef]" />
              Quick Counter Sale (Immediate Sync)
            </h3>
            <button
              onClick={() => setShowQuickSaleDrawer(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Close
            </button>
          </div>
          <QuickSaleForm onTransactionSaved={fetchData} showRecentFeed={false} />
        </div>
      )}

      {/* Feedback Messages */}
      {closingSuccessMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-bold">{closingSuccessMsg}</p>
        </div>
      )}

      {closingErrorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-bold">{closingErrorMsg}</p>
        </div>
      )}

      {/* PROMPT 2 PHASE 1: OPENING CASH DRAWER BALANCE BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Opening Cash Drawer Float (Start of Day)
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                Current: ₹{(stats?.openingBalance || 0).toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Initial float change in drawer. Factored into Net Cash: <code className="text-slate-700 font-mono font-bold">(Opening + Cash Sales) - Expenses</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-36 sm:w-44">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold text-xs">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={openingBalanceInput}
              onChange={(e) => setOpeningBalanceInput(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#00aeef]"
              disabled={stats?.isClosed}
            />
          </div>
          <button
            onClick={handleSaveOpeningBalance}
            disabled={savingOpeningBalance || stats?.isClosed}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>{savingOpeningBalance ? 'Saving...' : 'Set Float'}</span>
          </button>
        </div>
      </div>

      {/* Live Stats Cards: Opening Float, Cash Sales, Expenses, Net Cash in Drawer, UPI, Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Opening Balance Float */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Opening Float
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            ₹{stats ? stats.openingBalance.toFixed(2) : '0.00'}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
            Drawer Start Float
          </div>
        </div>

        {/* Card 2: Today's Cash Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Cash Sales
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-800 tracking-tight">
            +₹{stats ? stats.totalCash.toFixed(2) : '0.00'}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
            {stats?.cashCount || 0} Cash Sales
          </div>
        </div>

        {/* Card 3: Today's Expenses (Petty Cash) in Red */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-colors bg-gradient-to-b from-rose-50/30 to-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Total Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 tracking-tight">
            -₹{stats ? stats.totalExpenses.toFixed(2) : '0.00'}
          </div>
          <div className="mt-2 text-[10px] text-rose-600/80 border-t border-rose-100 pt-1.5 flex items-center justify-between">
            <span>{stats?.expenses?.length || 0} Vouchers</span>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="font-bold text-rose-700 hover:underline"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Card 4: Net Cash in Drawer (Formula: Opening + Cash - Expenses) */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md shadow-emerald-800/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              Net Cash in Drawer
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            ₹{stats ? stats.netExpectedCash.toFixed(2) : '0.00'}
          </div>
          <div className="mt-2 text-[10px] text-emerald-100/90 border-t border-white/20 pt-1.5">
            Physical Cash to Count
          </div>
        </div>

        {/* Card 5: Today's UPI Total */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-cyan-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              UPI Total (Bank)
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-[#00aeef] flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            ₹{stats ? stats.totalUPI.toFixed(2) : '0.00'}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
            {stats?.upiCount || 0} Soundbox Txns
          </div>
        </div>

        {/* Card 6: Total Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-950 tracking-tight">
            ₹{stats ? stats.totalSales.toFixed(2) : '0.00'}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 flex items-center justify-between">
            <span>Cash + UPI</span>
            {stats?.isClosed ? (
              <span className="text-emerald-600 font-bold">Closed</span>
            ) : (
              <span className="text-amber-600 font-bold">Open</span>
            )}
          </div>
        </div>
      </div>

      {/* Day-End Closing Action Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#00aeef]" />
              Day-End Closing (EOD) Register
            </h2>
            <p className="text-xs text-slate-500">
              Commit day-end totals to the permanent ledger after verifying cash drawer and merchant settlement
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveClosingTab('AUTO')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeClosingTab === 'AUTO'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Option A: Auto Totals
            </button>
            <button
              type="button"
              onClick={() => setActiveClosingTab('MANUAL')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeClosingTab === 'MANUAL'
                  ? 'bg-white text-[#0284c7] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Option B: Rush Mode / Override
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {activeClosingTab === 'AUTO' ? (
            /* OPTION A: AUTO TOTALS */
            <div className="max-w-2xl space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50/50 via-slate-50 to-blue-50/30 border border-cyan-100 space-y-4">
                <div className="flex items-center gap-2 text-cyan-900 font-extrabold text-sm">
                  <Sparkles className="w-4 h-4 text-[#00aeef]" />
                  <span>Auto-Calculated Ledger Summary (Opening Float + Sales - Expenses)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Opening Float</span>
                    <span className="text-sm font-black text-slate-800">
                      ₹{stats ? stats.openingBalance.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cash Sales</span>
                    <span className="text-sm font-black text-slate-800">
                      ₹{stats ? stats.totalCash.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-rose-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-rose-500 block">Expenses</span>
                    <span className="text-sm font-black text-rose-600">
                      -₹{stats ? stats.totalExpenses.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Net Cash</span>
                    <span className="text-sm font-black text-emerald-800">
                      ₹{stats ? stats.netExpectedCash.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">UPI Total</span>
                    <span className="text-sm font-black text-[#00aeef]">
                      ₹{stats ? stats.totalUPI.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Total day revenue: <strong>₹{stats ? stats.totalSales.toFixed(2) : '0.00'}</strong>.
                  Expected physical cash in drawer: <strong>₹{stats ? stats.netExpectedCash.toFixed(2) : '0.00'}</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleAutoClose}
                  disabled={closingActionLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00aeef] to-[#0284c7] hover:from-cyan-400 hover:to-sky-600 text-white font-extrabold text-sm shadow-md shadow-cyan-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <FileCheck2 className="w-5 h-5" />
                  <span>
                    {closingActionLoading ? 'Closing Day...' : 'Close Day with Auto Totals'}
                  </span>
                </button>
                {stats?.isClosed && (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Today is already closed. Submitting will update the record.
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* OPTION B: RUSH MODE / MANUAL OVERRIDE */
            <form onSubmit={handleManualClose} className="max-w-2xl space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <Sliders className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">
                    Rush Mode / Physical Drawer Count Override
                  </p>
                  <p className="text-amber-800 mt-0.5">
                    Count the physical cash remaining in your cash drawer (including opening float, minus all petty cash payouts) and check the UPI settlement report from your merchant app.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Manual Cash Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>Actual Cash in Drawer (₹)</span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Expected Net: ₹{stats ? stats.netExpectedCash.toFixed(2) : '0.00'}
                    </span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-[#00aeef] bg-white shadow-2xs">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={manualCash}
                      onChange={(e) => setManualCash(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-slate-900 font-bold text-base focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Manual UPI Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>Actual UPI Total (Merchant App ₹)</span>
                    <span className="text-[10px] text-slate-400">
                      System: ₹{stats ? stats.totalUPI.toFixed(2) : '0.00'}
                    </span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-[#00aeef] bg-white shadow-2xs">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={manualUPI}
                      onChange={(e) => setManualUPI(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-slate-900 font-bold text-base focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Live Variance Calculation vs Net Expected Cash */}
              {(manualCash || manualUPI) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                  <div>
                    <span className="text-slate-500">Calculated Manual Total: </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{manualTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {manualCash && (
                      <div>
                        <span className="text-slate-500">Cash in Drawer Variance: </span>
                        <span
                          className={`font-black text-sm ${
                            cashVariance >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {cashVariance >= 0
                            ? `+₹${cashVariance.toFixed(2)} (Excess)`
                            : `-₹${Math.abs(cashVariance).toFixed(2)} (Shortage)`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={closingActionLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm shadow-md shadow-amber-700/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sliders className="w-5 h-5" />
                  <span>
                    {closingActionLoading
                      ? 'Submitting Override...'
                      : 'Submit Day-End with Manual Override'}
                  </span>
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  Will flag ledger entry with <code className="text-amber-700 font-bold">isManualEntry: true</code>
                </span>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* PROMPT 2 PHASE 2: PETTY CASH CONTROLS (EDITABLE BUT TIME-LOCKED) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                Today's Petty Cash Vouchers ({stats?.expenses?.length || 0})
              </h2>
              {stats?.isClosed ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Locked (Day Closed)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Editable (Open Day)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cash outflows deducted from the drawer today. Vouchers become permanently locked once Day-End Close is executed.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
              Total Outflow: -₹{stats ? stats.totalExpenses.toFixed(2) : '0.00'}
            </div>
            {!stats?.isClosed && (
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                + Add Voucher
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton columns={PETTY_CASH_SKELETON_COLUMNS} rows={4} />
        ) : !stats?.expenses || stats.expenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No petty cash expenses logged for today. Click "+ Add Voucher" above if needed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3 px-6">Reason / Note</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>{exp.reason}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                      -₹{exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {exp.addedBy?.name || 'Manager / Admin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(exp.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {stats.isClosed ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold cursor-not-allowed"
                          title="Locked: This day has been closed and cannot be edited."
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          Locked
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingExpense(exp)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Edit Voucher"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp)}
                            disabled={deletingExpenseId === exp.id}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROMPT 2 PHASE 3: IMMUTABLE DAY-END HISTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-slate-700" />
                Day-End Closing History
              </h2>
              {/* IMMUTABLE AUDIT TRAIL BADGE */}
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white tracking-wide">
                <Lock className="w-2.5 h-2.5 text-cyan-400" />
                Immutable Audit Trail (Read-Only)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanent chronological ledger snapshots. Historical records cannot be modified or deleted.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <MonthYearPicker
              month={historyMonth}
              year={historyYear}
              years={getHistoryYearOptions()}
              onMonthChange={setHistoryMonth}
              onYearChange={setHistoryYear}
            />
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              {history.length} total closing records
            </span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton
            columns={CLOSING_HISTORY_SKELETON_COLUMNS}
            rows={4}
            headerRowClassName="py-3.5 px-4"
          />
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No day-end closings recorded for{' '}
            {HISTORY_MONTHS.find((m) => m.value === historyMonth)?.label} {historyYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 px-6">Closing Date</th>
                  <th className="py-3.5 px-4">Opening Float</th>
                  <th className="py-3.5 px-4">Cash Sales</th>
                  <th className="py-3.5 px-4">Total Expenses</th>
                  <th className="py-3.5 px-4">Net Cash in Drawer</th>
                  <th className="py-3.5 px-4">UPI Total</th>
                  <th className="py-3.5 px-4">Total Revenue</th>
                  <th className="py-3.5 px-4">Closing Mode</th>
                  <th className="py-3.5 px-4">Closed By Role</th>
                  <th className="py-3.5 px-6 text-right">Recorded At</th>
                  <th className="py-3.5 px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((record) => {
                  const recordDate = new Date(record.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  const createdAtTime = new Date(record.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const openFloat = record.openingBalance ?? 0;
                  const expensesVal = record.totalExpenses ?? 0;
                  const netCashVal = record.netExpectedCash ?? ((openFloat + record.totalCash) - expensesVal);
                  const isExpanded = expandedRowId === record.id;
                  const details = rowDetailsCache[record.id];

                  return (
                    <React.Fragment key={record.id}>
                      <tr
                        onClick={() => handleToggleRow(record.id, record.date)}
                        className={`hover:bg-slate-50/90 transition-colors cursor-pointer group ${
                          isExpanded ? 'bg-cyan-50/30' : ''
                        }`}
                      >
                        <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-[#00aeef]' : 'bg-slate-300'}`} />
                          <span>{recordDate}</span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-600">
                          ₹{openFloat.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          ₹{record.totalCash.toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded-md font-bold text-rose-700 bg-rose-50 border border-rose-100">
                            -₹{expensesVal.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-emerald-800 text-sm bg-emerald-50/30">
                          ₹{netCashVal.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#0284c7]">
                          ₹{record.totalUPI.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                          ₹{record.totalSales.toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          {record.isManualEntry ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-200">
                              <Sliders className="w-3 h-3 text-amber-700" />
                              Manual Override
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              Auto
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold">
                            {record.closedByRole}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-slate-400 font-mono text-[11px]">
                          {createdAtTime}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRow(record.id, record.date);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 group-hover:text-slate-700 transition-colors"
                            title={isExpanded ? 'Collapse breakdown' : 'Expand full breakdown'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#00aeef]" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* PHASE 3: NESTED ACCORDION AREA (On-Demand Detailed View) */}
                      {isExpanded && (
                        <tr className="bg-slate-100/70 border-b border-slate-200 animate-in fade-in duration-200">
                          <td colSpan={11} className="p-4 sm:p-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
                              {/* Accordion Detail Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-[#00aeef]" />
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    Full Daily Transaction Audit — {recordDate}
                                  </span>
                                  {details && !details.loading && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                                      {details.transactions.length} Sales • {details.expenses.length} Vouchers
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  Opening Float: <strong className="text-slate-800 font-mono">₹{openFloat.toFixed(2)}</strong> • Net Cash in Drawer: <strong className="text-emerald-700 font-mono">₹{netCashVal.toFixed(2)}</strong>
                                </div>
                              </div>

                              {/* Loading Spinner during on-demand fetch */}
                              {details?.loading ? (
                                <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-slate-400 text-xs">
                                  <Loader2 className="w-6 h-6 animate-spin text-[#00aeef]" />
                                  <span className="font-semibold text-slate-500">
                                    Fetching transactions & petty cash vouchers for {recordDate}...
                                  </span>
                                </div>
                              ) : details?.error ? (
                                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                                  {details.error}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {/* 1. SALES BREAKDOWN (styled like Recent Quick Sales) */}
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                      <span className="flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-[#00aeef]" />
                                        Sales Breakdown ({details?.transactions.length || 0})
                                      </span>
                                      <span className="text-slate-500 font-mono text-[11px]">
                                        ₹{record.totalSales.toFixed(2)} Recorded
                                      </span>
                                    </div>

                                    {(!details?.transactions || details.transactions.length === 0) ? (
                                      <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        No individual counter transactions found for this date.
                                      </div>
                                    ) : (
                                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto bg-slate-50/60 rounded-xl border border-slate-200/80 p-2">
                                        {details.transactions.map((tx: any) => {
                                          const isCash = tx.paymentMode === 'CASH';
                                          const isVoid = Boolean(tx.isVoid);
                                          const txTime = new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                          });
                                          return (
                                            <div
                                              key={tx.id}
                                              className={`py-2.5 px-3 flex items-center justify-between text-xs rounded-lg transition-colors ${
                                                isVoid ? 'bg-red-50/50 text-slate-500' : 'hover:bg-white'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5">
                                                <span
                                                  className={`px-1.5 py-0.5 rounded font-bold text-[9px] flex items-center gap-1 ${
                                                    isVoid
                                                      ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                                      : isCash
                                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                      : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                                  }`}
                                                >
                                                  {isCash ? <Banknote className="w-2.5 h-2.5" /> : <QrCode className="w-2.5 h-2.5" />}
                                                  {tx.paymentMode}
                                                </span>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span className={`font-semibold ${isVoid ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-800'}`}>
                                                    {tx.note || 'General Counter Sale'}
                                                  </span>
                                                  {isVoid && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-red-100 text-red-600 border border-red-200">
                                                      VOID
                                                    </span>
                                                  )}
                                                  <span className="text-[10px] text-slate-400 ml-2 font-mono">{txTime}</span>
                                                </div>
                                              </div>
                                              <span className={`font-extrabold text-xs font-mono ${isVoid ? 'text-red-500' : 'text-slate-900'}`}>
                                                {isVoid ? `-₹${tx.amount.toFixed(2)}` : `₹${tx.amount.toFixed(2)}`}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* 2. EXPENSE BREAKDOWN (styled like Petty Cash Vouchers) */}
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                      <span className="flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5 text-rose-600" />
                                        Petty Cash Outflows ({details?.expenses.length || 0})
                                      </span>
                                      <span className="text-rose-600 font-mono text-[11px] font-bold">
                                        -₹{expensesVal.toFixed(2)} Total Outflow
                                      </span>
                                    </div>

                                    {(!details?.expenses || details.expenses.length === 0) ? (
                                      <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        No petty cash expenses logged for this date.
                                      </div>
                                    ) : (
                                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto bg-slate-50/60 rounded-xl border border-slate-200/80 p-2">
                                        {details.expenses.map((exp: any) => {
                                          const expTime = new Date(exp.createdAt).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                          });
                                          return (
                                            <div
                                              key={exp.id}
                                              className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-white rounded-lg transition-colors"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                                <div>
                                                  <span className="font-semibold text-slate-800">{exp.reason}</span>
                                                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <span>{exp.addedBy?.name || 'Manager / Admin'}</span>
                                                    <span>•</span>
                                                    <span className="font-mono">{expTime}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              <span className="font-black text-rose-600 text-xs font-mono">
                                                -₹{exp.amount.toFixed(2)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
