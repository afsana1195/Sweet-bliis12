import React from 'react';

export const TrustBadgesStrip: React.FC = () => {
  return (
    <div className="bg-[#FFF5F8] border-y border-rose-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Badge 1: 100% Fresh Ingredients */}
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-rose-200/60 flex items-center justify-center text-[#881337] shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">100% Fresh</p>
              <p className="text-[11px] text-stone-600">Pure Ingredients</p>
            </div>
          </div>

          {/* Badge 2: Custom Cake Designs */}
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-rose-200/60 flex items-center justify-center text-[#881337] shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">Custom Cake</p>
              <p className="text-[11px] text-stone-600">Bespoke Designs</p>
            </div>
          </div>

          {/* Badge 3: Same Day Delivery */}
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-rose-200/60 flex items-center justify-center text-[#881337] shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h3l3 4v4h-2m-8 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">Same Day</p>
              <p className="text-[11px] text-stone-600">Express Delivery</p>
            </div>
          </div>

          {/* Badge 4: Safe & Secure Ordering */}
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-rose-200/60 flex items-center justify-center text-[#881337] shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">Safe & Secure</p>
              <p className="text-[11px] text-stone-600">Guaranteed Hygiene</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
