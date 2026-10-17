import React, { useState, useEffect } from 'react';
import {
  Search,
  Tag,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  tagline?: string;
  category: string;
  categoryLabel: string;
  image: string;
  basePrice: number;
  currentPrice: number;
  isOutOfStock: boolean;
  rating?: number;
  badge?: string;
  description?: string;
  flavours?: string[];
  isEggless?: boolean;
}

interface AdminMenuManagerProps {
  adminKey: string;
  onMenuUpdated?: () => void;
}

const CATEGORY_OPTIONS = [
  { id: 'cakes', label: 'Celebration Cakes' },
  { id: 'cheesecakes', label: 'Artisan Cheesecakes' },
  { id: 'croissants', label: 'French Croissants' },
  { id: 'donuts', label: 'Gourmet Donuts' },
  { id: 'pastries', label: 'Patisserie Gateaux' },
  { id: 'cupcakes', label: 'Gourmet Cupcakes' },
  { id: 'cookies', label: 'Artisan Cookies' },
  { id: 'brownies', label: 'Fudge Brownies' },
  { id: 'breads', label: 'Sourdough & Breads' },
  { id: 'gift-hampers', label: 'Luxury Gift Hampers' },
];

const PRESET_IMAGES = [
  { label: 'Belgian Chocolate Truffle', url: '/src/assets/images/featured_chocolate_truffle_1791733075545.jpg' },
  { label: 'Red Velvet Rose', url: '/src/assets/images/featured_red_velvet_1791733088519.jpg' },
  { label: 'Exotic Fresh Fruit', url: '/src/assets/images/featured_fresh_fruit_1791733100150.jpg' },
  { label: 'Butterscotch Crunch', url: '/src/assets/images/featured_butterscotch_1791733167102.jpg' },
  { label: 'Blueberry Cheesecake', url: '/src/assets/images/category_cheesecake_1791733048010.jpg' },
  { label: 'Gourmet Cupcakes', url: '/src/assets/images/category_cupcakes_1791733009259.jpg' },
  { label: 'Butter Croissants', url: '/src/assets/images/bakery_croissant_showcase_1791755071012.jpg' },
  { label: 'Glazed Donuts', url: '/src/assets/images/bakery_donuts_showcase_1791755080950.jpg' },
  { label: 'Artisan Breads', url: '/src/assets/images/bakery_fresh_breads_1791755116409.jpg' },
  { label: 'Pastry Showcase', url: '/src/assets/images/bakery_pastries_showcase_1791755092468.jpg' },
];

