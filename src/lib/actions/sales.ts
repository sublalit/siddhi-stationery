'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getScopeWhere } from '@/lib/dataScope';

export type PaymentModeType = 'CASH' | 'UPI';

export interface CreateQuickTransactionInput {
  amount: number;
  paymentMode: PaymentModeType;
  note?: string;
}

export interface CloseDayEndInput {
  totalCash: number;
  totalUPI: number;
  openingBalance?: number;
  totalExpenses?: number;
  netExpectedCash?: number;
  isManualEntry?: boolean;
  closedByRole?: string;
  date?: string | Date;
}

export interface RecordExpenseInput {
  amount: number;
  reason: string;
  userEmail?: string;
}

/**
 * Phase 2: Save Quick Sale transaction instantly
 * Accessible to STAFF, MANAGER, and ADMIN
 */
export async function createQuickTransaction(data: CreateQuickTransactionInput) {
  try {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    if (data.paymentMode !== 'CASH' && data.paymentMode !== 'UPI') {
      return { success: false, error: 'Payment mode must be CASH or UPI' };
    }

    const scope = await getScopeWhere();
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        isDemo: scope.isDemo,
        paymentMode: data.paymentMode,
        note: data.note?.trim() || null,
      },
    });

    revalidatePath('/quick-sale');
    revalidatePath('/daily-sales');
    revalidatePath('/');

    return { success: true, transaction };
  } catch (error: any) {
    console.error('createQuickTransaction error:', error);
    return { success: false, error: error.message || 'Failed to record transaction' };
  }
}

/**
 * Void a Quick Sale transaction (Soft Delete)
 * Marks isVoid = true so it remains visible for auditing,
 * but its amount is deducted / excluded from the daily total.
 */
export async function voidSale(id: string, userRole?: string) {
  try {
    const scope = await getScopeWhere();
    const existing = await prisma.transaction.findFirst({
      where: { id, ...scope },
    });

    if (!existing) {
      return { success: false, error: 'Transaction not found' };
    }

    if (existing.isVoid) {
      return { success: false, error: 'Transaction is already voided' };
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        isVoid: true,
      },
    });

    revalidatePath('/quick-sale');
    revalidatePath('/daily-sales');
    revalidatePath('/');

    return { success: true, transaction: updated };
  } catch (error: any) {
    console.error('voidSale error:', error);
    return { success: false, error: error.message || 'Failed to void transaction' };
  }
}

/**
 * Alias for voidSale
 */
export async function deleteQuickTransaction(id: string, userRole?: string) {
  return voidSale(id, userRole);
}

/**
 * Toggle Payment Mode (CASH <-> UPI) for an active Quick Sale transaction
 */
export async function togglePaymentMode(id: string, userRole?: string) {
  try {
    const scope = await getScopeWhere();
    const existing = await prisma.transaction.findFirst({
      where: { id, ...scope },
    });

    if (!existing) {
      return { success: false, error: 'Transaction not found' };
    }

    if (existing.isVoid) {
      return { success: false, error: 'Cannot change payment mode of a voided transaction' };
    }

    const nextMode: PaymentModeType = existing.paymentMode === 'CASH' ? 'UPI' : 'CASH';

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        paymentMode: nextMode,
      },
    });

    revalidatePath('/quick-sale');
    revalidatePath('/daily-sales');
    revalidatePath('/');

    return {
      success: true,
      transaction: updated,
      previousMode: existing.paymentMode,
      nextMode,
    };
  } catch (error: any) {
    console.error('togglePaymentMode error:', error);
    return { success: false, error: error.message || 'Failed to switch payment mode' };
  }
}


const DEFAULT_NOTE_PRESETS = [
  'Photocopy / Xerox',
  'Printout',
  'Notebooks',
  'Pens / Stationery',
  'Binding',
];

export interface QuickNotePresetItem {
  id: string;
  text: string;
  order: number;
}

/**
 * Fetch all quick note presets. If none exist in DB, seeds the initial defaults.
 */
