import React from 'react';
import { ArrowRight, Sparkles, Heart } from 'lucide-react';
import { getWhatsAppInquiryUrl } from '../utils/whatsapp.ts';

interface HeroSectionProps {
  onExploreCakes: () => void;
  onCustomCake: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreCakes }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF5F7] via-[#FFF9F9] to-white pt-8 pb-14 md:py-16 lg:py-20">
      {/* Decorative floral pastel circles */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-96 h-96 bg-pink-100/40 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline, Copy, 4 Features, CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Brand Kicker */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#9F1239] bg-rose-100/70 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Sweet Bliss Patisserie</span>
            </div>

            {/* Main Headline with Heart */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#881337] font-bold tracking-tight leading-[1.12]">
              Life is Sweeter <br />
              <span className="inline-flex items-center gap-2 sm:gap-3">
                With Cake
                <span className="inline-block relative">
                  <Heart
                    className="w-8 h-8 sm:w-11 sm:h-11 text-rose-500 fill-rose-100 stroke-[2] -rotate-12 transition-transform hover:scale-110"
                    aria-hidden="true"
                  />
                </span>
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Artisan cakes for every celebration, crafted with love and the finest ingredients.
            </p>

            {/* 4 Feature Icons in a Neat Row (Exact match to reference mockup) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 py-2 border-y border-rose-100/80">
              {/* Feature 1: Freshly Baked */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left group">
                <div className="w-10 h-10 rounded-full bg-rose-100/80 flex items-center justify-center text-[#9F1239] mb-1.5 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-stone-800 leading-tight">Freshly</span>
                <span className="text-[11px] sm:text-xs text-stone-500">Baked</span>
              </div>

              {/* Feature 2: Premium Quality */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left group">
                <div className="w-10 h-10 rounded-full bg-rose-100/80 flex items-center justify-center text-[#9F1239] mb-1.5 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-stone-800 leading-tight">Premium</span>
                <span className="text-[11px] sm:text-xs text-stone-500">Quality</span>
              </div>

              {/* Feature 3: Custom Designs */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left group">
                <div className="w-10 h-10 rounded-full bg-rose-100/80 flex items-center justify-center text-[#9F1239] mb-1.5 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-stone-800 leading-tight">Custom</span>
                <span className="text-[11px] sm:text-xs text-stone-500">Designs</span>
              </div>

              {/* Feature 4: Home Delivery */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left group">
                <div className="w-10 h-10 rounded-full bg-rose-100/80 flex items-center justify-center text-[#9F1239] mb-1.5 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h3l3 4v4h-2m-8 0h6" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-stone-800 leading-tight">Home</span>
                <span className="text-[11px] sm:text-xs text-stone-500">Delivery</span>
              </div>
            </div>

            {/* Primary Action Buttons: Explore Cakes & Order on WhatsApp */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {/* Explore Cakes Button */}
              <button
                onClick={onExploreCakes}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#881337] hover:bg-[#9F1239] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Explore Cakes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Order on WhatsApp Button */}
              <a
                href={getWhatsAppInquiryUrl('Hello Sweet Bliss! 🎂 I would like to order a fresh artisan cake.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-rose-50 text-[#881337] border-2 border-[#881337] text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
                <span>Order on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Celebration Cake Image (Prominent & Pristine) */}
          <div className="lg:col-span-6 relative flex justify-center">
            {/* Background glowing halo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-200/50 via-pink-100/30 to-amber-100/40 rounded-3xl blur-2xl -z-10 scale-95" />

            <div className="relative rounded-3xl p-3 sm:p-4 bg-white/80 backdrop-blur-xs border border-rose-100 shadow-xl max-w-lg w-full group">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-rose-50">
                <img
                  src="/src/assets/images/hero_celebration_cake_1791732956087.jpg"
                  alt="Sweet Bliss Signature Happy Birthday Pastel Rose Cake"
                  className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                {/* Subtle bottom gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                {/* Floating Best Seller Badge */}
                <div className="absolute top-4 left-4 bg-[#881337] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Masterpiece Collection</span>
                </div>

                {/* Floating Rating Pill */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-800 shadow-md flex items-center gap-1.5 border border-rose-100">
                  <span className="text-amber-500">★★★★★</span>
                  <span>4.9 (64 reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
