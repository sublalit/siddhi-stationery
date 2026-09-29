'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(Boolean(data.session));
      setCheckingSession(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasRecoverySession(Boolean(session));
        setCheckingSession(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSaved(true);
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      console.error('updateUser password error:', err);
      setError('Could not update the password. Request a new reset link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00aeef] via-[#00a2df] to-[#008fca] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md mb-3 shadow-lg">
          <Package className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Siddhi Stationery</h1>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 text-center">Choose a new password</h2>
          <p className="text-xs text-slate-500 text-center font-medium mt-1">
            Use the link from your email, then set a new password here.
          </p>
        </div>

        {checkingSession ? (
          <p className="text-xs text-slate-500 text-center">Checking your reset link...</p>
        ) : saved ? (
          <p className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold p-3 text-xs">
            Password updated. Taking you back to sign in.
          </p>
        ) : !hasRecoverySession ? (
          <div className="space-y-4 text-xs">
            <p className="rounded-xl bg-amber-50 border border-amber-100 text-amber-800 font-semibold p-3">
              This reset link is missing or has expired. Request a new one.
            </p>
            <Link href="/forgot-password" className="block text-center text-[#00aeef] font-bold hover:underline">
              Forgot Password?
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">New password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Confirm password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] bg-slate-50/50"
              />
            </div>
            {error && <p className="font-semibold text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00aeef] hover:bg-[#0096ce] text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