export const AdminMenuManager: React.FC<AdminMenuManagerProps> = ({ adminKey, onMenuUpdated }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Quick Price Edit inline state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [quickPriceInput, setQuickPriceInput] = useState<string>('');

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    category: 'cakes',
    categoryLabel: 'Celebration Cakes',
    price: 699,
    tagline: 'Artisan handcrafted fresh daily',
    description: '',
    image: PRESET_IMAGES[0].url,
    badge: 'Popular',
    flavours: 'Belgian Chocolate, Vanilla Bean',
    isEggless: true,
  });

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'cakes',
    categoryLabel: 'Celebration Cakes',
    price: 699,
    tagline: '',
    description: '',
    image: '',
    badge: '',
    flavours: '',
    isEggless: true,
  });

  // Delete Confirmation State
  const [deletingProduct, setDeletingProduct] = useState<MenuItem | null>(null);

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminKey}`,
      'x-admin-key': adminKey,
    };
  };

  const fetchMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/menu', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to load menu items from bakery database');
      }
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

  // Toggle Out of Stock
  const handleToggleStock = async (item: MenuItem) => {
    const nextState = !item.isOutOfStock;
    try {
      const res = await fetch('/api/admin/menu/toggle-stock', {
        method: 'POST',
        headers: getAuthHeaders(),
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
      onMenuUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Error updating stock');
    }
  };

  // Quick Price Save
  const handleSaveQuickPrice = async (item: MenuItem) => {
    const newPrice = Math.round(Number(quickPriceInput));
    if (!newPrice || newPrice <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }
    try {
      const res = await fetch('/api/admin/menu/update-price', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: item.id,
          price: newPrice,
        }),
      });
      if (!res.ok) throw new Error('Failed to update price');
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, currentPrice: newPrice } : i))
      );
      setEditingPriceId(null);
      setActionSuccess(`Updated price of ${item.name} to ₹${newPrice}!`);
      setTimeout(() => setActionSuccess(null), 3000);
      onMenuUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Error saving price');
    }
  };

  // Add Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (Number(addForm.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setIsSavingProduct(true);
    setError(null);
    try {
      const flavoursArray = addForm.flavours
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: addForm.name.trim(),
          category: addForm.category,
          categoryLabel: addForm.categoryLabel,
          price: Number(addForm.price),
          tagline: addForm.tagline.trim(),
          description: addForm.description.trim(),
          image: addForm.image.trim(),
          badge: addForm.badge || undefined,
          flavours: flavoursArray.length > 0 ? flavoursArray : ['Classic Artisan'],
          isEggless: addForm.isEggless,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create product');
      }

      setActionSuccess(`Added "${addForm.name}" to menu successfully!`);
      setTimeout(() => setActionSuccess(null), 3000);
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        category: 'cakes',
        categoryLabel: 'Celebration Cakes',
        price: 699,
        tagline: 'Artisan handcrafted fresh daily',
        description: '',
        image: PRESET_IMAGES[0].url,
        badge: 'Popular',
        flavours: 'Belgian Chocolate, Vanilla Bean',
        isEggless: true,
      });
      fetchMenu();
      onMenuUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Error creating product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MenuItem) => {
    setEditingProduct(item);
    setEditForm({
      name: item.name,
      category: item.category,
      categoryLabel: item.categoryLabel,
      price: item.currentPrice,
      tagline: item.tagline || '',
      description: item.description || '',
      image: item.image,
      badge: item.badge || '',
      flavours: Array.isArray(item.flavours) ? item.flavours.join(', ') : '',
      isEggless: item.isEggless ?? true,
    });
  };

  // Submit Edit
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editForm.name.trim()) {
      setError('Product name cannot be empty');
      return;
    }
    if (Number(editForm.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setIsSavingProduct(true);
    setError(null);
    try {
      const flavoursArray = editForm.flavours
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editForm.name.trim(),
          category: editForm.category,
          categoryLabel: editForm.categoryLabel,
          price: Number(editForm.price),
          tagline: editForm.tagline.trim(),
          description: editForm.description.trim(),
          image: editForm.image.trim(),
          badge: editForm.badge || undefined,
          flavours: flavoursArray.length > 0 ? flavoursArray : ['Classic Artisan'],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update product');
      }

      setActionSuccess(`Updated "${editForm.name}" successfully!`);
      setTimeout(() => setActionSuccess(null), 3000);
      setEditingProduct(null);
      fetchMenu();
      onMenuUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Error saving product edits');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      const res = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete product');
      }
      setItems((prev) => prev.filter((i) => i.id !== deletingProduct.id));
      setActionSuccess(`Product "${deletingProduct.name}" removed from catalogue.`);
      setTimeout(() => setActionSuccess(null), 3000);
      setDeletingProduct(null);
      onMenuUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Error deleting product');
    }
  };

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const filtered = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(search.toLowerCase()) ||
      (item.tagline && item.tagline.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar Header & Action Controls */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#881337] flex items-center gap-2">
              <Tag className="w-5 h-5 text-rose-600" />
              <span>Menu & Product Catalogue Control</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Add new celebration cakes, modify pricing, toggle sold-out inventory, and manage storefront offerings.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>

            <button
              onClick={fetchMenu}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#881337] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Refresh Menu from Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
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
            <button onClick={() => setError(null)} className="font-bold text-stone-500 hover:text-stone-800 cursor-pointer">×</button>
          </div>
        )}

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by cake name, category, or flavour..."
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
                {cat === 'all' ? `All (${items.length})` : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const isQuickEditing = editingPriceId === item.id;
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all space-y-3 flex flex-col justify-between ${
                item.isOutOfStock ? 'border-stone-200 opacity-80 bg-stone-50/60' : 'border-rose-100 hover:border-rose-300'
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

                  {/* Top Right Quick Edit / Delete Buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg shadow-xs">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-stone-600 hover:text-[#881337] cursor-pointer rounded hover:bg-rose-50"
                      title="Edit Product Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(item)}
                      className="p-1 text-stone-400 hover:text-red-600 cursor-pointer rounded hover:bg-red-50"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {item.categoryLabel || item.category}
                  </div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 line-clamp-1">
                    {item.name}
                  </h3>
                  {item.tagline && (
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {item.tagline}
                    </p>
                  )}
                </div>

                {/* Price Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="text-stone-500">Base Price (500g):</span>
                  {isQuickEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-stone-900">₹</span>
                      <input
                        type="number"
                        value={quickPriceInput}
                        onChange={(e) => setQuickPriceInput(e.target.value)}
                        className="w-20 px-2 py-0.5 text-xs font-bold border border-rose-300 rounded-lg text-stone-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveQuickPrice(item)}
                        className="p-1 rounded bg-[#065f46] text-white hover:bg-emerald-700 cursor-pointer"
                        title="Save Price"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingPriceId(null)}
                        className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[#881337] tabular-nums">
                        ₹{item.currentPrice}
                      </span>
                      <button
                        onClick={() => {
                          setEditingPriceId(item.id);
                          setQuickPriceInput(String(item.currentPrice));
                        }}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                        title="Quick edit price"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* In-Stock Toggle Button */}
              <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => handleToggleStock(item)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
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
                      <span>Mark Sold Out</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="py-2 px-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
                  title="Full Edit"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="bg-white rounded-3xl p-12 text-center text-xs text-stone-500 border border-rose-100">
          No bakery items match your search or filter criteria.
        </div>
      )}

      {/* ================= MODAL: ADD NEW PRODUCT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-rose-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#881337] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#881337]">
                  Add New Bakery Product
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belgian Raspberry Dark Truffle"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) => {
                      const sel = CATEGORY_OPTIONS.find((c) => c.id === e.target.value);
                      setAddForm({
                        ...addForm,
                        category: e.target.value,
                        categoryLabel: sel?.label || 'Specialty Cakes',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="699"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  placeholder="e.g. Layered with 55% Belgian chocolate ganache"
                  value={addForm.tagline}
                  onChange={(e) => setAddForm({ ...addForm, tagline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed description, textures, and serving suggestions..."
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Image Preset Selector */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Photo / Image *</span>
                  <span className="text-[10px] text-stone-400">Click a preset or paste URL</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESET_IMAGES.slice(0, 5).map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, image: preset.url })}
                      className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer ${
                        addForm.image === preset.url ? 'border-[#881337] ring-2 ring-[#881337]' : 'border-stone-200'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      {addForm.image === preset.url && (
                        <div className="absolute inset-0 bg-[#881337]/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={addForm.image}
                  onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
                  placeholder="/src/assets/images/... or https://..."
                  className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Badge
                  </label>
                  <select
                    value={addForm.badge}
                    onChange={(e) => setAddForm({ ...addForm, badge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                  >
                    <option value="">None</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Popular">Popular</option>
                    <option value="Chef Special">Chef Special</option>
                    <option value="New">New Arrival</option>
                    <option value="Limited Edition">Limited Edition</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Flavours (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={addForm.flavours}
                    onChange={(e) => setAddForm({ ...addForm, flavours: e.target.value })}
                    placeholder="Chocolate, Raspberry, Truffle"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="w-full py-3 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProduct ? 'Saving to Database...' : 'Save Product to Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PRODUCT ================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-rose-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#881337] flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#881337]">
                  Edit Bakery Product
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => {
                      const sel = CATEGORY_OPTIONS.find((c) => c.id === e.target.value);
                      setEditForm({
                        ...editForm,
                        category: e.target.value,
                        categoryLabel: sel?.label || 'Specialty Cakes',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Badge
                  </label>
                  <select
                    value={editForm.badge}
                    onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                  >
                    <option value="">None</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Popular">Popular</option>
                    <option value="Chef Special">Chef Special</option>
                    <option value="New">New</option>
                    <option value="Limited Edition">Limited Edition</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Flavours
                  </label>
                  <input
                    type="text"
                    value={editForm.flavours}
                    onChange={(e) => setEditForm({ ...editForm, flavours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="flex-1 py-3 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProduct ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-3 rounded-xl border border-stone-200 hover:bg-stone-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-rose-100 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Delete Product?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to remove <strong>"{deletingProduct.name}"</strong> from the bakery catalogue? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
