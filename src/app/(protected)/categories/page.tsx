'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderTree, Plus, Home, ChevronRight, Package, X, Edit3, Trash2, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function CategoriesPage() {
  const { role, isStaff } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    if (isStaff) return;
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    if (isStaff) return;
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (isStaff) return;
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      try {
        await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
          headers: { 'x-user-role': role },
        });
        setCategories((prev) => prev.filter((c) => c._id !== id));
        fetchCategories();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStaff) return;
    if (!formData.name.trim()) return;
    try {
      setSubmitting(true);
      if (editingCategory) {
        // Edit existing
        const res = await fetch(`/api/categories/${editingCategory._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-role': role },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          setEditingCategory(null);
          setFormData({ name: '', description: '' });
          await fetchCategories();
        }
      } else {
        // Create new
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': role },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          setFormData({ name: '', description: '' });
          await fetchCategories();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
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
        <span className="text-slate-800 font-semibold">Categories</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categories</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Organize stationery items by department & type. Click any category to view products.
          </p>
        </div>

        {isStaff ? (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>View-Only Mode (Staff Access)</span>
          </div>
        ) : (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c) => (
          <div
            key={c._id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-cyan-50 text-[#00aeef] rounded-xl">
                  <FolderTree className="w-5 h-5" />
                </div>
                <Link
                  href={`/products?categoryId=${c._id}`}
                  className="text-xs font-bold px-2.5 py-1 bg-cyan-50 hover:bg-[#00aeef] text-[#00aeef] hover:text-white rounded-full flex items-center gap-1 transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>{c.productCount || 0} Products</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
              <Link href={`/products?categoryId=${c._id}`}>
                <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-[#00aeef] transition-colors flex items-center gap-1 cursor-pointer">
                  {c.name}
                </h3>
              </Link>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'No description provided.'}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/products?categoryId=${c._id}`}
                className="text-xs font-bold text-[#00aeef] hover:underline flex items-center gap-1"
              >
                <span>View Products</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              {!isStaff && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Edit Category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id, c.name)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ball pen"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef] text-xs font-medium"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#00aeef] hover:bg-[#0284c7] text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
