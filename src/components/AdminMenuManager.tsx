import React, { useState, useEffect } from 'react';
import { Search, Tag, CheckCircle2, XCircle, RefreshCw, AlertCircle, Sparkles, Filter, Edit3, Save } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  image: string;
  basePrice: number;
  currentPrice: number;
  isOutOfStock: boolean;
  rating: number;
  badge?: string;
}

interface AdminMenuManagerProps {
  adminKey: string;
}

export const AdminMenuManager: React.FC<AdminMenuManagerProps> = ({ adminKey }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/menu', {
        headers: {
          'x-admin-key': adminKey,
        },
      });
      if (!res.ok) throw new Error('Failed to load menu items');
      const data = await res.json();
      setItems(data.menu || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [adminKey]);

  const handleToggleStock = async (item: MenuItem) => {
    const nextState = !item.isOutOfStock;
    try {
      const res = await fetch('/api/admin/menu/toggle-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          productId: item.id,
          isOutOfStock: nextState,
        }),
      });
      if (!res.ok) throw new Error('Failed to update stock status');
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isOutOfStock: nextState } : i))
      );
      setActionSuccess(`${item.name} marked ${nextState ? 'Out of Stock' : 'In Stock'}!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating stock');
    }
  };

  const handleStartEditPrice = (item: MenuItem) => {
    setEditingId(item.id);
    setEditPriceInput(String(item.currentPrice));
  };

  const handleSavePrice = async (item: MenuItem) => {
    const newPrice = Math.round(Number(editPriceInput));
    if (!newPrice || newPrice <= 0) {
      setError('Please enter a valid price amount');
      return;
    }
    try {
      const res = await fetch('/api/admin/menu/update-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          productId: item.id,
          price: newPrice,
        }),
      });
      if (!res.ok) throw new Error('Failed to update price');
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, currentPrice: newPrice } : i))
      );
      setEditingId(null);
      setActionSuccess(`Updated price of ${item.name} to ₹${newPrice}!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error saving price');
    }
  };

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const filtered = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar Filters */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#881337] flex items-center gap-2">
              <Tag className="w-5 h-5 text-rose-600" />
              <span>Live Menu & Inventory Management</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Instantly toggle items In Stock / Out of Stock and adjust cake prices. Changes reflect live on the storefront.
            </p>
          </div>

          <button
            onClick={fetchMenu}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#881337] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Menu</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="font-bold cursor-pointer">×</button>
          </div>
        )}

        {/* Search & Category Pills */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cake or pastry by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-stone-50"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#881337] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all space-y-3 flex flex-col justify-between ${
                item.isOutOfStock ? 'border-stone-200 opacity-75 bg-stone-50/50' : 'border-rose-100'
              }`}
            >
              <div className="space-y-3">
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-rose-50 border border-stone-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {item.isOutOfStock ? (
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Sold Out
                      </span>
                    </div>
                  ) : item.badge ? (
                    <span className="absolute top-2 left-2 bg-[#881337] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {item.categoryLabel}
                  </div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 line-clamp-1">
                    {item.name}
                  </h3>
                </div>

                {/* Price Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="text-stone-500">Storefront Price:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-stone-900">₹</span>
                      <input
                        type="number"
                        value={editPriceInput}
                        onChange={(e) => setEditPriceInput(e.target.value)}
                        className="w-20 px-2 py-0.5 text-xs font-bold border border-rose-300 rounded-lg text-stone-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePrice(item)}
                        className="p-1 rounded bg-[#065f46] text-white hover:bg-emerald-700 cursor-pointer"
                        title="Save Price"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[#881337] tabular-nums">
                        ₹{item.currentPrice}
                      </span>
                      <button
                        onClick={() => handleStartEditPrice(item)}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                        title="Edit Price"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* In-Stock Toggle Button */}
              <div className="pt-2 border-t border-stone-100">
                <button
                  onClick={() => handleToggleStock(item)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    item.isOutOfStock
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {item.isOutOfStock ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Set In Stock</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Mark Out of Stock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center text-xs text-stone-500 border border-rose-100">
          No bakery items match your search or filter.
        </div>
      )}
    </div>
  );
};
