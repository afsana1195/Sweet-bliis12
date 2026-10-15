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
      id: 'Friendship Day',
      title: 'Friendship Day',
      hindi: 'फ्रेंडशिप डे',
      image: '/src/assets/images/friendship_day_cake_1792011234884.jpg',
      subtitle: 'Best Friend Bond',
      badge: 'Popular',
    },
    {
      id: "Mother's Day",
      title: "Mother's Day",
      hindi: 'मदर्स डे',
      image: '/src/assets/images/mothers_day_cake_1792011271760.jpg',
      subtitle: 'Purest Love & Gratitude',
      badge: 'Special',
    },
    {
      id: 'Independence Day',
      title: 'Independence Day',
      hindi: 'इंडिपेंडेंस डे',
      image: '/src/assets/images/independence_day_cake_1792011306276.jpg',
      subtitle: 'Tricolor Celebration',
      badge: 'Patriotic',
    },
    {
      id: "Father's Day",
      title: "Father's Day",
      hindi: 'फादर्स डे',
      image: '/src/assets/images/fathers_day_cake_1792011335601.jpg',
      subtitle: 'Gentleman & Hero',
      badge: 'Gourmet',
    },
    {
      id: 'Raksha Bandhan',
      title: 'Raksha Bandhan',
      hindi: 'रक्षा बंधन',
      image: '/src/assets/images/rakhi_sibling_cake_1792027051753.jpg',
      subtitle: 'Sweet Sibling Bond',
      badge: 'Festive',
    },
    {
      id: 'Birthday',
      title: 'Birthday Cakes',
      hindi: 'जन्मदिन उत्सव',
      image: '/src/assets/images/hero_celebration_cake_1791732956087.jpg',
      subtitle: 'Festive & Whimsical',
      badge: 'Bestseller',
    },
  ];

  return (
    <section className="py-12 bg-white w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#FFF0F4] via-[#FFF6F8] to-[#FFF0F4] border border-rose-200/70 p-6 sm:p-10 flex flex-col items-center justify-between gap-8">
          {/* Header: Headline & Explore Button */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9F1239] bg-rose-100/80 px-3 py-1 rounded-full">
                Occasional Specials & Festivities
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#881337] leading-tight mt-1">
                Make Every Special Day Sweeter
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-normal">
                Curated designer cakes for Friendship Day, Mother's Day, Independence Day, Festivals & Milestones.
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={onExploreCollection}
                className="px-6 py-3 rounded-full bg-[#881337] hover:bg-[#9F1239] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer group"
              >
                <span>View All Occasions</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Occasion Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full">
            {occasions.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectOccasion(item.id)}
                className="group flex flex-col items-center bg-white hover:bg-rose-50/70 rounded-2xl p-3 sm:p-4 border border-rose-100 hover:border-rose-300 shadow-2xs hover:shadow-md transition-all cursor-pointer text-center relative overflow-hidden"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-rose-100 shrink-0 mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div className="w-full">
                  <h3 className="font-serif text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#881337] transition-colors leading-snug line-clamp-1">
                    {item.title}
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-[#9F1239] font-medium block">
                    {item.hindi}
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal line-clamp-1 mt-0.5">
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
