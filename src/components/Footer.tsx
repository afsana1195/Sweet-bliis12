import React, { useState } from 'react';
import { PageRoute, CustomerUser } from '../types.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';
import { getWhatsAppInquiryUrl } from '../utils/whatsapp.ts';
import {
  MessageCircle,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Send,
  CheckCircle,
  Check,
  Gift,
  Tag,
  Copy,
  User,
  ShieldCheck
} from 'lucide-react';

interface FooterProps {
  onRouteChange: (route: PageRoute) => void;
  onSelectCategory: (cat: string) => void;
  currentUser?: CustomerUser | null;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onRouteChange,
  onSelectCategory,
  currentUser,
  onOpenAuth,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(() => {
    try {
      return localStorage.getItem('sb_newsletter_subscribed') === 'true';
    } catch {
      return false;
    }
  });
  const [promoCode, setPromoCode] = useState(() => {
    try {
      return localStorage.getItem('sb_vip_promo') || 'SWEETBLISS10';
    } catch {
      return 'SWEETBLISS10';
    }
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNav = (route: PageRoute) => {
    onRouteChange(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com)');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      const code = data.promoCode || 'SWEETBLISS10';
      setPromoCode(code);
      setSuccessMessage(data.message || 'You have successfully joined the Sweet Bliss VIP Club!');
      setIsSubmitted(true);

      try {
        localStorage.setItem('sb_newsletter_subscribed', 'true');
        localStorage.setItem('sb_vip_promo', code);
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to sign up right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    const code = promoCode || 'SWEETBLISS10';
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <footer className="bg-[#210D13] text-stone-200 pt-14 pb-12 border-t border-rose-950 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Signup Banner (Collect Customer Emails for Promotions) */}
        <div className="mb-14 rounded-3xl bg-gradient-to-br from-[#2D0F19] via-[#38111E] to-[#260B14] border border-rose-800/60 p-6 sm:p-9 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Bakery Ambient Glows */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-900/60 border border-rose-700/60 text-rose-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span>Sweet Bliss VIP Club & Promotions</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                Unlock 10% Off Your Next Artisan Cake
              </h3>

              <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed font-normal">
                Join 4,200+ pastry lovers in Hyderabad! Get secret holiday flash discounts, weekly fresh bake notifications, complimentary birthday treats, and custom celebration cake concepts delivered to your inbox.
              </p>

              {/* Promotional Highlights / Trust Perks */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1.5 text-xs text-rose-200">
                <span className="inline-flex items-center gap-1.5 bg-rose-900/40 border border-rose-700/50 px-2.5 py-1 rounded-full">
                  <Tag className="w-3.5 h-3.5 text-rose-300" />
                  <span className="font-medium">Instant 10% Off Promo Code</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-rose-900/40 border border-rose-700/50 px-2.5 py-1 rounded-full">
                  <Gift className="w-3.5 h-3.5 text-rose-300" />
                  <span className="font-medium">Free Birthday Cupcake</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-rose-900/40 border border-rose-700/50 px-2.5 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">Zero Spam • 1-Click Unsubscribe</span>
                </span>
              </div>
            </div>

            {/* Right Signup Form Column */}
            <div className="lg:col-span-5 w-full">
              {isSubmitted ? (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-[#0e271a] border border-emerald-500/50 text-emerald-100 space-y-3 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-white">
                        You're on the VIP List! 🎉
                      </h4>
                      <p className="text-[11px] sm:text-xs text-emerald-300/90">
                        {successMessage || 'Exclusive promo code unlocked for your celebration.'}
                      </p>
                    </div>
                  </div>

                  {/* Promo Code Card */}
                  <div className="bg-black/50 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                        Your 10% Promotion Code
                      </span>
                      <span className="font-mono font-extrabold text-base sm:text-lg text-white tracking-widest">
                        {promoCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-white" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-300 leading-normal">
                    💡 Apply this code at checkout or mention it when ordering directly on WhatsApp to redeem your 10% discount.
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="text-[11px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
                  >
                    Subscribe with a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                    <div className="relative flex-1 min-w-0">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your email for promotions..."
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-full bg-white/10 hover:bg-white/15 border border-rose-700/60 text-white placeholder:text-stone-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30 transition-all backdrop-blur-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-[#9F1239] hover:from-rose-500 hover:to-[#881337] text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {loading ? (
                        <span>Subscribing...</span>
                      ) : (
                        <>
                          <span>Claim 10% Off</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="bg-rose-900/60 border border-rose-600/60 rounded-xl px-3 py-2 text-xs text-rose-200 animate-in fade-in duration-200">
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
                    <span>🔒 100% secure. We never share your email.</span>
                    <span className="text-rose-400/80 font-medium hidden sm:inline">Delivered bi-weekly</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-rose-900/40">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-900/60 border border-rose-700/60 flex items-center justify-center text-rose-300">
                <svg
                  className="w-5 h-5 fill-none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2a5 5 0 0 0-5 5c0 2.5 2 4.5 5 4.5s5-2 5-4.5a5 5 0 0 0-5-5z" />
                  <path d="M12 11.5c-4.5 0-8 3-8 7.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1c0-4.5-3.5-7.5-8-7.5z" />
                </svg>
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-white tracking-tight leading-none block">
                  Sweet Bliss
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-rose-300/80 block mt-0.5">
                  CAKES • PASTRIES • HAPPINESS
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 max-w-sm leading-relaxed">
              Hyderabad’s premier artisan cake patisserie. Every creation is hand-baked with pure dairy butter, 55% Belgian chocolate, and fresh organic flowers for life’s sweetest memories.
            </p>

            <div className="pt-2">
              <a
                href={getWhatsAppInquiryUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-stone-900 font-semibold text-xs transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp: {BUSINESS_CONFIG.phone}</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-300">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-rose-300 transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop')} className="hover:text-rose-300 transition-colors cursor-pointer">
                  All Cakes / Shop
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('custom-order')} className="hover:text-rose-300 transition-colors cursor-pointer text-rose-300 font-medium">
                  Custom Cake Order
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-rose-300 transition-colors cursor-pointer">
                  About Our Bakery
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('track-order')} className="hover:text-rose-300 transition-colors cursor-pointer text-rose-300 font-medium">
                  Track My Order (6 Stages)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('contact')} className="hover:text-rose-300 transition-colors cursor-pointer">
                  Contact & Orders
                </button>
              </li>
              <li>
                {currentUser ? (
                  <button
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth('login');
                    }}
                    className="hover:text-rose-300 transition-colors cursor-pointer text-emerald-300 font-medium flex items-center gap-1.5"
                  >
                    <span>👤 My Account ({currentUser.name.split(' ')[0]})</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-200">
                    <User className="w-3.5 h-3.5 text-rose-300" />
                    <button
                      onClick={() => onOpenAuth && onOpenAuth('login')}
                      className="hover:text-white transition-colors cursor-pointer underline font-medium"
                    >
                      Customer Login
                    </button>
                    <span className="text-stone-500">/</span>
                    <button
                      onClick={() => onOpenAuth && onOpenAuth('signup')}
                      className="hover:text-white transition-colors cursor-pointer underline font-medium"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </li>
              <li>
                <button
                  onClick={() => handleNav('admin')}
                  className="hover:text-rose-300 transition-colors cursor-pointer text-amber-300 font-semibold flex items-center gap-1.5"
                >
                  <span>📊 Store Dashboard & Reports</span>
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full border border-amber-400/30">
                    Admin
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Cake Collections */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Collections
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-300">
              <li>
                <button onClick={() => { onSelectCategory('theme-cakes'); handleNav('shop'); }} className="hover:text-rose-300 transition-colors cursor-pointer">
                  Theme Cakes
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('flower-cakes'); handleNav('shop'); }} className="hover:text-rose-300 transition-colors cursor-pointer">
                  Flower Cakes
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('photo-cakes'); handleNav('shop'); }} className="hover:text-rose-300 transition-colors cursor-pointer">
                  Photo Cakes
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('cupcakes'); handleNav('shop'); }} className="hover:text-rose-300 transition-colors cursor-pointer">
                  Gourmet Cupcakes
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('cheesecakes'); handleNav('shop'); }} className="hover:text-rose-300 transition-colors cursor-pointer">
                  Cheesecakes
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCategory('gift-hampers'); handleNav('shop'); }} className="hover:text-rose-300 transition-colors cursor-pointer">
                  Luxury Gift Hampers
                </button>
              </li>
            </ul>
          </div>

          {/* Store Location & Timings */}
          <div className="space-y-3 text-xs sm:text-sm text-stone-300">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Store Info & Compliance
            </h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{BUSINESS_CONFIG.address}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{BUSINESS_CONFIG.bakingHours}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-rose-400 shrink-0" />
              <span>+91 {BUSINESS_CONFIG.phone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{BUSINESS_CONFIG.email}</span>
            </div>
            <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 space-y-1">
              <div className="flex items-center gap-1.5 text-stone-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold">FSSAI Status:</span>
                <span className="text-amber-300/90">{BUSINESS_CONFIG.fssaiLicence}</span>
              </div>
              <p className="text-[10px] text-stone-400">
                GSTIN: <span className="text-stone-300">{BUSINESS_CONFIG.gstin}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Policies and Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} Sweet Bliss Bakery. Handcrafted with love.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => handleNav('privacy')} className="hover:text-rose-300 transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <button onClick={() => handleNav('terms')} className="hover:text-rose-300 transition-colors cursor-pointer">
              Terms & Conditions
            </button>
            <button
              onClick={() => handleNav('admin')}
              className="hover:text-amber-300 text-stone-300 transition-colors cursor-pointer font-semibold flex items-center gap-1"
            >
              <span>📊 Store Dashboard (Admin)</span>
            </button>
            <span className="flex items-center gap-1 text-rose-300">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>in Bangalore, Karnataka</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
