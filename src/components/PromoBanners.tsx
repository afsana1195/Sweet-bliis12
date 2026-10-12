import React from 'react';
import { ArrowRight, Sparkles, Heart } from 'lucide-react';

interface PromoBannersProps {
  onStartCustomOrder: () => void;
  onOpenAiAssistant: () => void;
}

export const PromoBanners: React.FC<PromoBannersProps> = ({
  onStartCustomOrder,
  onOpenAiAssistant,
}) => {
  return (
    <section className="py-10 bg-[#FFF9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Banner 1: Custom Cake Order */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFE8EE] via-[#FFF0F4] to-[#FFF5F8] border border-rose-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
            {/* Background decorative swirl */}
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-rose-200/40 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="max-w-xs sm:max-w-sm space-y-3">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9F1239] bg-rose-200/60 px-2.5 py-0.5 rounded-full">
                  <span>Bespoke Creation</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337] leading-tight">
                  Custom Cake Order
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                  Tell us your idea, we'll create a perfect cake for your special moment.
                </p>

                <div className="pt-2">
                  <button
                    onClick={onStartCustomOrder}
                    className="px-5 py-2.5 rounded-full bg-[#881337] hover:bg-[#9F1239] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer group"
                  >
                    <span>Start Custom Order</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Artisan Cake Visual */}
              <div className="relative shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                <img
                  src="/src/assets/images/custom_cake_artisan_1791733249561.jpg"
                  alt="Custom Cake Decorating"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Banner 2: AI Cake Assistant */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F5EEFF] via-[#FDF2F8] to-[#FFF5F8] border border-pink-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
            {/* Background glow */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-purple-200/30 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="max-w-xs sm:max-w-sm space-y-3">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Smart Recommender</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337] leading-tight flex items-center gap-2">
                  <span>AI Cake Assistant</span>
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-300 stroke-1 inline" />
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                  Get personalised cake recommendations based on your occasion, budget and taste.
                </p>

                <div className="pt-2">
                  <button
                    onClick={onOpenAiAssistant}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-rose-50 text-[#881337] border-2 border-[#881337] text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer group"
                  >
                    <span>Chat with AI Assistant</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Cute Baker Robot Mascot Visual */}
              <div className="relative shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-purple-50">
                <img
                  src="/src/assets/images/ai_baker_assistant_1791733180129.jpg"
                  alt="Sweet Bliss AI Baker Mascot"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
