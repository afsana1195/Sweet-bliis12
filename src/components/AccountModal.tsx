import React, { useState } from 'react';
import { X, User, Package, Clock, CheckCircle2, Truck, ChefHat, Sparkles, ChevronRight, ArrowLeft, BarChart3 } from 'lucide-react';
import { PlacedOrder } from '../types.ts';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentOrders: PlacedOrder[];
  onSelectOrder: (order: PlacedOrder) => void;
  onNavigateToDashboard?: () => void;
}

const ORDER_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Recipe queued with our master pastry chefs', icon: CheckCircle2 },
  { key: 'baking', label: 'Baking & Decorating', desc: 'Crafting sponges & piping fresh rosettes', icon: ChefHat },
  { key: 'dispatch', label: 'Out for Delivery', desc: 'Temperature-controlled vehicle in transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Handed over for your special celebration', icon: Sparkles },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  recentOrders,
  onSelectOrder,
  onNavigateToDashboard,
}) => {
  const [selectedTrackOrderId, setSelectedTrackOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  if (!isOpen) return null;

  const trackingOrder = recentOrders.find((o) => o.orderId === selectedTrackOrderId) || recentOrders[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#881337]">Sweet Bliss Member</h3>
              <p className="text-xs text-stone-500">Demo Customer Profile & Order Tracking</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-rose-50/70 rounded-xl border border-rose-100">
          <button
            onClick={() => {
              setActiveTab('orders');
              setSelectedTrackOrderId(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'orders' && !selectedTrackOrderId
                ? 'bg-white text-[#881337] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Recent Orders ({recentOrders.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('orders');
              if (recentOrders.length > 0) {
                setSelectedTrackOrderId(recentOrders[0].orderId);
              }
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              selectedTrackOrderId
                ? 'bg-white text-[#881337] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Live Order Tracking
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setSelectedTrackOrderId(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-[#881337] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Rewards & Profile
          </button>
        </div>

        {/* ================= LIVE ORDER TRACKING VIEW ================= */}
        {selectedTrackOrderId && trackingOrder ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedTrackOrderId(null)}
                className="text-xs font-semibold text-[#881337] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Orders</span>
              </button>
              <span className="font-mono text-xs font-bold text-stone-500">
                {trackingOrder.orderId}
              </span>
            </div>

            {/* Tracking Progress Box */}
            <div className="bg-[#FFF9F9] rounded-2xl p-4 border border-rose-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                <div>
                  <span className="text-[11px] font-semibold text-stone-500 block">Status:</span>
                  <span className="text-sm font-bold text-[#881337] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{trackingOrder.status || 'Baking in Progress'}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-stone-500 block">Delivery Slot:</span>
                  <span className="text-xs font-bold text-stone-800">{trackingOrder.deliverySlot}</span>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="space-y-3 pt-1">
                {ORDER_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  // For demo, first two steps are complete, 3rd is active
                  const isCompleted = idx <= 1;
                  const isCurrent = idx === 1;

                  return (
                    <div key={step.key} className="flex items-start gap-3 relative">
                      {idx < ORDER_STEPS.length - 1 && (
                        <div
                          className={`absolute left-3.5 top-7 w-0.5 h-6 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-stone-200'
                          }`}
                        />
                      )}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          isCompleted
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-400'
                        } ${isCurrent ? 'ring-2 ring-emerald-300' : ''}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs font-bold ${
                              isCompleted ? 'text-stone-900' : 'text-stone-400'
                            }`}
                          >
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] bg-rose-100 text-[#881337] font-bold px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 leading-snug">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items summary */}
            <div className="bg-white rounded-xl p-3 border border-rose-100 text-xs space-y-2">
              <span className="font-bold text-stone-800 block text-[11px] uppercase tracking-wider">
                Order Items:
              </span>
              {trackingOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-stone-700">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-bold tabular-nums">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-rose-50 flex items-center justify-between font-bold text-[#881337]">
                <span>Total Paid:</span>
                <span className="tabular-nums">₹{trackingOrder.total}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectOrder(trackingOrder);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors text-center"
            >
              View Full Order Receipt →
            </button>
          </div>
        ) : activeTab === 'profile' ? (
          /* ================= PROFILE & REWARDS VIEW ================= */
          <div className="space-y-4">
            <div className="bg-rose-50/60 rounded-2xl p-4 text-xs text-stone-700 space-y-2.5 border border-rose-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900">Celebration Rewards Tier:</span>
                <span className="bg-[#881337] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Gold Connoisseur
                </span>
              </div>
              <p className="text-stone-500 leading-relaxed">
                Enjoy 10% off custom cakes, complimentary express delivery on orders above ₹999, and VIP chef consultations.
              </p>
              <div className="pt-1 flex items-center justify-between font-bold text-[#881337]">
                <span>Bliss Reward Points:</span>
                <span className="text-sm">450 Points (~₹450 value)</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-rose-100 space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 mb-1">Customer Details:</h4>
              <div className="flex justify-between text-stone-600">
                <span>Name:</span>
                <strong className="text-stone-900">Celebration Guest</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Hub:</span>
                <strong className="text-stone-900">Jubilee Hills, Hyderabad (500033)</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Dietary Preference:</span>
                <strong className="text-emerald-700">100% Pure Veg (Eggless)</strong>
              </div>
            </div>
          </div>
        ) : (
          /* ================= RECENT ORDERS LIST VIEW ================= */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
              <Package className="w-4 h-4 text-[#9F1239]" />
              <span>Past Orders ({recentOrders.length})</span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-500 bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-2">
                <Package className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-semibold text-stone-700">No past orders in this session</p>
                <p className="text-[11px] text-stone-400">
                  Place an order from the cake catalog to view real-time live baking tracking!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentOrders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-3.5 rounded-2xl border border-rose-100 hover:border-rose-300 bg-white hover:bg-rose-50/40 transition-colors text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#881337]">{ord.orderId}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {ord.status || 'Preparing'}
                      </span>
                    </div>

                    <p className="text-stone-700 line-clamp-1 font-medium">
                      {ord.items.map((i) => i.name).join(', ')}
                    </p>

                    <div className="flex items-center justify-between text-stone-500 text-[11px] pt-1 border-t border-rose-50">
                      <span>Date: {ord.deliveryDate}</span>
                      <strong className="text-stone-900 tabular-nums">Total: ₹{ord.total}</strong>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedTrackOrderId(ord.orderId)}
                        className="flex-1 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#881337] text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Track Order Live</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectOrder(ord);
                          onClose();
                        }}
                        className="py-1.5 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Receipt</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Shortcut to Store Performance Dashboard */}
        {onNavigateToDashboard && (
          <div className="pt-3 border-t border-rose-100">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#881337] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#881337]">Bakery Owner / Admin?</p>
                  <p className="text-[10px] text-stone-500">View daily sales charts, order queue & CSV reports</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDashboard();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Open Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