export async function getQuickNotePresets(): Promise<{
  success: boolean;
  presets: QuickNotePresetItem[];
  error?: string;
}> {
  try {
    const scope = await getScopeWhere();
    let presets = await prisma.quickNotePreset.findMany({
      where: scope,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    if (presets.length === 0) {
      // Seed default presets
      await prisma.quickNotePreset.createMany({
        data: DEFAULT_NOTE_PRESETS.map((text, idx) => ({
          text,
          order: idx,
          isDemo: scope.isDemo,
        })),
        skipDuplicates: true,
      });

      presets = await prisma.quickNotePreset.findMany({
        where: scope,
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });
    }

    return {
      success: true,
      presets: presets.map((p) => ({ id: p.id, text: p.text, order: p.order })),
    };
  } catch (error: any) {
    console.error('getQuickNotePresets error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch quick note presets',
      presets: DEFAULT_NOTE_PRESETS.map((text, idx) => ({
        id: `default-${idx}`,
        text,
        order: idx,
      })),
    };
  }
}

/**
 * Create a new quick note preset
 */
export async function createQuickNotePreset(text: string): Promise<{
  success: boolean;
  preset?: QuickNotePresetItem;
  alreadyExisted?: boolean;
  error?: string;
}> {
  try {
    const trimmed = text?.trim();
    if (!trimmed) {
      return { success: false, error: 'Preset text cannot be empty' };
    }

    if (trimmed.length > 60) {
      return { success: false, error: 'Preset text must be 60 characters or less' };
    }

    // Check for existing case-insensitively
    const scope = await getScopeWhere();
    const existing = await prisma.quickNotePreset.findFirst({
      where: {
        ...scope,
        text: {
          equals: trimmed,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      return {
        success: true,
        preset: { id: existing.id, text: existing.text, order: existing.order },
        alreadyExisted: true,
      };
    }

    const count = await prisma.quickNotePreset.count({ where: scope });
    const preset = await prisma.quickNotePreset.create({
      data: {
        text: trimmed,
        order: count,
        isDemo: scope.isDemo,
      },
    });

    revalidatePath('/quick-sale');
    revalidatePath('/');

    return {
      success: true,
      preset: { id: preset.id, text: preset.text, order: preset.order },
      alreadyExisted: false,
    };
  } catch (error: any) {
    console.error('createQuickNotePreset error:', error);
    return { success: false, error: error.message || 'Failed to create preset' };
  }
}

/**
 * Delete a quick note preset
 */
export async function deleteQuickNotePreset(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const scope = await getScopeWhere();
    const { count } = await prisma.quickNotePreset.deleteMany({
      where: { id, ...scope },
    });
    if (count === 0) {
      return { success: false, error: 'Preset not found' };
    }

    revalidatePath('/quick-sale');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('deleteQuickNotePreset error:', error);
    return { success: false, error: error.message || 'Failed to delete preset' };
  }
}


/**
 * Record Daily Petty Cash Expense
 * RBAC Guard: Strictly ensures only ADMIN and MANAGER can add expenses.
 */
export async function recordExpense(data: RecordExpenseInput, userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot record expenses.');
  }

  try {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    if (!data.reason || !data.reason.trim()) {
      return { success: false, error: 'Reason for expense is required' };
    }

    let userId: string | null = null;
    if (data.userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: data.userEmail },
      });
      if (user) {
        userId = user.id;
      }
    }

    const scope = await getScopeWhere();
    const expense = await prisma.expense.create({
      data: {
        amount,
        reason: data.reason.trim(),
        userId,
        isDemo: scope.isDemo,
      },
      include: {
        addedBy: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    revalidatePath('/daily-sales');
    revalidatePath('/quick-sale');
    revalidatePath('/');

    return { success: true, expense };
  } catch (error: any) {
    console.error('recordExpense error:', error);
    if (error.message?.includes('403')) throw error;
    return { success: false, error: error.message || 'Failed to record expense' };
  }
}

/**
 * Update Petty Cash Expense with Time-Lock Guard
 * RBAC Guard: Admin & Manager only.
 * Time-Lock: If the day is already closed in DailyLedger, edits are strictly rejected.
 */
export async function updateExpense(
  id: string,
  data: { amount: number; reason: string },
  userRole?: string
) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot edit expenses.');
  }

  try {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }
    if (!data.reason || !data.reason.trim()) {
      return { success: false, error: 'Reason is required' };
    }

    const scope = await getScopeWhere();
    const existing = await prisma.expense.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return { success: false, error: 'Expense voucher not found' };
    }

    // Time-Lock Check: Check if Day-End Close has already been executed for this expense's date
    const { start, end } = getDayBounds(new Date(existing.createdAt));
    const ledger = await prisma.dailyLedger.findFirst({
      where: {
        ...scope,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    if (ledger) {
      return {
        success: false,
        error: 'Locked: This day has already been closed. Petty cash vouchers cannot be edited after day-end closing.',
      };
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount,
        reason: data.reason.trim(),
      },
    });

    revalidatePath('/daily-sales');
    revalidatePath('/quick-sale');
    revalidatePath('/');

    return { success: true, expense: updated };
  } catch (error: any) {
    console.error('updateExpense error:', error);
    if (error.message?.includes('403')) throw error;
    return { success: false, error: error.message || 'Failed to update expense' };
  }
}

