'use client';

import React, { useState } from 'react';
import {
  Building,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  Save,
  Home,
  ChevronRight,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { updateStoreDetails } from '@/lib/actions/settings';
import MyProfileSettings from '@/components/settings/MyProfileSettings';

type SettingsTab = 'store' | 'profile';

export default function SettingsPage() {
  const { isAdmin, isStaff, role } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [storeName, setStoreName] = useState('Siddhi Stationery Depot');
  const [phone, setPhone] = useState('+91 98200 12345');
  const [email, setEmail] = useState('contact@siddhistationery.com');
  const [gstin, setGstin] = useState('27SSTNW9918K1Z3');
  const [address, setAddress] = useState('Powai Commercial Complex, Mumbai - 400076');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingStore, setSavingStore] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const showStoreTab = isAdmin && !isStaff;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingStore(true);
      setSaved(false);
      setSaveError(null);
      const result = await updateStoreDetails(
        { storeName, phone, email, gstin, address },
        role
      );
      if (!result.success) {
        setSaveError(result.error || '403 Forbidden');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save store details.');
    } finally {
      setSavingStore(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setSeedMsg(null);
      const res = await fetch('/api/seed', {
        headers: { 'x-user-role': role },
      });
      const data = await res.json();
      if (data.success) {
        setSeedMsg('Demo stationery dataset seeded successfully!');
      } else {
        setSeedMsg(`Seed error: ${data.error}`);
      }
    } catch (e: any) {
      setSeedMsg(`Error: ${e?.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <a href="/" className="hover:text-slate-800">
          Dashboard
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Settings</span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Manage your profile, business details, and database tools
        </p>
      </div>

      {showStoreTab && (
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'store'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            Store Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserRound className="w-4 h-4" />
            My Profile
          </button>
        </div>
      )}

      {!showStoreTab || activeTab === 'profile' ? (
        <MyProfileSettings />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-cyan-50 text-[#00aeef] rounded-xl">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Business Profile & Tax Information</h2>
                <p className="text-xs text-slate-500 font-medium">Shown on customer invoices and receipts</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Tax Registration *</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {saved ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Settings Saved!
                  </span>
                ) : saveError ? (
                  <span className="text-xs font-bold text-red-500">{saveError}</span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={savingStore}
                  className="px-6 py-2 bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingStore ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-2 bg-cyan-50 text-[#00aeef] rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Database Tools</h2>
                  <p className="text-xs text-slate-500 font-medium">Seed demo stationery dataset</p>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-600 space-y-3">
                <p>
                  Populate Database with default stationery items (A4 paper, ballpoint pens, HB pencils,
                  exercise books), categories, vendors, and invoices matching the Lovable prototype.
                </p>

                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
                  <span>{seeding ? 'Seeding Database...' : 'Seed Sample Dataset'}</span>
                </button>

                {seedMsg && (
                  <div className="p-3 bg-cyan-50 border border-cyan-200 text-[#00aeef] font-semibold rounded-xl text-center animate-in fade-in">
                    {seedMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
