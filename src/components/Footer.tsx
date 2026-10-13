import React from 'react';
import { PageRoute } from '../types.ts';
import { BUSINESS_CONFIG } from '../data/bakeryData.ts';
import { getWhatsAppInquiryUrl } from '../utils/whatsapp.ts';
import { MessageCircle, Heart, Phone, Mail, MapPin, Clock } from 'lucide-react';

interface FooterProps {
  onRouteChange: (route: PageRoute) => void;
  onSelectCategory: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onRouteChange, onSelectCategory }) => {
  const handleNav = (route: PageRoute) => {
    onRouteChange(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#210D13] text-stone-200 pt-16 pb-12 border-t border-rose-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Store Info
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
              <span>{BUSINESS_CONFIG.phone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{BUSINESS_CONFIG.email}</span>
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
              <span>in Hyderabad</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
