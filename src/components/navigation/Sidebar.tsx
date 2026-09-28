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
  Zap,
  CalendarCheck,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Quick Sale', href: '/quick-sale', icon: Zap, badge: 'Fast' },
  { name: 'Day-End Closing', href: '/daily-sales', icon: CalendarCheck, adminOnly: true },
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
  const { isStaff } = useAuth();

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="no-print hidden md:flex w-64 bg-slate-900 text-slate-300 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto flex-col justify-between border-r border-slate-800 shrink-0">
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white shadow-md shadow-cyan-950/40 translate-x-1'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {item.badge}
                    </span>
                  )}

                  {item.adminOnly && isStaff && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  )}
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

      {/* Mobile Quick Bottom Navigation Dock (visible on mobile only) */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-[10px] text-slate-400 shadow-2xl">
        {[
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Quick Sale', href: '/quick-sale', icon: Zap },
          { name: 'Invoices', href: '/invoices', icon: FileText },
          { name: 'Scanner', href: '/scanner', icon: ScanLine },
          { name: 'Products', href: '/products', icon: Package },
        ].map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-[#00aeef] font-bold' : 'hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#00aeef]' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
