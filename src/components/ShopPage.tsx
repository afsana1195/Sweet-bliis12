import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Heart, ShoppingBag, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { CakeProduct, CAKE_CATEGORIES } from '../data/bakeryData.ts';

interface ShopPageProps {
  products: CakeProduct[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (
    product: CakeProduct,
    sizeLabel?: string,
    weightKg?: number,
    isEggless?: boolean,
    cakeMessage?: string,
    flavour?: string,
    quantity?: number,
    calculatedPrice?: number,
    variantName?: string
  ) => void;
  selectedOccasion?: string;
  onSelectOccasion?: (occ: string) => void;
  onSelectProduct: (product: CakeProduct) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  selectedOccasion: propSelectedOccasion,
  onSelectOccasion: propOnSelectOccasion,
  searchQuery,
  onSearchChange,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}) => {
  const [internalOccasion, setInternalOccasion] = useState<string>('all');
  const selectedOccasion = propSelectedOccasion !== undefined ? propSelectedOccasion : internalOccasion;
  const setSelectedOccasion = (occ: string) => {
    if (propOnSelectOccasion) {
      propOnSelectOccasion(occ);
    } else {
      setInternalOccasion(occ);
    }
  };

  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [egglessOnly, setEgglessOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  // Pagination State - 8 products per page creates 6 to 7 pages of cakes!
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  // Dynamic selection maps for cards
  const [sizeIndexMap, setSizeIndexMap] = useState<Record<string, number>>({});
  const [variantIndexMap, setVariantIndexMap] = useState<Record<string, number>>({});

  const occasions = [
    { id: 'Friendship Day', label: '👫 Friendship Day (फ्रेंडशिप डे)' },
    { id: "Mother's Day", label: "💐 Mother's Day (मदर्स डे)" },
    { id: 'Independence Day', label: '🇮🇳 Independence Day (इंडिपेंडेंस डे)' },
    { id: "Father's Day", label: "🎩 Father's Day (फादर्स डे)" },
    { id: 'Raksha Bandhan', label: '🪔 Raksha Bandhan (रक्षा बंधन)' },
    { id: 'Festival', label: '✨ Festive & Holidays (त्योहार)' },
    { id: 'Birthday', label: '🎂 Birthday Cakes (जन्मदिन)' },
    { id: 'Anniversary', label: '💍 Anniversary & Romance (सालगिरह)' },
    { id: 'Romantic', label: '💖 Romance & Valentine (रोमांस)' },
    { id: 'Kids', label: '🦄 Kids & Cartoon (बच्चों के लिए)' },
    { id: "Teacher's Day", label: "🎓 Teacher's Day (शिक्षक दिवस)" },
    { id: 'Baby Shower', label: '🍼 Baby Shower' },
    { id: 'Wedding', label: '💒 Grand Wedding (विवाह)' },
    { id: 'Celebration', label: '🎉 Special Celebrations' },
  ];

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedOccasion, searchQuery, egglessOnly, maxPrice, sortBy]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        // Occasion filter
        if (
          selectedOccasion !== 'all' &&
          !p.occasions.some((o) => o.toLowerCase() === selectedOccasion.toLowerCase())
        ) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            p.name.toLowerCase().includes(q) ||
            p.tagline.toLowerCase().includes(q) ||
            p.categoryLabel.toLowerCase().includes(q) ||
            p.flavours.some((f) => f.toLowerCase().includes(q)) ||
            p.occasions.some((o) => o.toLowerCase().includes(q)) ||
            (p.productVariants && p.productVariants.some((v) => v.name.toLowerCase().includes(q)));
          if (!matches) return false;
        }
        // Price slider
        if (p.price > maxPrice) return false;
        // Eggless
        if (egglessOnly && !p.isEggless) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0; // featured default
      });
  }, [products, selectedCategory, selectedOccasion, searchQuery, maxPrice, egglessOnly, sortBy]);

  // Total pages and sliced products for current page
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCardAddToCart = (p: CakeProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.productVariants && p.productVariants.length > 0) {
      const vIdx = variantIndexMap[p.id] ?? 0;
      const v = p.productVariants[vIdx] || p.productVariants[0];
      onAddToCart(
        p,
        v.name,
        0.08,
        p.isEggless,
        '',
        v.name,
        1,
        v.price,
        v.name
      );
    } else if (p.sizes && p.sizes.length > 0) {
      const sIdx = sizeIndexMap[p.id] ?? 0;
      const s = p.sizes[sIdx] || p.sizes[0];
      const calcPrice = Math.round(p.price * s.priceMultiplier);
      onAddToCart(
        p,
        s.label,
        s.weightKg,
        p.isEggless,
        '',
        p.flavours[0] || 'Classic',
        1,
        calcPrice
      );
    } else {
      onAddToCart(p);
    }
  };

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9F1239] mb-1">
            Artisan Bakery Menu
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#881337]">
            All Cakes & Artisan Confections
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            Explore our complete collection: 18+ celebration cakes, French croissants, gourmet donuts, pastries, cookies, and luxury gift hampers.
          </p>
        </div>

        {/* Categories Bar (Segmented button tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            All Collections ({products.length})
          </button>
          {CAKE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#881337] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-rose-50 border border-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Secondary Filters & Search Bar Row */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs mb-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full lg:max-w-xs">
            <input
              type="text"
              placeholder="Search cakes, variants, flavours..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          </div>

          {/* Occasions Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto">
            <span className="text-xs font-semibold text-stone-500 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Occasions:
            </span>
            <button
              onClick={() => setSelectedOccasion('all')}
              className={`px-3 py-1.5 text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedOccasion === 'all'
                  ? 'bg-[#881337] text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 bg-stone-50'
              }`}
            >
              All Occasions
            </button>
            {occasions.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasion(occ.id)}
                className={`px-3 py-1.5 text-xs rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedOccasion === occ.id
                    ? 'bg-[#881337] text-white font-bold shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100 bg-stone-50'
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>

          {/* Eggless Switch & Sort Dropdown */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={egglessOnly}
                onChange={(e) => setEgglessOnly(e.target.checked)}
                className="w-4 h-4 accent-[#881337] rounded"
              />
              <span>100% Eggless Only</span>
            </label>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-400"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count Banner & Scroll Anchor */}
        <div ref={gridTopRef} className="flex items-center justify-between text-xs text-stone-500 mb-6 scroll-mt-24">
          <span>
            Showing <strong className="text-stone-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> of <strong className="text-stone-800">{filteredProducts.length}</strong> items in collection
            {totalPages > 1 && (
              <span className="ml-2 font-medium text-[#881337] bg-rose-50 px-2 py-0.5 rounded-full">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </span>
          {(selectedCategory !== 'all' || selectedOccasion !== 'all' || searchQuery || egglessOnly) && (
            <button
              onClick={() => {
                onSelectCategory('all');
                setSelectedOccasion('all');
                onSearchChange('');
                setEgglessOnly(false);
              }}
              className="text-[#9F1239] font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-rose-100 p-8">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-800 mb-2">No items match your criteria</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
              Try modifying your search or filters, or tell Chef Bliss AI what you are looking for!
            </p>
            <button
              onClick={() => {
                onSelectCategory('all');
                setSelectedOccasion('all');
                onSearchChange('');
              }}
              className="px-5 py-2.5 rounded-full bg-[#881337] text-white text-xs font-semibold cursor-pointer"
            >
              Show All Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((p) => {
              const isWishlisted = wishlist.includes(p.id);

              // Variant calculation
              const hasVariants = Boolean(p.productVariants && p.productVariants.length > 0);
              const vIdx = variantIndexMap[p.id] ?? 0;
              const selectedVar = hasVariants && p.productVariants ? p.productVariants[vIdx] : null;

              // Size calculation
              const sIdx = sizeIndexMap[p.id] ?? 0;
              const selectedSz = p.sizes && p.sizes[sIdx] ? p.sizes[sIdx] : p.sizes[0];

              const currentPrice = selectedVar
                ? selectedVar.price
                : Math.round(p.price * (selectedSz?.priceMultiplier ?? 1.0));

              return (
                <div
                  key={p.id}
                  className="group flex flex-col bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image Container */}
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden bg-rose-50 cursor-pointer"
                    onClick={() => onSelectProduct(p)}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />

                    {p.badge && (
                      <div className="absolute top-3 left-3 bg-[#881337] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        {p.badge}
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(p.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-white shadow-xs transition-transform active:scale-90 cursor-pointer"
                      aria-label="Wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isWishlisted ? 'fill-[#9F1239] text-[#9F1239]' : 'text-stone-500 hover:text-[#9F1239]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-1.5">
                        <span className="text-amber-500 text-[11px]">★★★★★</span>
                        <span className="font-semibold text-stone-800">{p.rating}</span>
                        <span className="text-stone-400">({p.reviewsCount})</span>
                      </div>

                      <h3
                        onClick={() => onSelectProduct(p)}
                        className="font-serif text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#881337] transition-colors cursor-pointer leading-snug line-clamp-1"
                      >
                        {p.name}
                      </h3>

                      <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                        {p.tagline}
                      </p>

                      {/* Variant Selection Pills (for Croissants and Donuts) */}
                      {hasVariants && p.productVariants && (
                        <div className="flex items-center gap-1.5 my-3 flex-wrap">
                          {p.productVariants.map((v, idx) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVariantIndexMap((prev) => ({ ...prev, [p.id]: idx }));
                              }}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                vIdx === idx
                                  ? 'bg-[#881337] text-white shadow-2xs'
                                  : 'bg-rose-50/80 text-stone-700 hover:bg-rose-100'
                              }`}
                            >
                              {v.name.replace(' Croissant', '')}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Size Selection Pills (for Cakes) */}
                      {!hasVariants && p.sizes && p.sizes.length > 1 && (
                        <div className="flex items-center gap-1.5 my-3">
                          {p.sizes.map((s, idx) => {
                            const shortLabel = s.label.split(' ')[0] + ' ' + s.label.split(' ')[1];
                            return (
                              <button
                                key={s.label}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSizeIndexMap((prev) => ({ ...prev, [p.id]: idx }));
                                }}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                  sIdx === idx
                                    ? 'bg-[#881337] text-white shadow-2xs'
                                    : 'bg-rose-50/80 text-stone-700 hover:bg-rose-100'
                                  }`}
                              >
                                {shortLabel}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-lg sm:text-xl font-bold text-[#881337] tabular-nums">
                          ₹{currentPrice}
                        </span>
                        {p.originalPrice && !hasVariants && sIdx === 0 && (
                          <span className="text-xs sm:text-sm text-stone-400 line-through tabular-nums">
                            ₹{p.originalPrice}
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 ml-auto">
                          {selectedVar ? selectedVar.name : selectedSz ? selectedSz.label.split(' ')[0] + ' ' + selectedSz.label.split(' ')[1] : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-2">
                      <button
                        onClick={(e) => handleCardAddToCart(p, e)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation Bar */}
        {filteredProducts.length > 0 && totalPages > 1 && (
          <div className="mt-12 pt-8 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
              <span>
                Showing <strong className="text-stone-900 font-semibold">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}</strong>–<strong className="text-stone-900 font-semibold">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> of <strong className="text-stone-900 font-semibold">{filteredProducts.length}</strong> items
              </span>
              <span className="text-stone-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 cursor-pointer focus:outline-none focus:border-rose-400"
                >
                  <option value={8}>8 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={16}>16 per page</option>
                  <option value={24}>24 per page</option>
                </select>
              </div>
            </div>

            {/* Page number buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous Page"
                className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === 1
                    ? 'border-stone-200 text-stone-300 cursor-not-allowed bg-stone-50'
                    : 'border-rose-200 text-stone-700 hover:bg-rose-50 hover:text-[#881337] active:scale-95'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Numbered page buttons with intelligent windowing */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .reduce<(number | string)[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                    acc.push(`ellipsis-${page}`);
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item) => {
                  if (typeof item === 'string') {
                    return (
                      <span key={item} className="px-1.5 text-stone-400 text-xs font-bold">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = item === currentPage;
                  return (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item)}
                      className={`min-w-9 h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#881337] text-white shadow-xs'
                          : 'border border-rose-100 text-stone-700 hover:bg-rose-50 hover:text-[#881337]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
                className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === totalPages
                    ? 'border-stone-200 text-stone-300 cursor-not-allowed bg-stone-50'
                    : 'border-rose-200 text-stone-700 hover:bg-rose-50 hover:text-[#881337] active:scale-95'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
