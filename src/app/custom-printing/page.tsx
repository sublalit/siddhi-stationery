'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Calculator, Send, Home, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CustomPrintingPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [serviceType, setServiceType] = useState<'Business Cards' | 'Letterheads' | 'Custom Stamps' | 'Brochures' | 'Banners'>('Business Cards');
  const [quantity, setQuantity] = useState(500);
  const [paperGsm, setPaperGsm] = useState('300 GSM Matte');
  const [printSides, setPrintSides] = useState('Double-Sided');
  const [finishType, setFinishType] = useState('Matte Lamination');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Compute live price estimate
  const calculatePrice = () => {
    let baseRate = 2.0; // per unit
    if (serviceType === 'Letterheads') baseRate = 3.5;
    if (serviceType === 'Custom Stamps') baseRate = 250.0;
    if (serviceType === 'Brochures') baseRate = 8.0;
    if (serviceType === 'Banners') baseRate = 45.0;

    let multiplier = 1.0;
    if (printSides === 'Double-Sided') multiplier *= 1.4;
    if (finishType === 'Spot UV') multiplier *= 1.3;
    if (finishType === 'Gold Foil Stamping') multiplier *= 1.6;

    if (serviceType === 'Custom Stamps') {
      return baseRate * (quantity > 10 ? 0.9 : 1.0);
    }

    return Math.round(quantity * baseRate * multiplier);
  };

  const estimatedCost = calculatePrice();

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerContact) return;
    try {
      setSubmitting(true);
      const newReq = {
        customerName,
        customerContact,
        serviceType,
        quantity: Number(quantity),
        paperGsm,
        printSides,
        finishType,
        estimatedCost,
        status: 'Pending',
        notes,
        createdAt: new Date().toISOString(),
      };

      setRequests([newReq, ...requests]);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });

      setCustomerName('');
      setCustomerContact('');
      setNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
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
        <span className="text-slate-800 font-semibold">Custom Printing Services</span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Custom Stationery Printing
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Instant quote calculator & job order configurator for custom letterheads, stamps & business cards
        </p>
      </div>

      {/* Grid Layout: Configurator & Quote Calculator on Left, Recent Orders on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Configurator Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-cyan-50 text-[#00aeef] rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Job Order Configurator</h2>
              <p className="text-xs text-slate-500 font-medium">Select specs to compute real-time quote</p>
            </div>
          </div>

          <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-[#00aeef]"
                >
                  <option value="Business Cards">Business Cards</option>
                  <option value="Letterheads">Letterheads (A4 Bond)</option>
                  <option value="Custom Stamps">Custom Rubber Stamps</option>
                  <option value="Brochures">Brochures & Flyers</option>
                  <option value="Banners">Vinyl Banners</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-[#00aeef]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paper GSM</label>
                <select
                  value={paperGsm}
                  onChange={(e) => setPaperGsm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                >
                  <option value="90 GSM Bond">90 GSM Bond</option>
                  <option value="100 GSM Sunshine">100 GSM Sunshine</option>
                  <option value="300 GSM Matte">300 GSM Matte</option>
                  <option value="350 GSM Velvet">350 GSM Velvet</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Print Sides</label>
                <select
                  value={printSides}
                  onChange={(e) => setPrintSides(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                >
                  <option value="Single-Sided">Single-Sided</option>
                  <option value="Double-Sided">Double-Sided</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Finish Type</label>
                <select
                  value={finishType}
                  onChange={(e) => setFinishType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
                >
                  <option value="Matte Lamination">Matte Lamination</option>
                  <option value="Glossy Lamination">Glossy Lamination</option>
                  <option value="Spot UV">Spot UV</option>
                  <option value="Gold Foil Stamping">Gold Foil Stamping</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Order Notes / Custom Design Details</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Logo placement on top right corner, dark navy blue background..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              />
            </div>

            {/* Estimated Quote Card */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Estimated Job Quote
                </span>
                <span className="text-2xl font-extrabold text-[#00aeef]">₹{estimatedCost}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Job Request</span>
              </button>
            </div>
          </form>
        </div>

        {/* Custom Printing Orders List */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Recent Printing Orders</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-cyan-50 text-[#00aeef] rounded-full">
                {requests.length + 1} Total Jobs
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1 text-xs">
              {/* Default Sample Job */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Karan Malhotra</span>
                  <span className="text-[#00aeef]">₹1,250</span>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold">
                  Business Cards (500 units) • 350 GSM Velvet
                </div>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-slate-400">Double-Sided Spot UV</span>
                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded font-bold">
                    In Production
                  </span>
                </div>
              </div>

              {requests.map((r, i) => (
                <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 animate-in fade-in">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{r.customerName}</span>
                    <span className="text-[#00aeef]">₹{r.estimatedCost}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">
                    {r.serviceType} ({r.quantity} units) • {r.paperGsm}
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[10px]">
                    <span className="text-slate-400">{r.printSides} • {r.finishType}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