/**
 * Delete Petty Cash Expense with Time-Lock Guard
 * RBAC Guard: Admin & Manager only.
 * Time-Lock: If the day is already closed in DailyLedger, deletion is strictly rejected.
 */
export async function deleteExpense(id: string, userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot delete expenses.');
  }

  try {
    const scope = await getScopeWhere();
    const existing = await prisma.expense.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return { success: false, error: 'Expense voucher not found' };
    }

    // Time-Lock Check: Check if Day-End Close has already been executed for this expense's date
    const { start, end } = getDayBounds(new Date(existing.createdAt));
    const ledger = await prisma.dailyLedger.findFirst({
      where: {
        ...scope,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    if (ledger) {
      return {
        success: false,
        error: 'Locked: This day has already been closed. Petty cash vouchers cannot be deleted after day-end closing.',
      };
    }

    await prisma.expense.delete({ where: { id } });

    revalidatePath('/daily-sales');
    revalidatePath('/quick-sale');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('deleteExpense error:', error);
    if (error.message?.includes('403')) throw error;
    return { success: false, error: error.message || 'Failed to delete expense' };
  }
}

/**
 * Set Opening Cash Balance for the Day
 * RBAC Guard: Admin & Manager only
 */
export async function setOpeningCashBalance(
  data: { date?: string | Date; openingBalance: number },
  userRole?: string
) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot set opening cash balance.');
  }

  try {
    const openingBalance = Number(data.openingBalance);
    if (isNaN(openingBalance) || openingBalance < 0) {
      return { success: false, error: 'Opening cash balance must be a valid non-negative number.' };
    }

    const targetDate = data.date ? new Date(data.date) : new Date();
    const { start, end, normalized } = getDayBounds(targetDate);
    const scope = await getScopeWhere();

    const existing = await prisma.dailyLedger.findFirst({
      where: {
        ...scope,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    if (existing) {
      const netExpectedCash = Number(
        (openingBalance + existing.totalCash - existing.totalExpenses).toFixed(2)
      );
      await prisma.dailyLedger.update({
        where: { id: existing.id },
        data: {
          openingBalance,
          netExpectedCash,
        },
      });
    } else {
      await prisma.dailyLedger.create({
        data: {
          date: normalized,
          openingBalance,
          totalCash: 0,
          totalUPI: 0,
          totalSales: 0,
          totalExpenses: 0,
          netExpectedCash: openingBalance,
          isManualEntry: false,
          closedByRole: userRole || 'ADMIN',
          isDemo: scope.isDemo,
        },
      });
    }

    revalidatePath('/daily-sales');
    revalidatePath('/');

    return { success: true, openingBalance };
  } catch (error: any) {
    console.error('setOpeningCashBalance error:', error);
    if (error.message?.includes('403')) throw error;
    return { success: false, error: error.message || 'Failed to update opening cash balance' };
  }
}

/**
 * Fetch recent quick transactions (for counter feed and instant cashier verification)
 * Accessible to all roles
 */
export async function getRecentTransactions(limit = 15) {
  try {
    const scope = await getScopeWhere();
    const transactions = await prisma.transaction.findMany({
      where: scope,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return transactions;
  } catch (error: any) {
    console.error('getRecentTransactions error:', error);
    return [];
  }
}

/**
 * Helper to get local start and end of a date
 */
function getDayBounds(targetDate = new Date()) {
  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
  const normalized = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  return { start, end, normalized };
}

function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Phase 3: Fetch today's total CASH, UPI, EXPENSES, and OPENING BALANCE
 * Formula: Net Cash in Drawer = (Opening Cash + Total Cash Sales) - Total Expenses
 * RBAC Guard: Strictly blocks STAFF from accessing this server action
 */
export async function getTodaySalesStats(userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot access Daily Sales EOD stats.');
  }

  try {
    const { start, end, normalized } = getDayBounds();
    const scope = await getScopeWhere();

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        ...scope,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: {
        ...scope,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        addedBy: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalCash = 0;
    let totalUPI = 0;
    let cashCount = 0;
    let upiCount = 0;

    for (const tx of transactions) {
      if (tx.isVoid) continue; // Exclude voided/soft-deleted sales from drawer totals
      if (tx.paymentMode === 'CASH') {
        totalCash += tx.amount;
        cashCount += 1;
      } else if (tx.paymentMode === 'UPI') {
        totalUPI += tx.amount;
        upiCount += 1;
      }
    }

    let totalExpenses = 0;
    for (const exp of expenses) {
      totalExpenses += exp.amount;
    }

    const totalSales = Number((totalCash + totalUPI).toFixed(2));
    totalCash = Number(totalCash.toFixed(2));
    totalUPI = Number(totalUPI.toFixed(2));
    totalExpenses = Number(totalExpenses.toFixed(2));

    // Check if day is already in DailyLedger (for opening balance or closure)
    const existingLedger = await prisma.dailyLedger.findFirst({
      where: {
        ...scope,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const openingBalance = existingLedger?.openingBalance ?? 0;
    // Formula: Net Cash in Drawer = (Opening Cash + Total Cash Sales) - Total Expenses
    const netExpectedCash = Number((openingBalance + totalCash - totalExpenses).toFixed(2));

    // A day is formally closed if it has been closed via day-end (sales match or closing committed)
    const isClosed = !!(existingLedger && existingLedger.totalSales > 0);

    return {
      success: true,
      openingBalance,
      totalCash,
      totalUPI,
      totalSales,
      totalExpenses,
      netExpectedCash,
      totalCount: transactions.filter((t) => !t.isVoid).length,
      cashCount,
      upiCount,
      transactions,
      expenses,
      isClosed,
      closedLedger: existingLedger,
      todayDate: normalized.toISOString(),
    };
  } catch (error: any) {
    console.error('getTodaySalesStats error:', error);
    if (error.message?.includes('403')) throw error;
    return {
      success: false,
      error: error.message || 'Failed to fetch sales stats',
      openingBalance: 0,
      totalCash: 0,
      totalUPI: 0,
      totalSales: 0,
      totalExpenses: 0,
      netExpectedCash: 0,
      totalCount: 0,
      cashCount: 0,
      upiCount: 0,
      transactions: [],
      expenses: [],
      isClosed: false,
      closedLedger: null,
      todayDate: new Date().toISOString(),
    };
  }
}

/**
 * Alias for getTodaySalesStats
 */
export const getTodaySales = getTodaySalesStats;

/**
 * Prompt 1: Check for any missed / unclosed past days before today
 * RBAC Guard: Strictly blocks STAFF
 */
export async function checkPendingDayClosings(userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot check pending day closings.');
  }

  try {
    const { start: todayStart } = getDayBounds(new Date());
    const scope = await getScopeWhere();

    // Find all transactions before today
    const pastTransactions = await prisma.transaction.findMany({
      where: {
        ...scope,
        createdAt: {
          lt: todayStart,
        },
        isVoid: false,
      },
      select: {
        id: true,
        amount: true,
        paymentMode: true,
        isVoid: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Find all expenses before today
    const pastExpenses = await prisma.expense.findMany({
      where: {
        ...scope,
        createdAt: {
          lt: todayStart,
        },
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group dates by YYYY-MM-DD
    const dateMap = new Map<string, Date>();
    for (const tx of pastTransactions) {
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dateMap.has(key)) dateMap.set(key, d);
    }
    for (const exp of pastExpenses) {
      const d = new Date(exp.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dateMap.has(key)) dateMap.set(key, d);
    }

    const pendingDays = [];

    for (const [dateKey, sampleDate] of dateMap.entries()) {
      const { start, end, normalized } = getDayBounds(sampleDate);

      // Check if DailyLedger already exists and is closed for this day
      const existingLedger = await prisma.dailyLedger.findFirst({
        where: {
          ...scope,
          date: {
            gte: start,
            lte: end,
          },
        },
      });

      // If no ledger, or ledger is just an unclosed draft (totalSales === 0 and totalCash === 0)
      if (!existingLedger || (existingLedger.totalSales === 0 && existingLedger.totalCash === 0)) {
        // Calculate figures for this missed date
        let dayCash = 0;
        let dayUPI = 0;
        let dayTxnCount = 0;

        for (const tx of pastTransactions) {
          const txTime = new Date(tx.createdAt).getTime();
          if (txTime >= start.getTime() && txTime <= end.getTime()) {
            dayTxnCount++;
            if (tx.paymentMode === 'CASH') dayCash += tx.amount;
            else if (tx.paymentMode === 'UPI') dayUPI += tx.amount;
          }
        }

        let dayExpenses = 0;
        for (const exp of pastExpenses) {
          const expTime = new Date(exp.createdAt).getTime();
          if (expTime >= start.getTime() && expTime <= end.getTime()) {
            dayExpenses += exp.amount;
          }
        }

        const openingBal = existingLedger?.openingBalance ?? 0;
        const totalSales = Number((dayCash + dayUPI).toFixed(2));
        dayCash = Number(dayCash.toFixed(2));
        dayUPI = Number(dayUPI.toFixed(2));
        dayExpenses = Number(dayExpenses.toFixed(2));
        const netCash = Number((openingBal + dayCash - dayExpenses).toFixed(2));

        pendingDays.push({
          dateKey,
          date: normalized.toISOString(),
          formattedDate: sampleDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          openingBalance: openingBal,
          totalCash: dayCash,
          totalUPI: dayUPI,
          totalSales,
          totalExpenses: dayExpenses,
          netExpectedCash: netCash,
          transactionCount: dayTxnCount,
        });
      }
    }

    // Sort descending by date
    pendingDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { success: true, pendingDays };
  } catch (error: any) {
    console.error('checkPendingDayClosings error:', error);
    if (error.message?.includes('403')) throw error;
    return { success: false, error: error.message || 'Failed to check pending closings', pendingDays: [] };
  }
}

/**
 * Prompt 1: Process and close a backdated missed day
 * RBAC Guard: Strictly blocks STAFF
 */
export async function closeBackdatedDay(
  data: {
    date: string | Date;
    openingBalance?: number;
    totalCash?: number;
    totalUPI?: number;
    isManualEntry?: boolean;
    closedByRole?: string;
  },
  userRole?: string
) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot close backdated days.');
  }

  try {
    const targetDate = new Date(data.date);
    const { start, end, normalized } = getDayBounds(targetDate);
    const scope = await getScopeWhere();

    // Fetch expenses for that backdated day
    const dayExpenses = await prisma.expense.findMany({
      where: {
        ...scope,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalExpenses = Number(
      dayExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)
    );

    // If cash / UPI not provided, calculate from transactions
    let totalCash = Number(data.totalCash);
    let totalUPI = Number(data.totalUPI);

    if (isNaN(totalCash) || isNaN(totalUPI)) {
      const dayTxs = await prisma.transaction.findMany({
        where: { ...scope, createdAt: { gte: start, lte: end }, isVoid: false },
      });
      totalCash = dayTxs.filter((t) => t.paymentMode === 'CASH').reduce((s, t) => s + t.amount, 0);
      totalUPI = dayTxs.filter((t) => t.paymentMode === 'UPI').reduce((s, t) => s + t.amount, 0);
    }

    totalCash = Number(totalCash.toFixed(2));
    totalUPI = Number(totalUPI.toFixed(2));
    const totalSales = Number((totalCash + totalUPI).toFixed(2));
    const openingBalance = Number(data.openingBalance) || 0;
    // Formula: Net Cash in Drawer = (Opening Cash + Total Cash Sales) - Total Expenses
    const netExpectedCash = Number((openingBalance + totalCash - totalExpenses).toFixed(2));

    const existing = await prisma.dailyLedger.findFirst({
      where: {
        ...scope,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    let savedLedger;
    if (existing) {
      savedLedger = await prisma.dailyLedger.update({
        where: { id: existing.id },
        data: {
          openingBalance,
          totalCash,
          totalUPI,
          totalSales,
          totalExpenses,
          netExpectedCash,
          isManualEntry: Boolean(data.isManualEntry),
          closedByRole: data.closedByRole || userRole || 'ADMIN',
        },
      });
    } else {
      savedLedger = await prisma.dailyLedger.create({
        data: {
          date: normalized,
          openingBalance,
          totalCash,
          totalUPI,
          totalSales,
          totalExpenses,
          netExpectedCash,
          isManualEntry: Boolean(data.isManualEntry),
          closedByRole: data.closedByRole || userRole || 'ADMIN',
          isDemo: scope.isDemo,
        },
      });
    }

    revalidatePath('/daily-sales');
    revalidatePath('/quick-sale');
    revalidatePath('/');

    return { success: true, ledger: savedLedger };
  } catch (error: any) {
    console.error('closeBackdatedDay error:', error);
    if (error.message?.includes('403')) throw error;
    return { success: false, error: error.message || 'Failed to close backdated day' };
  }
}

/**
 * Phase 3: Fetch historical records from the DailyLedger table
 * RBAC Guard: Strictly blocks STAFF from accessing this server action
 */
export async function getDailyLedgerHistory(
  userRole?: string,
  month?: number,
  year?: number
) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot access Daily Ledger records.');
  }

  try {
    const now = new Date();
    const selectedMonth =
      typeof month === 'number' && month >= 1 && month <= 12 ? month : now.getMonth() + 1;
    const selectedYear =
      typeof year === 'number' && year >= 2026 ? year : now.getFullYear();
    const { start, end } = getMonthBounds(selectedYear, selectedMonth);
    const scope = await getScopeWhere();

    const records = await prisma.dailyLedger.findMany({
      where: {
        ...scope,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'desc' },
    });
    return records;
  } catch (error: any) {
    console.error('getDailyLedgerHistory error:', error);
    if (error.message?.includes('403')) throw error;
    return [];
  }
}

/**
 * Phase 3: Close Day-End Ledger (Auto or Manual Override)
 * Formula: Net Cash in Drawer = (Opening Cash + Total Cash Sales) - Total Expenses
 * RBAC Guard: Strictly blocks STAFF from closing the day
 */
export async function closeDayEndLedger(data: CloseDayEndInput, userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot close day-end ledger.');
  }

  try {
    const rawCash = Number(data.totalCash);
    const rawUPI = Number(data.totalUPI);

    if (isNaN(rawCash) || rawCash < 0 || isNaN(rawUPI) || rawUPI < 0) {
      return { success: false, error: 'Cash and UPI amounts must be valid non-negative numbers.' };
    }

    const totalCash = Number(rawCash.toFixed(2));
    const totalUPI = Number(rawUPI.toFixed(2));
    const totalSales = Number((totalCash + totalUPI).toFixed(2));
    const isManualEntry = Boolean(data.isManualEntry);
    const roleToStore = data.closedByRole || userRole || 'MANAGER';

    const targetDate = data.date ? new Date(data.date) : new Date();
    const { start, end, normalized } = getDayBounds(targetDate);
    const scope = await getScopeWhere();

    // Look for existing ledger entry for the day to check opening balance
    const existing = await prisma.dailyLedger.findFirst({
      where: {
        ...scope,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const openingBalance = data.openingBalance !== undefined
      ? Number(data.openingBalance)
      : (existing?.openingBalance ?? 0);

    // Calculate totalExpenses from today's expenses if not provided
    let totalExpenses = Number(data.totalExpenses);
    if (isNaN(totalExpenses) || totalExpenses < 0) {
      const dayExpenses = await prisma.expense.findMany({
        where: { ...scope, createdAt: { gte: start, lte: end } },
      });
      totalExpenses = dayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    }
    totalExpenses = Number(totalExpenses.toFixed(2));

    // Formula: Net Cash in Drawer = (Opening Cash + Total Cash Sales) - Total Expenses
    const netExpectedCash = Number((openingBalance + totalCash - totalExpenses).toFixed(2));

    let savedLedger;
    if (existing) {
      savedLedger = await prisma.dailyLedger.update({
        where: { id: existing.id },
        data: {
          openingBalance,
          totalCash,
          totalUPI,
          totalSales,
          totalExpenses,
          netExpectedCash,
          isManualEntry,
          closedByRole: roleToStore,
        },
      });
    } else {
      savedLedger = await prisma.dailyLedger.create({
        data: {
          date: normalized,
          openingBalance,
          totalCash,
          totalUPI,
          totalSales,
          totalExpenses,
          netExpectedCash,
          isManualEntry,
          closedByRole: roleToStore,
          isDemo: scope.isDemo,
        },
      });
    }

    revalidatePath('/daily-sales');
    revalidatePath('/quick-sale');
    revalidatePath('/');

    return { success: true, ledger: savedLedger };
  } catch (error: any) {
    console.error('closeDayEndLedger error:', error);
    if (error.message?.includes('403')) throw error;
    return { success: false, error: error.message || 'Failed to close day-end ledger.' };
  }
}

/**
 * Alias for closeDayEndLedger
 */
export const closeDayRegister = closeDayEndLedger;

/**
 * Fetch detailed sales and expenses for a specific historical date
 * Used for the on-demand expandable accordion in Day-End Closing History
 * RBAC Guard: Admin & Manager only
 */
export async function getDailyLedgerDetails(date: string | Date, userRole?: string) {
  if (userRole === 'STAFF' || userRole === 'Staff') {
    throw new Error('403 Forbidden: Staff role cannot view detailed ledger history.');
  }

  try {
    const targetDate = new Date(date);
    const { start, end } = getDayBounds(targetDate);
    const scope = await getScopeWhere();

    const [transactions, expenses] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...scope,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.expense.findMany({
        where: {
          ...scope,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          addedBy: {
            select: { name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      success: true,
      transactions,
      expenses,
    };
  } catch (error: any) {
    console.error('getDailyLedgerDetails error:', error);
    if (error.message?.includes('403')) throw error;
    return {
      success: false,
      error: error.message || 'Failed to fetch ledger details',
      transactions: [],
      expenses: [],
    };
  }
}
