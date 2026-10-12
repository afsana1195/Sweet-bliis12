import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CAKE_CATEGORIES, CakeCategory } from '../data/bakeryData.ts';

interface CategoryCardsProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({ onSelectCategory }) => {
  return (
    <section className="py-10 bg-white border-b border-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239] block mb-1">
              Explore Our Delights
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337]">
              Bakery Category Shortcuts
            </h2>
          </div>
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs sm:text-sm font-semibold text-[#881337] hover:text-[#9F1239] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-3.5">
          {CAKE_CATEGORIES.map((cat: CakeCategory) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group flex flex-col items-center bg-[#FFF2F5] hover:bg-[#FFE6EC] border border-rose-100 hover:border-rose-300 rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer text-center focus:outline-none"
            >
              {/* Circular Cake Category Image with frame */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-2 border-2 border-white shadow-xs group-hover:scale-105 transition-transform duration-300 bg-white">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>

              {/* Category Name */}
              <h3 className="font-semibold text-xs text-stone-900 group-hover:text-[#881337] transition-colors leading-tight mb-2 truncate max-w-full">
                {cat.name}
              </h3>

              {/* Circular Arrow Action Icon */}
              <div className="w-6 h-6 rounded-full bg-[#881337] group-hover:bg-[#9F1239] text-white flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-xs mt-auto">
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
