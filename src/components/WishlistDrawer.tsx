import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { CakeProduct, PRODUCTS } from '../data/bakeryData.ts';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: CakeProduct) => void;
  onSelectProduct: (product: CakeProduct) => void;
  onExploreCakes: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onExploreCakes,
}) => {
  if (!isOpen) return null;

  const wishlistedCakes = PRODUCTS.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-[#FFF9F9]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#9F1239] fill-rose-100" />
            <h2 className="font-serif text-lg font-bold text-[#881337]">Saved Cakes</h2>
            <span className="bg-rose-100 text-[#881337] text-xs font-bold px-2 py-0.5 rounded-full">
              {wishlistedCakes.length} items
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-100/70 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {wishlistedCakes.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-[#881337] flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-800">Your wishlist is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                  Tap the heart icon on any cake to save it for your next celebration.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onExploreCakes();
                }}
                className="px-6 py-2.5 rounded-full bg-[#881337] text-white text-xs font-semibold cursor-pointer"
              >
                Explore Cakes
              </button>
            </div>
          ) : (
            wishlistedCakes.map((cake) => (
              <div
                key={cake.id}
                className="flex gap-3.5 p-3.5 rounded-2xl border border-rose-100 bg-[#FFFDFD] hover:border-rose-200 transition-colors"
              >
                <img
                  src={cake.image}
                  alt={cake.name}
                  onClick={() => {
                    onSelectProduct(cake);
                    onClose();
                  }}
                  className="w-18 h-18 rounded-xl object-cover shrink-0 cursor-pointer"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4
                        onClick={() => {
                          onSelectProduct(cake);
                          onClose();
                        }}
                        className="font-serif text-xs sm:text-sm font-bold text-stone-900 truncate hover:text-[#881337] cursor-pointer"
                      >
                        {cake.name}
                      </h4>
                      <p className="text-[11px] text-stone-500">{cake.categoryLabel}</p>
                    </div>

                    <button
                      onClick={() => onToggleWishlist(cake.id)}
                      className="text-stone-400 hover:text-rose-700 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-50">
                    <span className="text-xs sm:text-sm font-bold text-[#881337] tabular-nums">
                      ₹{cake.price}
                    </span>

                    <button
                      onClick={() => {
                        onAddToCart(cake);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#881337] hover:bg-[#9F1239] text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
