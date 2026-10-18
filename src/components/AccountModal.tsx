import React, { useState } from 'react';
import {
  X,
  User,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ChefHat,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  BarChart3,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Award,
  Edit2,
  Check,
  Gift,
  Crown,
  TrendingUp,
  Star,
  Copy,
  Zap,
  RotateCcw,
  ShoppingBag,
  FileText,
  Receipt,
  Calendar
} from 'lucide-react';
import { PlacedOrder, CustomerUser } from '../types.ts';

export interface LoyaltyTier {
  id: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  name: string;
  minPoints: number;
  maxPoints: number;
  multiplier: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBg: string;
  accentText: string;
  exclusivePerk: string;
  perks: string[];
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'Bronze',
    name: 'Bronze Connoisseur',
    minPoints: 0,
    maxPoints: 199,
    multiplier: '1x Points (₹10 = 1 pt)',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    cardBg: 'from-[#2e190f] via-[#1f1008] to-[#120703]',
    accentText: 'text-amber-300',
    exclusivePerk: 'Birthday surprise celebration voucher',
    perks: [
      'Earn 1 Sweet Point per ₹10 spent',
      '1 Sweet Point = ₹1 discount on any celebration cake',
      'Birthday special celebration surprise treat',
      'Points never expire'
    ],
  },
  {
    id: 'Silver',
    name: 'Silver Connoisseur',
    minPoints: 200,
    maxPoints: 499,
    multiplier: '1.25x Points Booster',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    cardBg: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
    accentText: 'text-slate-200',
    exclusivePerk: 'Free delivery above ₹799 + 1.25x Points',
    perks: [
      '1.25x points booster on every order',
      'Free standard delivery on orders above ₹799',
      'Complimentary custom chocolate message plaque',
      'Early access to seasonal festival dessert drops'
    ],
  },
  {
    id: 'Gold',
    name: 'Gold Connoisseur',
    minPoints: 500,
    maxPoints: 999,
    multiplier: '1.5x Points Booster',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-400',
    cardBg: 'from-[#451a03] via-[#290f02] to-[#120500]',
    accentText: 'text-amber-300',
    exclusivePerk: 'Priority baking slot + Free delivery above ₹599',
    perks: [
      '1.5x points booster on all orders',
      'Priority morning / evening kitchen baking slot',
      'Free priority delivery on orders above ₹599',
      'Complimentary chef-curated pastry tasting sample'
    ],
  },
  {
    id: 'VIP',
    name: 'Royal VIP Elite',
    minPoints: 1000,
    maxPoints: Infinity,
    multiplier: '2x Points Multiplier',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-[#881337]',
    badgeBorder: 'border-rose-300',
    cardBg: 'from-[#881337] via-[#4c0519] to-[#1a040b]',
    accentText: 'text-rose-200',
    exclusivePerk: 'Guaranteed free express delivery + Direct Pastry Chef consultation',
    perks: [
      '2x point multiplier on every single purchase',
      'Guaranteed free express delivery across Hyderabad',
      'Direct head pastry chef custom design consultation',
      'VIP secret celebration menu & private tasting invites'
    ],
  },
];

