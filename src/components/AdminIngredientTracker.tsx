import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Download,
  Edit2,
  Trash2,
  Scale,
  DollarSign,
  Layers,
  ChefHat,
  Info,
  Calendar,
  Sparkles,
  Wheat,
  Milk,
  Boxes,
} from 'lucide-react';
import { BakingIngredient, IngredientCategory, IngredientUnit, PlacedOrder } from '../types.ts';

interface AdminIngredientTrackerProps {
  adminKey: string;
  orders?: PlacedOrder[];
}

interface InventorySummary {
  totalCount: number;
  lowStockCount: number;
  criticalCount: number;
  totalInventoryValueINR: number;
  healthyCount: number;
}

interface LiveDemand {
  totalActiveOrders: number;
  totalActiveCakeKg: number;
  estimatedDemand: {
    flourKg: number;
    butterKg: number;
    creamLiters: number;
    sugarKg: number;
    chocolateKg: number;
  };
}

const CATEGORIES: IngredientCategory[] = [
  'Flour & Grains',
  'Dairy & Fats',
  'Sugars & Sweeteners',
  'Chocolate & Cocoa',
  'Flavourings & Extracts',
  'Leavening & Additives',
  'Packaging & Kitchen',
];

export const AdminIngredientTracker: React.FC<AdminIngredientTrackerProps> = ({
  adminKey,
  orders = [],
}) => {
  const [ingredients, setIngredients] = useState<BakingIngredient[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [liveDemand, setLiveDemand] = useState<LiveDemand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'critical' | 'healthy'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<BakingIngredient | null>(null);
  const [quickAdjustTarget, setQuickAdjustTarget] = useState<BakingIngredient | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>('Weekly stock replenishment');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showDemandDetails, setShowDemandDetails] = useState(false);

  // New Ingredient Form state
  const [newForm, setNewForm] = useState({
    name: '',
    category: 'Flour & Grains' as IngredientCategory,
    currentStock: 25,
    unit: 'kg' as IngredientUnit,
    minimumThreshold: 10,
    idealStock: 50,
    costPerUnit: 150,
    supplier: 'Local Bangalore Wholesaler',
    storageLocation: 'Main Dry Pantry',
    notes: '',
  });

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminKey}`,
    'x-admin-key': adminKey,
  });

  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ingredients', {
        headers: getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to load ingredient inventory (Status: ${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setIngredients(data.ingredients || []);
        setSummary(data.summary || null);
        setLiveDemand(data.liveDemand || null);
      }
    } catch (err: any) {
      console.error('Fetch ingredients error:', err);
      setError(err?.message || 'Could not fetch ingredient data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [adminKey]);

  // Quick delta stock adjustment
  const handleStockAdjustment = async (id: string, delta: number, reason: string) => {
    setIsAdjusting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ingredients/${id}/adjust`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ delta, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to adjust stock');
      }
      setSuccessMsg(data.message);
      setQuickAdjustTarget(null);
      await fetchIngredients();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Stock adjustment failed');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Create new ingredient
  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) {
      setError('Ingredient name is required');
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/admin/ingredients', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create ingredient');
      }
      setSuccessMsg(`Added "${newForm.name}" to inventory`);
      setIsAddModalOpen(false);
      setNewForm({
        name: '',
        category: 'Flour & Grains',
        currentStock: 25,
        unit: 'kg',
        minimumThreshold: 10,
        idealStock: 50,
        costPerUnit: 150,
        supplier: 'Local Bangalore Wholesaler',
        storageLocation: 'Main Dry Pantry',
        notes: '',
      });
      await fetchIngredients();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to add ingredient');
    }
  };

  // Update existing ingredient
  const handleUpdateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/ingredients/${editingIngredient.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(editingIngredient),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update ingredient');
      }
      setSuccessMsg(`Updated "${editingIngredient.name}"`);
      setEditingIngredient(null);
      await fetchIngredients();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update ingredient');
    }
  };

  // Delete ingredient
  const handleDeleteIngredient = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from inventory tracking?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/ingredients/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete ingredient');
      }
      setSuccessMsg(`Removed "${name}" from tracking`);
      await fetchIngredients();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete ingredient');
    }
  };

  // Export Inventory CSV
  const handleExportCSV = () => {
    if (ingredients.length === 0) return;
    const headers = [
      'ID',
      'Ingredient Name',
      'Category',
      'Current Stock',
      'Unit',
      'Min Threshold',
      'Par Ideal Stock',
      'Status',
      'Cost Per Unit (INR)',
      'Total Stored Value (INR)',
      'Supplier',
      'Storage Location',
      'Last Restocked',
      'Notes',
    ];

    const rows = ingredients.map((i) => {
      const isCritical = i.currentStock <= i.minimumThreshold * 0.5;
      const isLow = i.currentStock <= i.minimumThreshold;
      const status = isCritical ? 'CRITICAL' : isLow ? 'LOW STOCK' : 'HEALTHY';
      const totalVal = Math.round(i.currentStock * i.costPerUnit);

      return [
        `"${i.id}"`,
        `"${i.name.replace(/"/g, '""')}"`,
        `"${i.category}"`,
        i.currentStock,
        `"${i.unit}"`,
        i.minimumThreshold,
        i.idealStock,
        `"${status}"`,
        i.costPerUnit,
        totalVal,
        `"${(i.supplier || '').replace(/"/g, '""')}"`,
        `"${(i.storageLocation || '').replace(/"/g, '""')}"`,
        `"${i.lastRestocked || ''}"`,
        `"${(i.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sweet_bliss_ingredient_stock_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockStatusFilter === 'low' && item.currentStock > item.minimumThreshold) {
        return false;
      }
      if (
        stockStatusFilter === 'critical' &&
        item.currentStock > item.minimumThreshold * 0.5
      ) {
        return false;
      }
      if (stockStatusFilter === 'healthy' && item.currentStock <= item.minimumThreshold) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesSupplier = (item.supplier || '').toLowerCase().includes(query);
        const matchesLocation = (item.storageLocation || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesSupplier && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }, [ingredients, selectedCategory, stockStatusFilter, searchQuery]);

  // Essential Baking Trio (Flour, Butter, Cream) quick aggregates
  const trioStats = useMemo(() => {
    const flourItems = ingredients.filter((i) => i.name.toLowerCase().includes('flour'));
    const butterItems = ingredients.filter((i) => i.name.toLowerCase().includes('butter'));
    const creamItems = ingredients.filter(
      (i) => i.name.toLowerCase().includes('cream') && !i.name.toLowerCase().includes('cheese')
    );

    const totalFlour = flourItems.reduce((acc, curr) => acc + curr.currentStock, 0);
    const minFlour = flourItems.reduce((acc, curr) => acc + curr.minimumThreshold, 0);

    const totalButter = butterItems.reduce((acc, curr) => acc + curr.currentStock, 0);
    const minButter = butterItems.reduce((acc, curr) => acc + curr.minimumThreshold, 0);

    const totalCream = creamItems.reduce((acc, curr) => acc + curr.currentStock, 0);
    const minCream = creamItems.reduce((acc, curr) => acc + curr.minimumThreshold, 0);

    return {
      flour: { total: Math.round(totalFlour * 10) / 10, min: minFlour, items: flourItems },
      butter: { total: Math.round(totalButter * 10) / 10, min: minButter, items: butterItems },
      cream: { total: Math.round(totalCream * 10) / 10, min: minCream, items: creamItems },
    };
  }, [ingredients]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#9F1239] uppercase tracking-wider">
              <ChefHat className="w-4 h-4" />
              <span>Kitchen & Raw Material Logistics</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Baking Ingredients Stock Tracker
            </h2>
            <p className="text-xs text-stone-500 max-w-2xl">
              Monitor key baking inventory levels including flour, butter, and cream. Set automated low-stock reorder thresholds and estimate raw ingredient requirements directly from active kitchen orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchIngredients}
              disabled={loading}
              className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#881337] transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#881337]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 text-rose-200" />
              <span>Add Ingredient</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="font-bold cursor-pointer">×</button>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="font-bold cursor-pointer">×</button>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Total Ingredients
            </span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {summary?.totalCount ?? ingredients.length}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Across 7 baking categories
          </div>
        </div>

        {/* Metric 2: Low Stock */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            stockStatusFilter === 'low'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/30'
              : 'bg-white border-rose-100 shadow-2xs hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900">
            {summary?.lowStockCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium">
            Below reorder threshold
          </div>
        </div>

        {/* Metric 3: Critical Stock */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'critical' ? 'all' : 'critical')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            stockStatusFilter === 'critical'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-300/30'
              : 'bg-white border-rose-100 shadow-2xs hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Critical / Depleted
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-900">
            {summary?.criticalCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-rose-700 font-medium">
            Urgent restock needed
          </div>
        </div>

        {/* Metric 4: Inventory Valuation */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Inventory Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            ₹{(summary?.totalInventoryValueINR ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            At wholesale cost
          </div>
        </div>

        {/* Metric 5: Live Order Pipeline Demand */}
        <div
          onClick={() => setShowDemandDetails(!showDemandDetails)}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-2xs cursor-pointer hover:border-[#881337]/30 transition-all col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#881337] uppercase tracking-wider">
              Queue Demand
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#881337] flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#881337]">
            {liveDemand?.totalActiveCakeKg ?? 0} <span className="text-xs font-sans text-stone-600 font-semibold">kg</span>
          </div>
          <div className="mt-1 text-[11px] text-stone-500 flex items-center justify-between">
            <span>{liveDemand?.totalActiveOrders ?? 0} pending cakes</span>
            <span className="text-[#881337] font-semibold underline">Details</span>
          </div>
        </div>
      </div>

      {/* ================= SPECIAL HIGHLIGHT: ESSENTIAL BAKING TRIO (FLOUR, BUTTER, CREAM) ================= */}
      <div className="bg-gradient-to-br from-amber-50/70 via-rose-50/30 to-white rounded-3xl p-6 border border-amber-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#881337] text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Core Baking Staples: Flour, Butter & Cream
              </h3>
              <p className="text-xs text-stone-600">
                Foundational ingredient reserves for daily artisan sponge, brioche, and buttercream batches
              </p>
            </div>
          </div>

          <div className="text-xs text-stone-500 font-medium">
            Live reserve monitoring
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Flour */}
          <div className="bg-white rounded-2xl p-4.5 border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Wheat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">Baking Flour</h4>
                  <span className="text-[11px] text-stone-500">AP Maida & Almond</span>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  trioStats.flour.total <= trioStats.flour.min
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {trioStats.flour.total <= trioStats.flour.min ? 'Low Stock' : 'Optimal'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="font-mono text-2xl font-bold text-stone-900">
                  {trioStats.flour.total}
                </span>
                <span className="text-xs text-stone-500 font-semibold ml-1">kg in stock</span>
              </div>
              <div className="text-right text-xs text-stone-500">
                Min Reorder: <strong className="text-stone-700">{trioStats.flour.min} kg</strong>
              </div>
            </div>

            {/* Quick Adjustment Buttons */}
            {trioStats.flour.items[0] && (
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5 text-xs">
                <button
                  onClick={() =>
                    handleStockAdjustment(
                      trioStats.flour.items[0].id,
                      -2.0,
                      'Daily cake sponge batch bake'
                    )
                  }
                  disabled={isAdjusting}
                  className="flex-1 py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors cursor-pointer text-center"
                  title="Consume 2 kg in kitchen"
                >
                  -2 kg (Bake)
                </button>
                <button
                  onClick={() =>
                    handleStockAdjustment(
                      trioStats.flour.items[0].id,
                      10.0,
                      'Mill flour delivery intake'
                    )
                  }
                  disabled={isAdjusting}
                  className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition-colors cursor-pointer text-center"
                  title="Add 10 kg delivered"
                >
                  +10 kg (Restock)
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Butter */}
          <div className="bg-white rounded-2xl p-4.5 border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Milk className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">White Butter (82%)</h4>
                  <span className="text-[11px] text-stone-500">Swiss Buttercream & Crust</span>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  trioStats.butter.total <= trioStats.butter.min
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {trioStats.butter.total <= trioStats.butter.min ? 'Low Stock' : 'Optimal'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="font-mono text-2xl font-bold text-stone-900">
                  {trioStats.butter.total}
                </span>
                <span className="text-xs text-stone-500 font-semibold ml-1">kg in stock</span>
              </div>
              <div className="text-right text-xs text-stone-500">
                Min Reorder: <strong className="text-stone-700">{trioStats.butter.min} kg</strong>
              </div>
            </div>

            {/* Quick Adjustment Buttons */}
            {trioStats.butter.items[0] && (
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5 text-xs">
                <button
                  onClick={() =>
                    handleStockAdjustment(
                      trioStats.butter.items[0].id,
                      -1.5,
                      'Buttercream batch production'
                    )
                  }
                  disabled={isAdjusting}
                  className="flex-1 py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors cursor-pointer text-center"
                  title="Consume 1.5 kg in kitchen"
                >
                  -1.5 kg (Frost)
                </button>
                <button
                  onClick={() =>
                    handleStockAdjustment(
                      trioStats.butter.items[0].id,
                      5.0,
                      'Fresh dairy butter intake'
                    )
                  }
                  disabled={isAdjusting}
                  className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition-colors cursor-pointer text-center"
                  title="Add 5 kg delivered"
                >
                  +5 kg (Restock)
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Cream */}
          <div className="bg-white rounded-2xl p-4.5 border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">Heavy Whipping Cream</h4>
                  <span className="text-[11px] text-stone-500">35% Fat Ganache & Chantilly</span>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  trioStats.cream.total <= trioStats.cream.min
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {trioStats.cream.total <= trioStats.cream.min ? 'Low Stock' : 'Optimal'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="font-mono text-2xl font-bold text-stone-900">
                  {trioStats.cream.total}
                </span>
                <span className="text-xs text-stone-500 font-semibold ml-1">Liters in stock</span>
              </div>
              <div className="text-right text-xs text-stone-500">
                Min Reorder: <strong className="text-stone-700">{trioStats.cream.min} L</strong>
              </div>
            </div>

            {/* Quick Adjustment Buttons */}
            {trioStats.cream.items[0] && (
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5 text-xs">
                <button
                  onClick={() =>
                    handleStockAdjustment(
                      trioStats.cream.items[0].id,
                      -2.0,
                      'Chocolate ganache preparation'
                    )
                  }
                  disabled={isAdjusting}
                  className="flex-1 py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors cursor-pointer text-center"
                  title="Consume 2 liters in kitchen"
                >
                  -2 L (Whip)
                </button>
                <button
                  onClick={() =>
                    handleStockAdjustment(
                      trioStats.cream.items[0].id,
                      10.0,
                      'Chilled dairy cream shipment'
                    )
                  }
                  disabled={isAdjusting}
                  className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition-colors cursor-pointer text-center"
                  title="Add 10 L delivered"
                >
                  +10 L (Restock)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= LIVE DEMAND FORECAST BREAKDOWN (EXPANDABLE) ================= */}
      {showDemandDetails && liveDemand && (
        <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#881337]" />
              <h3 className="font-bold text-sm text-stone-900">
                Order Pipeline Ingredient Demand Breakdown
              </h3>
            </div>
            <button
              onClick={() => setShowDemandDetails(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-semibold"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Based on <strong>{liveDemand.totalActiveOrders} active orders</strong> ({liveDemand.totalActiveCakeKg} kg cake mass) currently in the kitchen queue (Confirmed, Baking, or Assembling). These estimates calculate raw batch weights required to fulfill all upcoming deliveries without running short:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Flour Demand</span>
              <strong className="text-base text-amber-950 font-mono">
                {liveDemand.estimatedDemand.flourKg} kg
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Butter Demand</span>
              <strong className="text-base text-amber-950 font-mono">
                {liveDemand.estimatedDemand.butterKg} kg
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">Cream Demand</span>
              <strong className="text-base text-rose-950 font-mono">
                {liveDemand.estimatedDemand.creamLiters} Liters
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-700 block">Sugar Demand</span>
              <strong className="text-base text-stone-900 font-mono">
                {liveDemand.estimatedDemand.sugarKg} kg
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-700 block">Chocolate Demand</span>
              <strong className="text-base text-stone-900 font-mono">
                {liveDemand.estimatedDemand.chocolateKg} kg
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ================= SEARCH & CATEGORY FILTERS ================= */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ingredient name, supplier, or pantry location..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#881337] focus:ring-1 focus:ring-[#881337] text-xs bg-stone-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                stockStatusFilter === 'all'
                  ? 'bg-[#881337] text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All ({ingredients.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('low')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                stockStatusFilter === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Low Stock ({summary?.lowStockCount ?? 0})
            </button>
            <button
              onClick={() => setStockStatusFilter('healthy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                stockStatusFilter === 'healthy'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Healthy ({summary?.healthyCount ?? 0})
            </button>
          </div>
        </div>

        {/* Category Pills (Interactive segmented buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ================= INVENTORY TABLE / LIST ================= */}
      {filteredIngredients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-rose-100 space-y-3">
          <Package className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-stone-800">No ingredients match your filter</h3>
          <p className="text-xs text-stone-500">
            Try resetting your search query or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setStockStatusFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-rose-100 text-stone-600 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Ingredient & Details</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-4 text-center">Stock Level</th>
                  <th className="py-3.5 px-3">Unit Cost & Value</th>
                  <th className="py-3.5 px-3">Supplier & Location</th>
                  <th className="py-3.5 px-4 text-right">Quick Restock / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 text-stone-800">
                {filteredIngredients.map((item) => {
                  const isCritical = item.currentStock <= item.minimumThreshold * 0.5;
                  const isLow = item.currentStock <= item.minimumThreshold;
                  const percentageOfIdeal = Math.min(
                    100,
                    Math.round((item.currentStock / Math.max(1, item.idealStock)) * 100)
                  );
                  const totalStoredValue = Math.round(item.currentStock * item.costPerUnit);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-rose-50/30 transition-colors ${
                        isCritical
                          ? 'bg-rose-50/20'
                          : isLow
                          ? 'bg-amber-50/15'
                          : ''
                      }`}
                    >
                      {/* 1. Name & notes */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-stone-900 text-sm">
                          {item.name}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                            {item.notes}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
                          <span>ID: {item.id}</span>
                          <span>·</span>
                          <span>Restocked: {new Date(item.lastRestocked).toLocaleDateString('en-IN')}</span>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="py-4 px-3 text-stone-600 font-medium">
                        {item.category}
                      </td>

                      {/* 3. Stock Level & Progress Bar */}
                      <td className="py-4 px-4 text-center min-w-[150px]">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <span
                            className={`font-mono font-bold text-base ${
                              isCritical
                                ? 'text-rose-700'
                                : isLow
                                ? 'text-amber-700'
                                : 'text-emerald-800'
                            }`}
                          >
                            {item.currentStock}
                          </span>
                          <span className="text-xs text-stone-500 font-semibold">{item.unit}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isCritical ? 'Critical' : isLow ? 'Low' : 'Healthy'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden max-w-[140px] mx-auto">
                          <div
                            className={`h-full transition-all rounded-full ${
                              isCritical
                                ? 'bg-rose-600'
                                : isLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${percentageOfIdeal}%` }}
                          />
                        </div>

                        <div className="text-[10px] text-stone-400 mt-1">
                          Min: {item.minimumThreshold} {item.unit} / Ideal: {item.idealStock} {item.unit}
                        </div>
                      </td>

                      {/* 4. Cost & Total Value */}
                      <td className="py-4 px-3 font-mono">
                        <div className="text-stone-900 font-semibold">
                          ₹{item.costPerUnit} / {item.unit}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Total: ₹{totalStoredValue.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* 5. Supplier & Location */}
                      <td className="py-4 px-3 text-stone-600">
                        <div className="font-medium text-stone-800">{item.supplier}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {item.storageLocation}
                        </div>
                      </td>

                      {/* 6. Quick Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Adjust modal trigger */}
                          <button
                            onClick={() => {
                              setQuickAdjustTarget(item);
                              setAdjustDelta(item.unit === 'packets' ? 10 : 5);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
                            title="Quick Restock or Log Usage"
                          >
                            Adjust ±
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingIngredient(item)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
                            title="Edit Ingredient Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteIngredient(item.id, item.name)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from Inventory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ================= MODAL 1: ADD NEW INGREDIENT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-rose-100 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#881337] text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Add Baking Ingredient
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="e.g. Belgian Dark Chocolate Callets 54.5%"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#881337]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newForm.category}
                    onChange={(e) =>
                      setNewForm({ ...newForm, category: e.target.value as IngredientCategory })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Measurement Unit *
                  </label>
                  <select
                    value={newForm.unit}
                    onChange={(e) =>
                      setNewForm({ ...newForm, unit: e.target.value as IngredientUnit })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="liters">Liters (L)</option>
                    <option value="grams">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="packets">Packets / Units</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={newForm.currentStock}
                    onChange={(e) =>
                      setNewForm({ ...newForm, currentStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Min Threshold *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={newForm.minimumThreshold}
                    onChange={(e) =>
                      setNewForm({ ...newForm, minimumThreshold: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Ideal Par Stock
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newForm.idealStock}
                    onChange={(e) =>
                      setNewForm({ ...newForm, idealStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Cost per Unit (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newForm.costPerUnit}
                    onChange={(e) =>
                      setNewForm({ ...newForm, costPerUnit: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Supplier / Source
                  </label>
                  <input
                    type="text"
                    value={newForm.supplier}
                    onChange={(e) => setNewForm({ ...newForm, supplier: e.target.value })}
                    placeholder="e.g. Amul Fresh Dairy"
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Storage Location in Bakery
                </label>
                <input
                  type="text"
                  value={newForm.storageLocation}
                  onChange={(e) => setNewForm({ ...newForm, storageLocation: e.target.value })}
                  placeholder="e.g. Walk-in Chiller Shelf 2 (4°C)"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Usage & Storage Notes
                </label>
                <textarea
                  rows={2}
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="e.g. Sift before adding to batter; store airtight"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT INGREDIENT ================= */}
      {editingIngredient && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-rose-100 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#881337]" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Edit Ingredient: {editingIngredient.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingIngredient(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateIngredient} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingIngredient.name}
                  onChange={(e) =>
                    setEditingIngredient({ ...editingIngredient, name: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={editingIngredient.category}
                    onChange={(e) =>
                      setEditingIngredient({
                        ...editingIngredient,
                        category: e.target.value as IngredientCategory,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Unit</label>
                  <select
                    value={editingIngredient.unit}
                    onChange={(e) =>
                      setEditingIngredient({
                        ...editingIngredient,
                        unit: e.target.value as IngredientUnit,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="liters">Liters (L)</option>
                    <option value="grams">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="packets">Packets / Units</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingIngredient.currentStock}
                    onChange={(e) =>
                      setEditingIngredient({
                        ...editingIngredient,
                        currentStock: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingIngredient.minimumThreshold}
                    onChange={(e) =>
                      setEditingIngredient({
                        ...editingIngredient,
                        minimumThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ideal Par Stock</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingIngredient.idealStock}
                    onChange={(e) =>
                      setEditingIngredient({
                        ...editingIngredient,
                        idealStock: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Cost per Unit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingIngredient.costPerUnit}
                    onChange={(e) =>
                      setEditingIngredient({
                        ...editingIngredient,
                        costPerUnit: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={editingIngredient.supplier}
                    onChange={(e) =>
                      setEditingIngredient({ ...editingIngredient, supplier: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Storage Location</label>
                <input
                  type="text"
                  value={editingIngredient.storageLocation}
                  onChange={(e) =>
                    setEditingIngredient({ ...editingIngredient, storageLocation: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingIngredient.notes || ''}
                  onChange={(e) =>
                    setEditingIngredient({ ...editingIngredient, notes: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingIngredient(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: QUICK ADJUST STOCK (RESTOCK / USAGE) ================= */}
      {quickAdjustTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-100 shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Quick Stock Adjustment
                </span>
                <h3 className="font-bold text-stone-900 text-base">
                  {quickAdjustTarget.name}
                </h3>
              </div>
              <button
                onClick={() => setQuickAdjustTarget(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-600">Current Stock:</span>
              <span className="font-mono font-bold text-stone-900 text-sm">
                {quickAdjustTarget.currentStock} {quickAdjustTarget.unit}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Select Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (adjustDelta < 0) setAdjustDelta(Math.abs(adjustDelta));
                      setAdjustReason('Stock delivery restock');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold cursor-pointer text-center transition-all ${
                      adjustDelta > 0
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    + Add / Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (adjustDelta > 0) setAdjustDelta(-Math.abs(adjustDelta));
                      setAdjustReason('Baking batch production usage');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold cursor-pointer text-center transition-all ${
                      adjustDelta < 0
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    - Deduct / Used
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Quantity ({quickAdjustTarget.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={Math.abs(adjustDelta)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setAdjustDelta(adjustDelta < 0 ? -val : val);
                  }}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Reason / Reference Note
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received weekly Amul dairy delivery"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              {/* Preview calculation */}
              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-[11px] text-stone-600 flex justify-between">
                <span>New Stock Level:</span>
                <strong className="text-[#881337] font-mono">
                  {Math.max(0, Math.round((quickAdjustTarget.currentStock + adjustDelta) * 10) / 10)}{' '}
                  {quickAdjustTarget.unit}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAdjustTarget(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAdjusting || adjustDelta === 0}
                  onClick={() =>
                    handleStockAdjustment(quickAdjustTarget.id, adjustDelta, adjustReason)
                  }
                  className="px-4 py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {isAdjusting ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
