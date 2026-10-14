import React, { useState } from 'react';
import { Heart, ShoppingBag, ArrowRight, Sparkles, Check } from 'lucide-react';
import { CakeProduct, ProductVariant } from '../data/bakeryData.ts';

interface FeaturedCollectionProps {
  products: CakeProduct[];
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
  onSelectProduct: (product: CakeProduct) => void;
  onViewCategory?: (category: string) => void;
  onViewAll?: () => void;
}

export const FeaturedCollection: React.FC<FeaturedCollectionProps> = ({
  products,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onViewCategory,
  onViewAll,
}) => {
  const handleNavCategory = (catId: string) => {
    if (onViewCategory) {
      onViewCategory(catId);
    } else if (onViewAll) {
      onViewAll();
    }
  };
  // Filter products by category
  const allCakes = products.filter((p) => p.category === 'cakes');
  const croissantProduct = products.find((p) => p.id === 'croissant-single-main');
  const donutsProduct = products.find((p) => p.id === 'donuts-single-main');
  const pastries = products.filter((p) => p.category === 'pastries');
  const cupcakes = products.filter((p) => p.category === 'cupcakes');
  const cookiesAndBrownies = products.filter((p) => p.category === 'cookies' || p.category === 'brownies');
  const breads = products.filter((p) => p.category === 'breads');
  const giftHampers = products.filter((p) => p.category === 'gift-hampers');

  // Cakes show all toggle or display full multi-row grid
  const [showAllCakes, setShowAllCakes] = useState(false);
  const displayedCakes = showAllCakes ? allCakes : allCakes.slice(0, 8);

  // Dynamic state for Croissant single card
  const [croissantVariant, setCroissantVariant] = useState<ProductVariant>(
    croissantProduct?.productVariants?.[0] || { id: 'croissant-plain', name: 'Plain Croissant', price: 120 }
  );
  const [croissantQty, setCroissantQty] = useState(1);
  const [croissantAdded, setCroissantAdded] = useState(false);

  // Dynamic state for Donuts single card
  const [donutVariant, setDonutVariant] = useState<ProductVariant>(
    donutsProduct?.productVariants?.[0] || { id: 'donut-classic', name: 'Classic', price: 90 }
  );
  const [donutQty, setDonutQty] = useState(1);
  const [donutAdded, setDonutAdded] = useState(false);

  // Dynamic size selections for cake cards: mapping product.id -> sizeIndex
  const [cakeSizeIndexMap, setCakeSizeIndexMap] = useState<Record<string, number>>({});

  const handleSelectCakeSize = (cakeId: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCakeSizeIndexMap((prev) => ({ ...prev, [cakeId]: idx }));
  };

  const handleCakeAddToCart = (cake: CakeProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    const sizeIdx = cakeSizeIndexMap[cake.id] ?? 0;
    const size = cake.sizes[sizeIdx] || cake.sizes[0];
    const calculatedPrice = Math.round(cake.price * size.priceMultiplier);

    onAddToCart(
      cake,
      size.label,
      size.weightKg,
      cake.isEggless,
      '',
      cake.flavours[0] || 'Classic',
      1,
      calculatedPrice
    );
  };

  return (
    <div className="space-y-16 py-12 bg-white w-full max-w-full overflow-hidden">
      {/* =========================================================================
          1. MAIN CAKES COLLECTION (Prominent Multi-Row Product Section)
      ========================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-serif font-semibold text-[#9F1239] mb-1">
              <span>♥</span>
              <span>Our Signature Cake Collection</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#881337] tracking-tight">
              Cakes for Every Occasion
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 font-normal max-w-2xl">
              From our famous Belgian Chocolate Truffle and Red Velvet to handcrafted Ferrero Rocher and Biscoff cakes, all baked fresh in 500g, 1kg, and 2kg sizes.
            </p>
          </div>

          <button
            onClick={() => handleNavCategory('cakes')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#881337] hover:text-[#9F1239] hover:underline cursor-pointer transition-colors self-start md:self-auto"
          >
            <span>View All ({allCakes.length}) Cakes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-Row Cake Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedCakes.map((cake) => {
            const isWishlisted = wishlist.includes(cake.id);
            const sizeIdx = cakeSizeIndexMap[cake.id] ?? 0;
            const currentSize = cake.sizes[sizeIdx] || cake.sizes[0];
            const currentPrice = Math.round(cake.price * currentSize.priceMultiplier);

            return (
              <div
                key={cake.id}
                className="group flex flex-col bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image Container with Badges */}
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden bg-rose-50 cursor-pointer"
                  onClick={() => onSelectProduct(cake)}
                >
                  <img
                    src={cake.image}
                    alt={cake.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />

                  {cake.badge && (
                    <div className="absolute top-3 left-3 bg-[#881337] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                      {cake.badge}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(cake.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-white shadow-xs transition-transform active:scale-90 cursor-pointer"
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isWishlisted ? 'fill-[#9F1239] text-[#9F1239]' : 'text-stone-500 hover:text-[#9F1239]'
                      }`}
                    />
                  </button>
                </div>

                {/* Card Details */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-1.5">
                      <span className="text-amber-500 text-[11px]">★★★★★</span>
                      <span className="font-semibold text-stone-800">{cake.rating}</span>
                      <span className="text-stone-400">({cake.reviewsCount})</span>
                    </div>

                    <h3
                      onClick={() => onSelectProduct(cake)}
                      className="font-serif text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#881337] transition-colors cursor-pointer leading-snug line-clamp-1"
                    >
                      {cake.name}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                      {cake.tagline}
                    </p>

                    {/* Size Selector Pills (500g, 1kg, 2kg with dynamic pricing) */}
                    <div className="flex items-center gap-1.5 my-3">
                      {cake.sizes.map((s, idx) => {
                        const shortLabel = s.label.split(' ')[0] + ' ' + s.label.split(' ')[1];
                        const isSelected = sizeIdx === idx;
                        return (
                          <button
                            key={s.label}
                            type="button"
                            onClick={(e) => handleSelectCakeSize(cake.id, idx, e)}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#881337] text-white shadow-2xs'
                                : 'bg-rose-50/80 text-stone-700 hover:bg-rose-100'
                            }`}
                          >
                            {shortLabel}
                          </button>
                        );
                      })}
                    </div>

                    {/* Price with Dynamic Size Multiplier */}
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg sm:text-xl font-bold text-[#881337] tabular-nums">
                        ₹{currentPrice}
                      </span>
                      {cake.originalPrice && sizeIdx === 0 && (
                        <span className="text-xs sm:text-sm text-stone-400 line-through tabular-nums">
                          ₹{cake.originalPrice}
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400 ml-auto font-medium">
                        {currentSize.label.split(' ')[0]} {currentSize.label.split(' ')[1]}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="mt-4 pt-2">
                    <button
                      onClick={(e) => handleCakeAddToCart(cake, e)}
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

        {/* Expand / View All Cakes Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => setShowAllCakes(!showAllCakes)}
            className="px-8 py-3 rounded-full bg-rose-50 hover:bg-rose-100 text-[#881337] border border-rose-200 text-xs sm:text-sm font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{showAllCakes ? 'Show Less Cakes' : `Explore All ${allCakes.length} Cakes`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          2. CROISSANTS & DONUTS SECTION (Exactly ONE Card Each with Variants)
      ========================================================================== */}
      <section className="bg-gradient-to-b from-[#FFF5F8] to-[#FFF9F9] py-14 border-y border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239] block mb-1">
              Fresh Daily Bakes
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#881337]">
              Artisan Croissants & Gourmet Donuts
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Handcrafted in small batches every morning. Choose your favourite variety and quantity below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ONE CARD ONLY: Croissant */}
            {croissantProduct && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-rose-50 mb-4 cursor-pointer" onClick={() => onSelectProduct(croissantProduct)}>
                    <img
                      src={croissantProduct.image}
                      alt={croissantProduct.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#881337] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                      Single Card • 3 Varieties
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif text-2xl font-bold text-[#881337] cursor-pointer" onClick={() => onSelectProduct(croissantProduct)}>
                      {croissantProduct.name}
                    </h3>
                    <span className="text-xs font-bold text-amber-500">★★★★★ 4.9 (142)</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                    Authentic French all-butter lamination with flaky golden crust and tender honeycomb interior.
                  </p>

                  {/* Selectable Variants: Plain, Chocolate, Almond */}
                  <div className="space-y-2 mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Choose Your Croissant Variety:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {croissantProduct.productVariants?.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setCroissantVariant(v)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            croissantVariant.id === v.id
                              ? 'border-[#881337] bg-rose-50 text-[#881337] ring-1 ring-rose-300 font-bold'
                              : 'border-stone-200 hover:border-rose-300 text-stone-700'
                          }`}
                        >
                          <div className="text-xs">{v.name.replace(' Croissant', '')}</div>
                          <div className="text-xs font-bold text-[#881337] mt-0.5">₹{v.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price, Quantity & Add to Cart */}
                <div className="pt-4 border-t border-rose-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Total Price:</span>
                    <span className="text-xl font-bold text-[#881337] tabular-nums">
                      ₹{croissantVariant.price * croissantQty}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => setCroissantQty(Math.max(1, croissantQty - 1))}
                        className="w-7 h-7 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-xs font-bold tabular-nums text-stone-800">
                        {croissantQty}
                      </span>
                      <button
                        onClick={() => setCroissantQty(croissantQty + 1)}
                        className="w-7 h-7 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart(
                          croissantProduct,
                          croissantVariant.name,
                          0.08,
                          false,
                          '',
                          croissantVariant.name,
                          croissantQty,
                          croissantVariant.price,
                          croissantVariant.name
                        );
                        setCroissantAdded(true);
                        setTimeout(() => setCroissantAdded(false), 1200);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      {croissantAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                      <span>{croissantAdded ? 'Added!' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ONE CARD ONLY: Donuts */}
            {donutsProduct && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-rose-50 mb-4 cursor-pointer" onClick={() => onSelectProduct(donutsProduct)}>
                    <img
                      src={donutsProduct.image}
                      alt={donutsProduct.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#881337] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                      Single Card • 3 Varieties
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif text-2xl font-bold text-[#881337] cursor-pointer" onClick={() => onSelectProduct(donutsProduct)}>
                      {donutsProduct.name}
                    </h3>
                    <span className="text-xs font-bold text-amber-500">★★★★★ 4.8 (128)</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                    Slow-proofed fluffy brioche donuts dipped in Belgian chocolate, vanilla bean, and real strawberry glazes.
                  </p>

                  {/* Selectable Variants: Classic, Chocolate, Strawberry */}
                  <div className="space-y-2 mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Choose Your Donut Glaze:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {donutsProduct.productVariants?.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setDonutVariant(v)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            donutVariant.id === v.id
                              ? 'border-[#881337] bg-rose-50 text-[#881337] ring-1 ring-rose-300 font-bold'
                              : 'border-stone-200 hover:border-rose-300 text-stone-700'
                          }`}
                        >
                          <div className="text-xs">{v.name}</div>
                          <div className="text-xs font-bold text-[#881337] mt-0.5">₹{v.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price, Quantity & Add to Cart */}
                <div className="pt-4 border-t border-rose-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Total Price:</span>
                    <span className="text-xl font-bold text-[#881337] tabular-nums">
                      ₹{donutVariant.price * donutQty}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => setDonutQty(Math.max(1, donutQty - 1))}
                        className="w-7 h-7 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-xs font-bold tabular-nums text-stone-800">
                        {donutQty}
                      </span>
                      <button
                        onClick={() => setDonutQty(donutQty + 1)}
                        className="w-7 h-7 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart(
                          donutsProduct,
                          donutVariant.name,
                          0.07,
                          true,
                          '',
                          donutVariant.name,
                          donutQty,
                          donutVariant.price,
                          donutVariant.name
                        );
                        setDonutAdded(true);
                        setTimeout(() => setDonutAdded(false), 1200);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      {donutAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                      <span>{donutAdded ? 'Added!' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FRENCH PASTRIES & SLICES SECTION (6 Items)
      ========================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239] block mb-1">
              Patisserie Showcase
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#881337]">
              Individual Pastry Slices
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Chocolate, Black Forest, Strawberry, Blueberry Cheesecake, Fruit, and Tiramisu Pastries.
            </p>
          </div>
          <button
            onClick={() => handleNavCategory('pastries')}
            className="text-xs sm:text-sm font-semibold text-[#881337] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Pastries</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {pastries.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-rose-100 p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              <div className="cursor-pointer" onClick={() => onSelectProduct(item)}>
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-rose-50 mb-2.5">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#881337] line-clamp-1">
                  {item.name}
                </h4>
                <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{item.tagline}</p>
                <div className="text-xs font-bold text-[#881337] mt-1 tabular-nums">₹{item.price}</div>
              </div>

              <button
                onClick={() => onAddToCart(item)}
                className="mt-3 w-full py-1.5 rounded-lg bg-rose-50 hover:bg-[#881337] text-[#881337] hover:text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          4. CUPCAKES, COOKIES & BROWNIES SECTION
      ========================================================================== */}
      <section className="bg-[#FFF9F9] py-12 border-t border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Cupcakes Row */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239] block mb-1">
                  Petite Delights
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337]">
                  Gourmet Cupcakes
                </h2>
              </div>
              <button
                onClick={() => handleNavCategory('cupcakes')}
                className="text-xs sm:text-sm font-semibold text-[#881337] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Cupcakes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {cupcakes.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-rose-100 p-4 flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="cursor-pointer" onClick={() => onSelectProduct(item)}>
                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-rose-50 mb-3">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <h4 className="font-serif text-sm font-bold text-stone-900 group-hover:text-[#881337] line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{item.tagline}</p>
                    <div className="text-xs font-bold text-[#881337] mt-1 tabular-nums">₹{item.price}</div>
                  </div>

                  <button
                    onClick={() => onAddToCart(item)}
                    className="mt-3 w-full py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cookies & Brownies Row */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239] block mb-1">
                  Crunchy & Fudgy
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337]">
                  Cookies & Fudgy Brownies
                </h2>
              </div>
              <button
                onClick={() => handleNavCategory('cookies')}
                className="text-xs sm:text-sm font-semibold text-[#881337] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Cookies & Brownies</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {cookiesAndBrownies.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-rose-100 p-4 flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="cursor-pointer" onClick={() => onSelectProduct(item)}>
                    <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-rose-50 mb-3">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#9F1239] tracking-wider">{item.categoryLabel}</span>
                    <h4 className="font-serif text-sm font-bold text-stone-900 group-hover:text-[#881337] line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{item.tagline}</p>
                    <div className="text-xs font-bold text-[#881337] mt-1.5 tabular-nums">₹{item.price}</div>
                  </div>

                  <button
                    onClick={() => onAddToCart(item)}
                    className="mt-3 w-full py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. ARTISAN BREADS & GIFT HAMPERS SECTION
      ========================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Daily Fresh Breads */}
          <div className="bg-[#FFFDFD] rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239]">Slow-Fermented</span>
                <h3 className="font-serif text-2xl font-bold text-[#881337]">Daily Artisan Breads</h3>
              </div>
              <button
                onClick={() => handleNavCategory('breads')}
                className="text-xs font-semibold text-[#881337] hover:underline cursor-pointer"
              >
                View Breads →
              </button>
            </div>

            <div className="space-y-3">
              {breads.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-rose-50 hover:border-rose-200 bg-white transition-colors"
                >
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectProduct(b)}>
                    <img src={b.image} alt={b.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">{b.name}</h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{b.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-xs text-[#881337]">₹{b.price}</span>
                    <button
                      onClick={() => onAddToCart(b)}
                      className="px-3 py-1.5 rounded-lg bg-[#881337] text-white text-xs font-semibold hover:bg-[#9F1239] cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Luxury Gift Hampers */}
          <div className="bg-[#FFFDFD] rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#9F1239]">Keepsake Boxes</span>
                <h3 className="font-serif text-2xl font-bold text-[#881337]">Festive Gift Hampers</h3>
              </div>
              <button
                onClick={() => handleNavCategory('gift-hampers')}
                className="text-xs font-semibold text-[#881337] hover:underline cursor-pointer"
              >
                View Hampers →
              </button>
            </div>

            <div className="space-y-3">
              {giftHampers.slice(0, 3).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-rose-50 hover:border-rose-200 bg-white transition-colors"
                >
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectProduct(h)}>
                    <img src={h.image} alt={h.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">{h.name}</h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{h.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-xs text-[#881337]">₹{h.price}</span>
                    <button
                      onClick={() => onAddToCart(h)}
                      className="px-3 py-1.5 rounded-lg bg-[#881337] text-white text-xs font-semibold hover:bg-[#9F1239] cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
