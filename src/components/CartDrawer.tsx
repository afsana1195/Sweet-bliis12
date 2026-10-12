import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, MessageCircle, Tag, Check } from 'lucide-react';
import { CartItem } from '../types.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';
import { getCartWhatsAppUrl } from '../utils/whatsapp.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: () => void;
  onExploreCakes: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onExploreCakes,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const isFreeDelivery = subtotal >= BUSINESS_CONFIG.freeDeliveryThreshold;
  const deliveryFee = subtotal === 0 ? 0 : isFreeDelivery ? 0 : BUSINESS_CONFIG.standardDeliveryFee;
  const discount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercent) / 100) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const handleApplyCoupon = () => {
    setCouponError('');
    if (couponCode.trim().toUpperCase() === 'BLISS10') {
      setAppliedCoupon({ code: 'BLISS10', discountPercent: 10 });
    } else {
      setCouponError('Invalid coupon. Try "BLISS10" for 10% off!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-[#FFF9F9]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#881337]" />
            <h2 className="font-serif text-lg font-bold text-[#881337]">Your Bakery Cart</h2>
            <span className="bg-rose-100 text-[#881337] text-xs font-bold px-2 py-0.5 rounded-full">
              {cartItems.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-100/70 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar */}
        {subtotal > 0 && (
          <div className="bg-[#FFF2F5] px-5 py-2.5 text-xs text-stone-700 border-b border-rose-100 flex items-center justify-between">
            {isFreeDelivery ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                You qualify for FREE Delivery!
              </span>
            ) : (
              <span>
                Add <strong>₹{BUSINESS_CONFIG.freeDeliveryThreshold - subtotal}</strong> more for free delivery
              </span>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-[#881337] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-800">Your cart is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                  Explore our artisan cakes and hand-crafted delicacies for your special occasion.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onExploreCakes();
                }}
                className="px-6 py-2.5 rounded-full bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Explore Cakes
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 p-3.5 rounded-2xl border border-rose-100 bg-[#FFFDFD] hover:border-rose-200 transition-colors"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-18 h-18 rounded-xl object-cover shrink-0 border border-rose-50"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {item.selectedSizeLabel} • {item.isEggless ? 'Eggless' : 'With Egg'}
                      </p>
                      {item.cakeMessage && (
                        <p className="text-[10px] text-rose-700 italic truncate max-w-[200px]">
                          "{item.cakeMessage}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-stone-400 hover:text-rose-700 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-50">
                    <span className="text-xs sm:text-sm font-bold text-[#881337] tabular-nums">
                      ₹{item.unitPrice * item.quantity}
                    </span>

                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-50 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-stone-800 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-50 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Subtotal & Actions */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-rose-100 bg-[#FFF9F9] space-y-4">
            {/* Promo Code Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Coupon Code (e.g. BLISS10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 uppercase font-semibold"
                />
                <Tag className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              </div>
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-[11px] text-rose-700">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[11px] text-emerald-700 font-semibold">
                ✓ Coupon {appliedCoupon.code} applied (10% OFF)!
              </p>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-stone-900 tabular-nums">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="font-semibold tabular-nums text-stone-900">
                  {deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount (10%):</span>
                  <span className="font-semibold tabular-nums">-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-bold text-[#881337] pt-2 border-t border-rose-200/60">
                <span>Estimated Total:</span>
                <span className="tabular-nums">₹{total}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={getCartWhatsAppUrl(cartItems, subtotal, deliveryFee, total)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Order Cart on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
