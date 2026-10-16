import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  MessageCircle,
  Check,
  Clock,
  AlertCircle,
  Star,
  ThumbsUp,
  Plus,
  Sparkles,
  Award,
  CheckCircle2,
  Filter,
  MessageSquare,
  ArrowLeft,
  Share2,
  Copy
} from 'lucide-react';
import { CakeProduct, STANDARD_CAKE_SIZES, ProductVariant } from '../data/bakeryData.ts';
import { getProductWhatsAppUrl } from '../utils/whatsapp.ts';
import { getProductReviews, saveProductReview, CustomerReview } from '../data/productReviews.ts';
import { updateProductMetaTags } from '../utils/seo.ts';

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

const RATING_DESCRIPTIONS = [
  '',
  '1 - Needs improvement',
  '2 - Fair, could be better',
  '3 - Good, enjoyed it',
  '4 - Delicious & very fresh',
  '5 - Extraordinary! Pure bliss 🍰',
];

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

  const [activeTab, setActiveTab] = useState<'customise' | 'reviews'>('customise');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants && product?.productVariants ? product.productVariants[0] : null
  );
  const [isEggless, setIsEggless] = useState(product?.isEggless ?? true);
  const [selectedFlavour, setSelectedFlavour] = useState(product?.flavours?.[0] || 'Classic');
  const [cakeMessage, setCakeMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | '5' | '4' | 'birthday' | 'eggless'>('all');
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newAuthor, setNewAuthor] = useState('');
  const [newLocation, setNewLocation] = useState('Bangalore');
  const [newOccasion, setNewOccasion] = useState('Birthday Celebration');
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamically update product SEO meta tags (title, description, OpenGraph, Twitter, and Schema.org JSON-LD)
  useEffect(() => {
    if (isOpen && product) {
      updateProductMetaTags(product);
    }
    return () => {
      updateProductMetaTags(null);
    };
  }, [isOpen, product]);

  const handleShareProduct = async () => {
    if (!product) return;
    const shareUrl = `${window.location.origin}/?product=${encodeURIComponent(product.id)}`;
    const shareData = {
      title: `${product.name} – ₹${product.price} | Sweet Bliss by Jyoti Tanti`,
      text: `Order fresh ${product.name} (₹${product.price}) handcrafted by Chef Jyoti Tanti in Bangalore (562162). 100% Eggless available with free delivery!`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard if user cancels or API errors
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  useEffect(() => {
    if (product) {
      setSelectedSizeIndex(0);
      setSelectedVariant(hasVariants && product.productVariants ? product.productVariants[0] : null);
      setIsEggless(product.isEggless ?? true);
      setSelectedFlavour(product.flavours?.[0] || 'Classic');
      setCakeMessage('');
      setQuantity(1);
      setAddedSuccess(false);
      setActiveTab('customise');
      setIsWritingReview(false);
      setReviews(getProductReviews(product));
    }
  }, [product, hasVariants]);

  if (!isOpen || !product) return null;

  const selectedSize = sizes[selectedSizeIndex] || sizes[0];
  const unitPrice = selectedVariant
    ? selectedVariant.price
    : Math.round(product.price * selectedSize.priceMultiplier);
  const totalPrice = unitPrice * quantity;

  // Review calculations
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : (product.rating || 4.8);

  const starCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const getStarPercent = (star: 5 | 4 | 3 | 2 | 1) => {
    if (reviews.length === 0) return star === 5 ? 85 : star === 4 ? 15 : 0;
    return Math.round((starCounts[star] / reviews.length) * 100);
  };

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === '5') return r.rating === 5;
    if (reviewFilter === '4') return r.rating === 4;
    if (reviewFilter === 'birthday') return r.occasion.toLowerCase().includes('birthday');
    if (reviewFilter === 'eggless') {
      return (r.purchasedSize || '').toLowerCase().includes('eggless') || (r.comment || '').toLowerCase().includes('eggless');
    }
    return true;
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product) return;
    setSubmittingReview(true);

    const updated = saveProductReview(product, {
      author: newAuthor.trim() || 'Sweet Bliss Patron',
      location: newLocation.trim() || 'Hyderabad, Telangana',
      rating: newReviewRating,
      occasion: newOccasion,
      title: newTitle.trim() || 'Celebration Cake Review',
      comment: newComment.trim(),
      purchasedSize: selectedVariant ? selectedVariant.name : selectedSize.label,
    });

    setReviews(updated);
    setSubmittingReview(false);
    setReviewSuccessMsg(true);
    setNewComment('');
    setNewTitle('');
    setIsWritingReview(false);
    setTimeout(() => setReviewSuccessMsg(false), 3500);
  };

  const handleHelpfulVote = (reviewId: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
  };

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-rose-100 my-6 sm:my-8">
        {/* Top actions: Share button & Close button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleShareProduct}
            className="h-10 px-3.5 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-[#881337] flex items-center gap-1.5 shadow-md transition-all cursor-pointer text-xs font-semibold"
            title="Share this cake (SEO link with rich card preview)"
            aria-label="Share product"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#881337]" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 flex items-center justify-center shadow-md transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image & Badges */}
          <div className="relative bg-[#FFF2F5] min-h-[300px] md:min-h-full flex flex-col justify-between p-6">
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
                aria-label="Toggle wishlist"
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
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                Same-Day Bangalore Delivery (562162)
              </span>
            </div>
          </div>

          {/* Right Column: Order & Customization OR Customer Reviews */}
          <div className="p-5 sm:p-7 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-rose-100">
              <button
                type="button"
                onClick={() => setActiveTab('customise')}
                className={`pb-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'customise'
                    ? 'border-[#881337] text-[#881337]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Details & Customise</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'border-[#881337] text-[#881337]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Customer Reviews</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold tabular-nums">
                  ★ {averageRating.toFixed(1)} ({reviews.length})
                </span>
              </button>
            </div>

            {/* ================= TAB 1: CUSTOMISE & ORDER ================= */}
            {activeTab === 'customise' ? (
              <>
                <div className="space-y-4">
                  {/* Category & Clickable Rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#9F1239]">
                      {product.categoryLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className="flex items-center gap-1 text-xs text-stone-700 font-medium hover:text-[#881337] transition-colors cursor-pointer group"
                      title="View all customer reviews"
                    >
                      <div className="flex text-amber-400 text-xs">
                        {'★'.repeat(Math.round(averageRating))}
                      </div>
                      <span className="font-bold">{averageRating.toFixed(1)}</span>
                      <span className="text-stone-400 group-hover:underline">
                        ({reviews.length} reviews)
                      </span>
                    </button>
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

                  {/* Variant Selector (For Croissants, Donuts, etc.) */}
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

                  {/* Size Selector for Cakes */}
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
                            <span className="block font-bold">
                              {s.label.split(' ')[0]} {s.label.split(' ')[1]}
                            </span>
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
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isEggless ? 'border-emerald-600' : 'border-amber-600'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${isEggless ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-stone-800">
                            {isEggless ? '100% Eggless Pure Veg' : 'Contains Egg'}
                          </span>
                          <span className="text-[11px] text-stone-500 block">Freshly baked in separate kitchen stations</span>
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
                        Message on Cake (Free Hand-Piping):
                      </label>
                      <input
                        type="text"
                        maxLength={35}
                        value={cakeMessage}
                        onChange={(e) => setCakeMessage(e.target.value)}
                        placeholder="e.g. Happy 30th Birthday Priya! ♡"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block text-right">
                        {cakeMessage.length}/35 characters
                      </span>
                    </div>
                  )}

                  {/* Reviews Highlight Snippet */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50/80 to-rose-50/80 border border-amber-200/70 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400 text-xs">★★★★★</div>
                      <span className="font-bold text-stone-900">{averageRating.toFixed(1)} / 5.0</span>
                      <span className="text-stone-500">({reviews.length} customer feedback)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className="text-[#881337] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <span>Read Reviews →</span>
                    </button>
                  </div>

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
                <div className="pt-5 mt-5 border-t border-rose-100 space-y-2.5">
                  <div className="flex items-center gap-3">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer font-bold"
                        aria-label="Decrease quantity"
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
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={addedSuccess}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
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
                    className="w-full py-2 px-4 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Order on WhatsApp</span>
                  </a>
                </div>
              </>
            ) : (
              /* ================= TAB 2: REVIEWS & CUSTOMER FEEDBACK ================= */
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Rating Overview Card */}
                <div className="bg-gradient-to-br from-rose-50/70 via-pink-50/50 to-amber-50/80 p-4 sm:p-5 rounded-2xl border border-rose-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center sm:text-left">
                        <span className="text-3xl sm:text-4xl font-serif font-black text-[#881337] leading-none">
                          {averageRating.toFixed(1)}
                        </span>
                        <div className="flex text-amber-400 text-sm mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= Math.round(averageRating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="border-l border-rose-200 pl-3">
                        <span className="text-xs font-bold text-stone-800 block">
                          Based on {reviews.length} Verified Customer Reviews
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>98% of customers recommend this dessert</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsWritingReview(!isWritingReview)}
                      className="px-3.5 py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isWritingReview ? 'Cancel Review' : 'Write a Review'}</span>
                    </button>
                  </div>

                  {/* Star Rating Breakdown Bars */}
                  <div className="pt-2 border-t border-rose-200/50 space-y-1.5">
                    {([5, 4, 3, 2, 1] as const).map((star) => {
                      const percent = getStarPercent(star);
                      const count = starCounts[star] || 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-[11px] text-stone-600">
                          <span className="w-10 font-bold tabular-nums text-stone-700">
                            {star} Star
                          </span>
                          <div className="flex-1 h-2 bg-stone-200/80 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-[#881337] rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-12 text-right tabular-nums text-stone-500 font-medium">
                            {count} ({percent}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review Success Toast */}
                {reviewSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thank you! Your verified customer feedback has been posted. 🍰</span>
                  </div>
                )}

                {/* Write Review Form */}
                {isWritingReview && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="p-4 bg-white rounded-2xl border-2 border-rose-300 shadow-sm space-y-3 text-xs animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                      <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#881337]" />
                        <span>Share Your Feedback for {product.name}</span>
                      </span>
                      <span className="text-[10px] text-stone-500">Verified Reviewer</span>
                    </div>

                    {/* Interactive Star Picker */}
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Your Rating:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setNewReviewRating(starVal)}
                              onMouseEnter={() => setHoverRating(starVal)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 cursor-pointer transition-transform hover:scale-120"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  starVal <= (hoverRating || newReviewRating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-stone-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-800 ml-2">
                          {RATING_DESCRIPTIONS[hoverRating || newReviewRating]}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-stone-700 block mb-1">
                          Your Name:
                        </label>
                        <input
                          type="text"
                          required
                          value={newAuthor}
                          onChange={(e) => setNewAuthor(e.target.value)}
                          placeholder="e.g. Radhika Sharma"
                          className="w-full p-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-700 block mb-1">
                          City / Locality:
                        </label>
                        <input
                          type="text"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          placeholder="e.g. Jubilee Hills, Hyderabad"
                          className="w-full p-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-stone-700 block mb-1">
                          Occasion:
                        </label>
                        <select
                          value={newOccasion}
                          onChange={(e) => setNewOccasion(e.target.value)}
                          className="w-full p-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-rose-400 bg-white"
                        >
                          <option value="Birthday Celebration">Birthday Celebration</option>
                          <option value="Anniversary Party">Anniversary Party</option>
                          <option value="Weekend Family Treat">Weekend Family Treat</option>
                          <option value="Office Celebration">Office Celebration</option>
                          <option value="Festival & Gifting">Festival & Gifting</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-stone-700 block mb-1">
                          Review Headline:
                        </label>
                        <input
                          type="text"
                          required
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. Outstanding texture & perfectly balanced sweetness"
                          className="w-full p-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Detailed Customer Feedback:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Tell others about the flavour, sponge freshness, delivery temperature, and presentation..."
                        className="w-full p-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-rose-400 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsWritingReview(false)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-1.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-stone-400 text-[11px] font-semibold flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    <span>Filter:</span>
                  </span>
                  {[
                    { id: 'all', label: `All (${reviews.length})` },
                    { id: '5', label: '5 Stars ★' },
                    { id: '4', label: '4 Stars ★' },
                    { id: 'birthday', label: 'Birthday' },
                    { id: 'eggless', label: 'Eggless' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setReviewFilter(chip.id as any)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        reviewFilter === chip.id
                          ? 'bg-[#881337] text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Customer Feedback List */}
                <div className="space-y-3">
                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-6 bg-stone-50 rounded-2xl text-stone-500 text-xs">
                      No reviews match this filter. Try selecting 'All'.
                    </div>
                  ) : (
                    filteredReviews.map((rev) => {
                      const additionalHelpful = helpfulVotes[rev.id] || 0;
                      return (
                        <div
                          key={rev.id}
                          className="p-3.5 bg-white rounded-2xl border border-rose-100/90 shadow-2xs space-y-2 text-xs hover:border-rose-200 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 text-[#881337] flex items-center justify-center font-bold text-xs shrink-0">
                                {rev.author.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-900">{rev.author}</span>
                                  {rev.isVerified && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/60 flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>Verified Buyer</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-stone-400 block">{rev.location}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="flex text-amber-400 text-xs justify-end">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-stone-400 block mt-0.5">{rev.date}</span>
                            </div>
                          </div>

                          {/* Occasion & Title */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-semibold text-[#881337] bg-rose-50 px-2 py-0.5 rounded-md">
                                {rev.occasion}
                              </span>
                              {rev.purchasedSize && (
                                <span className="text-[10px] text-stone-500">
                                  • {rev.purchasedSize}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-stone-900 text-xs">{rev.title}</h4>
                          </div>

                          {/* Comment paragraph */}
                          <p className="text-stone-600 text-[11px] leading-relaxed">
                            {rev.comment}
                          </p>

                          {/* Helpful button */}
                          <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
                            <span>Freshly handcrafted by Chef Jyoti Tanti • Bangalore (562162)</span>
                            <button
                              type="button"
                              onClick={() => handleHelpfulVote(rev.id)}
                              className="flex items-center gap-1 text-stone-500 hover:text-[#881337] font-medium transition-colors cursor-pointer"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Helpful ({rev.helpfulCount + additionalHelpful})</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom CTA to Return to Ordering */}
                <div className="pt-3 border-t border-rose-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('customise')}
                    className="w-full py-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Back to Customise & Add to Cart • ₹{totalPrice}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
