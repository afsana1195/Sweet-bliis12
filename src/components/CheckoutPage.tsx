import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Check,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  QrCode,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  KeyRound,
  Delete,
  Calendar,
  MapPin,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { CartItem, PlacedOrder } from '../types.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onOrderCompleted: (order: PlacedOrder) => void;
  onBackToCart: () => void;
  onExploreCakes: () => void;
}

// Popular Indian Banks for NetBanking
interface BankOption {
  id: string;
  name: string;
  shortCode: string;
  primaryColor: string;
  secondaryColor: string;
  defaultUser: string;
}

const BANKS: BankOption[] = [
  { id: 'HDFC', name: 'HDFC Bank', shortCode: 'HDFC', primaryColor: '#004c8f', secondaryColor: '#e8f0fe', defaultUser: 'HDFC_8492019' },
  { id: 'SBI', name: 'State Bank of India', shortCode: 'SBI', primaryColor: '#280071', secondaryColor: '#ede9fe', defaultUser: 'SBI_ONLINE_492' },
  { id: 'ICICI', name: 'ICICI Bank', shortCode: 'ICICI', primaryColor: '#b02a30', secondaryColor: '#fee2e2', defaultUser: 'ICICI_CORP_381' },
  { id: 'AXIS', name: 'Axis Bank', shortCode: 'AXIS', primaryColor: '#861f41', secondaryColor: '#fdf2f4', defaultUser: 'AXIS_USER_719' },
  { id: 'KOTAK', name: 'Kotak Mahindra Bank', shortCode: 'KOTAK', primaryColor: '#ed1c24', secondaryColor: '#fee2e2', defaultUser: 'KOTAK_NET_902' },
  { id: 'PNB', name: 'Punjab National Bank', shortCode: 'PNB', primaryColor: '#a21d3c', secondaryColor: '#fdf2f4', defaultUser: 'PNB_ONE_541' },
];

