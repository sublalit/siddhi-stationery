'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Plus,
  X,
  Check,
  CornerDownLeft,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';
import {
  createQuickTransaction,
  getRecentTransactions,
  getQuickNotePresets,
  createQuickNotePreset,
  deleteQuickNotePreset,
  voidSale,
  togglePaymentMode,
  QuickNotePresetItem,
  PaymentModeType,
} from '@/lib/actions/sales';
import { useAuth } from '@/lib/authContext';

interface QuickSaleFormProps {
  onTransactionSaved?: () => void;
  showRecentFeed?: boolean;
}

const COMMON_PRESETS = [10, 20, 50, 100, 200, 500];

const INITIAL_FALLBACK_PRESETS: QuickNotePresetItem[] = [
  { id: 'def-1', text: 'Photocopy / Xerox', order: 0 },
  { id: 'def-2', text: 'Printout', order: 1 },
  { id: 'def-3', text: 'Notebooks', order: 2 },
  { id: 'def-4', text: 'Pens / Stationery', order: 3 },
  { id: 'def-5', text: 'Binding', order: 4 },
];

interface PaymentBadge3DProps {
  mode: 'CASH' | 'UPI';
  isVoid: boolean;
  isFlipping: boolean;
}

function PaymentBadge3D({ mode, isVoid, isFlipping }: PaymentBadge3DProps) {
  if (isVoid) {
    return (
      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200">
        {mode === 'CASH' ? <Banknote className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
        {mode}
      </span>
    );
  }

  const isUPI = mode === 'UPI';

  return (
    <div
      className="relative w-[62px] h-[22px]"
      style={{
        perspective: '1000px',
        WebkitPerspective: '1000px',
      }}
    >
      <div
        className="w-full h-full relative"
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transform: isUPI ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: isFlipping ? 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        {/* Front Face: Green CASH */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 select-none shadow-2xs"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <Banknote className="w-3 h-3 shrink-0 text-emerald-700" />
          <span>CASH</span>
        </div>

        {/* Back Face: Blue UPI (pre-rotated by 180deg so it displays upright at 180deg) */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-cyan-100 text-cyan-800 border border-cyan-200 select-none shadow-2xs"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <QrCode className="w-3 h-3 shrink-0 text-cyan-700" />
          <span>UPI</span>
        </div>
      </div>
    </div>
  );
}

export default function QuickSaleForm({ onTransactionSaved, showRecentFeed = true }: QuickSaleFormProps) {
  const { role } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submittingMode, setSubmittingMode] = useState<PaymentModeType | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ amount: number; mode: PaymentModeType } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState<boolean>(false);
  const [voidingTxId, setVoidingTxId] = useState<string | null>(null);

  // Dynamic Quick Note Presets State
  const [presets, setPresets] = useState<QuickNotePresetItem[]>(INITIAL_FALLBACK_PRESETS);
  const [loadingPresets, setLoadingPresets] = useState<boolean>(false);
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [newPresetText, setNewPresetText] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [presetError, setPresetError] = useState<string | null>(null);

  // Autocomplete Combobox State
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const newPresetInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load presets from DB
  const loadPresets = async () => {
    try {
      setLoadingPresets(true);
      const res = await getQuickNotePresets();
      if (res.success && res.presets && res.presets.length > 0) {
        setPresets(res.presets);
      }
    } catch (err) {
      console.error('Failed to load presets', err);
    } finally {
      setLoadingPresets(false);
    }
  };

  // Load recent transactions for fast counter verification
  const loadRecent = async () => {
    try {
      setLoadingRecent(true);
      const data = await getRecentTransactions(10);
      setRecentTransactions(data);
    } catch (err) {
      console.error('Failed to load recent transactions', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const [confirmingVoidId, setConfirmingVoidId] = useState<string | null>(null);

  // Void a Quick Sale (Soft Delete)
  const handleConfirmVoid = async (id: string) => {
    try {
      setVoidingTxId(id);
      setConfirmingVoidId(null);
      setErrorMessage(null);
      const res = await voidSale(id, role);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to void transaction');
        return;
      }

      await loadRecent();
      onTransactionSaved?.();
    } catch (err: any) {
      console.error('Failed to void transaction:', err);
      setErrorMessage(err?.message || 'Failed to void transaction');
    } finally {
      setVoidingTxId(null);
    }
  };

  const [switchingTxId, setSwitchingTxId] = useState<string | null>(null);
  const [flippingTxIds, setFlippingTxIds] = useState<Set<string>>(new Set());

  // Toggle Payment Mode (CASH <-> UPI) with 3D Coin-Flip Animation
  const handleTogglePaymentMode = async (id: string) => {
    if (switchingTxId === id) return;

    try {
      setSwitchingTxId(id);
      setErrorMessage(null);

      // Start 3D coin-flip animation
      setFlippingTxIds((prev) => new Set(prev).add(id));

      // Optimistically flip the mode for instantaneous 3D response
      setRecentTransactions((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              paymentMode: t.paymentMode === 'CASH' ? 'UPI' : 'CASH',
            };
          }
          return t;
        })
      );

      const res = await togglePaymentMode(id, role);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to switch payment mode');
        await loadRecent();
        return;
      }

      onTransactionSaved?.();
    } catch (err: any) {
      console.error('Failed to switch payment mode:', err);
      setErrorMessage(err?.message || 'Failed to switch payment mode');
      await loadRecent();
    } finally {
      // Hold flipping state for the 500ms duration so transition completes smoothly
      setTimeout(() => {
        setFlippingTxIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setSwitchingTxId(null);
      }, 550);
    }
  };




  useEffect(() => {
    loadRecent();
    loadPresets();
    // Auto-focus amount on mount
    amountInputRef.current?.focus();
  }, []);

  // Handle outside click for autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        noteInputRef.current &&
        !noteInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Append preset to note input with comma-separation
  const handleAppendPreset = (presetText: string) => {
    setNote((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return presetText;
      }
      // If ends with comma or spaces after comma, clean it before appending
      const cleaned = trimmed.replace(/,\s*$/, '');
      if (!cleaned) {
        return presetText;
      }
      return `${cleaned}, ${presetText}`;
    });
    setShowDropdown(false);
    setHighlightedIndex(-1);
    noteInputRef.current?.focus();
  };

  // Determine active segment after last comma for filtering
  const segments = note.split(',');
  const activeSegment = (segments[segments.length - 1] || '').trim();

  // Filter matching suggestions based on active typed segment
  const filteredSuggestions = presets.filter((p) => {
    if (!activeSegment) return true;
    return p.text.toLowerCase().includes(activeSegment.toLowerCase());
  });

  // Select item from autocomplete combobox dropdown
  const handleSelectDropdownSuggestion = (presetText: string) => {
    setNote((prev) => {
      const lastCommaIndex = prev.lastIndexOf(',');
      if (lastCommaIndex === -1) {
        return presetText;
      }
      const prefix = prev.slice(0, lastCommaIndex).trim();
      return prefix ? `${prefix}, ${presetText}` : presetText;
    });
    setShowDropdown(false);
    setHighlightedIndex(-1);
    noteInputRef.current?.focus();
  };

  // Keyboard navigation for note input combobox
  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? filteredSuggestions.length - 1 : prev - 1));
        return;
      }
      if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelectDropdownSuggestion(filteredSuggestions[highlightedIndex].text);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        setHighlightedIndex(-1);
        return;
      }
    }

    // Default global enter shortcut to submit sale
    handleKeyDown(e);
  };

  // Save custom preset
  const handleSaveCustomPreset = async () => {
    const trimmed = newPresetText.trim();
    if (!trimmed) return;

    try {
      setIsSavingPreset(true);
      setPresetError(null);
      const res = await createQuickNotePreset(trimmed);

      if (!res.success) {
        setPresetError(res.error || 'Failed to save preset');
        return;
      }

      if (res.preset) {
        const created = res.preset;
        setPresets((prev) => {
          if (!prev.some((p) => p.text.toLowerCase() === created.text.toLowerCase())) {
            return [...prev, created];
          }
          return prev;
        });

        // Automatically append to current note
        handleAppendPreset(created.text);
      }

      setIsAddingCustom(false);
      setNewPresetText('');
    } catch (err: any) {
      console.error('Failed to create preset:', err);
      setPresetError(err?.message || 'Error saving preset');
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Delete preset (accessible to Admin)
  const handleDeletePreset = async (presetId: string, presetText: string) => {
    if (!confirm(`Delete "${presetText}" from quick presets?`)) return;

    try {
      const res = await deleteQuickNotePreset(presetId);
      if (res.success) {
        setPresets((prev) => prev.filter((p) => p.id !== presetId));
      }
    } catch (err) {
      console.error('Failed to delete preset', err);
    }
  };


  const handleSubmit = async (mode: PaymentModeType) => {
    setErrorMessage(null);
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than ₹0');
      amountInputRef.current?.focus();
      return;
    }

    try {
      setSubmittingMode(mode);
      const res = await createQuickTransaction({
        amount: parsedAmount,
        paymentMode: mode,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to save transaction');
        return;
      }

      // Success feedback
      setLastSuccess({ amount: parsedAmount, mode });
      setAmount('');
      setNote('');

      // Auto-dismiss success alert after 3.5 seconds
      setTimeout(() => {
        setLastSuccess(null);
      }, 3500);

      // Refresh recent list
      loadRecent();
      onTransactionSaved?.();

      // Refocus back to input for rapid next sale
      amountInputRef.current?.focus();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save transaction');
    } finally {
      setSubmittingMode(null);
    }
  };

  // Keyboard shortcut: Press Enter with shift or tab
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Default Enter: If Shift is held, submit as UPI, else Cash
      if (e.shiftKey) {
        handleSubmit('UPI');
      } else {
        handleSubmit('CASH');
      }
    }
  };

  const handlePresetClick = (presetAmount: number) => {
    setAmount(String(presetAmount));
    amountInputRef.current?.focus();
  };

  const handleAddPreset = (addAmount: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + addAmount));
    amountInputRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      {/* Main Quick Sale Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00aeef] to-cyan-400 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
                Quick Sale Counter
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-400/30">
                  Instant Entry
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Single-step billing for fast-paced stationery & photocopy counter
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Operator
            </span>
            <span className="text-xs font-bold text-cyan-300">{role}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Success Flash Banner */}
          {lastSuccess && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  Recorded ₹{lastSuccess.amount.toFixed(2)} as {lastSuccess.mode}!
                </p>
                <p className="text-xs text-emerald-700">
                  Successfully logged to database. Ready for next entry.
                </p>
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-in fade-in duration-150">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-semibold">{errorMessage}</p>
            </div>
          )}

          {/* Large Number Input for Amount */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Sale Amount (₹)</span>
              <span className="text-[11px] font-normal text-slate-400">
                Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono text-[10px]">Enter</kbd> for Cash, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono text-[10px]">Shift+Enter</kbd> for UPI
              </span>
            </label>

            <div className="relative rounded-2xl shadow-inner bg-slate-50 border-2 border-slate-200 focus-within:border-[#00aeef] focus-within:bg-white transition-all">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-400">₹</span>
              </div>
              <input
                ref={amountInputRef}
                type="number"
                inputMode="decimal"
                step="any"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-12 pr-6 py-4 sm:py-5 text-3xl sm:text-4xl font-extrabold text-slate-900 bg-transparent rounded-2xl focus:outline-none placeholder:text-slate-300"
                disabled={submittingMode !== null}
              />
              {amount && (
                <button
                  type="button"
                  onClick={() => {
                    setAmount('');
                    amountInputRef.current?.focus();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-md bg-slate-200/80 hover:bg-slate-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Denomination Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {COMMON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-300 text-xs font-bold text-slate-700 hover:text-[#00aeef] transition-all active:scale-95 shadow-2xs"
                >
                  ₹{preset}
                </button>
              ))}
              <div className="h-6 w-px bg-slate-200 mx-1 self-center" />
              {[10, 50, 100].map((addVal) => (
                <button
                  key={`add-${addVal}`}
                  type="button"
                  onClick={() => handleAddPreset(addVal)}
                  className="px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-all active:scale-95"
                >
                  +{addVal}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note / Purpose Input with Combobox & Dynamic Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Optional Item / Note</span>
              </label>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click pills to append • Type for autocomplete
              </span>
            </div>

            {/* Combobox Input Container */}
            <div className="relative">
              <input
                ref={noteInputRef}
                type="text"
                placeholder="e.g. Photocopy, 2x Register Notebooks, Gel Pens..."
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setShowDropdown(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => {
                  setShowDropdown(true);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleNoteKeyDown}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00aeef] text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs"
                disabled={submittingMode !== null}
                autoComplete="off"
              />

              {/* Clear note button */}
              {note && (
                <button
                  type="button"
                  onClick={() => {
                    setNote('');
                    setShowDropdown(false);
                    noteInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                  title="Clear note"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete Combobox Dropdown */}
              {showDropdown && filteredSuggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100">
                    <span>Suggested Presets</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ↑↓ Navigate • ↵ Select
                    </span>
                  </div>
                  {filteredSuggestions.map((suggestion, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <div
                        key={suggestion.id}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectDropdownSuggestion(suggestion.text);
                        }}
                        className={`px-3 py-2 text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                          isHighlighted
                            ? 'bg-cyan-50 text-[#00aeef]'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className={`w-3.5 h-3.5 ${isHighlighted ? 'text-[#00aeef]' : 'text-slate-400'}`} />
                          <span>{suggestion.text}</span>
                        </div>
                        {isHighlighted && (
                          <span className="text-[10px] flex items-center gap-0.5 text-cyan-600 bg-cyan-100/70 px-1.5 py-0.5 rounded font-mono">
                            <span>Select</span>
                            <CornerDownLeft className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamic Quick Note Pills + Add Custom Button */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Frequent Suggestions
                </span>
                {loadingPresets && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="group inline-flex items-center rounded-lg bg-slate-100 hover:bg-cyan-50 border border-transparent hover:border-cyan-200 transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleAppendPreset(preset.text)}
                      className="text-[11px] px-2.5 py-1 text-slate-700 group-hover:text-[#00aeef] font-medium transition-colors cursor-pointer"
                      title={`Click to append "${preset.text}"`}
                    >
                      {preset.text}
                    </button>
                    {/* Subtle delete button for admin */}
                    {role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset.id, preset.text);
                        }}
                        className="hidden group-hover:flex items-center pr-2 pl-0.5 text-slate-400 hover:text-red-500 transition-colors"
                        title={`Delete preset "${preset.text}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Custom Preset Button / Inline Form */}
                {!isAddingCustom ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(true);
                      setPresetError(null);
                      setTimeout(() => newPresetInputRef.current?.focus(), 50);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-slate-300 hover:border-[#00aeef] hover:bg-cyan-50 text-slate-600 hover:text-[#00aeef] font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
                    title="Create and save a new note suggestion preset"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Custom</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-50 border-2 border-[#00aeef] shadow-sm animate-in fade-in zoom-in-95 duration-150">
                    <input
                      ref={newPresetInputRef}
                      type="text"
                      placeholder="e.g. Lamination"
                      value={newPresetText}
                      onChange={(e) => {
                        setNewPresetText(e.target.value);
                        setPresetError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveCustomPreset();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsAddingCustom(false);
                          setNewPresetText('');
                        }
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00aeef] w-32 sm:w-44"
                      disabled={isSavingPreset}
                      maxLength={50}
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomPreset}
                      disabled={isSavingPreset || !newPresetText.trim()}
                      className="p-1.5 rounded-lg bg-[#00aeef] text-white hover:bg-cyan-600 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                      title="Save to presets"
                    >
                      {isSavingPreset ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustom(false);
                        setNewPresetText('');
                      }}
                      disabled={isSavingPreset}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {presetError && (
                <p className="text-[11px] text-red-500 font-medium">{presetError}</p>
              )}
            </div>
          </div>


          {/* Prominent Two Submit Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* CASH SUBMIT BUTTON */}
            <button
              type="button"
              onClick={() => handleSubmit('CASH')}
              disabled={submittingMode !== null}
              className="group relative flex items-center justify-center gap-3 px-6 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {submittingMode === 'CASH' ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Banknote className="w-6 h-6 transition-transform group-hover:scale-110" />
              )}
              <div className="text-left">
                <span className="block leading-none">Add as Cash</span>
                <span className="text-[10px] font-normal text-emerald-100 opacity-90 leading-tight">
                  Instant physical drawer entry
                </span>
              </div>
            </button>

            {/* UPI SUBMIT BUTTON */}
            <button
              type="button"
              onClick={() => handleSubmit('UPI')}
              disabled={submittingMode !== null}
              className="group relative flex items-center justify-center gap-3 px-6 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#00aeef] via-[#0284c7] to-[#0369a1] hover:from-cyan-400 hover:to-sky-600 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-cyan-800/25 hover:shadow-cyan-800/35 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {submittingMode === 'UPI' ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <QrCode className="w-6 h-6 transition-transform group-hover:scale-110" />
              )}
              <div className="text-left">
                <span className="block leading-none">Add as UPI</span>
                <span className="text-[10px] font-normal text-cyan-100 opacity-90 leading-tight">
                  QR Code / Soundbox payment
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Feed */}
      {showRecentFeed && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Recent Quick Sales</h3>
            </div>
            <button
              onClick={loadRecent}
              disabled={loadingRecent}
              className="text-xs font-semibold text-[#00aeef] hover:underline flex items-center gap-1"
            >
              {loadingRecent ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No transactions recorded yet today. Enter a sale above to start.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {recentTransactions.map((tx) => {
                const isCash = tx.paymentMode === 'CASH';
                const isVoid = Boolean(tx.isVoid);
                const createdDate = new Date(tx.createdAt);
                const updatedDate = tx.updatedAt ? new Date(tx.updatedAt) : createdDate;
                const isModified = updatedDate.getTime() > createdDate.getTime();

                const formatTimeStr = (d: Date) =>
                  d.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  }).toLowerCase();

                const formattedTime = formatTimeStr(createdDate);
                const formattedUpdated = formatTimeStr(updatedDate);

                const tooltipTitle = isModified
                  ? `Last modified: ${formattedUpdated}`
                  : `Created at: ${formattedTime}`;

                return (
                  <div
                    key={tx.id}
                    className={`py-2.5 flex items-center justify-between text-xs px-2.5 rounded-lg transition-colors ${
                      isVoid ? 'bg-red-50/50 text-slate-500' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PaymentBadge3D
                        mode={tx.paymentMode}
                        isVoid={isVoid}
                        isFlipping={flippingTxIds.has(tx.id)}
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-semibold ${
                            isVoid ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {tx.note || 'General Counter Sale'}
                        </span>
                        {isVoid && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-red-100 text-red-600 border border-red-200">
                            VOID
                          </span>
                        )}
                        <span
                          title={tooltipTitle}
                          className="text-[10px] text-gray-400 ml-1 underline decoration-dotted underline-offset-4 cursor-help"
                        >
                          {formattedTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-sm font-extrabold font-mono ${
                          isVoid ? 'text-red-500' : 'text-slate-900'
                        }`}
                      >
                        {isVoid ? `-₹${tx.amount.toFixed(2)}` : `₹${tx.amount.toFixed(2)}`}
                      </span>

                      {/* Action buttons: Only shown for active (non-voided) items */}
                      {!isVoid ? (
                        <div className="flex items-center gap-1">
                          {/* Switch Payment Mode (CASH <-> UPI) */}
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentMode(tx.id)}
                            disabled={switchingTxId === tx.id || voidingTxId === tx.id}
                            className="p-1 rounded-md text-slate-400 hover:text-[#00aeef] hover:bg-cyan-50 transition-colors cursor-pointer"
                            title={`Switch to ${tx.paymentMode === 'CASH' ? 'UPI' : 'Cash'}`}
                          >
                            {switchingTxId === tx.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00aeef]" />
                            ) : (
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Trash/Void Button with 2-step inline confirmation */}
                          {confirmingVoidId === tx.id ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg animate-in fade-in zoom-in-95 duration-100">
                              <span className="text-[10px] font-bold text-red-700">Void?</span>
                              <button
                                type="button"
                                onClick={() => handleConfirmVoid(tx.id)}
                                disabled={voidingTxId === tx.id}
                                className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                                title="Confirm void"
                              >
                                {voidingTxId === tx.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  'Yes'
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingVoidId(null)}
                                disabled={voidingTxId === tx.id}
                                className="px-1 py-0.5 rounded hover:bg-slate-200 text-slate-500 text-[10px] font-bold transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmingVoidId(tx.id)}
                              disabled={voidingTxId === tx.id || switchingTxId === tx.id}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Void this sale (deduct from daily total)"
                            >
                              {voidingTxId === tx.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="w-6" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
