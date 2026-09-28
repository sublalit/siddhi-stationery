'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

import { useAuth, UserRole } from '@/lib/authContext';
import { syncUserRole } from '@/lib/actions/auth';

export default function AuthPage() {
  const router = useRouter();
  const { setAuthSession } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, roleName: UserRole = 'STAFF', prefillEmail?: string, prefillPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);

    const userEmail = prefillEmail || email || 'admin@example.com';
    let userName = name || (userEmail.includes('staff') ? 'Staff User' : userEmail.includes('manager') ? 'Manager User' : 'Admin User');

    let resolvedRole: UserRole = roleName;
    if (userEmail.includes('staff')) resolvedRole = 'STAFF';
    else if (userEmail.includes('manager')) resolvedRole = 'MANAGER';

    try {
      const synced = await syncUserRole(userEmail, resolvedRole, userName);
      if (synced?.name) userName = synced.name;
      if (synced?.role === 'ADMIN' || synced?.role === 'MANAGER' || synced?.role === 'STAFF') {
        resolvedRole = synced.role;
      }
      if (synced?.email) {
        setAuthSession({
          email: synced.email,
          role: resolvedRole,
          name: userName,
          avatarUrl: synced.avatarUrl ?? null,
        });
      } else {
        setAuthSession({
          email: userEmail,
          role: resolvedRole,
          name: userName,
        });
      }
    } catch (err) {
      console.error('syncUserRole error:', err);
      setAuthSession({
        email: userEmail,
        role: resolvedRole,
        name: userName,
      });
    }

    setTimeout(() => {
      setLoading(false);
      router.push('/');
    }, 300);
  };

  const fillDemoAccount = (demoType: 'admin' | 'manager' | 'staff') => {
    if (demoType === 'admin') {
      setEmail('admin@example.com');
      setPassword('admin123');
      handleLogin(undefined, 'ADMIN', 'admin@example.com', 'admin123');
    } else if (demoType === 'manager') {
      setEmail('manager@example.com');
      setPassword('manager123');
      handleLogin(undefined, 'MANAGER', 'manager@example.com', 'manager123');
    } else if (demoType === 'staff') {
      setEmail('staff@example.com');
      setPassword('staff123');
      handleLogin(undefined, 'STAFF', 'staff@example.com', 'staff123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00aeef] via-[#00a2df] to-[#008fca] flex flex-col items-center justify-center p-4 sm:p-6">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md mb-3 shadow-lg">
          <Package className="w-10 h-10 text-white animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Siddhi Stationery
        </h1>
        <p className="text-xs sm:text-sm text-cyan-100 font-medium tracking-wide mt-0.5">
          Inventory Management System
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 text-center">Welcome</h2>
          <p className="text-xs text-slate-500 text-center font-medium mt-1">
            Sign in to your account or create a new one
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1 rounded-2xl grid grid-cols-2 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`py-2 rounded-xl transition-all ${
              !isSignUp
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`py-2 rounded-xl transition-all ${
              isSignUp
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs font-medium">
          {isSignUp && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] bg-slate-50/50"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00aeef] hover:bg-[#0096ce] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Accounts Section */}
        <div className="pt-2">
          <p className="text-xs font-medium text-slate-500 text-center mb-3">
            Or try demo accounts:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin')}
              className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-[#00aeef] bg-slate-50/60 hover:bg-cyan-50/50 transition-all group"
            >
              <div className="font-bold text-xs text-slate-800 group-hover:text-[#00aeef] transition-colors">
                Admin Demo
              </div>
              <div className="text-[11px] text-slate-500">Full access to all features</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('manager')}
              className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-[#00aeef] bg-slate-50/60 hover:bg-cyan-50/50 transition-all group"
            >
              <div className="font-bold text-xs text-slate-800 group-hover:text-[#00aeef] transition-colors">
                Manager Demo
              </div>
              <div className="text-[11px] text-slate-500">Edit products, view reports</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('staff')}
              className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-[#00aeef] bg-slate-50/60 hover:bg-cyan-50/50 transition-all group"
            >
              <div className="font-bold text-xs text-slate-800 group-hover:text-[#00aeef] transition-colors">
                Staff Demo
              </div>
              <div className="text-[11px] text-slate-500">View-only access</div>
            </button>
          </div>
        </div>

        {/* Demo Credentials Box */}
        <div className="p-4 rounded-2xl bg-[#eef9ff] border border-cyan-100/90 text-xs text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            Demo Credentials:
          </div>
          <div className="text-[11px]">
            <span className="font-bold text-slate-700">Admin:</span> admin@example.com / admin123
          </div>
          <div className="text-[11px]">
            <span className="font-bold text-slate-700">Manager:</span> manager@example.com / manager123
          </div>
          <div className="text-[11px]">
            <span className="font-bold text-slate-700">Staff:</span> staff@example.com / staff123
          </div>
        </div>
      </div>
    </div>
  );
}
