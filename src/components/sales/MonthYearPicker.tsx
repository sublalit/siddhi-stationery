'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' },
] as const;

interface MonthYearPickerProps {
  month: number;
  year: number;
  years: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export default function MonthYearPicker({
  month,
  year,
  years,
  onMonthChange,
  onYearChange,
}: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedMonth = MONTHS.find((m) => m.value === month) ?? MONTHS[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span>
          {selectedMonth.label} {year}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select month and year"
          className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-30"
        >
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto">
            {years.map((optionYear) => (
              <button
                key={optionYear}
                type="button"
                onClick={() => onYearChange(optionYear)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  optionYear === year
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {optionYear}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onMonthChange(option.value);
                  setOpen(false);
                }}
                className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                  option.value === month
                    ? 'bg-[#00aeef]/10 text-[#0284c7] ring-1 ring-[#00aeef]/30'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.short}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
