'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch (err) {
      console.error('resetPasswordForEmail error:', err);
      setError('Could not send the reset email. Check your Supabase API key and try again.');
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
          <h2 className="text-2xl font-bold text-slate-900 text-center">Forgot password</h2>
          <p className="text-xs text-slate-500 text-center font-medium mt-1">
            Enter your account email and we will send a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-xs">
            <p className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold p-3">
              If an account exists for {email}, a password reset link is on its way. Open it to choose a new password.
            </p>
            <Link href="/login" className="block text-center text-[#00aeef] font-bold hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
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
            {error && <p className="font-semibold text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00aeef] hover:bg-[#0096ce] text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <Link href="/login" className="block text-center text-slate-500 font-semibold hover:text-slate-800">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
