import React, { useState } from 'react';
import { Search, ShoppingBag, User, Menu, X, Heart, Sparkles, MessageCircle, BarChart3 } from 'lucide-react';
import { PageRoute } from '../types.ts';
import { CakeProduct, BUSINESS_CONFIG } from '../data/bakeryData.ts';
import { getWhatsAppInquiryUrl } from '../utils/whatsapp.ts';

interface NavbarProps {
  currentRoute: PageRoute;
  onRouteChange: (route: PageRoute) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  onOpenSearch: () => void;
  onOpenAiAssistant: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProduct: (product: CakeProduct) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onRouteChange,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
  onOpenSearch,
  onOpenAiAssistant,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route: PageRoute) => {
    onRouteChange(route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFF9F9]/95 backdrop-blur-md border-b border-[#FCE7F3] shadow-xs transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-[#881337] text-white text-xs py-1.5 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-4">
        <span>✨ Freshly Baked Daily • Free Delivery on orders over ₹999</span>
        <span className="hidden md:inline text-rose-300">•</span>
        <a
          href={getWhatsAppInquiryUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1 text-rose-200 hover:text-white underline underline-offset-2 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Quick WhatsApp Order: +91 {BUSINESS_CONFIG.phone}</span>
        </a>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 border border-rose-300/80 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-[#9F1239]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a5 5 0 0 0-5 5c0 2.5 2 4.5 5 4.5s5-2 5-4.5a5 5 0 0 0-5-5z" />
              <path d="M12 11.5c-4.5 0-8 3-8 7.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1c0-4.5-3.5-7.5-8-7.5z" />
              <path d="M12 7v2" />
              <circle cx="12" cy="5" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <span className="font-serif text-2xl sm:text-[26px] font-bold text-[#881337] tracking-tight leading-none block">
              Sweet Bliss
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-rose-700/80 mt-0.5 block">
              CAKES • PASTRIES • HAPPINESS
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-700">
          <button
            onClick={() => handleNav('home')}
            className={`transition-colors hover:text-[#9F1239] cursor-pointer ${
              currentRoute === 'home' ? 'text-[#881337] font-semibold underline underline-offset-8 decoration-2 decoration-rose-400' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('shop')}
            className={`transition-colors hover:text-[#9F1239] cursor-pointer ${
              currentRoute === 'shop' ? 'text-[#881337] font-semibold underline underline-offset-8 decoration-2 decoration-rose-400' : ''
            }`}
          >
            Cakes
          </button>
          <button
            onClick={() => handleNav('custom-order')}
            className={`transition-colors hover:text-[#9F1239] cursor-pointer flex items-center gap-1.5 ${
              currentRoute === 'custom-order' ? 'text-[#881337] font-semibold underline underline-offset-8 decoration-2 decoration-rose-400' : ''
            }`}
          >
            <span>Custom Cakes</span>
            <span className="bg-rose-100 text-[#9F1239] text-[10px] font-bold px-1.5 py-0.5 rounded-full">Bespoke</span>
          </button>
          <button
            onClick={() => handleNav('shop')}
            className="transition-colors hover:text-[#9F1239] cursor-pointer"
          >
            Snacks
          </button>
          <button
            onClick={() => handleNav('track-order')}
            className={`transition-colors hover:text-[#9F1239] cursor-pointer flex items-center gap-1.5 ${
              currentRoute === 'track-order' ? 'text-[#881337] font-semibold underline underline-offset-8 decoration-2 decoration-rose-400' : ''
            }`}
          >
            <span>Track Order</span>
            <span className="flex items-center gap-1 bg-rose-100 text-[#9F1239] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </button>
          <button
            onClick={() => handleNav('about')}
            className={`transition-colors hover:text-[#9F1239] cursor-pointer ${
              currentRoute === 'about' ? 'text-[#881337] font-semibold underline underline-offset-8 decoration-2 decoration-rose-400' : ''
            }`}
          >
            About
          </button>
          <button
            onClick={() => handleNav('contact')}
            className={`transition-colors hover:text-[#9F1239] cursor-pointer ${
              currentRoute === 'contact' ? 'text-[#881337] font-semibold underline underline-offset-8 decoration-2 decoration-rose-400' : ''
            }`}
          >
            Contact
          </button>
          <button
            onClick={() => handleNav('admin')}
            className={`transition-colors hover:text-[#9F1239] cursor-pointer flex items-center gap-1.5 ${
              currentRoute === 'admin' ? 'text-[#881337] font-semibold underline underline-offset-8 decoration-2 decoration-rose-400' : ''
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#881337]" />
            <span>Dashboard</span>
            <span className="bg-rose-100 text-[#9F1239] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              Admin
            </span>
          </button>
        </nav>

        {/* Search Bar (Matching Reference Mockup) */}
        <div className="hidden md:flex items-center relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search cakes, flavours..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              if (currentRoute !== 'shop') {
                onRouteChange('shop');
              }
            }}
            className="w-full pl-4 pr-10 py-2 text-xs rounded-full bg-white border border-rose-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 shadow-2xs transition-all placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={onOpenSearch}
            className="absolute right-3 text-rose-500 hover:text-rose-700 cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions: Dashboard, AI Assistant, Wishlist, Account, Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dashboard Button */}
          <button
            onClick={() => handleNav('admin')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all shadow-2xs cursor-pointer group ${
              currentRoute === 'admin'
                ? 'bg-[#881337] text-white border-[#881337] shadow-sm'
                : 'bg-rose-100/70 hover:bg-rose-200/90 text-[#881337] border-rose-300/80'
            }`}
            title="Store Performance Dashboard & Live Analytics"
          >
            <BarChart3 className="w-3.5 h-3.5 text-rose-700 group-hover:scale-110 transition-transform" />
            <span className="font-bold">Dashboard</span>
            <span className="hidden sm:inline bg-white/80 text-[#881337] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              Live
            </span>
          </button>

          {/* AI Cake Assistant Pill Button */}
          <button
            onClick={onOpenAiAssistant}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-rose-50 to-pink-100 text-[#881337] border border-rose-200 hover:bg-rose-100 transition-all shadow-2xs cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-600 group-hover:rotate-12 transition-transform" />
            <span>AI Assistant</span>
          </button>

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="p-2 text-stone-600 hover:text-[#9F1239] hover:bg-rose-50 rounded-full transition-colors relative cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Account */}
          <button
            onClick={onOpenAccount}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-[#9F1239] hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
            aria-label="Account"
          >
            <User className="w-4.5 h-4.5 text-stone-600" />
            <span className="hidden lg:inline">Account</span>
          </button>

          {/* Shopping Cart (with exact item count badge like the reference mockup) */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-full bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-[#881337] transition-all cursor-pointer shadow-2xs"
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-[#881337]" />
              <span className="absolute -top-1.5 -right-2 bg-[#9F1239] text-white text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            </div>
            <span className="hidden md:inline text-xs font-semibold">Cart</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-700 hover:text-stone-900 lg:hidden rounded-lg hover:bg-rose-50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-rose-100 bg-[#FFF9F9] px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {/* Mobile Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search cakes, flavours..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 text-sm rounded-full bg-white border border-rose-200 focus:outline-none focus:border-rose-400"
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-rose-500" />
          </div>

          <nav className="flex flex-col gap-2 pt-2 text-base font-medium text-stone-800">
            <button
              onClick={() => handleNav('home')}
              className="text-left px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNav('shop')}
              className="text-left px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              All Cakes / Shop
            </button>
            <button
              onClick={() => handleNav('custom-order')}
              className="text-left px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors flex items-center justify-between"
            >
              <span>Custom Cake Order</span>
              <span className="bg-rose-200/60 text-[#881337] text-xs font-semibold px-2 py-0.5 rounded-full">
                Bespoke
              </span>
            </button>
            <button
              onClick={() => handleNav('track-order')}
              className="text-left px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors flex items-center justify-between"
            >
              <span>Track My Order</span>
              <span className="bg-rose-100 text-[#881337] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Live Status
              </span>
            </button>
            <button
              onClick={() => handleNav('about')}
              className="text-left px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              About Us
            </button>
            <button
              onClick={() => handleNav('contact')}
              className="text-left px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Contact & Store Hours
            </button>
            <button
              onClick={() => handleNav('admin')}
              className={`text-left px-3.5 py-2.5 rounded-xl font-bold flex items-center justify-between transition-colors shadow-2xs ${
                currentRoute === 'admin'
                  ? 'bg-[#881337] text-white'
                  : 'bg-rose-100 text-[#881337] hover:bg-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-current" />
                <span className="text-sm">Store Performance Dashboard</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentRoute === 'admin' ? 'bg-white text-[#881337]' : 'bg-[#881337] text-white'
              }`}>
                Admin & Reports
              </span>
            </button>
            <button
              onClick={() => {
                onOpenAiAssistant();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2.5 rounded-lg bg-rose-50 text-[#881337] font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span>Ask AI Cake Assistant</span>
            </button>
            <button
              onClick={() => {
                onOpenAccount();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4 text-stone-600" />
              <span>My Account & Orders</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
