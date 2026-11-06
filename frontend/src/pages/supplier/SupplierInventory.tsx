import React, { useState, useEffect } from 'react';
import { marketplaceApi, suppliersApi } from '../../services/api';
import { Product } from '../../types';
import confetti from 'canvas-confetti';
import {
  Store,
  Plus,
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';

export const SupplierInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceInInr, setPriceInInr] = useState(750);
  const [stockQuantity, setStockQuantity] = useState(100);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        marketplaceApi.getProducts(),
        marketplaceApi.getCategories(),
      ]);
      if (pRes.success) setProducts(pRes.products);
      if (cRes.success) {
        setCategories(cRes.categories);
        if (cRes.categories.length > 0) setCategoryId(cRes.categories[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;
    setSubmitting(true);
    try {
      const res = await marketplaceApi.createProduct({
        name,
        description,
        categoryId,
        priceInInr,
        creditPrice: priceInInr,
        stockQuantity,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80',
        isFeatured: false,
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 60 });
        setShowAddModal(false);
        setName('');
        setDescription('');
        fetchCatalog();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-200">
            <Store className="w-3.5 h-3.5" />
            Product Catalog & Warehouse Stock
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Agricultural Inputs & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplied fertilizers, biological cultures, vermicompost, and residue harvesting tools available to farmers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
          <button
            onClick={fetchCatalog}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="h-40 w-full overflow-hidden bg-slate-100 relative">
                <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900/80 text-white backdrop-blur-xs">
                  {prod.stockQuantity} in Stock
                </span>
              </div>
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                  {prod.category?.name || 'Input Category'}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{prod.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Unit Value</span>
                <span className="text-sm font-black text-slate-900">₹{prod.priceInInr}</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                {prod.creditPrice} Credits
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900">Add Agricultural Product</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certified Organic Neem Cake Fertilizer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Price (₹ / Credits) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={priceInInr}
                    onChange={(e) => setPriceInInr(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Available Stock *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Composition, NPK ratio, usage guidelines..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Product'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
