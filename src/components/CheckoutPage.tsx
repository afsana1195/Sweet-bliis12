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
  Tag,
  Wallet,
  BadgePercent,
  HelpCircle,
  Copy,
  Receipt,
  Shield,
  Award,
  ChevronDown,
} from 'lucide-react';
import { CartItem, PlacedOrder, CustomerUser } from '../types.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onOrderCompleted: (order: PlacedOrder) => void;
  onBackToCart: () => void;
  onExploreCakes: () => void;
  currentUser?: CustomerUser | null;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
}

// Popular Indian Banks
interface BankOption {
  id: string;
  name: string;
  shortCode: string;
  primaryColor: string;
  secondaryColor: string;
  logoText: string;
}

const POPULAR_BANKS: BankOption[] = [
  { id: 'HDFC', name: 'HDFC Bank', shortCode: 'HDFC', primaryColor: '#004c8f', secondaryColor: '#e8f0fe', logoText: 'HDFC' },
  { id: 'SBI', name: 'State Bank of India', shortCode: 'SBI', primaryColor: '#280071', secondaryColor: '#ede9fe', logoText: 'SBI' },
  { id: 'ICICI', name: 'ICICI Bank', shortCode: 'ICICI', primaryColor: '#b02a30', secondaryColor: '#fee2e2', logoText: 'ICICI' },
  { id: 'AXIS', name: 'Axis Bank', shortCode: 'AXIS', primaryColor: '#861f41', secondaryColor: '#fdf2f4', logoText: 'AXIS' },
  { id: 'KOTAK', name: 'Kotak Mahindra', shortCode: 'KOTAK', primaryColor: '#ed1c24', secondaryColor: '#fee2e2', logoText: 'KOTAK' },
  { id: 'PNB', name: 'Punjab National Bank', shortCode: 'PNB', primaryColor: '#a21d3c', secondaryColor: '#fdf2f4', logoText: 'PNB' },
];

