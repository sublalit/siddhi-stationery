'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  Home,
  ShoppingCart,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import ProductTable from '@/components/products/ProductTable';
import AddProductModal from '@/components/products/AddProductModal';
import RecordPurchaseModal from '@/components/products/RecordPurchaseModal';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  recordPurchase,
} from '@/lib/actions/products';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & View State
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [purchasingProduct, setPurchasingProduct] = useState<any | null>(null);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const data = await getProducts(search, selectedCategory, selectedStock);
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const catRes = await fetch('/api/categories').then((r) => r.json()).catch(() => ({ categories: [] }));
      if (catRes.categories) setCategories(catRes.categories);

      const vRes = await fetch('/api/vendors').then((r) => r.json()).catch(() => ({ vendors: [] }));
      if (vRes.vendors) setVendors(vRes.vendors);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedStock]);

  const handleSaveProduct = async (formData: any) => {
    if (editingProduct) {
      await updateProduct(editingProduct._id, formData);
    } else {
      await createProduct(formData);
    }
    await fetchProductData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this stationery item?')) {
      await deleteProduct(id);
      await fetchProductData();
    }
  };

  const handleRecordPurchaseSave = async (
    productId: string,
    quantity: number,
    costPrice: number
  ) => {
    await recordPurchase(productId, quantity, costPrice);
    await fetchProductData();
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
        <span className="text-slate-800 font-semibold">Products</span>
      </div>

      {/* Header & Main Actions matching Lovable prototype screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage your inventory items</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (products.length > 0) setPurchasingProduct(products[0]);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ShoppingCart className="w-4 h-4 text-[#00aeef]" />
            <span>Record Purchase</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Search input, Category filter, Stock status filter, View Switcher) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00aeef] bg-slate-50/50"
          />
        </div>

        {/* Category & Stock Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#00aeef]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#00aeef]"
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock (&gt; 5)</option>
            <option value="low-stock">Low Stock (1 - 5)</option>
            <option value="out-of-stock">Out of Stock (0)</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#00aeef] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#00aeef] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-[#00aeef] mb-2" />
          Loading products inventory...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add new stationery products.
          </p>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-[#00aeef] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Add Product
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              onEdit={(prod) => {
                setEditingProduct(prod);
                setIsAddModalOpen(true);
              }}
              onDelete={handleDeleteProduct}
              onRecordPurchase={(prod) => setPurchasingProduct(prod)}
            />
          ))}
        </div>
      ) : (
        <ProductTable
          products={products}
          onEdit={(prod) => {
            setEditingProduct(prod);
            setIsAddModalOpen(true);
          }}
          onDelete={handleDeleteProduct}
          onRecordPurchase={(prod) => setPurchasingProduct(prod)}
        />
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        vendors={vendors}
        initialData={editingProduct}
        onSave={handleSaveProduct}
      />

      <RecordPurchaseModal
        isOpen={!!purchasingProduct}
        onClose={() => setPurchasingProduct(null)}
        product={purchasingProduct}
        onSave={handleRecordPurchaseSave}
      />
    </div>
  );
}