// Card Network Detection Helper
function detectCardNetwork(number: string): 'visa' | 'mastercard' | 'rupay' | 'amex' | 'unknown' {
  const clean = number.replace(/\D/g, '');
  if (!clean) return 'unknown';
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^(60|65|81|82|508)/.test(clean)) return 'rupay';
  if (/^3[47]/.test(clean)) return 'amex';
  return 'unknown';
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  onOrderCompleted,
  onBackToCart,
  onExploreCakes,
}) => {
  const topFormRef = useRef<HTMLDivElement>(null);

  // 3-STEP WIZARD STATE (1: Delivery, 2: Address, 3: Payment)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  // Customer Contact & Delivery Info
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
    orderNotes: '',
  });

  // Selected Payment Mode
  const [selectedMethod, setSelectedMethod] = useState<
    'gpay' | 'phonepe' | 'paytm' | 'upi_id' | 'qr' | 'card' | 'netbanking' | 'cod'
  >('gpay');

  // UPI State
  const [upiIdInput, setUpiIdInput] = useState('');
  const [qrCountdown, setQrCountdown] = useState(300);

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);

  // NetBanking State
  const [selectedBankId, setSelectedBankId] = useState('HDFC');

  // -------------------------------------------------------------
  // REALISTIC PAYMENT INTERFACES (PIN & GATEWAYS)
  // -------------------------------------------------------------
  const [upiPinModal, setUpiPinModal] = useState<{
    isOpen: boolean;
    appType: 'gpay' | 'phonepe' | 'paytm' | 'upi_id';
    pin: string;
    step: 'enter_pin' | 'verifying' | 'success';
    error: string;
  }>({
    isOpen: false,
    appType: 'gpay',
    pin: '',
    step: 'enter_pin',
    error: '',
  });

  const [netBankingModal, setNetBankingModal] = useState<{
    isOpen: boolean;
    bank: BankOption;
    userId: string;
    password: string;
    otp: string;
    step: 'login' | 'otp' | 'verifying' | 'success';
    timer: number;
    error: string;
  }>({
    isOpen: false,
    bank: BANKS[0],
    userId: BANKS[0].defaultUser,
    password: 'Password@123',
    otp: '582910',
    step: 'login',
    timer: 45,
    error: '',
  });

  const [cardOtpModal, setCardOtpModal] = useState<{
    isOpen: boolean;
    otp: string;
    verifying: boolean;
    timer: number;
  }>({
    isOpen: false,
    otp: '482910',
    verifying: false,
    timer: 45,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-fill cardholder name with recipient name
  useEffect(() => {
    if (formData.fullName && !cardHolder) {
      setCardHolder(formData.fullName.toUpperCase());
    }
  }, [formData.fullName]);

  // QR countdown timer
  useEffect(() => {
    if (selectedMethod === 'qr' && qrCountdown > 0) {
      const interval = setInterval(() => setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
      return () => clearInterval(interval);
    }
  }, [selectedMethod, qrCountdown]);

  // NetBanking OTP timer
  useEffect(() => {
    if (netBankingModal.isOpen && netBankingModal.step === 'otp' && netBankingModal.timer > 0) {
      const timer = setInterval(() => {
        setNetBankingModal((prev) => ({ ...prev, timer: Math.max(0, prev.timer - 1) }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [netBankingModal.isOpen, netBankingModal.step, netBankingModal.timer]);

  // Card 3DS OTP timer
  useEffect(() => {
    if (cardOtpModal.isOpen && cardOtpModal.timer > 0) {
      const timer = setInterval(() => {
        setCardOtpModal((prev) => ({ ...prev, timer: Math.max(0, prev.timer - 1) }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cardOtpModal.isOpen, cardOtpModal.timer]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-20 bg-[#FAF7F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-stone-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#881337] flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">Your basket is empty</h2>
          <p className="text-xs text-stone-500">Please choose your celebration cake before checkout.</p>
          <button
            onClick={onExploreCakes}
            className="px-6 py-2.5 rounded-full bg-[#065f46] text-white text-xs font-semibold cursor-pointer"
          >
            Explore Bakery
          </button>
        </div>
      </div>
    );
  }

  // Financial Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const isMidnight = formData.deliverySlot === 'midnight';
  const isFreeDelivery = subtotal >= BUSINESS_CONFIG.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery
    ? isMidnight ? 99 : 0
    : isMidnight ? BUSINESS_CONFIG.expressMidnightDeliveryFee : BUSINESS_CONFIG.standardDeliveryFee;
  const discount = subtotal > 1500 ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // Stepper Validations & Navigation
  const handleNextFromDelivery = () => {
    if (!formData.deliveryDate) {
      setErrorMessage('Please select your cake delivery date.');
      return;
    }
    setErrorMessage('');
    setCheckoutStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextFromAddress = () => {
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter Full Name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Please type your complete home address.');
      return;
    }
    if (!formData.pincode.trim()) {
      setErrorMessage('Please enter Zip / Pincode.');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMessage('Please enter City.');
      return;
    }
    setErrorMessage('');
    setCheckoutStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    setErrorMessage('');
    if (checkoutStep === 1) {
      onBackToCart();
    } else if (checkoutStep === 2) {
      setCheckoutStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (checkoutStep === 3) {
      setCheckoutStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Card Formatters
  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Finalize Order Helper
  const finalizeOrderOnServer = async (methodName: string, transactionId?: string) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const orderPayload = {
        customer: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || 'customer@sweetbliss.com',
          address: formData.address.trim(),
          pincode: formData.pincode.trim(),
          city: formData.city.trim(),
          landmark: formData.landmark.trim() || undefined,
        },
        items: cartItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          weightKg: item.weightKg,
          price: item.unitPrice,
          quantity: item.quantity,
          isEggless: item.isEggless,
          cakeMessage: item.cakeMessage || undefined,
          flavour: item.flavour || undefined,
        })),
        deliveryDate: formData.deliveryDate,
        deliverySlot: formData.deliverySlot,
        paymentMethod: methodName,
        orderNotes: formData.orderNotes.trim() || undefined,
        transactionId: transactionId || undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order. Please try again.');
      }

      onOrderCompleted(data.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment communication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment Proceed Handler
  const handleProceedPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    // If UPI App selected
    if (selectedMethod === 'gpay' || selectedMethod === 'phonepe' || selectedMethod === 'paytm') {
      setUpiPinModal({
        isOpen: true,
        appType: selectedMethod,
        pin: '',
        step: 'enter_pin',
        error: '',
      });
      return;
    }

    if (selectedMethod === 'upi_id') {
      if (!upiIdInput.trim() || !upiIdInput.includes('@')) {
        setErrorMessage('Please enter a valid UPI ID (e.g. yourname@oksbi or 9876543210@paytm).');
        return;
      }
      setUpiPinModal({
        isOpen: true,
        appType: 'upi_id',
        pin: '',
        step: 'enter_pin',
        error: '',
      });
      return;
    }

    if (selectedMethod === 'qr') {
      finalizeOrderOnServer('UPI QR Code', `UPI_QR_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`);
      return;
    }

    if (selectedMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        setErrorMessage('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setErrorMessage('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setErrorMessage('Please enter your 3-digit CVV number on the back of the card.');
        return;
      }
      setCardOtpModal({
        isOpen: true,
        otp: '482910',
        verifying: false,
        timer: 45,
      });
      return;
    }

    if (selectedMethod === 'netbanking') {
      const chosenBank = BANKS.find((b) => b.id === selectedBankId) || BANKS[0];
      setNetBankingModal({
        isOpen: true,
        bank: chosenBank,
        userId: chosenBank.defaultUser,
        password: 'Password@123',
        otp: '582910',
        step: 'login',
        timer: 45,
        error: '',
      });
      return;
    }

    if (selectedMethod === 'cod') {
      finalizeOrderOnServer('COD');
      return;
    }
  };

  // UPI PIN Handler
  const handleUpiPinSubmit = () => {
    if (upiPinModal.pin.length < 4) {
      setUpiPinModal((prev) => ({ ...prev, error: 'Please enter all 4 digits of your UPI PIN.' }));
      return;
    }

    setUpiPinModal((prev) => ({ ...prev, step: 'verifying', error: '' }));

    setTimeout(() => {
      setUpiPinModal((prev) => ({ ...prev, step: 'success' }));
      setTimeout(() => {
        setUpiPinModal((prev) => ({ ...prev, isOpen: false }));
        const label =
          upiPinModal.appType === 'gpay'
            ? 'Google Pay UPI'
            : upiPinModal.appType === 'phonepe'
            ? 'PhonePe UPI'
            : upiPinModal.appType === 'paytm'
            ? 'Paytm UPI'
            : `UPI ID (${upiIdInput.trim()})`;

        finalizeOrderOnServer(label, `UPI_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`);
      }, 700);
    }, 1100);
  };

  // NetBanking Handlers
  const handleNetBankingLogin = () => {
    if (!netBankingModal.userId.trim() || !netBankingModal.password.trim()) {
      setNetBankingModal((prev) => ({ ...prev, error: 'Please enter Customer ID and Password.' }));
      return;
    }
    setNetBankingModal((prev) => ({ ...prev, step: 'otp', timer: 45, otp: '582910', error: '' }));
  };

  const handleNetBankingOtpSubmit = () => {
    if (!netBankingModal.otp.trim() || netBankingModal.otp.length < 4) {
      setNetBankingModal((prev) => ({ ...prev, error: 'Please enter the 6-digit High-Security OTP.' }));
      return;
    }
    setNetBankingModal((prev) => ({ ...prev, step: 'verifying', error: '' }));

    setTimeout(() => {
      setNetBankingModal((prev) => ({ ...prev, step: 'success' }));
      setTimeout(() => {
        setNetBankingModal((prev) => ({ ...prev, isOpen: false }));
        finalizeOrderOnServer(`NetBanking (${netBankingModal.bank.name})`, `NETB_${netBankingModal.bank.shortCode}_${Date.now()}`);
      }, 700);
    }, 1200);
  };

  // Card OTP Handler
  const handleCardOtpSubmit = () => {
    if (!cardOtpModal.otp.trim() || cardOtpModal.otp.length < 4) {
      setErrorMessage('Please enter the 6-digit bank verification OTP.');
      return;
    }
    setCardOtpModal((prev) => ({ ...prev, verifying: true }));

    setTimeout(() => {
      setCardOtpModal((prev) => ({ ...prev, verifying: false, isOpen: false }));
      const network = detectCardNetwork(cardNumber).toUpperCase();
      const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '6789';
      finalizeOrderOnServer(`Card (${network} ending in ${last4})`, `TXN_CARD_${Date.now()}`);
    }, 1100);
  };

  const detectedNetwork = detectCardNetwork(cardNumber);

  return (
    <div className="bg-[#FAF7F5] min-h-screen py-6 sm:py-10 text-[#2C1810]">
      <div className="max-w-xl mx-auto px-4 sm:px-6">

        {/* ================= TOP NAVIGATION BAR ================= */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevious}
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
            aria-label="Previous Step"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Checkout
          </h1>
          <button
            onClick={onBackToCart}
            className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 transition-colors cursor-pointer"
            title="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= 3-STEP PROGRESS STEPPER (MATCHING SCREENSHOT) ================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs mb-6">
          <div className="relative flex items-center justify-between max-w-sm mx-auto">
            {/* Connecting Lines */}
            <div className="absolute left-8 right-8 top-4 -translate-y-1/2 h-1 bg-stone-200 z-0">
              <div
                className="h-full bg-[#065f46] transition-all duration-300"
                style={{
                  width: checkoutStep === 1 ? '0%' : checkoutStep === 2 ? '50%' : '100%',
                }}
              />
            </div>

            {/* Step 1: Delivery */}
            <button
              type="button"
              onClick={() => setCheckoutStep(1)}
              className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  checkoutStep > 1
                    ? 'bg-[#065f46] text-white shadow-xs'
                    : checkoutStep === 1
                    ? 'bg-[#065f46] text-white ring-4 ring-[#065f46]/20'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {checkoutStep > 1 ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : checkoutStep === 1 ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="text-xs font-bold font-mono">1</span>
                )}
              </div>
              <span
                className={`text-xs font-bold tracking-wide transition-colors ${
                  checkoutStep === 1 ? 'text-[#065f46]' : 'text-stone-700'
                }`}
              >
                Delivery
              </span>
            </button>

            {/* Step 2: Address (Concentric Ring when active) */}
            <button
              type="button"
              onClick={() => {
                if (checkoutStep >= 2) setCheckoutStep(2);
                else handleNextFromDelivery();
              }}
              className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  checkoutStep > 2
                    ? 'bg-[#065f46] text-white shadow-xs'
                    : checkoutStep === 2
                    ? 'bg-[#065f46] text-white ring-4 ring-[#065f46]/20'
                    : 'bg-stone-100 text-stone-400 border border-stone-300'
                }`}
              >
                {checkoutStep > 2 ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : checkoutStep === 2 ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="text-xs font-bold font-mono">2</span>
                )}
              </div>
              <span
                className={`text-xs font-bold tracking-wide transition-colors ${
                  checkoutStep === 2 ? 'text-[#065f46]' : 'text-stone-700'
                }`}
              >
                Address
              </span>
            </button>

            {/* Step 3: Payment */}
            <button
              type="button"
              onClick={() => {
                if (checkoutStep === 3) setCheckoutStep(3);
                else if (checkoutStep === 2) handleNextFromAddress();
              }}
              className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  checkoutStep === 3
                    ? 'bg-[#065f46] text-white ring-4 ring-[#065f46]/20'
                    : 'bg-stone-100 text-stone-400 border border-stone-300'
                }`}
              >
                {checkoutStep === 3 ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span className="text-xs font-bold font-mono">3</span>
                )}
              </div>
              <span
                className={`text-xs font-bold tracking-wide transition-colors ${
                  checkoutStep === 3 ? 'text-[#065f46]' : 'text-stone-700'
                }`}
              >
                Payment
              </span>
            </button>
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* ================= STEP 1: DELIVERY SLOT & PREFERENCES ================= */}
        {checkoutStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#065f46]" />
                  <span>Choose Celebration Delivery Date</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Freshly baked on the morning of your event.
                </p>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Select Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-sm focus:outline-none focus:border-[#065f46] font-medium"
                />
              </div>

              {/* Delivery Slots */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Preferred Time Slot *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'morning', label: 'Morning Slot', time: '9:00 AM – 1:00 PM', desc: 'Standard Free' },
                    { id: 'afternoon', label: 'Afternoon Slot', time: '1:00 PM – 5:00 PM', desc: 'Standard Free' },
                    { id: 'evening', label: 'Evening Celebration', time: '5:00 PM – 9:00 PM', desc: 'Most Popular' },
                    { id: 'midnight', label: 'Midnight Surprise', time: '11:00 PM – 12:00 AM', desc: '+₹99 Express' },
                  ].map((slot) => (
                    <label
                      key={slot.id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        formData.deliverySlot === slot.id
                          ? 'border-[#065f46] bg-emerald-50/40 ring-1 ring-[#065f46]'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliverySlot"
                        value={slot.id}
                        checked={formData.deliverySlot === slot.id}
                        onChange={(e) => setFormData({ ...formData, deliverySlot: e.target.value })}
                        className="mt-0.5 text-[#065f46] focus:ring-[#065f46]"
                      />
                      <div className="text-xs">
                        <strong className="block font-bold text-stone-900">{slot.label}</strong>
                        <span className="text-stone-500 text-[11px] block">{slot.time}</span>
                        <span className="text-[10px] text-emerald-800 font-semibold">{slot.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Cake Plaque & Kitchen Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Order Note / Plaque Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.orderNotes}
                  onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
                  placeholder="e.g. Ring the bell gently, please handle upright..."
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs focus:outline-none focus:border-[#065f46]"
                />
              </div>

              {/* Items Preview */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <span>{cartItems.length} item(s) in bag:</span>
                <span className="font-bold text-stone-900">Subtotal: ₹{subtotal}</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-sm text-center shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextFromDelivery}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-sm text-center shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: ADDRESS (EXACTLY MATCHING USER SCREENSHOT) ================= */}
        {checkoutStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Type your home address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900"
                />
              </div>

              {/* Zip Code & City Side-by-Side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter here"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Enter here"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Buttons (Previous & Next in Green exactly like screenshot) */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-sm text-center shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextFromAddress}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-sm text-center shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT (SELECTION & COMPLETE GATEWAY) ================= */}
        {checkoutStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Delivery Recipient Summary Mini-Card */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Delivering To</span>
                <strong className="text-stone-900 font-bold">{formData.fullName}</strong>
                <p className="text-stone-500 text-[11px] truncate max-w-xs">{formData.address}, {formData.city}</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutStep(2)}
                className="text-xs font-bold text-[#065f46] underline cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Payment Modes Container */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#065f46]" />
                  <span>Choose Payment Method</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  100% Secure encrypted 256-bit bank level transactions
                </p>
              </div>

              {/* Mode Options */}
              <div className="space-y-2.5">
                {/* 1. Google Pay */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === 'gpay'
                      ? 'border-[#065f46] bg-emerald-50/40 ring-1 ring-[#065f46]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gpay"
                      checked={selectedMethod === 'gpay'}
                      onChange={() => setSelectedMethod('gpay')}
                      className="text-[#065f46] focus:ring-[#065f46]"
                    />
                    <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                      <span className="text-blue-500 font-black">G</span><span className="text-red-500 font-black">P</span>
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block">Google Pay (UPI)</strong>
                      <span className="text-[10px] text-stone-500">Fast 1-click PIN authorization</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Instant
                  </span>
                </label>

                {/* 2. PhonePe */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === 'phonepe'
                      ? 'border-[#065f46] bg-emerald-50/40 ring-1 ring-[#065f46]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="phonepe"
                      checked={selectedMethod === 'phonepe'}
                      onChange={() => setSelectedMethod('phonepe')}
                      className="text-[#065f46] focus:ring-[#065f46]"
                    />
                    <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      पे
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block">PhonePe (UPI)</strong>
                      <span className="text-[10px] text-stone-500">Direct wallet / bank transfer</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    Popular
                  </span>
                </label>

                {/* 3. Paytm */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === 'paytm'
                      ? 'border-[#065f46] bg-emerald-50/40 ring-1 ring-[#065f46]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paytm"
                      checked={selectedMethod === 'paytm'}
                      onChange={() => setSelectedMethod('paytm')}
                      className="text-[#065f46] focus:ring-[#065f46]"
                    />
                    <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                      Paytm
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block">Paytm UPI / Postpaid</strong>
                      <span className="text-[10px] text-stone-500">Zero surcharge</span>
                    </div>
                  </div>
                </label>

                {/* 4. Scan QR Code */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === 'qr'
                      ? 'border-[#065f46] bg-emerald-50/40 ring-1 ring-[#065f46]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="qr"
                      checked={selectedMethod === 'qr'}
                      onChange={() => setSelectedMethod('qr')}
                      className="text-[#065f46] focus:ring-[#065f46]"
                    />
                    <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-2xs">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block">Scan Dynamic QR Code</strong>
                      <span className="text-[10px] text-stone-500">Scan with any BHIM / Banking app</span>
                    </div>
                  </div>
                </label>

                {/* 5. Credit / Debit Card */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === 'card'
                      ? 'border-[#065f46] bg-emerald-50/40 ring-1 ring-[#065f46]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={selectedMethod === 'card'}
                      onChange={() => setSelectedMethod('card')}
                      className="text-[#065f46] focus:ring-[#065f46]"
                    />
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block">Credit / Debit Card</strong>
                      <span className="text-[10px] text-stone-500">Visa, Mastercard, RuPay, Amex</span>
                    </div>
                  </div>
                </label>

                {/* 6. NetBanking */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === 'netbanking'
                      ? 'border-[#065f46] bg-emerald-50/40 ring-1 ring-[#065f46]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="netbanking"
                      checked={selectedMethod === 'netbanking'}
                      onChange={() => setSelectedMethod('netbanking')}
                      className="text-[#065f46] focus:ring-[#065f46]"
                    />
                    <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-2xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block">Net Banking</strong>
                      <span className="text-[10px] text-stone-500">HDFC, SBI, ICICI, Axis + 50 banks</span>
                    </div>
                  </div>
                </label>

                {/* 7. Cash on Delivery */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedMethod === 'cod'
                      ? 'border-[#065f46] bg-emerald-50/40 ring-1 ring-[#065f46]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={selectedMethod === 'cod'}
                      onChange={() => setSelectedMethod('cod')}
                      className="text-[#065f46] focus:ring-[#065f46]"
                    />
                    <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-stone-900 block">Cash on Delivery (Doorstep)</strong>
                      <span className="text-[10px] text-stone-500">Pay cash/UPI when cake arrives</span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Sub-Card Details when Card is Selected */}
              {selectedMethod === 'card' && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumber}
                      maxLength={19}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiry}
                        maxLength={5}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Card when NetBanking is Selected */}
              {selectedMethod === 'netbanking' && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-stone-700">Select Bank</label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium"
                  >
                    {BANKS.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Total Summary */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-500 block">Total Amount to Pay</span>
                  <span className="text-xl font-bold text-[#065f46]">₹{total}</span>
                </div>
                <div className="text-right text-[11px] text-emerald-800 font-semibold">
                  <span>✓ 100% Satisfaction Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-sm text-center cursor-pointer transition-all"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProceedPayment}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#065f46] hover:bg-[#047857] disabled:opacity-60 text-white font-bold text-sm text-center shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay ₹{total} Now</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ================= NPCI UPI PIN MODAL ================= */}
      {upiPinModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold text-stone-500">NPCI SECURE PAYMENT</span>
              <button
                onClick={() => setUpiPinModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-2xl font-bold text-stone-900 mb-1">₹{total}</div>
              <p className="text-xs text-stone-500">Sweet Bliss Artisan Bakery</p>
            </div>

            {upiPinModal.step === 'enter_pin' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-stone-700">Enter 4-Digit UPI PIN</p>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-xl border-2 border-stone-300 flex items-center justify-center text-lg font-bold font-mono"
                    >
                      {upiPinModal.pin[idx] ? '•' : ''}
                    </div>
                  ))}
                </div>

                {upiPinModal.error && (
                  <p className="text-xs text-rose-600 font-medium">{upiPinModal.error}</p>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (upiPinModal.pin.length < 4) {
                          setUpiPinModal((prev) => ({ ...prev, pin: prev.pin + num, error: '' }));
                        }
                      }}
                      className="py-3 bg-stone-50 hover:bg-stone-100 rounded-xl text-base font-bold text-stone-800"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUpiPinModal((prev) => ({ ...prev, pin: prev.pin.slice(0, -1) }))}
                    className="py-3 bg-stone-100 rounded-xl text-xs font-bold text-stone-600"
                  >
                    DEL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (upiPinModal.pin.length < 4) {
                        setUpiPinModal((prev) => ({ ...prev, pin: prev.pin + '0', error: '' }));
                      }
                    }}
                    className="py-3 bg-stone-50 hover:bg-stone-100 rounded-xl text-base font-bold text-stone-800"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleUpiPinSubmit}
                    className="py-3 bg-[#065f46] text-white rounded-xl text-xs font-bold flex items-center justify-center shadow-xs"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {upiPinModal.step === 'verifying' && (
              <div className="py-8 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#065f46] mx-auto" />
                <p className="text-xs font-bold text-stone-700">Verifying with Bank...</p>
              </div>
            )}

            {upiPinModal.step === 'success' && (
              <div className="py-8 space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-emerald-800">Payment Authorized!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= NETBANKING SIMULATOR MODAL ================= */}
      {netBankingModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold text-stone-500">{netBankingModal.bank.name} Portal</span>
              <button
                onClick={() => setNetBankingModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {netBankingModal.step === 'login' && (
              <div className="space-y-3 text-left">
                <p className="text-xs text-stone-600">NetBanking Login for ₹{total}</p>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Customer / User ID</label>
                  <input
                    type="text"
                    value={netBankingModal.userId}
                    onChange={(e) => setNetBankingModal({ ...netBankingModal, userId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={netBankingModal.password}
                    onChange={(e) => setNetBankingModal({ ...netBankingModal, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleNetBankingLogin}
                  className="w-full py-2.5 rounded-xl bg-[#065f46] text-white text-xs font-bold cursor-pointer"
                >
                  Continue to OTP
                </button>
              </div>
            )}

            {netBankingModal.step === 'otp' && (
              <div className="space-y-3 text-left">
                <p className="text-xs font-semibold text-stone-700">Enter Bank OTP sent to registered mobile</p>
                <input
                  type="text"
                  value={netBankingModal.otp}
                  onChange={(e) => setNetBankingModal({ ...netBankingModal, otp: e.target.value })}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-3 py-2 text-center rounded-xl border border-stone-200 font-mono tracking-widest text-sm"
                />
                <button
                  type="button"
                  onClick={handleNetBankingOtpSubmit}
                  className="w-full py-2.5 rounded-xl bg-[#065f46] text-white text-xs font-bold cursor-pointer"
                >
                  Authorize Payment
                </button>
              </div>
            )}

            {netBankingModal.step === 'verifying' && (
              <div className="py-6 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-[#065f46] mx-auto" />
                <p className="text-xs font-bold text-stone-700">Authorizing with {netBankingModal.bank.name}...</p>
              </div>
            )}

            {netBankingModal.step === 'success' && (
              <div className="py-6 space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-800">Bank Transfer Successful!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CARD 3D SECURE OTP MODAL ================= */}
      {cardOtpModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold text-stone-500">Verified by Visa / RuPay Secure</span>
              <button
                onClick={() => setCardOtpModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-stone-500">Authenticating Card ending in {cardNumber.slice(-4) || '6789'}</p>
              <div className="text-xl font-bold text-stone-900 mt-1">₹{total}</div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={cardOtpModal.otp}
                onChange={(e) => setCardOtpModal({ ...cardOtpModal, otp: e.target.value })}
                placeholder="Enter Bank OTP"
                className="w-full px-3 py-2 text-center rounded-xl border border-stone-200 font-mono tracking-widest text-sm"
              />
              <button
                type="button"
                onClick={handleCardOtpSubmit}
                disabled={cardOtpModal.verifying}
                className="w-full py-2.5 rounded-xl bg-[#065f46] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
              >
                {cardOtpModal.verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Submit OTP & Pay</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
