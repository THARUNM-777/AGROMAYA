import React, { useState, useEffect } from 'react';
import { marketplaceApi, walletApi } from '../../services/api';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import confetti from 'canvas-confetti';
import {
  Store,
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  Coins,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Wheat,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export const AgriMarketplace: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableCredits, setAvailableCredits] = useState<number>(4850);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any>(null);

  const fetchShopData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, wRes] = await Promise.all([
        marketplaceApi.getProducts(),
        marketplaceApi.getCategories(),
        walletApi.getWallet(),
      ]);
      if (pRes.success) setProducts(pRes.products);
      if (cRes.success) setCategories(cRes.categories);
      if (wRes.success) setAvailableCredits(wRes.wallet.availableCredits);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartCredits = cart.reduce((acc, item) => acc + item.product.creditPrice * item.quantity, 0);
  const hasSufficientCredits = availableCredits >= totalCartCredits;

  const handleCheckout = async () => {
    if (cart.length === 0 || !hasSufficientCredits) return;
    setSubmitting(true);
    try {
      const res = await marketplaceApi.placeOrder({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });

      if (res.success) {
        setPurchaseSuccess(res);
        setAvailableCredits(res.remainingCredits);
        setCart([]);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Store className="w-4 h-4" />
            Biochar Circular Input Marketplace
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{t('marketplace')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reinvest agricultural waste credits into certified biochar soil enrichers, organic vermicompost, seeds, and tools.
          </p>
        </div>

        {/* Live Wallet Balance & Cart Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-700" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-none">Available Credits</span>
              <span className="text-sm font-extrabold text-emerald-800">
                {availableCredits.toLocaleString()} Credits
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl shadow-md transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                {cart.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search biochar, seeds, vermicompost..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Input Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                  {product.category?.name || 'Biochar'}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{product.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-100 mt-2 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Credit Price</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {product.creditPrice} Credits
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">INR Value</span>
                  <span className="text-xs font-semibold text-slate-700">₹{product.priceInInr}</span>
                </div>
              </div>

              <button
                onClick={() => addToCart(product)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('addToCart')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 animate-fade-in">
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-extrabold text-base text-slate-900">{t('cart')}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {cart.length} item(s)
                  </span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-[50vh] overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Your cart is empty. Add biochar fertilizers or seeds to proceed.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="pt-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1">
                        <h5 className="font-bold text-slate-900 line-clamp-1">{item.product.name}</h5>
                        <span className="text-slate-500 font-semibold">
                          {item.product.creditPrice} Credits each
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 hover:bg-slate-100 text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Wallet Credits:</span>
                  <span className="font-extrabold text-emerald-800">
                    {availableCredits.toLocaleString()} Credits
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1.5">
                  <span>Total Order Cost:</span>
                  <span className="text-emerald-700">{totalCartCredits.toLocaleString()} Credits</span>
                </div>
              </div>

              {!hasSufficientCredits && cart.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Insufficient agricultural credits. Need {(totalCartCredits - availableCredits).toLocaleString()} more credits.
                  </span>
                </div>
              )}

              <button
                disabled={cart.length === 0 || !hasSufficientCredits || submitting}
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  'Processing Redemption...'
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Redeem Using {totalCartCredits.toLocaleString()} Credits
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {purchaseSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-100 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Order Confirmed! 🎉</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your order <b>{purchaseSuccess.order?.orderNumber}</b> has been placed and scheduled for delivery at your farm address.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl text-xs space-y-1 text-left border border-emerald-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Credits Deducted:</span>
                <span className="font-bold text-slate-900">
                  {purchaseSuccess.order?.totalAmountCredits.toLocaleString()} Credits
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Wallet Balance:</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {purchaseSuccess.remainingCredits.toLocaleString()} Credits
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setPurchaseSuccess(null);
                setIsCartOpen(false);
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