const ALL_INDIAN_BANKS = [
  'Airtel Payments Bank',
  'AU Small Finance Bank',
  'Axis Bank',
  'Bandhan Bank',
  'Bank of Baroda',
  'Bank of India',
  'Bank of Maharashtra',
  'Canara Bank',
  'Central Bank of India',
  'City Union Bank',
  'Equitas Small Finance Bank',
  'Federal Bank',
  'HDFC Bank',
  'ICICI Bank',
  'IDBI Bank',
  'IDFC FIRST Bank',
  'Indian Bank',
  'Indian Overseas Bank',
  'IndusInd Bank',
  'Jammu & Kashmir Bank',
  'Karnataka Bank',
  'Karur Vysya Bank',
  'Kotak Mahindra Bank',
  'Punjab & Sind Bank',
  'Punjab National Bank',
  'RBL Bank',
  'South Indian Bank',
  'Standard Chartered Bank',
  'State Bank of India',
  'UCO Bank',
  'Union Bank of India',
  'Yes Bank',
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

// Audio chime using Web Audio API (smooth luxury payment notification)
function playPaymentSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.9);
    osc2.stop(now + 0.9);
  } catch (e) {
    // Non-fatal if audio context is blocked
    console.debug('Payment chime muted:', e);
  }
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  onOrderCompleted,
  onBackToCart,
  onExploreCakes,
  currentUser,
  onOpenAuth,
}) => {
  // 3-Step Flow
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  // Delivery & Customer Information
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    city: currentUser?.city || 'Bangalore',
    pincode: currentUser?.pincode || '562162',
    landmark: '',
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    deliverySlot: 'evening',
    orderNotes: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.name,
        email: prev.email || currentUser.email,
        phone: prev.phone || currentUser.phone,
        address: prev.address || currentUser.address || '',
        city: prev.city || currentUser.city || 'Bangalore',
        pincode: prev.pincode || currentUser.pincode || '562162',
      }));
    }
  }, [currentUser]);

  // Payment Channel Selection
  const [paymentCategory, setPaymentCategory] = useState<'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'qr' | 'vpa'>('gpay');
  const [upiVpa, setUpiVpa] = useState('');
  const [vpaVerified, setVpaVerified] = useState(false);
  const [isVerifyingVpa, setIsVerifyingVpa] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(300);

  // Card Inputs & Visual State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [saveCard, setSaveCard] = useState(true);

  // NetBanking State
  const [selectedBankId, setSelectedBankId] = useState('HDFC');
  const [otherBankSelect, setOtherBankSelect] = useState('');

  // Digital Wallets
  const [selectedWallet, setSelectedWallet] = useState<'amazonpay' | 'paytm' | 'mobikwik' | 'simpl'>('amazonpay');

  // COD Anti-Spam Security Code
  const [codSecurityCode, setCodSecurityCode] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('4892');

  // Coupons & Promo Codes
  const [couponInput, setCouponInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Sweet Points Redemption
  const [redeemPointsChecked, setRedeemPointsChecked] = useState(false);

  // Global submission & errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Razorpay Gateway Sandbox Testing Modal State
  const [razorpaySandboxModal, setRazorpaySandboxModal] = useState<{
    isOpen: boolean;
    pendingOrderId: string;
    razorpayOrderId: string;
    amountInr: number;
    amountPaise: number;
    paymentCategory: string;
    loading: boolean;
    error: string;
  }>({
    isOpen: false,
    pendingOrderId: '',
    razorpayOrderId: '',
    amountInr: 0,
    amountPaise: 0,
    paymentCategory: 'UPI',
    loading: false,
    error: '',
  });

  // Regenerate COD captcha on mount
  useEffect(() => {
    setGeneratedCaptcha(String(Math.floor(1000 + Math.random() * 9000)));
  }, [checkoutStep]);

  // Auto-fill cardholder name from customer full name
  useEffect(() => {
    if (formData.fullName && !cardHolder) {
      setCardHolder(formData.fullName.toUpperCase());
    }
  }, [formData.fullName]);

  // QR countdown
  useEffect(() => {
    if (selectedUpiApp === 'qr' && qrCountdown > 0) {
      const interval = setInterval(() => setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
      return () => clearInterval(interval);
    }
  }, [selectedUpiApp, qrCountdown]);


  // Empty Cart Screen
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-20 bg-[#FAF7F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-stone-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#881337] flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">Your basket is empty</h2>
          <p className="text-xs text-stone-500">Please choose your celebration cake before proceeding to checkout.</p>
          <button
            onClick={onExploreCakes}
            className="px-6 py-2.5 rounded-full bg-[#065f46] hover:bg-[#047857] text-white text-xs font-semibold cursor-pointer transition-colors"
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
  const isFreeDelivery = BUSINESS_CONFIG.freeDeliveryThreshold === 0 || subtotal >= BUSINESS_CONFIG.freeDeliveryThreshold;
  const deliveryFee = BUSINESS_CONFIG.freeDeliveryThreshold === 0 ? 0 : (
    isFreeDelivery
      ? (isMidnight ? 99 : 0)
      : (isMidnight ? BUSINESS_CONFIG.expressMidnightDeliveryFee : BUSINESS_CONFIG.standardDeliveryFee)
  );

  const baseOrderDiscount = subtotal > 1500 ? Math.round(subtotal * 0.1) : 0;
  const promoDiscount = appliedPromo ? appliedPromo.discountAmount : 0;

  // Max points user can redeem (1 point = ₹1, up to 25% of subtotal or total user balance)
  const userAvailablePoints = currentUser?.loyaltyPoints || 0;
  const maxRedeemablePoints = Math.min(userAvailablePoints, Math.floor(subtotal * 0.25));
  const pointsDiscount = redeemPointsChecked ? maxRedeemablePoints : 0;

  const totalDiscounts = baseOrderDiscount + promoDiscount + pointsDiscount;
  const total = Math.max(0, subtotal + deliveryFee - totalDiscounts);

  // Promo Code Validation Handler
  const handleApplyPromo = (codeToApply?: string) => {
    const raw = (codeToApply || couponInput).trim().toUpperCase();
    setPromoError('');
    setPromoSuccess('');

    if (!raw) {
      setPromoError('Please enter a coupon code.');
      return;
    }

    if (raw === 'SWEETBLISS10') {
      const disc = Math.round(subtotal * 0.1);
      setAppliedPromo({ code: 'SWEETBLISS10', discountAmount: disc, label: '10% Sweet Bliss Welcome Discount' });
      setPromoSuccess(`Coupon SWEETBLISS10 applied! You saved ₹${disc}`);
      setCouponInput('SWEETBLISS10');
    } else if (raw === 'FIRSTCAKE') {
      const disc = Math.min(150, Math.round(subtotal * 0.15));
      setAppliedPromo({ code: 'FIRSTCAKE', discountAmount: disc, label: '₹150 First Celebration Discount' });
      setPromoSuccess(`Coupon FIRSTCAKE applied! You saved ₹${disc}`);
      setCouponInput('FIRSTCAKE');
    } else if (raw === 'FESTIVE15') {
      const disc = Math.round(subtotal * 0.15);
      setAppliedPromo({ code: 'FESTIVE15', discountAmount: disc, label: '15% Festive Celebration Saver' });
      setPromoSuccess(`Coupon FESTIVE15 applied! You saved ₹${disc}`);
      setCouponInput('FESTIVE15');
    } else {
      setPromoError('Invalid coupon code. Try SWEETBLISS10 or FIRSTCAKE.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoSuccess('');
    setPromoError('');
    setCouponInput('');
  };

  // Stepper Validations & Navigation
  const handleNextFromDelivery = () => {
    if (!formData.deliveryDate) {
      setErrorMessage('Please select your celebration delivery date.');
      return;
    }
    setErrorMessage('');
    setCheckoutStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextFromAddress = () => {
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter recipient full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Please enter complete delivery street address.');
      return;
    }
    if (!formData.pincode.trim() || formData.pincode.trim().length < 6) {
      setErrorMessage('Please enter a valid 6-digit Pincode.');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMessage('Please enter delivery city.');
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
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // VPA Verification
  const handleVerifyVpa = () => {
    if (!upiVpa.trim() || !upiVpa.includes('@')) {
      setErrorMessage('Please enter a valid UPI address format (e.g. name@okhdfcbank or 9876543210@paytm)');
      return;
    }
    setIsVerifyingVpa(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsVerifyingVpa(false);
      setVpaVerified(true);
    }, 700);
  };

  // Final Order Submission to Server
  const finalizeOrderOnServer = async (methodLabel: string, txnReference?: string) => {
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
        paymentMethod: methodLabel,
        orderNotes: formData.orderNotes.trim() || undefined,
        transactionId: txnReference,
        promoDiscount: promoDiscount,
        pointsDiscount: pointsDiscount,
        pointsRedeemed: redeemPointsChecked ? maxRedeemablePoints : 0,
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

      // Audio celebration
      playPaymentSuccessChime();

      onOrderCompleted(data.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment communication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Online Payment via Razorpay Gateway (Server Order Creation & Signature Verification)
  const initiateRazorpayPayment = async (selectedMethod: string) => {
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
        orderNotes: formData.orderNotes.trim() || undefined,
        promoCode: appliedPromo?.code || undefined,
        pointsRedeemed: redeemPointsChecked ? maxRedeemablePoints : 0,
      };

      const res = await fetch('/api/payment/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate Razorpay payment order.');
      }

      const hasLiveRazorpay = typeof window !== 'undefined' && (window as any).Razorpay && !data.isSandbox;

      if (hasLiveRazorpay) {
        const rzp = new (window as any).Razorpay({
          key: data.keyId,
          amount: data.amountPaise,
          currency: 'INR',
          name: 'Sweet Bliss by Jyoti Tanti',
          description: `Artisan Cake Order (${data.pendingOrderId})`,
          order_id: data.razorpayOrderId,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: '#881337',
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/payment/verify-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  pendingOrderId: data.pendingOrderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.verified) {
                playPaymentSuccessChime();
                onOrderCompleted(verifyData.order);
              } else {
                setErrorMessage(verifyData.error || 'Signature verification failed.');
              }
            } catch (err: any) {
              setErrorMessage('Payment verification error: ' + err.message);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
            },
          },
        });
        rzp.open();
      } else {
        // Open Sandbox Test Mode Modal with live order verification capability
        setRazorpaySandboxModal({
          isOpen: true,
          pendingOrderId: data.pendingOrderId,
          razorpayOrderId: data.razorpayOrderId,
          amountInr: data.amountInr,
          amountPaise: data.amountPaise,
          paymentCategory: selectedMethod.toUpperCase(),
          loading: false,
          error: '',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed. Please check order details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSandboxConfirm = async (simulateFailure: boolean) => {
    setRazorpaySandboxModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const verifyRes = await fetch('/api/payment/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingOrderId: razorpaySandboxModal.pendingOrderId,
          razorpay_order_id: razorpaySandboxModal.razorpayOrderId,
          razorpay_payment_id: `pay_sandbox_${Date.now()}`,
          razorpay_signature: simulateFailure ? 'tampered_invalid_signature' : 'sandbox_verified',
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.verified) {
        setRazorpaySandboxModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        playPaymentSuccessChime();
        onOrderCompleted(verifyData.order);
      } else {
        setRazorpaySandboxModal((prev) => ({
          ...prev,
          loading: false,
          error: verifyData.error || 'Payment signature rejected by server as expected.',
        }));
      }
    } catch (err: any) {
      setRazorpaySandboxModal((prev) => ({
        ...prev,
        loading: false,
        error: 'Communication error: ' + err.message,
      }));
    }
  };

  // Payment Initiation Trigger
  const handleProceedPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    // --- CASH ON DELIVERY FLOW ---
    if (paymentCategory === 'cod') {
      if (!codSecurityCode.trim() || codSecurityCode.trim() !== generatedCaptcha) {
        setErrorMessage(`Please enter the correct 4-digit verification code (${generatedCaptcha}) to confirm Cash on Delivery.`);
        return;
      }
      finalizeOrderOnServer('Cash on Delivery (Doorstep)');
      return;
    }

    // --- ONLINE PAYMENT FLOWS (Razorpay Order + Signature Verification) ---
    initiateRazorpayPayment(paymentCategory);
  };

  const detectedNetwork = detectCardNetwork(cardNumber);

  return (
    <div className="bg-[#FAF7F5] min-h-screen py-6 sm:py-10 text-[#2C1810]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ================= HEADER NAVIGATION ================= */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
          <button
            onClick={handlePrevious}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-900 shadow-2xs text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{checkoutStep === 1 ? 'Back to Basket' : 'Previous Step'}</span>
          </button>

          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-serif">
              Secure Checkout
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">Sweet Bliss Artisan Bakery • Hyderabad</p>
          </div>

          <button
            onClick={onBackToCart}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Exit Checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= 3-STEP PROGRESS STEPPER ================= */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs mb-8">
          <div className="relative flex items-center justify-between max-w-xl mx-auto">
            {/* Background Track */}
            <div className="absolute left-10 right-10 top-4 -translate-y-1/2 h-1 bg-stone-200 z-0">
              <div
                className="h-full bg-[#065f46] transition-all duration-300 rounded-full"
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
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  checkoutStep > 1
                    ? 'bg-[#065f46] text-white shadow-xs'
                    : checkoutStep === 1
                    ? 'bg-[#065f46] text-white ring-4 ring-[#065f46]/20'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {checkoutStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </div>
              <span className={`text-xs font-bold ${checkoutStep === 1 ? 'text-[#065f46]' : 'text-stone-700'}`}>
                Delivery
              </span>
            </button>

            {/* Step 2: Address */}
            <button
              type="button"
              onClick={() => {
                if (checkoutStep >= 2) setCheckoutStep(2);
                else handleNextFromDelivery();
              }}
              className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  checkoutStep > 2
                    ? 'bg-[#065f46] text-white shadow-xs'
                    : checkoutStep === 2
                    ? 'bg-[#065f46] text-white ring-4 ring-[#065f46]/20'
                    : 'bg-stone-100 text-stone-400 border border-stone-300'
                }`}
              >
                {checkoutStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </div>
              <span className={`text-xs font-bold ${checkoutStep === 2 ? 'text-[#065f46]' : 'text-stone-700'}`}>
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
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  checkoutStep === 3
                    ? 'bg-[#065f46] text-white ring-4 ring-[#065f46]/20 shadow-xs'
                    : 'bg-stone-100 text-stone-400 border border-stone-300'
                }`}
              >
                {checkoutStep === 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </div>
              <span className={`text-xs font-bold ${checkoutStep === 3 ? 'text-[#065f46]' : 'text-stone-700'}`}>
                Payment
              </span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= 2-COLUMN CHECKOUT GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: ACTIVE STEP DETAILS & PAYMENT GATEWAY */}
          <div className="lg:col-span-7 space-y-6">

            {/* ================= STEP 1: DELIVERY SLOT ================= */}
            {checkoutStep === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#065f46]" />
                    <span>Choose Celebration Delivery Date</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Freshly baked and refrigerated on the morning of your event.
                  </p>
                </div>

                {/* Date Input */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Delivery Date *
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

                {/* Time Slots */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">
                    Preferred Delivery Window *
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

                {/* Custom Plaque Message */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Order Note / Cake Plaque Inscription (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.orderNotes}
                    onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
                    placeholder="e.g. Happy 30th Birthday Rahul! Please ring the bell gently..."
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs focus:outline-none focus:border-[#065f46]"
                  />
                </div>

                {/* Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm text-center cursor-pointer transition-all"
                  >
                    Back to Bag
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromDelivery}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-sm text-center shadow-md cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Proceed to Address
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: ADDRESS ================= */}
            {checkoutStep === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#065f46]" />
                    <span>Recipient & Delivery Address</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Our cold-van dispatch rider will contact you prior to delivery.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Recipient Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900 font-medium"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Email Address * (For Tax Invoice & Order Tracking)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900 font-medium"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    10-Digit Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-13 pr-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900 font-medium"
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Complete Street Address / Flat / Floor *
                  </label>
                  <input
                    type="text"
                    placeholder="House/Flat No, Apartment/Building, Road Name"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900 font-medium"
                  />
                </div>

                {/* Zip Code & City Side-by-Side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="562162"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900 font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      placeholder="Bangalore"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900 font-medium"
                    />
                  </div>
                </div>

                {/* Landmark */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Chandapura Circle, Electronic City Flyover"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm focus:outline-none focus:border-[#065f46] text-stone-900"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm text-center cursor-pointer transition-all"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromAddress}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-sm text-center shadow-md cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: FULLY PROFESSIONAL REAL PAYMENT GATEWAY ================= */}
            {checkoutStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">

                {/* Delivery Snapshot Mini-Pill */}
                <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Delivering To</span>
                        <span className="text-[11px] font-bold text-stone-900">{formData.fullName}</span>
                      </div>
                      <p className="text-stone-500 text-xs truncate max-w-xs sm:max-w-md">
                        {formData.address}, {formData.city} - {formData.pincode}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(2)}
                    className="text-xs font-bold text-[#065f46] hover:underline cursor-pointer shrink-0"
                  >
                    Edit
                  </button>
                </div>

                {/* Gateway Container */}
                <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
                  {/* Gateway Header */}
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-[#19362D] text-white flex items-center justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-white/10 px-2.5 py-0.5 rounded-full mb-1">
                        <Lock className="w-3 h-3" />
                        <span>256-Bit Bank Level Encryption</span>
                      </div>
                      <h2 className="font-serif text-lg sm:text-xl font-bold">Select Payment Method</h2>
                      <p className="text-stone-300 text-xs">All major Indian UPI, Cards & NetBanking accepted</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-stone-300 block">Total Due</span>
                      <span className="text-2xl font-black text-emerald-300">₹{total}</span>
                    </div>
                  </div>

                  {/* Payment Channel Tabs Navigation */}
                  <div className="grid grid-cols-5 border-b border-stone-200 bg-stone-50/70 text-xs font-bold text-stone-600">
                    <button
                      type="button"
                      onClick={() => setPaymentCategory('upi')}
                      className={`py-3.5 px-2 text-center border-b-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        paymentCategory === 'upi'
                          ? 'border-[#065f46] text-[#065f46] bg-white'
                          : 'border-transparent hover:text-stone-900 hover:bg-stone-100/50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="text-[11px]">UPI Fast</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentCategory('card')}
                      className={`py-3.5 px-2 text-center border-b-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        paymentCategory === 'card'
                          ? 'border-[#065f46] text-[#065f46] bg-white'
                          : 'border-transparent hover:text-stone-900 hover:bg-stone-100/50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-[11px]">Cards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentCategory('netbanking')}
                      className={`py-3.5 px-2 text-center border-b-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        paymentCategory === 'netbanking'
                          ? 'border-[#065f46] text-[#065f46] bg-white'
                          : 'border-transparent hover:text-stone-900 hover:bg-stone-100/50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="text-[11px]">NetBank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentCategory('wallet')}
                      className={`py-3.5 px-2 text-center border-b-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        paymentCategory === 'wallet'
                          ? 'border-[#065f46] text-[#065f46] bg-white'
                          : 'border-transparent hover:text-stone-900 hover:bg-stone-100/50'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="text-[11px]">Wallets</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentCategory('cod')}
                      className={`py-3.5 px-2 text-center border-b-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        paymentCategory === 'cod'
                          ? 'border-[#065f46] text-[#065f46] bg-white'
                          : 'border-transparent hover:text-stone-900 hover:bg-stone-100/50'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span className="text-[11px]">Cash/COD</span>
                    </button>
                  </div>

                  {/* Channel Body */}
                  <div className="p-6">

                    {/* ================= 1. UPI SECTION ================= */}
                    {paymentCategory === 'upi' && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* Sub-modes: Apps, Dynamic QR, VPA */}
                        <div className="flex items-center gap-2 pb-1 border-b border-stone-100 overflow-x-auto text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setSelectedUpiApp('gpay')}
                            className={`px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                              selectedUpiApp === 'gpay'
                                ? 'bg-stone-900 text-white font-bold'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            Google Pay
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUpiApp('phonepe')}
                            className={`px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                              selectedUpiApp === 'phonepe'
                                ? 'bg-purple-700 text-white font-bold'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            PhonePe
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUpiApp('paytm')}
                            className={`px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                              selectedUpiApp === 'paytm'
                                ? 'bg-sky-600 text-white font-bold'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            Paytm
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUpiApp('qr')}
                            className={`px-3 py-1.5 rounded-full cursor-pointer transition-all flex items-center gap-1 ${
                              selectedUpiApp === 'qr'
                                ? 'bg-[#065f46] text-white font-bold'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Scan QR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUpiApp('vpa')}
                            className={`px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                              selectedUpiApp === 'vpa'
                                ? 'bg-stone-900 text-white font-bold'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            Custom UPI ID
                          </button>
                        </div>

                        {/* UPI APP SELECTED (GPay, PhonePe, Paytm, BHIM) */}
                        {selectedUpiApp !== 'qr' && selectedUpiApp !== 'vpa' && (
                          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md ${
                                  selectedUpiApp === 'gpay'
                                    ? 'bg-white border border-stone-200 text-stone-800'
                                    : selectedUpiApp === 'phonepe'
                                    ? 'bg-purple-700'
                                    : 'bg-sky-500'
                                }`}
                              >
                                {selectedUpiApp === 'gpay' ? (
                                  <div className="flex font-black text-sm">
                                    <span className="text-blue-500">G</span>
                                    <span className="text-red-500">P</span>
                                    <span className="text-amber-500">a</span>
                                    <span className="text-green-500">y</span>
                                  </div>
                                ) : selectedUpiApp === 'phonepe' ? (
                                  'पे'
                                ) : (
                                  'Paytm'
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-stone-900 text-sm">
                                  {selectedUpiApp === 'gpay'
                                    ? 'Pay with Google Pay UPI'
                                    : selectedUpiApp === 'phonepe'
                                    ? 'Pay with PhonePe UPI'
                                    : 'Pay with Paytm Payments Bank / UPI'}
                                </h3>
                                <p className="text-xs text-stone-500">
                                  Direct 1-click NPCI PIN authorization with linked bank account.
                                </p>
                                <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                                  Instant Confirmation • 0% Surcharge
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DYNAMIC QR CODE DISPLAY */}
                        {selectedUpiApp === 'qr' && (
                          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 text-center space-y-4">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#065f46] bg-emerald-100 px-3 py-1 rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                QR expires in {Math.floor(qrCountdown / 60)}:
                                {String(qrCountdown % 60).padStart(2, '0')}
                              </span>
                            </div>

                            <div className="relative inline-block p-4 bg-white rounded-3xl border-2 border-stone-800 shadow-md">
                              {/* High resolution authentic vector QR code pattern */}
                              <svg
                                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto"
                                viewBox="0 0 200 200"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                {/* Position Detection Corners */}
                                <rect x="10" y="10" width="50" height="50" rx="8" fill="#1C1917" />
                                <rect x="18" y="18" width="34" height="34" rx="4" fill="white" />
                                <rect x="24" y="24" width="22" height="22" rx="2" fill="#065f46" />

                                <rect x="140" y="10" width="50" height="50" rx="8" fill="#1C1917" />
                                <rect x="148" y="18" width="34" height="34" rx="4" fill="white" />
                                <rect x="154" y="24" width="22" height="22" rx="2" fill="#065f46" />

                                <rect x="10" y="140" width="50" height="50" rx="8" fill="#1C1917" />
                                <rect x="18" y="148" width="34" height="34" rx="4" fill="white" />
                                <rect x="24" y="154" width="22" height="22" rx="2" fill="#065f46" />

                                {/* Realistic Data Grid Blocks */}
                                <g fill="#1C1917">
                                  <rect x="70" y="15" width="10" height="10" rx="2" />
                                  <rect x="90" y="15" width="10" height="10" rx="2" />
                                  <rect x="110" y="15" width="10" height="10" rx="2" />
                                  <rect x="75" y="35" width="15" height="10" rx="2" />
                                  <rect x="100" y="35" width="10" height="10" rx="2" />
                                  <rect x="120" y="35" width="10" height="10" rx="2" />
                                  <rect x="70" y="55" width="10" height="15" rx="2" />
                                  <rect x="95" y="55" width="15" height="10" rx="2" />
                                  <rect x="120" y="55" width="10" height="10" rx="2" />

                                  <rect x="15" y="70" width="10" height="10" rx="2" />
                                  <rect x="35" y="75" width="15" height="10" rx="2" />
                                  <rect x="15" y="95" width="10" height="10" rx="2" />
                                  <rect x="35" y="100" width="10" height="15" rx="2" />
                                  <rect x="15" y="120" width="15" height="10" rx="2" />

                                  <rect x="145" y="70" width="10" height="10" rx="2" />
                                  <rect x="165" y="75" width="15" height="10" rx="2" />
                                  <rect x="145" y="95" width="15" height="10" rx="2" />
                                  <rect x="170" y="100" width="10" height="15" rx="2" />
                                  <rect x="145" y="120" width="10" height="10" rx="2" />

                                  <rect x="70" y="145" width="10" height="10" rx="2" />
                                  <rect x="90" y="145" width="15" height="10" rx="2" />
                                  <rect x="115" y="145" width="10" height="10" rx="2" />
                                  <rect x="75" y="165" width="10" height="15" rx="2" />
                                  <rect x="95" y="165" width="15" height="10" rx="2" />
                                  <rect x="145" y="145" width="15" height="10" rx="2" />
                                  <rect x="170" y="150" width="10" height="10" rx="2" />
                                  <rect x="145" y="170" width="10" height="15" rx="2" />
                                  <rect x="165" y="170" width="15" height="10" rx="2" />
                                </g>

                                {/* Center Sweet Bliss Emblem */}
                                <circle cx="100" cy="100" r="24" fill="white" stroke="#065f46" strokeWidth="3" />
                                <text
                                  x="100"
                                  y="104"
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight="900"
                                  fill="#065f46"
                                  fontFamily="sans-serif"
                                >
                                  UPI
                                </text>
                              </svg>
                            </div>

                            <div>
                              <p className="text-xs font-bold text-stone-800">
                                Scan with any UPI App (GPay, PhonePe, Paytm, CRED, BHIM)
                              </p>
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                Verified Merchant: <strong className="text-stone-700">sweetbliss.bakery@icici</strong>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* CUSTOM UPI ID / VPA */}
                        {selectedUpiApp === 'vpa' && (
                          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                                Enter your Virtual Payment Address (VPA)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                                  value={upiVpa}
                                  onChange={(e) => {
                                    setUpiVpa(e.target.value);
                                    setVpaVerified(false);
                                  }}
                                  className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#065f46]"
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyVpa}
                                  disabled={isVerifyingVpa || !upiVpa.trim()}
                                  className="px-4 py-3 rounded-xl bg-stone-900 text-white font-bold text-xs disabled:opacity-50 cursor-pointer hover:bg-stone-800 transition-colors"
                                >
                                  {isVerifyingVpa ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : vpaVerified ? (
                                    'Verified ✓'
                                  ) : (
                                    'Verify'
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Popular VPA Suffix Pills */}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                                Quick Handles:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {['@okhdfcbank', '@okicici', '@oksbi', '@paytm', '@ybl', '@axl'].map((suffix) => (
                                  <button
                                    key={suffix}
                                    type="button"
                                    onClick={() => {
                                      const base = upiVpa.split('@')[0] || formData.phone || 'customer';
                                      setUpiVpa(`${base}${suffix}`);
                                      setVpaVerified(false);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-mono text-stone-700 hover:border-[#065f46] hover:text-[#065f46] cursor-pointer"
                                  >
                                    {suffix}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ================= 2. CREDIT / DEBIT CARDS SECTION ================= */}
                    {paymentCategory === 'card' && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* Interactive Luxury 3D Card Preview */}
                        <div className="relative max-w-sm mx-auto h-48 rounded-2xl p-5 text-white shadow-xl bg-gradient-to-tr from-stone-900 via-[#1c2e27] to-[#065f46] border border-white/20 flex flex-col justify-between overflow-hidden">
                          {/* Holographic Chip & Brand */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-600/50 flex items-center justify-center shadow-inner">
                                <div className="w-6 h-5 border border-amber-700/40 rounded-xs" />
                              </div>
                              <span className="text-[10px] tracking-widest text-emerald-300 font-mono">
                                NFC CONTACTLESS
                              </span>
                            </div>

                            {/* Card Network Badge */}
                            <div className="font-black text-sm uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-xs border border-white/20">
                              {detectedNetwork === 'visa' ? (
                                <span className="text-blue-300 font-serif italic text-base">VISA</span>
                              ) : detectedNetwork === 'mastercard' ? (
                                <span className="text-amber-400 font-bold">Mastercard</span>
                              ) : detectedNetwork === 'rupay' ? (
                                <span className="text-cyan-300 font-bold">RuPay</span>
                              ) : detectedNetwork === 'amex' ? (
                                <span className="text-sky-300 font-bold">AMEX</span>
                              ) : (
                                'CARD'
                              )}
                            </div>
                          </div>

                          {/* 16-Digit Number */}
                          <div className="font-mono text-lg sm:text-xl tracking-widest font-semibold text-stone-100">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>

                          {/* Holder & Expiry */}
                          <div className="flex items-end justify-between text-xs">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-stone-400 block">
                                CARDHOLDER
                              </span>
                              <span className="font-bold tracking-wide uppercase truncate max-w-[180px] block">
                                {cardHolder || formData.fullName.toUpperCase() || 'VALUED PATRON'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] uppercase tracking-wider text-stone-400 block">EXPIRES</span>
                              <span className="font-mono font-bold">{cardExpiry || 'MM/YY'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Form Inputs */}
                        <div className="space-y-4">
                          {/* Card Number */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-stone-700">Card Number</label>
                              <span className="text-[10px] text-stone-400 font-medium">Visa, Mastercard, RuPay, Amex</span>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white font-mono text-sm tracking-wider focus:outline-none focus:border-[#065f46]"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <CreditCard className="w-5 h-5 text-stone-400" />
                              </div>
                            </div>
                          </div>

                          {/* Cardholder Name */}
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5">Name on Card</label>
                            <input
                              type="text"
                              placeholder="Name as printed on card"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm uppercase font-medium focus:outline-none focus:border-[#065f46]"
                            />
                          </div>

                          {/* Expiry & CVV */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-stone-700 mb-1.5">Expiry Date</label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                maxLength={5}
                                value={cardExpiry}
                                onChange={handleExpiryChange}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white font-mono text-xs sm:text-sm text-center focus:outline-none focus:border-[#065f46]"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-stone-700">CVV / CVC</label>
                                <span className="text-[10px] text-stone-400">3-4 digits</span>
                              </div>
                              <div className="relative">
                                <input
                                  type={showCvv ? 'text' : 'password'}
                                  placeholder="•••"
                                  maxLength={4}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white font-mono text-xs sm:text-sm text-center tracking-widest focus:outline-none focus:border-[#065f46]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCvv(!showCvv)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                >
                                  {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* RBI Tokenization Compliance Toggle */}
                          <label className="flex items-start gap-2.5 pt-1 text-xs text-stone-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveCard}
                              onChange={(e) => setSaveCard(e.target.checked)}
                              className="mt-0.5 rounded-sm text-[#065f46] focus:ring-[#065f46]"
                            />
                            <span>
                              Secure this card with RBI Tokenization guidelines for future 1-click checkout. CVV is never stored.
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* ================= 3. NET BANKING SECTION ================= */}
                    {paymentCategory === 'netbanking' && (
                      <div className="space-y-5 animate-in fade-in">
                        <label className="block text-xs font-bold text-stone-700">
                          Select from Popular Indian Banks
                        </label>

                        {/* Top 6 Indian Banks Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {POPULAR_BANKS.map((bank) => (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => {
                                setSelectedBankId(bank.id);
                                setOtherBankSelect('');
                              }}
                              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                                selectedBankId === bank.id && !otherBankSelect
                                  ? 'border-[#065f46] bg-emerald-50/50 ring-2 ring-[#065f46]'
                                  : 'border-stone-200 bg-white hover:bg-stone-50'
                              }`}
                            >
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-2xs shrink-0"
                                style={{ backgroundColor: bank.primaryColor }}
                              >
                                {bank.logoText}
                              </div>
                              <div className="truncate">
                                <strong className="text-xs font-bold text-stone-900 block truncate">
                                  {bank.name}
                                </strong>
                                <span className="text-[10px] text-stone-500 font-mono">Retail & Corp</span>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* All Other Indian Banks Dropdown */}
                        <div className="pt-2">
                          <label className="block text-xs font-bold text-stone-700 mb-1.5">
                            Or Choose from 45+ Other Banks
                          </label>
                          <select
                            value={otherBankSelect}
                            onChange={(e) => {
                              setOtherBankSelect(e.target.value);
                              if (e.target.value) setSelectedBankId('');
                            }}
                            className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-[#F0F4F8] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#065f46]"
                          >
                            <option value="">-- Choose Any Scheduled Indian Bank --</option>
                            {ALL_INDIAN_BANKS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ================= 4. DIGITAL WALLETS & PAY LATER ================= */}
                    {paymentCategory === 'wallet' && (
                      <div className="space-y-4 animate-in fade-in">
                        <label className="block text-xs font-bold text-stone-700">
                          Select Wallet or Pay Later Partner
                        </label>

                        <div className="space-y-2.5">
                          {[
                            { id: 'amazonpay', name: 'Amazon Pay Balance', desc: 'Instant 1-click Amazon authorization' },
                            { id: 'paytm', name: 'Paytm Wallet & Postpaid', desc: 'Direct wallet debit' },
                            { id: 'mobikwik', name: 'MobiKwik Wallet & ZIP', desc: 'SuperCash & pay later' },
                            { id: 'simpl', name: 'Simpl 1-Click Checkout', desc: 'Pay next month on the 15th' },
                          ].map((w) => (
                            <label
                              key={w.id}
                              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                selectedWallet === w.id
                                  ? 'border-[#065f46] bg-emerald-50/50 ring-1 ring-[#065f46]'
                                  : 'border-stone-200 bg-white hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="walletPartner"
                                  checked={selectedWallet === w.id}
                                  onChange={() => setSelectedWallet(w.id as any)}
                                  className="text-[#065f46] focus:ring-[#065f46]"
                                />
                                <div>
                                  <strong className="text-xs font-bold text-stone-900 block">{w.name}</strong>
                                  <span className="text-[11px] text-stone-500">{w.desc}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                                0% Fee
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ================= 5. CASH ON DELIVERY SECTION ================= */}
                    {paymentCategory === 'cod' && (
                      <div className="space-y-5 animate-in fade-in">
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-bold text-amber-950">
                            <Truck className="w-4 h-4 text-amber-700" />
                            <span>Doorstep Delivery Payment</span>
                          </div>
                          <p>
                            Pay by <strong>Cash</strong> or <strong>UPI QR</strong> to the Sweet Bliss delivery rider
                            upon receiving your cake box.
                          </p>
                          <p className="text-[11px] text-amber-800">
                            🎂 <em>Artisan cakes are handcrafted fresh. To protect against accidental or fraudulent bookings, please verify your intent below.</em>
                          </p>
                        </div>

                        {/* Anti-Spam Security Code */}
                        <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                          <label className="block text-xs font-bold text-stone-700">
                            Security Verification Code *
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="px-4 py-2.5 rounded-xl bg-stone-900 text-emerald-400 font-mono text-base font-black tracking-widest select-none shadow-inner">
                              {generatedCaptcha}
                            </div>
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="Type 4 digits"
                              value={codSecurityCode}
                              onChange={(e) => setCodSecurityCode(e.target.value.replace(/\D/g, ''))}
                              className="w-36 px-4 py-2.5 rounded-xl border border-stone-200 bg-white font-mono text-sm tracking-widest text-center focus:outline-none focus:border-[#065f46]"
                            />
                            <button
                              type="button"
                              onClick={() => setGeneratedCaptcha(String(Math.floor(1000 + Math.random() * 9000)))}
                              className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer p-2"
                              title="Refresh Code"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Gateway Action Footer */}
                  <div className="p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Certified PCI-DSS Level 1 & RBI Tokenization Protected</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="py-3 px-5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-xs cursor-pointer transition-colors"
                      >
                        Previous
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleProceedPayment}
                        className="flex-1 sm:flex-initial py-3.5 px-8 rounded-xl bg-[#065f46] hover:bg-[#047857] disabled:opacity-60 text-white font-bold text-sm text-center shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Authorizing...</span>
                          </>
                        ) : (
                          <span>
                            {paymentCategory === 'cod' ? 'Confirm & Book Order' : `Pay ₹${total} Securely`}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: STICKY ORDER SUMMARY, COUPONS, LOYALTY & BREAKDOWN */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">

            {/* ORDER SUMMARY CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#065f46]" />
                  <span>Order Summary</span>
                </h3>
                <span className="text-xs font-bold text-stone-500">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)} cake(s)
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 pr-1 space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                    <div className="flex gap-2.5">
                      <img
                        src={item.product.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-100 shrink-0"
                      />
                      <div>
                        <strong className="text-stone-900 font-bold block">{item.product.name}</strong>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          <span>{item.weightKg} kg</span>
                          <span>•</span>
                          <span className={item.isEggless ? 'text-emerald-700 font-medium' : 'text-amber-800'}>
                            {item.isEggless ? 'Eggless' : 'Contains Egg'}
                          </span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                        {item.cakeMessage && (
                          <p className="text-[10px] text-rose-700 italic truncate max-w-[170px] mt-0.5">
                            "{item.cakeMessage}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-stone-900 tabular-nums shrink-0">
                      ₹{item.unitPrice * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* COUPON & PROMO CODE BOX */}
              <div className="pt-3 border-t border-stone-100 space-y-2">
                <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#065f46]" />
                  <span>Promotional Coupon Code</span>
                </label>

                {appliedPromo ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
                    <div>
                      <span className="font-bold font-mono tracking-wider text-emerald-800 block">
                        {appliedPromo.code}
                      </span>
                      <span className="text-[11px] text-emerald-700">{appliedPromo.label} (-₹{appliedPromo.discountAmount})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. SWEETBLISS10"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-[#F0F4F8] text-xs font-mono uppercase focus:outline-none focus:border-[#065f46]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyPromo()}
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer transition-colors"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Quick Coupon Chips */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-stone-400">Try:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyPromo('SWEETBLISS10')}
                        className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-100 text-stone-700 font-mono font-bold cursor-pointer"
                      >
                        SWEETBLISS10 (10% OFF)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPromo('FIRSTCAKE')}
                        className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-100 text-stone-700 font-mono font-bold cursor-pointer"
                      >
                        FIRSTCAKE (₹150 OFF)
                      </button>
                    </div>

                    {promoError && (
                      <p className="text-[11px] text-rose-600 font-medium animate-in fade-in">{promoError}</p>
                    )}
                    {promoSuccess && (
                      <p className="text-[11px] text-emerald-700 font-medium animate-in fade-in">{promoSuccess}</p>
                    )}
                  </div>
                )}
              </div>

              {/* SWEET POINTS LOYALTY REDEMPTION */}
              {userAvailablePoints > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Redeem Sweet Points</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                      {userAvailablePoints} pts available
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redeemPointsChecked}
                      onChange={(e) => setRedeemPointsChecked(e.target.checked)}
                      className="rounded-sm text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      Use <strong>{maxRedeemablePoints} points</strong> to save <strong>₹{maxRedeemablePoints}</strong> on this order
                    </span>
                  </label>
                </div>
              )}

              {/* FINANCIAL BREAKDOWN */}
              <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Cart Subtotal:</span>
                  <span className="font-semibold text-stone-800 tabular-nums">₹{subtotal}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Delivery Charges:</span>
                  <span className="font-semibold tabular-nums">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        FREE DELIVERY
                      </span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>

                {baseOrderDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Celebration Savings (&gt;₹1,500):</span>
                    <span className="tabular-nums">-₹{baseOrderDiscount}</span>
                  </div>
                )}

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon ({appliedPromo?.code}):</span>
                    <span className="tabular-nums">-₹{promoDiscount}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>Sweet Points Redeemed:</span>
                    <span className="tabular-nums">-₹{pointsDiscount}</span>
                  </div>
                )}

                {/* Final Total */}
                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-serif text-sm font-bold text-stone-900 block">Total Amount to Pay</span>
                    <span className="text-[10px] text-stone-400">Inclusive of all bakery taxes & GST</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#065f46] tabular-nums">₹{total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TRUST & SATISFACTION BADGES */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2.5 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>100% On-Time Delivery Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Temperature-controlled insulated van transit</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Zero card storage; official RBI tokenization gateway</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ================= RAZORPAY GATEWAY SANDBOX / TEST MODE MODAL ================= */}
      {razorpaySandboxModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95 border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#881337]">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>RAZORPAY GATEWAY SIMULATION</span>
              </div>
              <button
                type="button"
                onClick={() => setRazorpaySandboxModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sandbox Notice */}
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-left text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>[TEST / DEMO MODE] Razorpay Payment Simulation</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong>DEMO TRANSACTION:</strong> This is a secure development test sandbox. No real bank account or credit card will be charged. Real payments activate when live Razorpay API keys are configured in environment variables.
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID:</span>
                <span className="font-mono font-bold text-stone-800">{razorpaySandboxModal.pendingOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Gateway Order:</span>
                <span className="font-mono text-stone-600 text-[11px]">{razorpaySandboxModal.razorpayOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Channel:</span>
                <span className="font-bold text-stone-800">{razorpaySandboxModal.paymentCategory}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm">
                <span className="font-bold text-stone-700">Amount to Pay:</span>
                <span className="font-black text-[#065f46]">₹{razorpaySandboxModal.amountInr}</span>
              </div>
            </div>

            {razorpaySandboxModal.error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{razorpaySandboxModal.error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={razorpaySandboxModal.loading}
                onClick={() => handleSandboxConfirm(false)}
                className="w-full py-3 px-4 rounded-xl bg-[#065f46] hover:bg-[#047857] disabled:opacity-60 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                {razorpaySandboxModal.loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Signature with Server...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate Successful Payment (₹{razorpaySandboxModal.amountInr})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={razorpaySandboxModal.loading}
                onClick={() => handleSandboxConfirm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-60 text-stone-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Simulate Payment Failure / Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
