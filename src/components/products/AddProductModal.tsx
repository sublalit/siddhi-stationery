'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, PackagePlus, Upload } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  vendors: any[];
  onSave: (productData: any) => Promise<void>;
  initialData?: any;
}

export default function AddProductModal({
  isOpen,
  onClose,
  categories,
  vendors,
  onSave,
  initialData,
}: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    vendor: '',
    currentStock: '0',
    minStock: '5',
    sellingPrice: '',
    costPrice: '',
    unit: 'units',
    rackLocation: 'A1-B1-S1',
    imageUrl: '',
    description: '',
    isCustomPrinting: false,
  });
  const [loading, setLoading] = useState(false);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        barcode: initialData.barcode || '',
        category: initialData.category?._id || initialData.category || '',
        vendor: initialData.vendor?._id || initialData.vendor || '',
        currentStock: String(initialData.currentStock || 0),
        minStock: String(initialData.minStock || 5),
        sellingPrice: String(initialData.sellingPrice || ''),
        costPrice: String(initialData.costPrice || ''),
        unit: initialData.unit || 'units',
        rackLocation: initialData.rackLocation || 'A1-B1-S1',
        imageUrl: initialData.imageUrl || '',
        description: initialData.description || '',
        isCustomPrinting: initialData.isCustomPrinting || false,
      });
    } else {
      setFormData({
        name: '',
        sku: `PPR-${Math.floor(100 + Math.random() * 900)}`,
        barcode: `890123${Math.floor(100000 + Math.random() * 900000)}`,
        category: categories[0]?._id || '',
        vendor: vendors[0]?._id || '',
        currentStock: '50',
        minStock: '10',
        sellingPrice: '100',
        costPrice: '70',
        unit: 'units',
        rackLocation: 'A1-B1-S1',
        imageUrl: '',
        description: '',
        isCustomPrinting: false,
      });
    }
    setImageFile(null);
    setPreviewUrl('');
    setUploadError('');
    setOptimizingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [initialData, categories, vendors, isOpen]);

  useEffect(() => {
    if (!imageFile) return;
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  if (!isOpen) return null;

  const applyImageFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file (JPEG, PNG, GIF, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be 5MB or smaller.');
      return;
    }
    setUploadError('');
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setUploadError('');
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        setOptimizingImage(true);
        const payload = new FormData();
        payload.append('file', imageFile);
        const res = await fetch('/api/uploads', { method: 'POST', body: payload });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.url) {
          throw new Error(json.error || 'Failed to upload image');
        }
        imageUrl = json.url;
      }

      await onSave({ ...formData, imageUrl });
      onClose();
    } catch (err: any) {
      console.error(err);
      setUploadError(err?.message || 'Could not save the product image.');
    } finally {
      setOptimizingImage(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 text-[#00aeef] rounded-xl">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Product' : 'Add New Stationery Product'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Fill in item specifications, pricing, rack location & stock levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. A4 Copy Paper White 75 GSM"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode / EAN</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vendor / Supplier</label>
              <select
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Type</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              >
                <option value="units">units</option>
                <option value="reams">reams</option>
                <option value="packs">packs</option>
                <option value="boxes">boxes</option>
                <option value="sets">sets</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Stock</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Threshold</label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rack Location</label>
              <input
                type="text"
                value={formData.rackLocation}
                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                placeholder="A1-B1-S1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => applyImageFile(e.target.files?.[0])}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                applyImageFile(e.dataTransfer.files?.[0]);
              }}
              className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-[#00aeef] bg-cyan-50'
                  : 'border-slate-200 hover:border-[#00aeef] hover:bg-slate-50'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-[#00aeef]" />
              <p className="font-semibold text-slate-700">Drag and drop an image here</p>
              <p className="text-slate-500 mt-1">or click to browse — converted to WebP, max 800px (JPEG, PNG, GIF, WebP · 5MB)</p>
            </div>
            {(previewUrl || formData.imageUrl) && (
              <div className="mt-3 flex items-center gap-3">
                <div className="relative w-16 h-16 shrink-0">
                  <img
                    src={previewUrl || formData.imageUrl}
                    alt="Selected product"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-100"
                  />
                  {optimizingImage && (
                    <div className="absolute inset-0 rounded-xl bg-slate-900/50 flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-700 truncate">
                    {imageFile?.name || 'Current product image'}
                  </p>
                  <p className="text-slate-500">
                    {optimizingImage
                      ? 'Optimizing to WebP (max 800px, 80% quality)…'
                      : imageFile
                        ? 'Saved as compressed WebP when you save'
                        : 'Current product image'}
                  </p>
                  {imageFile && !optimizingImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setPreviewUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-1 text-[#00aeef] font-semibold hover:underline"
                    >
                      Remove selected file
                    </button>
                  )}
                </div>
              </div>
            )}
            {uploadError && <p className="mt-2 text-red-500 font-semibold">{uploadError}</p>}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="customPrint"
              checked={formData.isCustomPrinting}
              onChange={(e) => setFormData({ ...formData, isCustomPrinting: e.target.checked })}
              className="rounded text-[#00aeef] focus:ring-[#00aeef]"
            />
            <label htmlFor="customPrint" className="font-semibold text-slate-700 cursor-pointer">
              Is Custom Stationery Printing Service?
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white font-bold hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
