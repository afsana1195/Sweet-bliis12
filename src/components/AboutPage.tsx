import React from 'react';
import { Sparkles, Heart, Award, ShieldCheck, Clock, Users } from 'lucide-react';
import { PageRoute } from '../types.ts';

interface AboutPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#FFF9F9] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="flex justify-center mb-1">
            <img
              src="/assets/aistudio/file_0000000061b481f4ab617a424b614604_7c5ac529.png"
              alt="Sweet Bliss Artisan Bakery Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-rose-200 bg-white object-contain p-1 shadow-md hover:scale-105 transition-transform"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9F1239] bg-rose-100/70 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Our Baking Philosophy</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#881337] tracking-tight">
            Crafting Happiness in Every Slice
          </h1>
          <p className="text-sm sm:text-base text-stone-600 font-normal leading-relaxed">
            Founded with a passion for luxury confectionery, Sweet Bliss transforms life's milestones into unforgettable sensory celebrations.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-rose-100 shadow-sm">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#881337]">
              From an Artisan Kitchen to Life’s Grand Stages
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Sweet Bliss by Chef Jyoti Tanti was established in Bangalore (Karnataka) with a singular, unwavering mission: to eliminate artificial premixes and factory shortcuts from celebration cakes. Every creation begins with certified pure European dairy butter, 55% Belgian single-origin chocolate, and organic Tahitian vanilla pods.
            </p>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Our team of master pastry chefs and floral designers meticulously handcraft every tier, delicate lace ruffle, and sugar bloom. Whether you require a whimsical 1st birthday drip cake or a 5-tier royal wedding masterpiece, each confection is baked fresh to order on the day of delivery.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-[#881337]">
              <span>✓ 100% Eggless Pure Veg Dedicated Facility</span>
              <span>✓ Zero Preservatives</span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-rose-100 shadow-md aspect-square bg-rose-50">
            <img
              src="/src/assets/images/custom_cake_artisan_1791733249561.jpg"
              alt="Artisan Pastry Chef at Sweet Bliss"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 4 Pillars of Excellence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-rose-100 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">Belgian Cocoa & Dairy</h3>
            <p className="text-xs text-stone-500">Uncompromising quality with authentic Callebaut chocolate and fresh farm dairy.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-rose-100 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">Custom Sculpting</h3>
            <p className="text-xs text-stone-500">Bespoke fondant artistry, real garden roses, and edible wafer-paper flowers.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-rose-100 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">Same-Day Express</h3>
            <p className="text-xs text-stone-500">Freshly baked and refrigerated delivery right in time for your midnight surprise.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-rose-100 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">AI Cake Assistant</h3>
            <p className="text-xs text-stone-500">Intelligent size, portion, and flavour guidance powered by Google Gemini.</p>
          </div>
        </div>

        {/* CTA banner */}
        <div className="bg-gradient-to-r from-[#881337] to-[#9F1239] rounded-3xl p-8 sm:p-10 text-white text-center space-y-4 shadow-lg">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">Ready to Sweeten Your Celebration?</h2>
          <p className="text-xs sm:text-sm text-rose-100 max-w-xl mx-auto">
            Browse our curated collections or design a one-of-a-kind custom cake with our head pastry chef.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => onNavigate('shop')}
              className="px-6 py-3 rounded-full bg-white text-[#881337] font-semibold text-xs sm:text-sm shadow-md hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Explore Cake Menu
            </button>
            <button
              onClick={() => onNavigate('custom-order')}
              className="px-6 py-3 rounded-full bg-rose-900/60 hover:bg-rose-900 border border-white/30 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Start Custom Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
