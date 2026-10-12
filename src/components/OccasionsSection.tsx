import React from 'react';
import { ArrowRight } from 'lucide-react';

interface OccasionsSectionProps {
  onSelectOccasion: (occasion: string) => void;
  onExploreCollection: () => void;
}

export const OccasionsSection: React.FC<OccasionsSectionProps> = ({
  onSelectOccasion,
  onExploreCollection,
}) => {
  const occasions = [
    {
      id: 'Birthday',
      title: 'Birthday Cakes',
      image: '/src/assets/images/hero_celebration_cake_1791732956087.jpg',
      subtitle: 'Festive & Whimsical',
    },
    {
      id: 'Anniversary',
      title: 'Anniversary Cakes',
      image: '/src/assets/images/featured_red_velvet_1791733088519.jpg',
      subtitle: 'Romantic & Floral',
    },
    {
      id: 'Wedding',
      title: 'Wedding Cakes',
      image: '/src/assets/images/category_flower_cakes_1791732982830.jpg',
      subtitle: 'Grand & Tiered',
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#FFF0F4] via-[#FFF6F8] to-[#FFF0F4] border border-rose-200/70 p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Side: Headline & Explore Button */}
          <div className="max-w-md text-center lg:text-left space-y-3">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#881337] leading-tight">
              Make Every Occasion Sweeter
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-normal">
              Beautiful cakes for birthdays, anniversaries, weddings and more.
            </p>
            <div className="pt-2">
              <button
                onClick={onExploreCollection}
                className="px-6 py-3 rounded-full bg-[#881337] hover:bg-[#9F1239] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer group"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Side: 3 Occasion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
            {occasions.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectOccasion(item.id)}
                className="group flex sm:flex-col items-center bg-white hover:bg-rose-50/60 rounded-2xl p-3 sm:p-4 border border-rose-100 hover:border-rose-300 shadow-2xs hover:shadow-md transition-all cursor-pointer text-left sm:text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-rose-100 shrink-0 mb-0 sm:mb-2 mr-3 sm:mr-0 group-hover:scale-105 transition-transform">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 group-hover:text-[#881337] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {item.subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
