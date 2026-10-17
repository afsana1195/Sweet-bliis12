import React, { useState, useEffect } from 'react';
import {
  Lock,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  Truck,
  ChefHat,
  Package,
  Sparkles,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  BarChart3,
  ListOrdered,
  FileSpreadsheet,
  Download,
  ShoppingBag,
  Settings,
  Printer,
  MessageCircle,
  ExternalLink,
  ArrowUpDown,
  Eye,
  LogOut,
  X,
  UserCheck,
  Wheat,
} from 'lucide-react';
import { PlacedOrder, PageRoute } from '../types.ts';
import { AdminPerformanceDashboard } from './AdminPerformanceDashboard.tsx';
import { AdminReportExportModal } from './AdminReportExportModal.tsx';
import { AdminReceiptModal } from './AdminReceiptModal.tsx';
import { AdminMenuManager } from './AdminMenuManager.tsx';
import { AdminStoreSettings } from './AdminStoreSettings.tsx';
import { AdminIngredientTracker } from './AdminIngredientTracker.tsx';
import { getOwnerNewOrderWhatsAppUrl, getCustomerOrderConfirmationWhatsAppUrl } from '../utils/whatsapp.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';

interface AdminOrderPageProps {
  onNavigate: (route: PageRoute) => void;
  onMenuUpdated?: () => void;
}

