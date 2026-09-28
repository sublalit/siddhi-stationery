'use client';

import React from 'react';

type ColumnAlign = 'left' | 'right' | 'center';

interface SkeletonColumn {
  header: string;
  barClassName: string;
  align?: ColumnAlign;
  headerClassName?: string;
  cellClassName?: string;
}

function alignmentClass(align: ColumnAlign = 'left') {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

function SkeletonRow({ columns }: { columns: SkeletonColumn[] }) {
  return (
    <tr className="animate-pulse">
      {columns.map((col) => (
        <td
          key={col.header}
          className={`py-3.5 ${col.cellClassName ?? 'px-4'} ${alignmentClass(col.align)}`}
        >
          <div
            className={`h-4 bg-gray-200 rounded inline-block ${col.barClassName} ${
              col.align === 'right' ? 'ml-auto' : col.align === 'center' ? 'mx-auto' : ''
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({
  columns,
  rows = 4,
  headerRowClassName = 'py-3 px-4',
}: {
  columns: SkeletonColumn[];
  rows?: number;
  headerRowClassName?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
            {columns.map((col) => (
              <th
                key={col.header}
                className={`${headerRowClassName} ${col.headerClassName ?? ''} ${alignmentClass(col.align)}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const PETTY_CASH_SKELETON_COLUMNS: SkeletonColumn[] = [
  { header: 'Reason / Note', barClassName: 'w-40', headerClassName: 'px-6', cellClassName: 'px-6' },
  { header: 'Amount', barClassName: 'w-16' },
  { header: 'Recorded By', barClassName: 'w-28' },
  { header: 'Time', barClassName: 'w-20' },
  {
    header: 'Actions',
    barClassName: 'w-16',
    align: 'right',
    headerClassName: 'px-6',
    cellClassName: 'px-6',
  },
];

export const CLOSING_HISTORY_SKELETON_COLUMNS: SkeletonColumn[] = [
  { header: 'Closing Date', barClassName: 'w-28', headerClassName: 'px-6', cellClassName: 'px-6' },
  { header: 'Opening Float', barClassName: 'w-16' },
  { header: 'Cash Sales', barClassName: 'w-16' },
  { header: 'Total Expenses', barClassName: 'w-16' },
  { header: 'Net Cash in Drawer', barClassName: 'w-20' },
  { header: 'UPI Total', barClassName: 'w-16' },
  { header: 'Total Revenue', barClassName: 'w-20' },
  { header: 'Closing Mode', barClassName: 'w-20' },
  { header: 'Closed By Role', barClassName: 'w-16' },
  {
    header: 'Recorded At',
    barClassName: 'w-16',
    align: 'right',
    headerClassName: 'px-6',
    cellClassName: 'px-6',
  },
  {
    header: 'Details',
    barClassName: 'w-8',
    align: 'center',
  },
];
