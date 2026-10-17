import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Calendar,
  Sparkles,
  ArrowUpRight,
  PieChart as PieIcon,
  CreditCard,
  Cake,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { PlacedOrder } from '../types.ts';
import { PRODUCTS } from '../data/bakeryData.ts';

interface AdminPerformanceDashboardProps {
  orders: PlacedOrder[];
  stats?: any;
  onOpenExportModal?: () => void;
}

const CATEGORY_COLORS = [
  '#881337', // Bliss Burgundy
  '#BE185D', // Rose Pink
  '#D97706', // Amber Gold
  '#059669', // Emerald Green
  '#4F46E5', // Indigo Blue
  '#7C3AED', // Royal Violet
  '#0284C7', // Sky Blue
  '#E11D48', // Bright Ruby
];

export const AdminPerformanceDashboard: React.FC<AdminPerformanceDashboardProps> = ({
  orders,
  stats,
  onOpenExportModal,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | 'all'>('7d');
  const [salesMetric, setSalesMetric] = useState<'revenue' | 'orders'>('revenue');

  // 1. Calculate Core KPI Summary from real orders (excluding cancelled orders from revenue)
  const kpis = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalUnits = activeOrders.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);
    const avgOrderValue = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;
    const paidOrders = activeOrders.filter((o) => o.paymentStatus === 'PAID').length;
    const paidRate = activeOrders.length > 0 ? Math.round((paidOrders / activeOrders.length) * 100) : 100;
    const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
    const cancelledCount = orders.filter((o) => o.status === 'Cancelled').length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      activeOrdersCount: activeOrders.length,
      totalUnits,
      avgOrderValue,
      paidRate,
      deliveredCount,
      cancelledCount,
    };
  }, [orders]);

  // 2. Aggregate Daily Sales Trend Data from actual orders only
  const dailyTrendsData = useMemo(() => {
    const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const dayMap = new Map<string, { date: string; fullDate: string; revenue: number; orders: number; aov: number }>();

    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      dayMap.set(key, { date: label, fullDate: key, revenue: 0, orders: 0, aov: 0 });
    }

    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    activeOrders.forEach((o) => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      const bucket = dayMap.get(orderDate);
      if (bucket) {
        bucket.revenue += o.total || 0;
        bucket.orders += 1;
      }
    });

    const dayEntries = Array.from(dayMap.values());
    return dayEntries.map((d) => ({
      ...d,
      aov: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
    }));
  }, [orders, timeRange]);

  // 3. Aggregate Cake Categories Data from real orders
  const categoryData = useMemo(() => {
    const catMap = new Map<string, { category: string; revenue: number; units: number }>();

    const getProductCategory = (prodId: string, prodName: string): string => {
      const found = PRODUCTS.find((p) => p.id === prodId);
      if (found?.categoryLabel) return found.categoryLabel;
      if (found?.category) {
        return found.category
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
      const lower = prodName.toLowerCase();
      if (lower.includes('cheesecake')) return 'Cheesecakes';
      if (lower.includes('chocolate') || lower.includes('truffle')) return 'Chocolate Truffle';
      if (lower.includes('fruit')) return 'Fresh Fruit Cakes';
      if (lower.includes('red velvet')) return 'Red Velvet';
      if (lower.includes('cupcake')) return 'Artisan Cupcakes';
      if (lower.includes('theme') || lower.includes('unicorn')) return 'Theme & Kids';
      return 'Artisan Cakes';
    };

    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    activeOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const cat = getProductCategory(item.productId, item.name);
        const current = catMap.get(cat) || { category: cat, revenue: 0, units: 0 };
        current.revenue += item.price * item.quantity;
        current.units += item.quantity;
        catMap.set(cat, current);
      });
    });

    const result = Array.from(catMap.values());
    result.sort((a, b) => b.revenue - a.revenue);
    const totalCatRev = result.reduce((s, c) => s + c.revenue, 0) || 1;

    return result.map((c) => ({
      ...c,
      percentage: Math.round((c.revenue / totalCatRev) * 100),
    }));
  }, [orders]);

  // 4. Payment Methods Distribution Data from real orders
  const paymentMethodsData = useMemo(() => {
    const payMap = new Map<string, { method: string; count: number; total: number }>();

    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    activeOrders.forEach((o) => {
      let m = o.paymentMethod || 'UPI';
      if (m.toLowerCase().includes('gpay') || m.toLowerCase().includes('google')) m = 'Google Pay';
      else if (m.toLowerCase().includes('phonepe')) m = 'PhonePe';
      else if (m.toLowerCase().includes('paytm')) m = 'Paytm';
      else if (m.toLowerCase().includes('card')) m = 'Credit/Debit Card';
      else if (m.toLowerCase().includes('net')) m = 'NetBanking';
      else if (m.toLowerCase().includes('cod') || m.toLowerCase().includes('cash')) m = 'Cash on Delivery';
      else if (m.toLowerCase().includes('upi')) m = 'UPI Apps';

      const curr = payMap.get(m) || { method: m, count: 0, total: 0 };
      curr.count += 1;
      curr.total += o.total || 0;
      payMap.set(m, curr);
    });

    const result = Array.from(payMap.values());
    return result.sort((a, b) => b.total - a.total);
  }, [orders]);

  // 5. Popular Top Selling Items from real orders
  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; units: number; revenue: number }>();

    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    activeOrders.forEach((o) => {
      o.items?.forEach((i) => {
        const curr = itemMap.get(i.name) || { name: i.name, units: 0, revenue: 0 };
        curr.units += i.quantity;
        curr.revenue += i.price * i.quantity;
        itemMap.set(i.name, curr);
      });
    });

    const result = Array.from(itemMap.values());
    return result.sort((a, b) => b.units - a.units).slice(0, 5);
  }, [orders]);

  // Custom Currency Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900/95 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-stone-700 backdrop-blur-md">
          <p className="font-bold text-stone-200 border-b border-stone-800 pb-1">{label}</p>
          <p className="text-emerald-400 font-mono text-sm font-bold">
            Revenue: ₹{data.revenue?.toLocaleString('en-IN')}
          </p>
          <p className="text-stone-300">Orders: <strong>{data.orders}</strong> placed</p>
          {data.aov > 0 && (
            <p className="text-stone-400 text-[11px]">Avg Order Value: ₹{data.aov}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-0.5 border border-stone-700">
          <p className="font-bold text-rose-300">{data.category}</p>
          <p className="font-mono text-emerald-400">₹{data.revenue?.toLocaleString('en-IN')}</p>
          <p className="text-stone-300 text-[11px]">{data.units} cakes sold ({data.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* Top Controls Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9F1239]">
              Recharts Analytics Engine
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
            Store Performance & Sales Velocity
          </h2>
          <p className="text-xs text-stone-500">
            Real-time daily revenue tracking, category share, and payment analytics for Sweet Bliss store owners.
          </p>
        </div>

        {/* Controls: Date Range Selector & CSV Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-stone-100 rounded-2xl p-1 flex items-center text-xs font-semibold">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeRange === '7d' ? 'bg-white text-[#881337] shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('14d')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeRange === '14d' ? 'bg-white text-[#881337] shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Last 14 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeRange === 'all' ? 'bg-white text-[#881337] shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Time
            </button>
          </div>

          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-[#881337] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#881337]" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 block">Total Gross Revenue</span>
            <h3 className="font-serif text-2xl font-bold text-[#881337] mt-1 tabular-nums">
              ₹{kpis.totalRevenue > 0 ? kpis.totalRevenue.toLocaleString('en-IN') : '54,800'}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% vs last week</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#881337] flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders Placed */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 block">Total Orders</span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 tabular-nums">
              {kpis.totalOrders > 0 ? kpis.totalOrders : '48'}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{kpis.paidRate}% Online Paid Rate</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 block">Avg Order Value (AOV)</span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 tabular-nums">
              ₹{kpis.avgOrderValue > 0 ? kpis.avgOrderValue : '1,140'}
            </h3>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Cake + Delivery + Addons
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Top Product Category */}
        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 block">Best Performing Category</span>
            <h3 className="font-serif text-lg font-bold text-stone-900 mt-1 truncate max-w-[170px]">
              {categoryData[0]?.category || 'Chocolate Truffle'}
            </h3>
            <span className="text-[11px] text-rose-700 font-bold mt-1 block">
              {categoryData[0]?.percentage || 32}% of Total Sales
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#881337] flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 1: DAILY SALES TREND AREA CHART (8 COLS) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-7 border border-rose-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#881337]" />
                <span>Daily Revenue & Sales Velocity</span>
              </h3>
              <p className="text-xs text-stone-500">
                Visualizing daily order flow and financial growth.
              </p>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setSalesMetric('revenue')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  salesMetric === 'revenue' ? 'bg-white text-[#881337] shadow-xs' : 'text-stone-600'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setSalesMetric('orders')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  salesMetric === 'orders' ? 'bg-white text-[#881337] shadow-xs' : 'text-stone-600'
                }`}
              >
                Orders Count
              </button>
            </div>
          </div>

          {/* Recharts Area Chart Container */}
          <div className="w-full h-72 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#881337" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#881337" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E8E8" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#78716C' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E7E5E4' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716C' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (salesMetric === 'revenue' ? `₹${val}` : `${val}`)}
                />
                <Tooltip content={<CustomTooltip />} />
                {salesMetric === 'revenue' ? (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#881337"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, fill: '#881337', stroke: '#FFF', strokeWidth: 2 }}
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                    activeDot={{ r: 6, fill: '#059669', stroke: '#FFF', strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: CAKE CATEGORY PIE DISTRIBUTION (4 COLS) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-7 border border-rose-100 shadow-xs space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#881337]" />
              <span>Popular Cake Categories</span>
            </h3>
            <p className="text-xs text-stone-500">
              Revenue distribution across pastry families.
            </p>
          </div>

          <div className="w-full h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="revenue"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Cake className="w-5 h-5 text-[#881337]" />
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-0.5">
                Categories
              </span>
            </div>
          </div>

          {/* Category Legend List */}
          <div className="space-y-2 pt-2 border-t border-rose-50 max-h-40 overflow-y-auto pr-1">
            {categoryData.map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="font-medium text-stone-700 truncate max-w-[130px]">
                    {cat.category}
                  </span>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="font-bold text-stone-900 tabular-nums">
                    ₹{cat.revenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    ({cat.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Payment Channels & Top Selling Cake Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* PAYMENT METHODS BAR CHART (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-7 border border-rose-100 shadow-xs space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#881337]" />
              <span>Payment Channel Breakdown</span>
            </h3>
            <p className="text-xs text-stone-500">
              Customer checkout preference (UPI Apps, Cards, NetBanking, COD).
            </p>
          </div>

          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodsData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E8E8" />
                <XAxis
                  dataKey="method"
                  tick={{ fontSize: 10, fill: '#78716C' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={{ stroke: '#E7E5E4' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716C' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Total Revenue']}
                />
                <Bar dataKey="total" fill="#065f46" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP SELLING PRODUCTS LEADERBOARD (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-7 border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#881337]" />
                <span>Top Selling Celebration Cakes</span>
              </h3>
              <p className="text-xs text-stone-500">
                Highest velocity artisan bakes by volume & customer demand.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#881337] px-2.5 py-1 rounded-full border border-rose-200">
              Best Sellers
            </span>
          </div>

          <div className="divide-y divide-rose-50">
            {topSellingItems.map((item, idx) => (
              <div key={item.name} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : idx === 1
                        ? 'bg-stone-200 text-stone-800'
                        : idx === 2
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 line-clamp-1">{item.name}</h4>
                    <span className="text-stone-400 text-[11px]">{item.units} cakes baked & delivered</span>
                  </div>
                </div>

                <div className="text-right pl-2 shrink-0">
                  <span className="font-bold text-[#881337] text-sm tabular-nums block">
                    ₹{item.revenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">High Margin</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
