'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Building2,
  FileText,
  ScanLine,
  Printer,
  Settings,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Scanner', href: '/scanner', icon: ScanLine },
  { name: 'Custom Printing', href: '/custom-printing', icon: Printer },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div className="p-4">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white shadow-md shadow-cyan-950/40 translate-x-1'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 m-3 rounded-xl bg-slate-850/50">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            System Online
          </span>
          <span className="text-slate-500 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
