'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Home, ChevronRight, Printer, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import CreateInvoiceModal from '@/components/invoices/CreateInvoiceModal';
import { getInvoices, createInvoice, updateInvoiceStatus } from '@/lib/actions/invoices';
import { getProducts } from '@/lib/actions/products';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invData = await getInvoices(selectedStatus);
      setInvoices(invData);
      const prodData = await getProducts();
      setProducts(prodData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus]);

  const handleSaveInvoice = async (invoiceData: any) => {
    await createInvoice(invoiceData);
    await fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateInvoiceStatus(id, newStatus);
    await fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium no-print">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <a href="/" className="hover:text-slate-800">
          Dashboard
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Invoices</span>
      </div>

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoices & POS</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage customer bills, tax receipts, and payment status
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 no-print">
        {(['All', 'Paid', 'Pending', 'Draft'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatus === st
                ? 'bg-[#00aeef] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                let badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                if (inv.paymentStatus === 'Pending') badgeStyle = 'bg-amber-50 text-amber-600 border-amber-200';
                if (inv.paymentStatus === 'Draft') badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.customer?.name}</div>
                      <div className="text-[10px] text-slate-400">{inv.customer?.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{inv.items?.length || 0} items</td>
                    <td className="py-3 px-4 font-extrabold text-[#00aeef]">
                      ₹{inv.grandTotal?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {inv.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${badgeStyle}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1.5 rounded-lg bg-cyan-50 text-[#00aeef] hover:bg-cyan-100 transition-colors flex items-center gap-1 font-bold text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" /> View / Print
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice View Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="text-xs font-bold text-slate-400">INVOICE PREVIEW</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00aeef] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Print Tax Invoice
                </button>
                <button onClick={() => setViewingInvoice(null)}>
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </div>

            {/* Tax Invoice Document */}
            <div className="py-4 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#00aeef]">SIDDHI STATIONERY</h2>
                  <p className="text-xs text-slate-500">Retail & Wholesale Stationery Depot</p>
                  <p className="text-[11px] text-slate-400 mt-1">Powai Commercial Complex, Mumbai - 400076</p>
                  <p className="text-[11px] text-slate-400">GSTIN: 27SSTNW9918K1Z3</p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-slate-900">{viewingInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-slate-500">
                    Date: {new Date(viewingInvoice.createdAt).toLocaleDateString()}
                  </p>
                  <span className="inline-block mt-2 px-3 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    {viewingInvoice.paymentStatus} ({viewingInvoice.paymentMethod})
                  </span>
                </div>
              </div>

              {/* Billed To */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Billed To:
                </span>
                <div className="text-sm font-bold text-slate-900">{viewingInvoice.customer?.name}</div>
                {viewingInvoice.customer?.phone && (
                  <p className="text-xs text-slate-500">Phone: {viewingInvoice.customer.phone}</p>
                )}
                {viewingInvoice.customer?.gstin && (
                  <p className="text-xs text-slate-500">GSTIN: {viewingInvoice.customer.gstin}</p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Item Description</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingInvoice.items?.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2 font-medium">{it.productName}</td>
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p-2 text-right">₹{it.unitPrice?.toFixed(2)}</td>
                      <td className="p-2 text-right font-bold">₹{it.lineTotal?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{viewingInvoice.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{viewingInvoice.gstAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-[#00aeef] pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span>₹{viewingInvoice.grandTotal?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        products={products}
        onSave={handleSaveInvoice}
      />
    </div>
  );
}
