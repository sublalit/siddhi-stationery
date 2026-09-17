'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  User as UserIcon,
  Settings,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  Menu,
  X,
  LayoutDashboard,
  FolderTree,
  Building2,
  FileText,
  ScanLine,
  Printer,
  LogOut,
} from 'lucide-react';

const mobileNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Scanner', href: '/scanner', icon: ScanLine },
  { name: 'Custom Printing', href: '/custom-printing', icon: Printer },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function TopHeader() {
  const pathname = usePathname();
  const [role, setRole] = useState<'Admin User' | 'Manager' | 'Staff'>('Admin User');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      setSeedMessage(null);
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (data.success) {
        setSeedMessage('Database Seeded Successfully!');
        setTimeout(() => {
          setSeedMessage(null);
          window.location.reload();
        }, 1200);
      } else {
        setSeedMessage(`Seed failed: ${data.error}`);
      }
    } catch (err: any) {
      setSeedMessage(`Error: ${err?.message || 'Failed'}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="no-print bg-gradient-to-r from-[#00aeef] via-[#0284c7] to-[#0369a1] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Mobile Hamburger Button + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/10 p-1.5 sm:p-2 rounded-xl border border-white/20 backdrop-blur-sm">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight leading-none text-white flex items-center gap-2">
                Siddhi Stationery
              </h1>
              <p className="text-[10px] sm:text-xs text-cyan-100 font-medium tracking-wide hidden sm:block">
                Inventory & Billing Management Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Actions & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Seed Database Button */}
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Populate demo stationery dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Seeding...' : 'Seed Data'}
          </button>

          {seedMessage && (
            <span className="hidden lg:flex items-center gap-1 text-xs bg-emerald-500/90 text-white px-2.5 py-1 rounded-full animate-bounce">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {seedMessage}
            </span>
          )}

          {/* User Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="max-w-[70px] sm:max-w-none truncate">{role}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Role
                </div>
                {(['Admin User', 'Manager', 'Staff'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-cyan-50 transition-colors ${
                      role === r ? 'text-[#00aeef] font-bold bg-cyan-50/50' : 'text-slate-600'
                    }`}
                  >
                    <span>{r}</span>
                    {role === r && <CheckCircle2 className="w-3.5 h-3.5 text-[#00aeef]" />}
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/auth"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-between transition-colors"
                >
                  <span>Sign Out / Auth</span>
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                </Link>
              </div>
            )}
          </div>

          {/* Account Settings Icon */}
          <Link
            href="/settings"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

        </div>

      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />

          {/* Sliding Panel */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col justify-between p-4 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-[#00aeef] p-1.5 rounded-xl">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Siddhi Stationery</h2>
                    <p className="text-[10px] text-slate-400">Inventory & Billing</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Menu Navigation
              </div>

              <nav className="space-y-1">
                {mobileNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <button
                onClick={() => {
                  handleSeedDatabase();
                  setMobileDrawerOpen(false);
                }}
                disabled={seeding}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                <span>{seeding ? 'Seeding...' : 'Seed Demo Data'}</span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>Status: Online</span>
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