export const getLoyaltyStatus = (points: number, explicitTier?: string) => {
  let tierIndex = 0;
  if (points >= 1000) tierIndex = 3;
  else if (points >= 500) tierIndex = 2;
  else if (points >= 200) tierIndex = 1;
  else tierIndex = 0;

  if (explicitTier) {
    const explicitIdx = LOYALTY_TIERS.findIndex((t) => t.id === explicitTier);
    if (explicitIdx > tierIndex) tierIndex = explicitIdx;
  }

  const currentTier = LOYALTY_TIERS[tierIndex];
  const nextTier = tierIndex < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[tierIndex + 1] : null;

  let progressPercent = 100;
  let pointsNeeded = 0;

  if (nextTier) {
    const span = nextTier.minPoints - currentTier.minPoints;
    const ptsInCurrentTier = Math.max(0, points - currentTier.minPoints);
    progressPercent = Math.min(100, Math.max(0, Math.round((ptsInCurrentTier / span) * 100)));
    pointsNeeded = Math.max(0, nextTier.minPoints - points);
  }

  return {
    currentTier,
    nextTier,
    progressPercent,
    pointsNeeded,
    points,
  };
};

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentOrders: PlacedOrder[];
  onSelectOrder: (order: PlacedOrder) => void;
  onNavigateToDashboard?: () => void;
  currentUser: CustomerUser | null;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogout: () => void;
  onUpdateUser: (user: CustomerUser) => void;
  onReorder?: (order: PlacedOrder) => void;
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
  currentUser,
  onOpenAuth,
  onLogout,
  onUpdateUser,
  onReorder,
}) => {
  const [selectedTrackOrderId, setSelectedTrackOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'loyalty' | 'orders' | 'rewards'>('profile');
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [orderDetailsModalOrder, setOrderDetailsModalOrder] = useState<PlacedOrder | null>(null);

  const handleReorderClick = (order: PlacedOrder) => {
    setReorderingId(order.orderId);
    if (onReorder) {
      onReorder(order);
    }
    setTimeout(() => {
      setReorderingId(null);
    }, 1500);
  };

  // Loyalty calculations for current user or welcome preview
  const loyalty = getLoyaltyStatus(currentUser?.loyaltyPoints ?? 100, currentUser?.memberTier);

  const handleCopyPromo = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedPromo(true);
      setTimeout(() => setCopiedPromo(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  };

  // Address edit state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState(currentUser?.address || '');
  const [editPincode, setEditPincode] = useState(currentUser?.pincode || '500033');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const trackingOrder = recentOrders.find((o) => o.orderId === selectedTrackOrderId) || recentOrders[0];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);

    try {
      const token = localStorage.getItem('sb_auth_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          phone: editPhone,
          address: editAddress,
          city: 'Hyderabad',
          pincode: editPincode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onUpdateUser(data.user);
        localStorage.setItem('sb_user', JSON.stringify(data.user));
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsEditingAddress(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to update address:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 text-[#881337] flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#881337]">
                  {currentUser ? currentUser.name : 'Welcome to Sweet Bliss'}
                </h3>
                {currentUser && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${loyalty.currentTier.badgeBg} ${loyalty.currentTier.badgeText} border ${loyalty.currentTier.badgeBorder} flex items-center gap-1`}>
                    <Crown className="w-2.5 h-2.5" />
                    <span>{loyalty.currentTier.id} Tier</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                {currentUser ? `${currentUser.email} • ${currentUser.loyaltyPoints} Sweet Points` : 'Customer Account & Tracking'}
              </p>
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

        {/* Guest Banner if not logged in */}
        {!currentUser && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-rose-100 border border-rose-200/80 space-y-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <Gift className="w-4 h-4 text-rose-600" />
              <span>Sign in for fast checkout & exclusive bakery perks</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Create an account or sign in to save your Hyderabad delivery address, earn loyalty points, and access member-only seasonal discounts.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="flex-1 py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold text-center cursor-pointer shadow-xs transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('signup');
                }}
                className="flex-1 py-2 rounded-xl bg-white hover:bg-rose-50 text-[#881337] border border-rose-300 text-xs font-bold text-center cursor-pointer shadow-2xs transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-rose-50/70 rounded-xl border border-rose-100 gap-1">
          <button
            onClick={() => {
              setActiveTab('profile');
              setSelectedTrackOrderId(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'profile' && !selectedTrackOrderId
                ? 'bg-white text-[#881337] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => {
              setActiveTab('loyalty');
              setSelectedTrackOrderId(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              (activeTab === 'loyalty' || activeTab === 'rewards') && !selectedTrackOrderId
                ? 'bg-white text-[#881337] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Loyalty Program</span>
          </button>
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
            My Orders ({recentOrders.length})
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
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 text-stone-400'
                        }`}
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

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleReorderClick(trackingOrder)}
                className="flex-1 py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
                title="Add all items from this order back to shopping cart"
              >
                {reorderingId === trackingOrder.orderId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder Items ({trackingOrder.items.length})</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setOrderDetailsModalOrder(trackingOrder)}
                className="py-2.5 px-3.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                title="View full receipt and delivery breakdown"
              >
                <FileText className="w-3.5 h-3.5 text-[#881337]" />
                <span>Order Details</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'profile' ? (
          /* ================= PROFILE & ADDRESS VIEW ================= */
          <div className="space-y-4">
            {currentUser ? (
              <>
                {/* User Card */}
                <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 rounded-2xl p-4 border border-rose-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#881337] block">{currentUser.name}</span>
                      <span className="text-[11px] text-stone-500">{currentUser.email}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Sweet Points</span>
                      <span className="font-mono text-base font-extrabold text-[#881337]">
                        {currentUser.loyaltyPoints} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-600 pt-1 border-t border-rose-200/50">
                    <Phone className="w-3.5 h-3.5 text-rose-500" />
                    <span>+91 {currentUser.phone}</span>
                  </div>
                </div>

                {/* Loyalty Program Summary Widget */}
                <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-pink-500/10 rounded-2xl p-4 border border-rose-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#881337] text-amber-300 flex items-center justify-center shadow-xs">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Loyalty Program</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900">{loyalty.currentTier.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${loyalty.currentTier.badgeBg} ${loyalty.currentTier.badgeText} border ${loyalty.currentTier.badgeBorder}`}>
                            {loyalty.currentTier.id}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#881337] font-mono">{loyalty.points}</span>
                      <span className="text-[10px] text-stone-500 block font-medium">Sweet Points</span>
                    </div>
                  </div>

                  {/* Progress Bar to next tier */}
                  <div className="space-y-1.5 pt-1 border-t border-rose-200/40">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-700 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#881337]" />
                        <span>{loyalty.nextTier ? `Progress to ${loyalty.nextTier.id} Tier` : 'Maximum Tier Achieved!'}</span>
                      </span>
                      <span className="font-bold text-[#881337] tabular-nums">
                        {loyalty.nextTier ? `${loyalty.points} / ${loyalty.nextTier.minPoints} pts (${loyalty.progressPercent}%)` : '100% Complete'}
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-stone-200/90 rounded-full overflow-hidden p-0.5 shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-[#881337] transition-all duration-700 ease-out shadow-xs"
                        style={{ width: `${loyalty.progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span>{loyalty.currentTier.id} ({loyalty.currentTier.minPoints} pts)</span>
                      {loyalty.nextTier ? (
                        <span>
                          Earn <strong className="text-stone-800">{loyalty.pointsNeeded} more pts</strong> for {loyalty.nextTier.id}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">★ Highest Tier</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('loyalty')}
                    className="w-full py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-[#881337] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>View Full Loyalty Program & Rewards →</span>
                  </button>
                </div>

                {/* Delivery Address Card with Inline Edit */}
                <div className="bg-white rounded-2xl p-4 border border-rose-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <span>Default Delivery Address</span>
                    </span>
                    {!isEditingAddress ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditAddress(currentUser.address || '');
                          setEditPincode(currentUser.pincode || '500033');
                          setEditPhone(currentUser.phone || '');
                          setIsEditingAddress(true);
                        }}
                        className="text-[#881337] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="text-stone-400 hover:text-stone-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <form onSubmit={handleSaveProfile} className="space-y-2.5 pt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                          Street / Apartment Address:
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full p-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                            Pincode:
                          </label>
                          <input
                            type="text"
                            required
                            value={editPincode}
                            onChange={(e) => setEditPincode(e.target.value)}
                            className="w-full p-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                            Mobile Number:
                          </label>
                          <input
                            type="tel"
                            required
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full p-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="w-full py-2 rounded-xl bg-[#881337] text-white font-bold text-xs hover:bg-[#9F1239] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {saveSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Address Saved!</span>
                          </>
                        ) : savingProfile ? (
                          <span>Saving...</span>
                        ) : (
                          <span>Save Address</span>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-stone-600 space-y-1 pt-1">
                      <p className="font-medium text-stone-800">
                        {currentUser.address || 'No saved address yet. Click Edit to add one for fast checkout.'}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        City: Hyderabad • Pincode: {currentUser.pincode || '500033'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-600 hover:text-[#881337] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Account</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">You are browsing as a guest</h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                    Sign in to view your saved addresses, track previous orders, and redeem your Sweet Points!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth('login');
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#881337] text-white font-bold text-xs hover:bg-[#9F1239] transition-all cursor-pointer shadow-xs"
                >
                  Sign In or Register
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'loyalty' || activeTab === 'rewards' ? (
          /* ================= LOYALTY PROGRAM SECTION ================= */
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Hero Points, Tier Status & Progress Bar Card */}
            <div className={`bg-gradient-to-br ${loyalty.currentTier.cardBg} text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl border border-white/10 relative overflow-hidden`}>
              {/* Subtle background glow */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-10 -top-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header: Tier status and multiplier */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 shadow-xs border border-amber-300/30">
                    <Crown className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-rose-200/80 font-bold block">
                      Sweet Bliss Loyalty Club
                    </span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{loyalty.currentTier.name}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${loyalty.currentTier.badgeBg} ${loyalty.currentTier.badgeText} border ${loyalty.currentTier.badgeBorder}`}>
                        {loyalty.currentTier.id}
                      </span>
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/10 text-rose-100 border border-white/15 backdrop-blur-xs flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>{loyalty.currentTier.multiplier}</span>
                </span>
              </div>

              {/* Points Big Counter */}
              <div className="relative z-10 pt-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white tabular-nums">
                      {currentUser ? loyalty.points : 100}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-rose-200 ml-2">Sweet Points</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-amber-300/90 block">Redemption Value</span>
                    <span className="text-xs font-bold text-white font-mono">₹{currentUser ? loyalty.points : 100} OFF</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-300 mt-1">
                  Earn 1 point per ₹10 spent • Apply at checkout for direct bill deduction
                </p>
              </div>

              {/* PROGRESS BAR TO NEXT TIER */}
              <div className="relative z-10 bg-black/40 rounded-xl p-3 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-stone-200">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {loyalty.nextTier ? `Progress to ${loyalty.nextTier.id} Tier` : 'Maximum Tier Achieved'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                    {loyalty.nextTier
                      ? `${loyalty.points} / ${loyalty.nextTier.minPoints} pts (${loyalty.progressPercent}%)`
                      : '100% Elite'}
                  </span>
                </div>

                {/* The Visual Progress Bar */}
                <div className="h-3.5 w-full bg-stone-900/80 rounded-full p-0.5 border border-white/15 overflow-hidden shadow-inner relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                    style={{ width: `${loyalty.progressPercent}%` }}
                  />
                </div>

                {/* Milestone labels */}
                <div className="flex items-center justify-between text-[10px] text-stone-300">
                  <span>Current: {loyalty.currentTier.id} ({loyalty.currentTier.minPoints} pts)</span>
                  {loyalty.nextTier ? (
                    <span className="text-amber-300 font-semibold">
                      Target: {loyalty.nextTier.id} ({loyalty.nextTier.minPoints} pts)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">★ Max VIP Tier</span>
                  )}
                </div>

                {/* Callout message */}
                <div className="pt-1.5 border-t border-white/10 text-[11px] text-stone-200 flex items-start gap-1.5 leading-snug">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                  {loyalty.nextTier ? (
                    <span>
                      Earn <strong className="text-amber-300 font-bold">{loyalty.pointsNeeded} more Sweet Points</strong> to unlock <strong>{loyalty.nextTier.name}</strong> perks including {loyalty.nextTier.exclusivePerk}!
                    </span>
                  ) : (
                    <span>
                      Congratulations! You have reached our highest Royal VIP status. Enjoy 2x multiplier, guaranteed free express delivery, and direct pastry chef consultations!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Guest Welcome Banner if not logged in */}
            {!currentUser && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/90 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-[#881337] flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-rose-600" />
                    <span>Get 100 Welcome Points on Signup!</span>
                  </span>
                  <p className="text-[11px] text-stone-600">
                    Create an account today to immediately unlock Bronze Connoisseur status with ₹100 worth of points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth('signup');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                >
                  Join Free
                </button>
              </div>
            )}

            {/* Loyalty Tier Status Roadmap */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#881337]" />
                  <span>Tier Status & Privileges Roadmap</span>
                </span>
                <span className="text-[10px] text-stone-500 font-normal">Climb tiers with every order</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LOYALTY_TIERS.map((tier) => {
                  const isCurrent = loyalty.currentTier.id === tier.id;
                  const isUnlocked = loyalty.points >= tier.minPoints;

                  return (
                    <div
                      key={tier.id}
                      className={`p-3 rounded-2xl border text-xs transition-all relative ${
                        isCurrent
                          ? 'bg-rose-50/90 border-[#881337] shadow-xs ring-1 ring-[#881337]/30'
                          : isUnlocked
                          ? 'bg-stone-50/80 border-stone-200'
                          : 'bg-white border-stone-200/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-200/60">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.badgeBg} ${tier.badgeText} border ${tier.badgeBorder}`}>
                            {tier.id}
                          </span>
                          <span className="font-bold text-stone-900 text-xs">
                            {tier.minPoints}+ pts
                          </span>
                        </div>

                        {isCurrent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#881337] text-white flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" />
                            <span>Your Tier</span>
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-stone-400">
                            Locked
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-[#881337] block">
                          ⚡ {tier.multiplier}
                        </span>
                        <ul className="space-y-0.5 text-[11px] text-stone-600">
                          {tier.perks.slice(0, 3).map((perk, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-1 leading-snug">
                              <span className="text-[#881337] font-bold">•</span>
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How Sweet Points Work */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>How to Earn & Redeem Points</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-stone-600">
                <div className="p-2.5 bg-white rounded-xl border border-stone-200/70 space-y-0.5">
                  <span className="font-bold text-stone-900 block">1. Order Cakes</span>
                  <p>Get 1 Sweet Point for every ₹10 spent automatically.</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-stone-200/70 space-y-0.5">
                  <span className="font-bold text-stone-900 block">2. Save Rupee-for-Rupee</span>
                  <p>1 Point = ₹1 discount. Redeem directly at checkout.</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-stone-200/70 space-y-0.5">
                  <span className="font-bold text-stone-900 block">3. Never Expire</span>
                  <p>Points stay safe in your account for your next party.</p>
                </div>
              </div>
            </div>

            {/* Promo Code Card */}
            <div className="p-3 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-100 border border-rose-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-[#881337] block text-xs">
                  🎁 Member Discount: SWEETBLISS10
                </span>
                <span className="text-[11px] text-stone-600">
                  Apply at checkout for 10% off your celebration order
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyPromo('SWEETBLISS10')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-[#881337] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
              >
                {copiedPromo ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#881337]" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ================= RECENT ORDERS LIST VIEW ================= */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#9F1239]" />
                <span>Orders History ({recentOrders.length})</span>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-500 bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-2">
                <Package className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-semibold text-stone-700">No past orders in this session</p>
                <p className="text-[11px] text-stone-400">
                  Place an order from our cake catalog to view real-time live kitchen baking progress!
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

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setOrderDetailsModalOrder(ord)}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#881337] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 shadow-2xs"
                        title="View itemized receipt, delivery address, and full breakdown"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#881337]" />
                        <span>View Order Details</span>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReorderClick(ord)}
                          className="py-2 px-3.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          title="Reorder this past transaction into shopping cart"
                        >
                          {reorderingId === ord.orderId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>Reorder</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTrackOrderId(ord.orderId)}
                          className="py-2 px-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          title="Live Kitchen Tracking"
                        >
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>Track</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Shortcut to Store Performance Dashboard */}
        {onNavigateToDashboard && (
          <div className="pt-2 border-t border-rose-100">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#881337] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#881337]">Store Owner / Admin</p>
                  <p className="text-[10px] text-stone-500">Live analytics & order queue</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDashboard();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= ORDER DETAILS & RECEIPT MODAL ================= */}
      {orderDetailsModalOrder && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 text-[#881337] flex items-center justify-center font-bold shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-[#881337]">
                      Order Details
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {orderDetailsModalOrder.status || 'Order Confirmed'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-stone-500">
                    ID: #{orderDetailsModalOrder.orderId} • {new Date(orderDetailsModalOrder.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOrderDetailsModalOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close order details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Timing Slot */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#881337]" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Scheduled Delivery</span>
                  <span className="font-bold text-stone-900">
                    {orderDetailsModalOrder.deliveryDate} ({orderDetailsModalOrder.deliverySlot})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTrackOrderId(orderDetailsModalOrder.orderId);
                  setOrderDetailsModalOrder(null);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-[#881337] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Clock className="w-3 h-3" />
                <span>Live Track</span>
              </button>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <MapPin className="w-4 h-4 text-[#881337]" />
                <span>Delivery Address</span>
              </div>
              <div className="space-y-1 text-stone-700 pl-6">
                <p className="font-semibold text-stone-900">
                  {orderDetailsModalOrder.customer?.fullName || 'Valued Customer'}
                </p>
                <p className="text-stone-600 leading-relaxed">
                  {orderDetailsModalOrder.customer?.address || 'Delivery Address Provided'}, {orderDetailsModalOrder.customer?.city || 'Bangalore'} - {orderDetailsModalOrder.customer?.pincode || '562162'}
                </p>
                {orderDetailsModalOrder.customer?.landmark && (
                  <p className="text-[11px] text-stone-500">
                    <strong className="text-stone-700">Landmark:</strong> {orderDetailsModalOrder.customer.landmark}
                  </p>
                )}
                <p className="text-[11px] text-stone-600 flex items-center gap-1.5 pt-0.5">
                  <Phone className="w-3 h-3 text-[#881337]" />
                  <span>+91 {orderDetailsModalOrder.customer?.phone}</span>
                  {orderDetailsModalOrder.customer?.email && (
                    <span className="text-stone-400">• {orderDetailsModalOrder.customer.email}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Itemized Receipt Table / List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#881337]" />
                  <span>Itemized Receipt ({orderDetailsModalOrder.items.length} {orderDetailsModalOrder.items.length === 1 ? 'item' : 'items'})</span>
                </span>
                <span className="text-[10px] text-stone-500 font-normal">Amount in INR (₹)</span>
              </div>

              <div className="divide-y divide-rose-100 rounded-2xl border border-rose-100 bg-white overflow-hidden text-xs">
                {orderDetailsModalOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 space-y-1.5 hover:bg-rose-50/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-xs sm:text-sm">
                            {item.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.isEggless ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {item.isEggless ? '100% Eggless' : 'With Egg'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Size: {item.weightKg} kg • Flavour: {item.flavour || 'Artisan Special'} • Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-stone-900 tabular-nums text-xs sm:text-sm">
                          ₹{item.price * item.quantity}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          ₹{item.price} each
                        </span>
                      </div>
                    </div>

                    {/* Custom Message on Cake */}
                    {item.cakeMessage && item.cakeMessage.trim() && (
                      <div className="p-2 rounded-xl bg-pink-50/70 border border-pink-100 text-[11px] text-rose-900 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Piping Message:</strong> "{item.cakeMessage.trim()}"
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Calculation Summary */}
            <div className="bg-[#FFF9F9] rounded-2xl p-4 border border-rose-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Subtotal ({orderDetailsModalOrder.items.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                <span className="tabular-nums font-semibold">
                  ₹{orderDetailsModalOrder.subtotal || orderDetailsModalOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span>Delivery Charges</span>
                <span className="tabular-nums font-semibold text-emerald-700">
                  {orderDetailsModalOrder.deliveryFee === 0 || !orderDetailsModalOrder.deliveryFee ? 'FREE' : `₹${orderDetailsModalOrder.deliveryFee}`}
                </span>
              </div>

              {orderDetailsModalOrder.discount && orderDetailsModalOrder.discount > 0 ? (
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span>Discount / Loyalty Benefit</span>
                  <span className="tabular-nums">-₹{orderDetailsModalOrder.discount}</span>
                </div>
              ) : null}

              <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between text-sm sm:text-base font-extrabold text-[#881337]">
                <span>Total Amount Paid</span>
                <span className="font-serif tabular-nums text-lg text-[#881337]">
                  ₹{orderDetailsModalOrder.total}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-rose-100 text-[11px] text-stone-500">
                <span>Payment Method: <strong className="text-stone-700">{orderDetailsModalOrder.paymentMethod || 'Online'}</strong></span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {orderDetailsModalOrder.paymentStatus || 'PAID'}
                </span>
              </div>
              {orderDetailsModalOrder.transactionId && (
                <div className="text-[10px] text-stone-400 font-mono">
                  Txn Ref: {orderDetailsModalOrder.transactionId}
                </div>
              )}
            </div>

            {/* Modal Footer Actions: Re-Order & Close */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => handleReorderClick(orderDetailsModalOrder)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 transition-all"
                title="Add all items from this order back to your shopping cart"
              >
                {reorderingId === orderDetailsModalOrder.orderId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Added to Shopping Cart! 🍰</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Re-order This Past Transaction</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOrderDetailsModalOrder(null)}
                className="py-3 px-5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold cursor-pointer text-center transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
