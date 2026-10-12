import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, MessageCircle, Check, Clock, AlertCircle } from 'lucide-react';
import { CakeProduct, STANDARD_CAKE_SIZES, ProductVariant } from '../data/bakeryData.ts';
import { getProductWhatsAppUrl } from '../utils/whatsapp.ts';

interface ProductDetailModalProps {
  product: CakeProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: CakeProduct,
    sizeLabel: string,
    weightKg: number,
    isEggless: boolean,
    cakeMessage: string,
    flavour: string,
    quantity: number,
    calculatedPrice: number,
    variantName?: string
  ) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const sizes = product?.sizes && product.sizes.length > 0 ? product.sizes : STANDARD_CAKE_SIZES;
  const hasVariants = Boolean(product?.productVariants && product.productVariants.length > 0);

  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants && product?.productVariants ? product.productVariants[0] : null
  );
  const [isEggless, setIsEggless] = useState(product?.isEggless ?? true);
  const [selectedFlavour, setSelectedFlavour] = useState(product?.flavours?.[0] || 'Classic');
  const [cakeMessage, setCakeMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSizeIndex(0);
      setSelectedVariant(hasVariants && product.productVariants ? product.productVariants[0] : null);
      setIsEggless(product.isEggless ?? true);
      setSelectedFlavour(product.flavours?.[0] || 'Classic');
      setCakeMessage('');
      setQuantity(1);
      setAddedSuccess(false);
    }
  }, [product, hasVariants]);

  if (!isOpen || !product) return null;

  const selectedSize = sizes[selectedSizeIndex] || sizes[0];
  const unitPrice = selectedVariant
    ? selectedVariant.price
    : Math.round(product.price * selectedSize.priceMultiplier);
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onAddToCart(
      product,
      selectedVariant ? selectedVariant.name : selectedSize.label,
      selectedSize.weightKg,
      isEggless,
      cakeMessage,
      selectedFlavour,
      quantity,
      unitPrice,
      selectedVariant?.name
    );
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-rose-100 my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 flex items-center justify-center shadow-md transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image & Badges */}
          <div className="relative bg-[#FFF2F5] min-h-[340px] md:min-h-full flex flex-col justify-between p-6">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md bg-white">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />

              {product.badge && (
                <div className="absolute top-3 left-3 bg-[#881337] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                  {product.badge}
                </div>
              )}

              <button
                onClick={() => onToggleWishlist(product.id)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center text-rose-500 hover:text-rose-700 shadow-xs cursor-pointer transition-transform active:scale-90"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#9F1239] text-[#9F1239]' : ''}`} />
              </button>
            </div>

            {/* Preparation time & Chef commitment */}
            <div className="mt-4 pt-4 border-t border-rose-200/60 flex items-center justify-between text-xs text-stone-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-[#9F1239]" />
                <span>Bakes fresh in {product.prepTimeHours} hrs</span>
              </div>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                Same-Day Available
              </span>
            </div>
          </div>

          {/* Right Column: Customization & Purchase Options */}
          <div className="p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
            <div className="space-y-5">
              {/* Category & Ratings */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-[#9F1239]">
                  {product.categoryLabel}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium">
                  <span className="text-amber-500">★★★★★</span>
                  <span>{product.rating}</span>
                  <span className="text-stone-400">({product.reviewsCount} reviews)</span>
                </div>
              </div>

              {/* Title & Tagline */}
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337]">
                  {product.name}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
                  {product.tagline}
                </p>
              </div>

              {/* Price display */}
              <div className="flex items-baseline gap-3 p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
                <span className="text-2xl sm:text-3xl font-bold text-[#881337] tabular-nums">
                  ₹{unitPrice}
                </span>
                {product.originalPrice && !selectedVariant && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    ₹{Math.round(product.originalPrice * selectedSize.priceMultiplier)}
                  </span>
                )}
                <span className="text-xs text-stone-600 ml-auto font-medium">
                  {selectedVariant ? selectedVariant.name : `for ${selectedSize.label}`}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {product.description}
              </p>

              {/* Variant Selector (For Croissant, Donuts, etc.) */}
              {hasVariants && product.productVariants && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Choose Variety / Flavour:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {product.productVariants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedVariant?.id === v.id
                            ? 'border-[#881337] bg-rose-50 text-[#881337] shadow-xs ring-1 ring-rose-300'
                            : 'border-stone-200 hover:border-rose-300 text-stone-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{v.name}</div>
                        <div className="text-xs font-bold text-[#881337] mt-0.5">₹{v.price}</div>
                        {v.description && (
                          <div className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                            {v.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector for Cakes and other multi-size items */}
              {!hasVariants && product.sizes && product.sizes.length > 1 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Select Weight / Serving Size:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((s, idx) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setSelectedSizeIndex(idx)}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                          selectedSizeIndex === idx
                            ? 'border-[#881337] bg-rose-50 text-[#881337] shadow-2xs ring-1 ring-rose-300'
                            : 'border-stone-200 hover:border-rose-300 text-stone-700'
                        }`}
                      >
                        <span className="block font-bold">{s.label.split(' ')[0]} {s.label.split(' ')[1]}</span>
                        <span className="text-[11px] font-normal text-stone-500 block">
                          ₹{Math.round(product.price * s.priceMultiplier)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Flavour Selector if applicable */}
              {!hasVariants && product.flavours.length > 1 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Cake Flavour:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.flavours.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSelectedFlavour(f)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          selectedFlavour === f
                            ? 'bg-[#881337] text-white border-[#881337]'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Option: Eggless toggle for cakes */}
              {product.category === 'cakes' && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isEggless ? 'border-emerald-600' : 'border-amber-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${isEggless ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-800">
                        {isEggless ? '100% Eggless Pure Veg' : 'Contains Egg'}
                      </span>
                      <span className="text-[11px] text-stone-500 block">Freshly baked in separate pans</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEggless(!isEggless)}
                    className="text-xs font-semibold text-[#881337] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Message on Cake (for cakes only) */}
              {product.category === 'cakes' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Message on Cake (Free):
                  </label>
                  <input
                    type="text"
                    maxLength={35}
                    value={cakeMessage}
                    onChange={(e) => setCakeMessage(e.target.value)}
                    placeholder="e.g. Happy Birthday Sarah! ♡"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block text-right">
                    {cakeMessage.length}/35 characters
                  </span>
                </div>
              )}

              {/* Ingredients & Allergens preview */}
              <div className="pt-1 text-[11px] text-stone-500 space-y-1">
                <p>
                  <strong className="text-stone-700">Key Ingredients:</strong> {product.ingredients.join(', ')}
                </p>
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Allergens: {product.allergens.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls: Quantity + Add to Cart + WhatsApp Order */}
            <div className="pt-6 mt-6 border-t border-rose-100 space-y-3">
              <div className="flex items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="w-9 text-center text-xs font-bold text-stone-800 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addedSuccess}
                  className={`flex-1 py-3 px-5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#881337] hover:bg-[#9F1239] text-white active:scale-98'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart • ₹{totalPrice}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Order Directly on WhatsApp Button */}
              <a
                href={getProductWhatsAppUrl(
                  selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
                  totalPrice,
                  selectedVariant ? selectedVariant.name : selectedSize.label,
                  isEggless,
                  cakeMessage
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Order on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