export const AdminOrderPage: React.FC<AdminOrderPageProps> = ({ onNavigate, onMenuUpdated }) => {
  const [adminView, setAdminView] = useState<'analytics' | 'queue' | 'menu' | 'ingredients' | 'settings'>('analytics');

  // Secure Session Token in sessionStorage (never hardcoded in plain-text localStorage)
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return sessionStorage.getItem('sb_admin_token') || '';
  });

  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'key'>('credentials');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<{ username: string; role: string } | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filters and Sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'delivery-date'>('date-desc');

  // Selected Order and Modals
  const [selectedOrder, setSelectedOrder] = useState<PlacedOrder | null>(null);
  const [detailedModalOrder, setDetailedModalOrder] = useState<PlacedOrder | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<PlacedOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const getHeaders = (token: string) => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-admin-key': token,
    };
  };

  const fetchOrders = async (token: string) => {
    if (!token) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      let url = `/api/admin/orders?status=${encodeURIComponent(statusFilter)}&sortBy=${sortBy}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url, {
        headers: getHeaders(token),
      });

      if (res.status === 401 || res.status === 403) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('sb_admin_token');
        throw new Error('Admin session expired or invalid credentials. Please log in again.');
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || null);
      setIsAuthenticated(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch orders');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Verify existing session on load
  useEffect(() => {
    if (sessionToken) {
      fetch('/api/admin/me', {
        headers: getHeaders(sessionToken),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then((data) => {
          if (data.admin) {
            setAdminProfile(data.admin);
            setIsAuthenticated(true);
            fetchOrders(sessionToken);
          }
        })
        .catch(() => {
          sessionStorage.removeItem('sb_admin_token');
          setSessionToken('');
          setIsAuthenticated(false);
        });
    }
  }, [sessionToken]);

  useEffect(() => {
    if (isAuthenticated && sessionToken) {
      fetchOrders(sessionToken);
    }
  }, [statusFilter, sortBy]);

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const payload = loginMethod === 'credentials'
        ? { username: usernameInput.trim(), password: passwordInput }
        : { key: keyInput.trim() };

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid admin credentials');
      }

      sessionStorage.setItem('sb_admin_token', data.token);
      setSessionToken(data.token);
      setAdminProfile(data.admin);
      setIsAuthenticated(true);
      fetchOrders(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      if (sessionToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: getHeaders(sessionToken),
        });
      }
    } catch {
      // Ignored
    }
    sessionStorage.removeItem('sb_admin_token');
    setSessionToken('');
    setAdminProfile(null);
    setIsAuthenticated(false);
    setOrders([]);
    setMessage('Logged out securely');
  };

  // Handle Update Status with Validation
  const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders(sessionToken),
        body: JSON.stringify({
          status: newStatus,
          note: statusNote.trim() || undefined,
          cancellationReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setMessage(`Order ${orderId} successfully advanced to "${newStatus}"!`);
      setStatusNote('');
      setCancelModalOpen(false);
      setCancelReason('');

      // Update state
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? data.order : o)));
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(data.order);
      }
      if (detailedModalOrder?.orderId === orderId) {
        setDetailedModalOrder(data.order);
      }

      // Refresh analytics & counts
      fetchOrders(sessionToken);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Print Order Receipt helper
  // Print Order Receipt helper: Opens printer-friendly modal with live preview & PDF print
  const handlePrintReceipt = (order: PlacedOrder) => {
    setReceiptModalOrder(order);
  };

  // ================= RENDER: LOGIN FORM =================
  if (!isAuthenticated) {
    return (
      <div className="bg-[#FFF9F9] min-h-screen py-16 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-rose-100 shadow-xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-[#881337] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="font-serif text-2xl font-bold text-[#881337]">
              Bakery Manager Portal
            </h2>
            <p className="text-xs text-stone-500">
              Authorized admin access to orders, kitchen dispatch, and inventory control.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {/* Toggle Login Method */}
          <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLoginMethod('credentials')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                loginMethod === 'credentials' ? 'bg-white text-[#881337] shadow-xs' : 'text-stone-600'
              }`}
            >
              Username & Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('key')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                loginMethod === 'key' ? 'bg-white text-[#881337] shadow-xs' : 'text-stone-600'
              }`}
            >
              Security Key
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMethod === 'credentials' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Admin Username / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. admin or ansariwazid1995@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Master Security Key
                </label>
                <input
                  type="password"
                  required
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter secret admin key"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loginLoading ? 'Verifying Credentials...' : 'Unlock Admin Portal'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              ← Back to Sweet Bliss Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER: AUTHENTICATED ADMIN DASHBOARD =================
  return (
    <div className="bg-[#FFF9F9] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-rose-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239]">
                Bakery Control Center
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>{adminProfile?.username || 'SuperAdmin'}</span>
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#881337]">
              Kitchen Order Management
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              Advance baking stages, track payments, inspect real customer orders, and manage live inventory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setExportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-200" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => fetchOrders(sessionToken)}
              className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-[#881337] hover:bg-rose-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer flex items-center gap-1.5"
              title="Secure Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
            <button onClick={() => setMessage(null)} className="font-bold cursor-pointer">×</button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="font-bold cursor-pointer">×</button>
          </div>
        )}

        {/* View Switcher: 4 Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-rose-100 shadow-2xs">
            <button
              onClick={() => setAdminView('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminView === 'analytics'
                  ? 'bg-[#881337] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Performance</span>
            </button>
            <button
              onClick={() => setAdminView('queue')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminView === 'queue'
                  ? 'bg-[#881337] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Kitchen Queue ({orders.length})</span>
            </button>
            <button
              onClick={() => setAdminView('menu')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminView === 'menu'
                  ? 'bg-[#881337] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Menu & Cakes</span>
            </button>
            <button
              onClick={() => setAdminView('ingredients')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminView === 'ingredients'
                  ? 'bg-[#881337] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Wheat className="w-4 h-4" />
              <span>Ingredient Stock</span>
            </button>
            <button
              onClick={() => setAdminView('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                adminView === 'settings'
                  ? 'bg-[#881337] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Bakery Settings</span>
            </button>
          </div>

          <div className="text-xs text-stone-500 font-medium">
            Chef Jyoti Tanti • Bangalore Patisserie Hub (562162)
          </div>
        </div>

        {/* ================= VIEW 1: RECHARTS ORDER PERFORMANCE DASHBOARD ================= */}
        {adminView === 'analytics' && (
          <div className="animate-in fade-in duration-200">
            <AdminPerformanceDashboard
              orders={orders}
              stats={stats}
              onOpenExportModal={() => setExportModalOpen(true)}
            />
          </div>
        )}

        {/* ================= VIEW 2: KITCHEN ORDER MANAGEMENT QUEUE ================= */}
        {adminView === 'queue' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stats Summary Strip */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs">
                  <span className="text-[11px] text-stone-500 block">Total Orders</span>
                  <span className="text-xl font-bold text-stone-900 tabular-nums">{stats.total}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs">
                  <span className="text-[11px] text-stone-500 block">Confirmed</span>
                  <span className="text-xl font-bold text-emerald-600 tabular-nums">{stats.confirmed}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs">
                  <span className="text-[11px] text-stone-500 block">Preparing</span>
                  <span className="text-xl font-bold text-[#881337] tabular-nums">{stats.preparing}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs">
                  <span className="text-[11px] text-stone-500 block">Ready / Dispatch</span>
                  <span className="text-xl font-bold text-amber-600 tabular-nums">{stats.ready}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs">
                  <span className="text-[11px] text-stone-500 block">Out for Delivery</span>
                  <span className="text-xl font-bold text-blue-600 tabular-nums">{stats.outForDelivery}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs">
                  <span className="text-[11px] text-stone-500 block">Delivered</span>
                  <span className="text-xl font-bold text-emerald-700 tabular-nums">{stats.delivered}</span>
                </div>
              </div>
            )}

            {/* Filter, Search & Sort Bar */}
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {['all', 'Order Confirmed', 'Preparing Your Order', 'Ready for Dispatch', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#881337] text-white'
                        : 'bg-stone-50 text-stone-600 hover:bg-rose-50'
                    }`}
                  >
                    {st === 'all' ? 'All Orders' : st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 md:w-56">
                  <input
                    type="text"
                    placeholder="Search by ID, name, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchOrders(sessionToken);
                    }}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                </div>

                {/* Sorting Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl border border-stone-200 text-xs font-medium bg-white text-stone-700 focus:outline-none focus:border-rose-400 cursor-pointer"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Total</option>
                  <option value="amount-asc">Lowest Total</option>
                  <option value="delivery-date">Delivery Date</option>
                </select>

                <button
                  onClick={() => setExportModalOpen(true)}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-[#881337] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  title="Download Order Report CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#881337]" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Main Orders Table / Cards */}
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 p-8 space-y-2">
                <Package className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="font-bold text-stone-800 text-sm">No orders matching filter</h3>
                <p className="text-xs text-stone-500">Try changing status filter, sort order, or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Orders List (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  {orders.map((ord) => {
                    const isSelected = selectedOrder?.orderId === ord.orderId;
                    return (
                      <div
                        key={ord.orderId}
                        onClick={() => setSelectedOrder(ord)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                          isSelected
                            ? 'border-[#881337] ring-2 ring-[#881337]/20 shadow-md'
                            : 'border-rose-100 hover:border-rose-300 shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-sm text-[#881337]">{ord.orderId}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#881337] border border-rose-200">
                              {ord.status}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintReceipt(ord);
                              }}
                              className="p-1 rounded-lg text-stone-400 hover:text-[#881337] hover:bg-rose-50 transition-colors"
                              title="Print Order Receipt (PDF)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailedModalOrder(ord);
                              }}
                              className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                              title="Inspect Full Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-stone-700 font-semibold mb-1">
                          <span>{ord.customer?.fullName} • {ord.customer?.phone}</span>
                          <span className="tabular-nums font-bold text-[#881337]">₹{ord.total}</span>
                        </div>

                        <p className="text-xs text-stone-500 line-clamp-1">
                          {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-rose-50 mt-2">
                          <span>Slot: {ord.deliverySlot} ({ord.deliveryDate})</span>
                          <span className="font-medium text-stone-600">
                            {ord.paymentMethod?.includes('COD') || ord.paymentMethod?.includes('Cash')
                              ? 'Cash on Delivery (Pending)'
                              : `${ord.paymentMethod} (${ord.paymentStatus})`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Action Panel (5 cols) */}
                <div className="lg:col-span-5">
                  {selectedOrder ? (
                    <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm sticky top-28 space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                        <div>
                          <span className="text-[11px] font-bold text-[#9F1239] uppercase tracking-wider block">
                            Order Action Panel
                          </span>
                          <h3 className="font-mono text-lg font-bold text-stone-900">
                            {selectedOrder.orderId}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            {selectedOrder.status}
                          </span>
                          <button
                            onClick={() => setDetailedModalOrder(selectedOrder)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                            title="Open full view modal"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="text-xs space-y-1.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                        <p><strong>Customer:</strong> {selectedOrder.customer.fullName}</p>
                        <p><strong>Phone:</strong> +91 {selectedOrder.customer.phone}</p>
                        <p><strong>Address:</strong> {selectedOrder.customer.address}, {selectedOrder.customer.city} ({selectedOrder.customer.pincode})</p>
                        <p><strong>Delivery:</strong> {selectedOrder.deliveryDate} • <span className="capitalize">{selectedOrder.deliverySlot}</span> Slot</p>
                        <p><strong>Payment:</strong> {selectedOrder.paymentMethod} • <span className="font-bold">{selectedOrder.paymentStatus}</span></p>
                        {selectedOrder.orderNotes && (
                          <p className="text-amber-800 pt-1 border-t border-stone-200">
                            <strong>Kitchen Instructions:</strong> {selectedOrder.orderNotes}
                          </p>
                        )}
                      </div>

                      {/* Items */}
                      <div className="text-xs space-y-1.5">
                        <strong className="block text-stone-800">Items Ordered:</strong>
                        {selectedOrder.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-stone-700 py-1 border-b border-rose-50">
                            <span>{it.quantity}x {it.name} ({it.weightKg}kg{it.isEggless ? ', Eggless' : ''})</span>
                            <span className="font-bold tabular-nums">₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-1 font-bold text-sm text-[#881337]">
                          <span>Total Amount:</span>
                          <span className="tabular-nums">₹{selectedOrder.total}</span>
                        </div>
                      </div>

                      {/* Advance Status Controls */}
                      <div className="space-y-2 pt-2 border-t border-rose-100">
                        <label className="block text-xs font-bold text-stone-800">
                          Advance Lifecycle Stage:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateStatus(selectedOrder.orderId, 'Preparing Your Order')}
                            disabled={actionLoading || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled'}
                            className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-[#881337] cursor-pointer disabled:opacity-50"
                          >
                            Bake & Decorate
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedOrder.orderId, 'Ready for Dispatch')}
                            disabled={actionLoading || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled'}
                            className="p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 cursor-pointer disabled:opacity-50"
                          >
                            Ready for Dispatch
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedOrder.orderId, 'Out for Delivery')}
                            disabled={actionLoading || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled'}
                            className="p-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-800 cursor-pointer disabled:opacity-50"
                          >
                            Out for Delivery
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedOrder.orderId, 'Delivered')}
                            disabled={actionLoading || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled'}
                            className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 cursor-pointer disabled:opacity-50"
                          >
                            Mark Delivered ✓
                          </button>
                        </div>

                        {/* Print Ticket & WhatsApp Action Triggers */}
                        <div className="pt-2 space-y-1.5">
                          <button
                            onClick={() => handlePrintReceipt(selectedOrder)}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                            title="Print Order Receipt / Save as PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-rose-200" />
                            <span>Print Order Receipt</span>
                          </button>

                          <a
                            href={getOwnerNewOrderWhatsAppUrl(selectedOrder)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-stone-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Send Alert to Chef Jyoti on WhatsApp</span>
                          </a>

                          <a
                            href={getCustomerOrderConfirmationWhatsAppUrl(selectedOrder)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                            <span>WhatsApp Customer Tracking Link</span>
                          </a>
                        </div>

                        {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                          <button
                            onClick={() => setCancelModalOpen(true)}
                            className="w-full mt-2 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                          >
                            Cancel Order...
                          </button>
                        )}
                      </div>

                      {/* Cancel Modal */}
                      {cancelModalOpen && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                          <strong className="text-rose-900 block">Cancellation Reason (Mandatory):</strong>
                          <input
                            type="text"
                            required
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="e.g. Customer cancelled / Ingredients unavailable"
                            className="w-full p-2 rounded-lg border border-rose-300 bg-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (!cancelReason.trim()) {
                                  setErrorMessage('Please enter a cancellation reason');
                                  return;
                                }
                                handleUpdateStatus(selectedOrder.orderId, 'Cancelled', cancelReason.trim());
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-rose-700 text-white font-bold cursor-pointer"
                            >
                              Confirm Cancel
                            </button>
                            <button
                              onClick={() => setCancelModalOpen(false)}
                              className="px-3 py-1.5 rounded-lg border border-stone-300 cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-8 border border-rose-100 text-center text-xs text-stone-500">
                      Select an order from the left to view items, customer contact, and advance its live stage.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 3: MENU & INVENTORY MANAGEMENT ================= */}
        {adminView === 'menu' && (
          <div className="animate-in fade-in duration-200">
            <AdminMenuManager
              adminKey={sessionToken}
              onMenuUpdated={() => {
                fetchOrders(sessionToken);
                onMenuUpdated?.();
              }}
            />
          </div>
        )}

        {/* ================= VIEW 4: BAKING INGREDIENTS STOCK TRACKER ================= */}
        {adminView === 'ingredients' && (
          <div className="animate-in fade-in duration-200">
            <AdminIngredientTracker adminKey={sessionToken} orders={orders} />
          </div>
        )}

        {/* ================= VIEW 5: STORE & BANGALORE SETTINGS ================= */}
        {adminView === 'settings' && (
          <div className="animate-in fade-in duration-200">
            <AdminStoreSettings adminKey={sessionToken} />
          </div>
        )}
      </div>

      {/* ================= MODAL: DETAILED ORDER INSPECTION MODAL ================= */}
      {detailedModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-rose-100 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div>
                <span className="text-[11px] font-bold text-[#9F1239] uppercase tracking-wider block">
                  Detailed Kitchen Order Record
                </span>
                <h3 className="font-mono text-2xl font-bold text-stone-900">
                  {detailedModalOrder.orderId}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {detailedModalOrder.status}
                </span>
                <button
                  onClick={() => setDetailedModalOrder(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer & Delivery Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-800 uppercase text-[10px] tracking-wider mb-2">
                  Customer Information
                </h4>
                <p><strong>Name:</strong> {detailedModalOrder.customer.fullName}</p>
                <p><strong>Phone:</strong> +91 {detailedModalOrder.customer.phone}</p>
                <p><strong>Email:</strong> {detailedModalOrder.customer.email || 'N/A'}</p>
                <p><strong>Delivery Address:</strong> {detailedModalOrder.customer.address}</p>
                <p><strong>City & Pincode:</strong> {detailedModalOrder.customer.city} - {detailedModalOrder.customer.pincode}</p>
                {detailedModalOrder.customer.landmark && (
                  <p><strong>Landmark:</strong> {detailedModalOrder.customer.landmark}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-800 uppercase text-[10px] tracking-wider mb-2">
                  Dispatch & Payment
                </h4>
                <p><strong>Target Date:</strong> {detailedModalOrder.deliveryDate}</p>
                <p><strong>Delivery Slot:</strong> <span className="capitalize font-semibold">{detailedModalOrder.deliverySlot}</span> Slot</p>
                <p><strong>Payment Method:</strong> {detailedModalOrder.paymentMethod}</p>
                <p><strong>Payment Status:</strong> <span className="font-bold">{detailedModalOrder.paymentStatus}</span></p>
                {detailedModalOrder.transactionId && (
                  <p><strong>Transaction Ref:</strong> <code className="text-[11px] font-mono">{detailedModalOrder.transactionId}</code></p>
                )}
                {detailedModalOrder.orderNotes && (
                  <p className="text-amber-800 pt-1 border-t border-stone-200">
                    <strong>Kitchen Notes:</strong> {detailedModalOrder.orderNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <h4 className="font-bold text-stone-800 text-xs mb-2">
                Order Items ({detailedModalOrder.items?.length || 0})
              </h4>
              <div className="border border-stone-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                    <tr>
                      <th className="p-3">Item Details</th>
                      <th className="p-3 text-center">Unit Weight</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {detailedModalOrder.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3">
                          <strong className="text-stone-900 block">{it.name}</strong>
                          <span className="text-[11px] text-stone-500">
                            {it.isEggless ? '100% Eggless' : 'Regular (Egg)'} • {it.flavour || 'Artisan Special'}
                          </span>
                          {it.cakeMessage && (
                            <span className="block text-[11px] text-[#881337] italic mt-0.5">
                              Piping: "{it.cakeMessage}"
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center tabular-nums">{it.weightKg} kg</td>
                        <td className="p-3 text-center tabular-nums font-bold">{it.quantity}</td>
                        <td className="p-3 text-right tabular-nums">₹{it.price}</td>
                        <td className="p-3 text-right tabular-nums font-bold text-[#881337]">₹{it.price * it.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-xs space-y-1.5 text-stone-700">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="tabular-nums font-semibold">₹{detailedModalOrder.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span className="tabular-nums font-semibold">
                  {detailedModalOrder.deliveryFee === 0 ? 'FREE' : `₹${detailedModalOrder.deliveryFee}`}
                </span>
              </div>
              {detailedModalOrder.discount ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Discounts Applied:</span>
                  <span className="tabular-nums font-semibold">-₹{detailedModalOrder.discount}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-bold text-[#881337] pt-2 border-t border-rose-200">
                <span>Final Paid Amount:</span>
                <span className="tabular-nums">₹{detailedModalOrder.total}</span>
              </div>
            </div>

            {/* Status History Timeline */}
            <div>
              <h4 className="font-bold text-stone-800 text-xs mb-2">
                Order Lifecycle Timeline
              </h4>
              <div className="space-y-2 text-xs">
                {detailedModalOrder.statusHistory?.map((hist, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50 border border-stone-200">
                    <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-stone-800">{hist.status}</strong>
                        <span className="text-[11px] text-stone-400">
                          {new Date(hist.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                      {hist.note && <p className="text-[11px] text-stone-500 mt-0.5">{hist.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-rose-100">
              <button
                onClick={() => handlePrintReceipt(detailedModalOrder)}
                className="px-4 py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                title="Print Order Receipt / Save as PDF"
              >
                <Printer className="w-4 h-4 text-rose-200" />
                <span>Print Order Receipt</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`/#track-${detailedModalOrder.orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-[#881337] border border-rose-200 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Customer Live GPS View</span>
                </a>
                <button
                  onClick={() => setDetailedModalOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#881337] text-white hover:bg-[#9F1239] font-bold text-xs cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Reports & CSV Export Modal */}
      <AdminReportExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        orders={orders}
        currentStatusFilter={statusFilter}
        adminKey={sessionToken}
      />

      {/* Official Printer-Friendly Order Receipt / Tax Invoice Modal */}
      <AdminReceiptModal
        isOpen={Boolean(receiptModalOrder)}
        order={receiptModalOrder}
        onClose={() => setReceiptModalOrder(null)}
      />
    </div>
  );
};
