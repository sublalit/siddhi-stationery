'use client';

import React, { useState } from 'react';
import { ScanLine, Search, Home, ChevronRight, PackageCheck, AlertCircle, ShoppingCart } from 'lucide-react';
import { getProducts } from '@/lib/actions/products';

export default function ScannerPage() {
  const [scanCode, setScanCode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScan = async (code: string) => {
    if (!code || code.trim() === '') return;
    try {
      setLoading(true);
      setSearched(true);
      const products = await getProducts(code);
      if (products && products.length > 0) {
        setScannedProduct(products[0]);
      } else {
        setScannedProduct(null);
      }
    } catch (e) {
      console.error(e);
      setScannedProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTrigger = (code: string) => {
    setScanCode(code);
    handleScan(code);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <a href="/" className="hover:text-slate-800">
          Dashboard
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Barcode & SKU Scanner</span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scanner Module</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Scan physical barcode labels or enter SKU codes for instant rack location & stock lookup
        </p>
      </div>

      {/* Scanner Input Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Scan Barcode or Type SKU
        </label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <ScanLine className="w-5 h-5 text-[#00aeef] absolute left-3.5 top-1/2 -translate-y-1/2 animate-pulse" />
            <input
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleScan(scanCode);
              }}
              placeholder="e.g. PPR-001, PEN-002, 890123456701..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:border-[#00aeef] bg-slate-50/50"
              autoFocus
            />
          </div>
          <button
            onClick={() => handleScan(scanCode)}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all"
          >
            {loading ? 'Scanning...' : 'Lookup Item'}
          </button>
        </div>

        {/* Demo Quick Shortcuts */}
        <div className="pt-2 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400">Quick Demo Presets:</span>
          {['PPR-001', 'PEN-002', 'PCL-003', 'NB-004', '890123456701'].map((demo) => (
            <button
              key={demo}
              onClick={() => handleQuickTrigger(demo)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-[#00aeef] text-slate-600 font-mono text-[11px] transition-colors border border-slate-200"
            >
              {demo}
            </button>
          ))}
        </div>
      </div>

      {/* Scanned Result Output Card */}
      {searched && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
          {scannedProduct ? (
            <div className="bg-white rounded-2xl border-2 border-cyan-400 p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={
                    scannedProduct.imageUrl ||
                    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop'
                  }
                  alt={scannedProduct.name}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                      Item Matched
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Rack: {scannedProduct.rackLocation || 'A1-B1-S1'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{scannedProduct.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mt-1">
                    <span>SKU: {scannedProduct.sku}</span>
                    <span>Barcode: {scannedProduct.barcode}</span>
                  </div>
                  <div className="mt-2 text-xl font-extrabold text-[#00aeef]">
                    ₹{scannedProduct.sellingPrice?.toFixed(2)}
                    <span className="text-xs text-slate-400 font-normal"> / {scannedProduct.unit}</span>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-50/60 p-4 rounded-xl border border-cyan-100 text-center w-full md:w-48 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Available Stock
                </span>
                <div className="text-3xl font-extrabold text-[#00aeef]">
                  {scannedProduct.currentStock}
                </div>
                <span className="text-[11px] text-slate-600 block">{scannedProduct.unit} in rack</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-red-600">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold">No stationery product found for &quot;{scanCode}&quot;</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please check the barcode label or register this item in the Products menu.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
