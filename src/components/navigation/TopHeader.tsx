'use client';

import React, { useState } from 'react';
import { Package, User as UserIcon, Settings, RefreshCw, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function TopHeader() {
  const [role, setRole] = useState<'Admin User' | 'Manager' | 'Staff'>('Admin User');
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-sm">
            <Package className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none text-white flex items-center gap-2">
              Siddhi Stationery
            </h1>
            <p className="text-xs text-cyan-100 font-medium tracking-wide">
              Inventory & Billing Management Platform
            </p>
          </div>
        </div>

        {/* Quick Actions & Role Switcher */}
        <div className="flex items-center gap-4">

          {/* Seed Database Button */}
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Populate demo stationery dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
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
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{role}</span>
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
              </div>
            )}
          </div>

          {/* Account Settings Icon */}
          <a
            href="/settings"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </a>

        </div>

      </div>
    </header>
  );
}
