import React, { useState, useEffect } from 'react';
import { Lock, Search, RefreshCw, Filter, CheckCircle2, Truck, ChefHat, Package, Sparkles, XCircle, Clock, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { PlacedOrder, PageRoute } from '../types.ts';

interface AdminOrderPageProps {
  onNavigate: (route: PageRoute) => void;
}

const STAGES = [
  'Order Confirmed',
  'Preparing Your Order',
  'Ready for Dispatch',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export const AdminOrderPage: React.FC<AdminOrderPageProps> = ({ onNavigate }) => {
  const [adminKey, setAdminKey] = useState(() => {
    return localStorage.getItem('sb_admin_key') || '';
  });
  const [keyInput, setKeyInput] = useState(adminKey || 'sweetbliss-admin-2026');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PlacedOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchOrders = async (key: string) => {
    setLoading(true);
    try {
      let url = `/api/admin/orders?status=${statusFilter}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url, {
        headers: {
          'x-admin-key': key,
        },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        throw new Error('Invalid Admin Key. Please check your credentials.');
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || null);
      setIsAuthenticated(true);
      localStorage.setItem('sb_admin_key', key);
    } catch (err: any) {
      setMessage(err.message || 'Failed to authenticate');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      fetchOrders(adminKey);
    }
  }, [statusFilter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKey(keyInput.trim());
    fetchOrders(keyInput.trim());
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || undefined,
          cancellationReason: reason,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setMessage(`Order ${orderId} successfully updated to "${newStatus}"!`);
        setStatusNote('');
        setCancelModalOpen(false);
        setCancelReason('');
        // Update local list
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? data.order : o)));
        if (selectedOrder?.orderId === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'Could not update status');
    } finally {
      setActionLoading(false);
    }
  };

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
              Authorized access to Sweet Bliss kitchen & delivery dispatch queue.
            </p>
          </div>

          {message && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Security Key
              </label>
              <input
                type="password"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter admin security key"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 font-mono"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Default sandbox key: <code className="text-[#881337] font-bold">sweetbliss-admin-2026</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Unlock Admin Order Portal'}</span>
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
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Live Kitchen Sync
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#881337]">
              Kitchen Order Management
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              Advance baking stages, track payments, and update live dispatch statuses.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => fetchOrders(adminKey)}
              className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-[#881337] hover:bg-rose-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('sb_admin_key');
                setIsAuthenticated(false);
              }}
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              Lock
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="font-bold cursor-pointer">×</button>
          </div>
        )}

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

        {/* Filter and Search Bar */}
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

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search by ID, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchOrders(adminKey);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
          </div>
        </div>

        {/* Main Orders Table / Cards */}
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 p-8 space-y-2">
            <Package className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-bold text-stone-800 text-sm">No orders matching filter</h3>
            <p className="text-xs text-stone-500">Try changing status filter or search query.</p>
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
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#881337] border border-rose-200">
                        {ord.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-700 font-semibold mb-1">
                      <span>{ord.customer.fullName} • {ord.customer.phone}</span>
                      <span className="tabular-nums font-bold text-[#881337]">₹{ord.total}</span>
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-1">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-rose-50 mt-2">
                      <span>Slot: {ord.deliverySlot} ({ord.deliveryDate})</span>
                      <span className="font-medium text-stone-600">
                        {ord.paymentMethod === 'COD' ? 'Cash on Delivery (Pending)' : 'Paid Online (UPI)'}
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
                        Action Panel
                      </span>
                      <h3 className="font-mono text-lg font-bold text-stone-900">
                        {selectedOrder.orderId}
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {selectedOrder.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="text-xs space-y-1.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                    <p><strong>Customer:</strong> {selectedOrder.customer.fullName}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.customer.address}, {selectedOrder.customer.city}</p>
                    <p><strong>Slot:</strong> {selectedOrder.deliverySlot} ({selectedOrder.deliveryDate})</p>
                    <p><strong>Payment:</strong> {selectedOrder.paymentMethod} • <span className="font-bold">{selectedOrder.paymentStatus}</span></p>
                  </div>

                  {/* Items */}
                  <div className="text-xs space-y-1.5">
                    <strong className="block text-stone-800">Items Ordered:</strong>
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-stone-700 py-1 border-b border-rose-50">
                        <span>{it.quantity}x {it.name} ({it.weightKg}kg)</span>
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
                        disabled={actionLoading}
                        className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-[#881337] cursor-pointer"
                      >
                        Bake & Decorate
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.orderId, 'Ready for Dispatch')}
                        disabled={actionLoading}
                        className="p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 cursor-pointer"
                      >
                        Ready for Dispatch
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.orderId, 'Out for Delivery')}
                        disabled={actionLoading}
                        className="p-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-800 cursor-pointer"
                      >
                        Out for Delivery
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.orderId, 'Delivered')}
                        disabled={actionLoading}
                        className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 cursor-pointer"
                      >
                        Mark Delivered ✓
                      </button>
                    </div>

                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="w-full mt-2 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                      Cancel Order...
                    </button>
                  </div>

                  {/* Cancel Modal */}
                  {cancelModalOpen && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                      <strong className="text-rose-900 block">Cancel Reason:</strong>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="e.g. Customer requested cancellation / ingredient out of stock"
                        className="w-full p-2 rounded-lg border border-rose-300 bg-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.orderId, 'Cancelled', cancelReason || 'Cancelled by bakery manager')}
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
    </div>
  );
};
