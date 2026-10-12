import React, { useState, useEffect } from 'react';
import { Search, Package, Clock, Truck, ChefHat, CheckCircle2, Sparkles, AlertCircle, ArrowRight, Printer, MessageCircle, XCircle } from 'lucide-react';
import { PlacedOrder, PageRoute } from '../types.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';

interface TrackOrderPageProps {
  initialOrderId?: string;
  onNavigate: (route: PageRoute) => void;
}

const TRACKING_STAGES = [
  { key: 'Order Placed', label: 'Order Placed', desc: 'Order received in our baking queue', icon: Clock },
  { key: 'Order Confirmed', label: 'Order Confirmed', desc: 'Payment verified / COD order accepted', icon: CheckCircle2 },
  { key: 'Preparing Your Order', label: 'Preparing Your Order', desc: 'Sponge baked & rosettes piped fresh', icon: ChefHat },
  { key: 'Ready for Dispatch', label: 'Ready for Dispatch', desc: 'Quality checked & ribbon tied', icon: Package },
  { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Temperature-controlled transit', icon: Truck },
  { key: 'Delivered', label: 'Delivered', desc: 'Celebration joy handed over', icon: Sparkles },
];

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderId, onNavigate }) => {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || '');
  const [verificationInput, setVerificationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<PlacedOrder | null>(null);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setTrackedOrder(null);

    const cleanId = orderIdInput.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg('Please enter your Order ID (e.g. SB-2026-1234)');
      return;
    }

    setLoading(true);

    try {
      let url = `/api/orders/track?orderId=${encodeURIComponent(cleanId)}`;
      if (verificationInput.trim()) {
        url += `&phoneOrEmail=${encodeURIComponent(verificationInput.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || 'No matching order found. Please verify your Order ID.');
      }

      setTrackedOrder(data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not locate order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      handleTrack();
    }
  }, [initialOrderId]);

  // Determine stage progress index
  const getStageIndex = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('placed')) return 0;
    if (s.includes('confirmed') || s.includes('received')) return 1;
    if (s.includes('prepar') || s.includes('baking')) return 2;
    if (s.includes('dispatch') || s.includes('ready')) return 3;
    if (s.includes('out') || s.includes('transit')) return 4;
    if (s.includes('deliver')) return 5;
    return 1;
  };

  const isCancelled = trackedOrder?.status?.toLowerCase().includes('cancel');
  const currentStageIdx = trackedOrder ? getStageIndex(trackedOrder.status) : 0;

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239]">
            Real-Time Bakery Status
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#881337]">
            Track Your Celebration Order
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Check live baking, decorating, and delivery progress directly from our ovens.
          </p>
        </div>

        {/* Tracking Search Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Order ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. SB-2026-4821"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 font-mono uppercase"
                  />
                  <Package className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Phone Number or Email (Optional verification)
                </label>
                <input
                  type="text"
                  placeholder="Registered phone or email"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#881337] hover:bg-[#9F1239] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Fetching Order Status...' : 'Track My Order Live'}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* ================= ORDER TRACKING RESULT ================= */}
        {trackedOrder && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-rose-100 shadow-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Top Summary Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-rose-100 gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9F1239] block mb-1">
                  Order Details
                </span>
                <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <span className="font-mono text-[#881337]">{trackedOrder.orderId}</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Placed on {new Date(trackedOrder.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Payment Status:</span>
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      trackedOrder.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : trackedOrder.paymentStatus === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {trackedOrder.paymentStatus === 'PAID' ? '✓ Paid Online (UPI)' : trackedOrder.paymentStatus === 'PENDING' ? 'Pending (COD)' : 'Payment Failed'}
                  </span>
                </div>
                <div className="text-right pl-3 border-l border-rose-100">
                  <span className="text-[11px] text-stone-500 block">Total Amount:</span>
                  <span className="text-lg font-bold text-[#881337] tabular-nums">
                    ₹{trackedOrder.total}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancelled Banner */}
            {isCancelled && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
                <XCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <strong className="block font-bold">Order Cancelled</strong>
                  <p>{trackedOrder.cancellationReason || 'This order was cancelled by the bakery or customer request.'}</p>
                </div>
              </div>
            )}

            {/* 6-Stage Timeline */}
            {!isCancelled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Order Milestones (6 Stages)
                  </span>
                  <span className="text-xs font-bold text-[#881337] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Current: {trackedOrder.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {TRACKING_STAGES.map((stage, idx) => {
                    const Icon = stage.icon;
                    const isPassed = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div
                        key={stage.key}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                          isCurrent
                            ? 'border-[#881337] bg-rose-50/70 shadow-2xs ring-1 ring-[#881337]'
                            : isPassed
                            ? 'border-emerald-200 bg-emerald-50/40 text-stone-700'
                            : 'border-stone-100 bg-stone-50/50 opacity-60'
                        }`}
                      >
                        <div>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mb-2.5 ${
                              isCurrent
                                ? 'bg-[#881337] text-white shadow-xs'
                                : isPassed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-stone-200 text-stone-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <h4
                            className={`text-xs font-bold leading-tight ${
                              isCurrent ? 'text-[#881337]' : isPassed ? 'text-stone-900' : 'text-stone-500'
                            }`}
                          >
                            {stage.label}
                          </h4>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-2 leading-snug">
                          {stage.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipient & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FFF9F9] p-5 sm:p-6 rounded-2xl border border-rose-100 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-stone-800 uppercase tracking-wider block text-[11px]">
                  Delivery Information
                </span>
                <p className="text-stone-700">
                  <strong className="text-stone-900">Recipient:</strong> {trackedOrder.customer.fullName}
                </p>
                <p className="text-stone-700">
                  <strong className="text-stone-900">Phone:</strong> {trackedOrder.customer.phone}
                </p>
                <p className="text-stone-700">
                  <strong className="text-stone-900">Address:</strong> {trackedOrder.customer.address}, {trackedOrder.customer.city} ({trackedOrder.customer.pincode})
                </p>
                {trackedOrder.customer.landmark && (
                  <p className="text-stone-500 italic">Landmark: {trackedOrder.customer.landmark}</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="font-bold text-stone-800 uppercase tracking-wider block text-[11px]">
                  Schedule & Payment
                </span>
                <p className="text-stone-700">
                  <strong className="text-stone-900">Delivery Date:</strong> {trackedOrder.deliveryDate}
                </p>
                <p className="text-stone-700">
                  <strong className="text-stone-900">Time Slot:</strong>{' '}
                  <span className="capitalize">{trackedOrder.deliverySlot} Slot</span>
                </p>
                <p className="text-stone-700">
                  <strong className="text-stone-900">Payment Method:</strong>{' '}
                  {trackedOrder.paymentMethod === 'COD' ? 'Cash on Delivery (Pay at Doorstep)' : 'Instant UPI (Razorpay)'}
                </p>
                {trackedOrder.transactionId && (
                  <p className="text-stone-500 font-mono text-[11px]">
                    TXN ID: {trackedOrder.transactionId}
                  </p>
                )}
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-3">
              <span className="font-bold text-stone-800 uppercase tracking-wider block text-xs">
                Items in This Celebration Order:
              </span>
              <div className="divide-y divide-rose-50 border border-rose-100 rounded-2xl overflow-hidden bg-white">
                {trackedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-stone-900">{item.name}</h4>
                      <p className="text-stone-500 text-[11px]">
                        {item.weightKg} kg • {item.flavour || 'Classic'} • {item.isEggless ? '100% Eggless' : 'Contains Egg'}
                      </p>
                      {item.cakeMessage && (
                        <p className="text-[10px] text-rose-700 italic">Plaque: "{item.cakeMessage}"</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-stone-800">
                        {item.quantity} × ₹{item.price}
                      </span>
                      <strong className="block text-[#881337] tabular-nums font-bold">
                        ₹{item.price * item.quantity}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit History Trail */}
            {trackedOrder.statusHistory && trackedOrder.statusHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-rose-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                  Status Activity Log
                </span>
                <div className="space-y-1.5">
                  {trackedOrder.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-stone-800">{h.status}: <span className="font-normal text-stone-600">{h.note || ''}</span></span>
                      <span className="text-stone-400 font-mono">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-rose-100">
              <a
                href={`https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello Sweet Bliss! Tracking inquiry for Order ${trackedOrder.orderId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Bakery Kitchen</span>
              </a>

              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Continue Browsing Cakes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
