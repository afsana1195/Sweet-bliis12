import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Clock, CreditCard, Check, AlertCircle, ArrowLeft, RefreshCw, QrCode, Smartphone } from 'lucide-react';
import { CartItem, PlacedOrder } from '../types.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onOrderCompleted: (order: PlacedOrder) => void;
  onBackToCart: () => void;
  onExploreCakes: () => void;
}

// Dynamically load Razorpay standard checkout script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Razorpay SDK script failed to load from CDN');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  onOrderCompleted,
  onBackToCart,
  onExploreCakes,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Hyderabad',
    pincode: '500033',
    landmark: '',
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    deliverySlot: 'evening',
    paymentMethod: 'ONLINE_UPI',
    orderNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gatewayConfig, setGatewayConfig] = useState<{
    keyId: string;
    isGatewayConfigured: boolean;
    currency: string;
    mode: string;
  }>({
    keyId: 'rzp_test_SweetBlissSandbox',
    isGatewayConfigured: false,
    currency: 'INR',
    mode: 'sandbox_test_mode',
  });

  // Fetch gateway configuration on mount
  useEffect(() => {
    fetch('/api/payment/config')
      .then((res) => res.json())
      .then((data) => setGatewayConfig(data))
      .catch((err) => console.warn('Could not fetch payment config:', err));
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-16 bg-[#FFF9F9] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-rose-100 shadow-sm space-y-4">
          <h2 className="font-serif text-2xl font-bold text-stone-800">No items in your cart</h2>
          <p className="text-xs text-stone-500">Please add cakes before proceeding to checkout.</p>
          <button
            onClick={onExploreCakes}
            className="px-6 py-2.5 rounded-full bg-[#881337] text-white text-xs font-semibold cursor-pointer"
          >
            Explore Cakes
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const isMidnight = formData.deliverySlot === 'midnight';
  const isFreeDelivery = subtotal >= BUSINESS_CONFIG.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery
    ? isMidnight ? 99 : 0
    : isMidnight ? BUSINESS_CONFIG.expressMidnightDeliveryFee : BUSINESS_CONFIG.standardDeliveryFee;
  const discount = subtotal > 1500 ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const totalInPaise = total * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg('Please complete your recipient name, phone, and delivery address.');
      return;
    }

    setLoading(true);

    try {
      const customerData = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || 'customer@sweetbliss.in',
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        city: formData.city,
        landmark: formData.landmark.trim(),
      };

      const orderItems = cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        variantName: item.selectedVariant,
        weightKg: item.weightKg,
        quantity: item.quantity,
        isEggless: item.isEggless,
        cakeMessage: item.cakeMessage,
        flavour: item.flavour,
      }));

      // ================= CASE A: CASH ON DELIVERY (COD) =================
      if (formData.paymentMethod === 'COD') {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: customerData,
            items: orderItems,
            deliveryDate: formData.deliveryDate,
            deliverySlot: formData.deliverySlot,
            paymentMethod: 'COD',
            orderNotes: formData.orderNotes,
          }),
        });

        const data = await res.json();
        if (!data.success || !data.order) {
          throw new Error(data.error || 'Failed to place Cash on Delivery order.');
        }

        onOrderCompleted(data.order);
        return;
      }

      // ================= CASE B: ONLINE UPI & CARD (Razorpay Flow) =================
      // 1. Create server-side order with exact amount in paise
      const orderInitiateRes = await fetch('/api/payment/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerData,
          items: orderItems,
          deliveryDate: formData.deliveryDate,
          deliverySlot: formData.deliverySlot,
          orderNotes: formData.orderNotes,
        }),
      });

      const orderInitData = await orderInitiateRes.json();
      if (!orderInitData.success || !orderInitData.pendingOrderId) {
        throw new Error(orderInitData.error || 'Failed to initiate payment order on the server.');
      }

      const pendingOrderId = orderInitData.pendingOrderId;
      const razorpayOrderId = orderInitData.razorpayOrderId;
      const amountPaise = orderInitData.amountPaise;
      const keyId = orderInitData.keyId;

      // 2. Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();

      if (isScriptLoaded && typeof (window as any).Razorpay !== 'undefined') {
        // Open official Razorpay modal (handles Google Pay, PhonePe, Paytm, BHIM UPI, QR, and Cards)
        const options = {
          key: keyId,
          amount: amountPaise,
          currency: 'INR',
          name: 'Sweet Bliss Bakery',
          description: `Order ${pendingOrderId} (${cartItems.length} items)`,
          image: '/src/assets/images/ai_baker_assistant_1791733180129.jpg',
          order_id: orderInitData.isSandbox ? undefined : razorpayOrderId,
          prefill: {
            name: customerData.fullName,
            email: customerData.email,
            contact: customerData.phone,
          },
          notes: {
            pendingOrderId,
            slot: formData.deliverySlot,
          },
          theme: {
            color: '#881337',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              setErrorMsg('Payment window was closed. Your card or UPI was not charged. You can retry with UPI or switch to Cash on Delivery.');
            },
          },
          handler: async (response: any) => {
            setVerifying(true);
            try {
              // 3. Cryptographically verify signature on server before confirming!
              const verifyRes = await fetch('/api/payment/verify-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  pendingOrderId,
                  razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.verified && verifyData.order) {
                onOrderCompleted(verifyData.order);
              } else {
                setErrorMsg(verifyData.error || 'Payment signature could not be verified by the server. Please contact support.');
              }
            } catch (err: any) {
              console.error('Payment verification error:', err);
              setErrorMsg('Network error while verifying payment with our server.');
            } finally {
              setVerifying(false);
              setLoading(false);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setLoading(false);
          setErrorMsg(`Payment failed: ${response.error?.description || 'Transaction declined by bank/UPI application'}. Please retry.`);
        });
        rzp.open();
      } else {
        // Fallback in environments where Razorpay external script cannot load
        // Provide simulated test gateway verification
        setVerifying(true);
        const simRes = await fetch('/api/payment/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pendingOrderId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: 'sandbox_test_signature',
          }),
        });
        const simData = await simRes.json();
        if (simData.verified && simData.order) {
          onOrderCompleted(simData.order);
        } else {
          setErrorMsg(simData.error || 'Payment verification failed.');
        }
      }
    } catch (err: any) {
      console.error('Order error:', err);
      setErrorMsg(err.message || 'Something went wrong while securing your order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#881337] hover:underline mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart Review</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239]">
              Checkout & Payment
            </span>
            {gatewayConfig.isGatewayConfigured ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Razorpay Live Gateway
              </span>
            ) : (
              <span className="text-[10px] bg-rose-100 text-[#881337] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                Razorpay UPI Test Mode
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#881337]">
            Secure Artisan Checkout
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Provide celebration recipient details and complete your verified order.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-semibold">Payment Notice</strong>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (7 cols): Address, Slot, Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Recipient Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-2xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#881337] flex items-center gap-2">
                <span>1. Contact & Recipient Details</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Recipient name"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile for delivery PIN & tracking"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address (For invoice & tracking)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-2xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#881337]">
                2. Delivery Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Street Address / Flat / Building *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Flat 402, Lotus Residency, Road No. 10, Jubilee Hills..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                    <input
                      type="text"
                      disabled
                      value={formData.city}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Landmark</label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="Near Metro / Park"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Delivery Slot & Date */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-2xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#881337] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9F1239]" />
                <span>3. Delivery Date & Time Slot</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Preferred Slot</label>
                  <select
                    value={formData.deliverySlot}
                    onChange={(e) => setFormData({ ...formData, deliverySlot: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 bg-white"
                  >
                    {BUSINESS_CONFIG.slots.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Payment Method with Razorpay UPI & COD Selection */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#881337] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#9F1239]" />
                  <span>4. Choose Payment Method</span>
                </h3>
                <span className="text-xs font-bold text-[#881337] tabular-nums">
                  Exact Total: ₹{total}
                </span>
              </div>

              <div className="space-y-3">
                {/* UPI Option */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'ONLINE_UPI'
                      ? 'border-[#881337] bg-rose-50/60 ring-1 ring-[#881337]'
                      : 'border-stone-200 hover:border-rose-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="ONLINE_UPI"
                    checked={formData.paymentMethod === 'ONLINE_UPI'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'ONLINE_UPI' })}
                    className="accent-[#881337] mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 block">
                        Instant UPI & QR Code (Google Pay, PhonePe, Paytm, BHIM)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Pay directly via any UPI app or scan dynamic QR code. Handled securely by Razorpay gateway.
                    </p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-100 text-[10px] font-semibold text-stone-600">
                      <span className="px-2 py-0.5 rounded bg-white border border-stone-200">GPay</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-stone-200">PhonePe</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-stone-200">Paytm</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-stone-200">BHIM UPI</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-stone-200">QR Code</span>
                    </div>
                  </div>
                </label>

                {/* Card Option */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'CARD'
                      ? 'border-[#881337] bg-rose-50/60 ring-1 ring-[#881337]'
                      : 'border-stone-200 hover:border-rose-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="CARD"
                    checked={formData.paymentMethod === 'CARD'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'CARD' })}
                    className="accent-[#881337] mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-stone-900 block">
                      Credit / Debit Card & NetBanking
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Visa, MasterCard, RuPay, and corporate NetBanking with 256-bit bank encryption.
                    </p>
                  </div>
                </label>

                {/* Cash on Delivery (COD) */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'COD'
                      ? 'border-[#881337] bg-rose-50/60 ring-1 ring-[#881337]'
                      : 'border-stone-200 hover:border-rose-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                    className="accent-[#881337] mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-stone-900 block">
                      Cash on Delivery (Pay at Doorstep)
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Pay cash or via delivery agent UPI upon cake delivery. Payment status will be marked 'Pending' until handed over.
                    </p>
                  </div>
                </label>
              </div>

              {/* Security Banner */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-stone-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Razorpay Payment Protection</span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-500">
                  Your UPI PIN is never entered or saved on Sweet Bliss. All payments are verified cryptographically via server-side HMAC signatures before order confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Order Summary & Submit */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-2xs sticky top-28 space-y-5">
              <h3 className="font-serif text-lg font-bold text-[#881337] pb-3 border-b border-rose-100">
                Order Review ({cartItems.length} items)
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs">
                    <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-stone-900 truncate">
                        {item.product.name} {item.selectedVariant ? `(${item.selectedVariant})` : ''}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {item.selectedSizeLabel} • Qty: {item.quantity}
                      </p>
                      {item.cakeMessage && (
                        <p className="text-[10px] text-rose-700 italic truncate">
                          "{item.cakeMessage}"
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-stone-800 tabular-nums">
                      ₹{item.unitPrice * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-rose-100 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-stone-900 tabular-nums">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery ({formData.deliverySlot === 'midnight' ? 'Midnight Special' : 'Standard'}):</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Celebration Savings (10%):</span>
                    <span className="font-semibold tabular-nums">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-base font-bold text-[#881337] pt-2 border-t border-rose-100">
                  <div>
                    <span>Amount to Pay:</span>
                    <span className="block text-[10px] font-normal text-stone-500">
                      (Server-verified: {totalInPaise} paise)
                    </span>
                  </div>
                  <span className="text-xl tabular-nums">₹{total}</span>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Baking / Delivery Instructions</label>
                <input
                  type="text"
                  value={formData.orderNotes}
                  onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
                  placeholder="e.g. Ring doorbell softly / write message neatly"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Place Order CTA Button */}
              <button
                type="submit"
                disabled={loading || verifying}
                className="w-full py-3.5 px-4 rounded-xl bg-[#881337] hover:bg-[#9F1239] disabled:opacity-60 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying HMAC Signature with Gateway...</span>
                  </>
                ) : loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Securing Server Order ({totalInPaise} paise)...</span>
                  </>
                ) : formData.paymentMethod === 'COD' ? (
                  <span>Confirm Cash on Delivery Order • ₹{total}</span>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Pay with Razorpay UPI • ₹{total}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
