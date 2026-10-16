import React from 'react';
import { CheckCircle2, MessageCircle, Printer, ArrowRight, Clock, MapPin, Sparkles } from 'lucide-react';
import { PlacedOrder, PageRoute } from '../types.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';
import { getOwnerNewOrderWhatsAppUrl } from '../utils/whatsapp.ts';

interface OrderConfirmationPageProps {
  order: PlacedOrder | null;
  onNavigate: (route: PageRoute) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  onNavigate,
}) => {
  if (!order) {
    return (
      <div className="min-h-screen py-16 bg-[#FFF9F9] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-rose-100 shadow-sm space-y-4">
          <h2 className="font-serif text-2xl font-bold text-stone-800">No active order found</h2>
          <p className="text-xs text-stone-500">You haven't placed an order yet in this session.</p>
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-2.5 rounded-full bg-[#881337] text-white text-xs font-semibold cursor-pointer"
          >
            Explore Bakery
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppShareUrl = () => {
    let msg = `🎂 *Sweet Bliss Order Confirmation*\n`;
    msg += `*Order ID:* ${order.orderId}\n`;
    msg += `*Customer:* ${order.customer.fullName}\n`;
    msg += `*Delivery Date:* ${order.deliveryDate} (${order.deliverySlot})\n`;
    msg += `*Total Amount:* ₹${order.total}\n\n`;
    msg += `Thank you Sweet Bliss! Excited for my celebration cake!`;
    return `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-rose-100 shadow-xl space-y-8">
          {/* Top Success Badge */}
          <div className="text-center space-y-3">
            <div className="w-18 h-18 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Order Verified & Confirmed</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#881337]">
              Thank You, {order.customer.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Your order <strong className="text-stone-900 font-mono">{order.orderId}</strong> has been received by our kitchen. Our master bakers will begin crafting your cakes fresh.
            </p>
          </div>

          {/* Tracking Timeline */}
          <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-100">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9F1239] mb-4 text-center">
              Order Status: {order.status}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-[#881337] text-white flex items-center justify-center mx-auto text-[10px] font-bold">✓</div>
                <p className="font-bold text-stone-800 text-[11px]">Received</p>
              </div>
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-rose-300 text-white flex items-center justify-center mx-auto text-[10px] font-bold">2</div>
                <p className="font-bold text-stone-600 text-[11px]">Baking</p>
              </div>
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center mx-auto text-[10px] font-bold">3</div>
                <p className="text-stone-400 text-[11px]">Decorating</p>
              </div>
              <div className="space-y-1">
                <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center mx-auto text-[10px] font-bold">4</div>
                <p className="text-stone-400 text-[11px]">Delivered</p>
              </div>
            </div>
          </div>

          {/* Delivery, Recipient & Payment Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-stone-50/70 p-5 rounded-2xl border border-stone-200">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <Clock className="w-4 h-4 text-[#881337]" />
                <span>Delivery Date & Slot</span>
              </div>
              <p className="text-stone-600 font-semibold">{order.deliveryDate}</p>
              <p className="text-stone-500 capitalize">{order.deliverySlot} Slot</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <MapPin className="w-4 h-4 text-[#881337]" />
                <span>Delivery Address</span>
              </div>
              <p className="text-stone-700 font-medium truncate">{order.customer.address}</p>
              <p className="text-stone-500">{order.customer.city} - {order.customer.pincode}</p>
              <p className="text-stone-500">Contact: {order.customer.phone}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <Sparkles className="w-4 h-4 text-[#881337]" />
                <span>Payment & Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {order.paymentStatus}
                </span>
                <span className="font-semibold text-stone-700 truncate">{order.paymentMethod}</span>
              </div>
              {order.transactionId && (
                <p className="text-[10px] text-stone-500 font-mono truncate">
                  Ref: {order.transactionId}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Receipt Breakdown */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-stone-900 border-b border-rose-100 pb-2">
              Order Receipt
            </h3>
            <div className="divide-y divide-rose-50 text-xs text-stone-700">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-stone-900">{item.name}</span>
                    <span className="text-stone-500 text-[11px] block">
                      {item.weightKg} kg • {item.isEggless ? '100% Eggless' : 'With Egg'} (Qty: {item.quantity})
                    </span>
                    {item.cakeMessage && (
                      <span className="text-rose-700 text-[10px] italic block">
                        Message: "{item.cakeMessage}"
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-stone-900 tabular-nums">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-rose-100 space-y-1 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-stone-800 tabular-nums">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Savings:</span>
                  <span className="font-semibold tabular-nums">-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-bold text-[#881337] pt-2 border-t border-rose-200">
                <span>Total Paid:</span>
                <span className="tabular-nums">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('track-order')}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#881337] to-[#9F1239] hover:from-[#9F1239] hover:to-[#881337] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.01]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <Clock className="w-4 h-4" />
              <span>Live Delivery Tracking (Radar & Rider GPS)</span>
            </button>

            <a
              href={getOwnerNewOrderWhatsAppUrl(order)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-stone-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Order to Chef Jyoti</span>
            </a>

            <button
              onClick={handlePrint}
              className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={() => onNavigate('shop')}
              className="py-3 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-[#881337] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Explore Bakery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
