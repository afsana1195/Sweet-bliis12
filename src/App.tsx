import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { CategoryCards } from './components/CategoryCards.tsx';
import { PromoBanners } from './components/PromoBanners.tsx';
import { FeaturedCollection } from './components/FeaturedCollection.tsx';
import { TrustBadgesStrip } from './components/TrustBadgesStrip.tsx';
import { OccasionsSection } from './components/OccasionsSection.tsx';
import { Footer } from './components/Footer.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { ShopPage } from './components/ShopPage.tsx';
import { CustomCakeOrderPage } from './components/CustomCakeOrderPage.tsx';
import { CheckoutPage } from './components/CheckoutPage.tsx';
import { OrderConfirmationPage } from './components/OrderConfirmationPage.tsx';
import { TrackOrderPage } from './components/TrackOrderPage.tsx';
import { AdminOrderPage } from './components/AdminOrderPage.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { WishlistDrawer } from './components/WishlistDrawer.tsx';
import { AccountModal } from './components/AccountModal.tsx';
import { AiAssistantModal } from './components/AiAssistantModal.tsx';
import { AboutPage } from './components/AboutPage.tsx';
import { ContactPage } from './components/ContactPage.tsx';
import { PrivacyTermsPage } from './components/PrivacyTermsPage.tsx';
import { PRODUCTS, CakeProduct } from './data/bakeryData.ts';
import { CartItem, PageRoute, PlacedOrder } from './types.ts';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<CakeProduct | null>(null);

  // Drawers & Modals
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);

  // Cart & Wishlist with localStorage persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sb_wishlist');
      return saved ? JSON.parse(saved) : ['chocolate-truffle'];
    } catch {
      return ['chocolate-truffle'];
    }
  });

  // Google Maps Platform Quota Exceeded state
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  const [recentOrders, setRecentOrders] = useState<PlacedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('sb_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('sb_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('sb_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('sb_orders', JSON.stringify(recentOrders));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [recentOrders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Add to Cart
  const handleAddToCart = (
    product: CakeProduct,
    sizeLabel?: string,
    weightKg?: number,
    isEggless: boolean = true,
    cakeMessage: string = '',
    flavour?: string,
    quantity: number = 1,
    calculatedPrice?: number
  ) => {
    const finalSizeLabel = sizeLabel || product.sizes[0]?.label || '0.5 kg (Serves 4-6)';
    const finalWeightKg = weightKg ?? product.sizes[0]?.weightKg ?? 0.5;
    const finalPrice = calculatedPrice ?? product.price;
    const finalFlavour = flavour || product.flavours[0] || 'Classic';

    setCartItems((prev) => {
      // Check if matching item exists
      const existingIdx = prev.findIndex(
        (i) =>
          i.product.id === product.id &&
          i.selectedSizeLabel === finalSizeLabel &&
          i.isEggless === isEggless &&
          i.cakeMessage === cakeMessage &&
          i.flavour === finalFlavour
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product,
        selectedSizeLabel: finalSizeLabel,
        weightKg: finalWeightKg,
        unitPrice: finalPrice,
        quantity,
        isEggless,
        cakeMessage,
        flavour: finalFlavour,
      };
      return [...prev, newItem];
    });

    showToast(`Added "${product.name}" to cart! 🍰`);
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Item removed from cart');
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist ♥');
      return updated;
    });
  };

  const handleOrderCompleted = (order: PlacedOrder) => {
    setPlacedOrder(order);
    setRecentOrders((prev) => [order, ...prev]);
    setCartItems([]);
    setCurrentRoute('order-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentRoute('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F9] text-stone-900 selection:bg-rose-200 selection:text-rose-900 font-sans">
      {/* Google Maps Quota Exceeded Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#881337] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl border border-rose-300 animate-in fade-in slide-in-from-bottom-4 duration-200 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onRouteChange={(route) => setCurrentRoute(route)}
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenSearch={() => setCurrentRoute('shop')}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* Main Page Body Routing */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <>
            <HeroSection
              onExploreCakes={() => {
                setSelectedCategory('all');
                setCurrentRoute('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onCustomCake={() => {
                setCurrentRoute('custom-order');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <CategoryCards onSelectCategory={handleSelectCategory} />

            <PromoBanners
              onStartCustomOrder={() => {
                setCurrentRoute('custom-order');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
            />

            <FeaturedCollection
              products={PRODUCTS}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onSelectProduct={(cake) => setSelectedProduct(cake)}
              onViewCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentRoute('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onViewAll={() => {
                setSelectedCategory('all');
                setCurrentRoute('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <TrustBadgesStrip />

            <OccasionsSection
              onSelectOccasion={(occ) => {
                setSelectedCategory('all');
                setCurrentRoute('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onExploreCollection={() => {
                setSelectedCategory('all');
                setCurrentRoute('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}

        {currentRoute === 'shop' && (
          <ShopPage
            products={PRODUCTS}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={(cake) => handleAddToCart(cake)}
            onSelectProduct={(cake) => setSelectedProduct(cake)}
          />
        )}

        {currentRoute === 'custom-order' && <CustomCakeOrderPage />}

        {currentRoute === 'checkout' && (
          <CheckoutPage
            cartItems={cartItems}
            onOrderCompleted={handleOrderCompleted}
            onBackToCart={() => setIsCartOpen(true)}
            onExploreCakes={() => setCurrentRoute('shop')}
          />
        )}

        {currentRoute === 'order-confirmation' && (
          <OrderConfirmationPage
            order={placedOrder}
            onNavigate={(route) => setCurrentRoute(route)}
          />
        )}

        {currentRoute === 'track-order' && (
          <TrackOrderPage
            initialOrderId={placedOrder?.orderId}
            onNavigate={(route) => setCurrentRoute(route)}
          />
        )}

        {currentRoute === 'admin' && (
          <AdminOrderPage onNavigate={(route) => setCurrentRoute(route)} />
        )}

        {currentRoute === 'about' && (
          <AboutPage onNavigate={(route) => setCurrentRoute(route)} />
        )}

        {currentRoute === 'contact' && <ContactPage />}

        {currentRoute === 'privacy' && <PrivacyTermsPage initialTab="privacy" />}

        {currentRoute === 'terms' && <PrivacyTermsPage initialTab="terms" />}
      </main>

      {/* Floating AI Chef Assistant Launcher */}
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#881337] hover:bg-[#9F1239] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer border-2 border-rose-200"
        aria-label="Chat with AI Cake Assistant"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden bg-white shrink-0">
          <img
            src="/src/assets/images/ai_baker_assistant_1791733180129.jpg"
            alt="Chef Bliss"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          Ask Chef Bliss AI
        </span>
        <Sparkles className="w-3.5 h-3.5 text-rose-300 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Footer */}
      <Footer
        onRouteChange={(route) => setCurrentRoute(route)}
        onSelectCategory={handleSelectCategory}
      />

      {/* Modals & Drawers */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(product, sizeLabel, weightKg, isEggless, msg, flav, qty, price) => {
            handleAddToCart(product, sizeLabel, weightKg, isEggless, msg, flav, qty, price);
          }}
          isWishlisted={wishlist.includes(selectedProduct.id)}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setCurrentRoute('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onExploreCakes={() => {
          setIsCartOpen(false);
          setCurrentRoute('shop');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistIds={wishlist}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={(cake) => handleAddToCart(cake)}
        onSelectProduct={(cake) => setSelectedProduct(cake)}
        onExploreCakes={() => {
          setIsWishlistOpen(false);
          setCurrentRoute('shop');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {isAccountOpen && (
        <AccountModal
          isOpen={true}
          onClose={() => setIsAccountOpen(false)}
          recentOrders={recentOrders}
          onSelectOrder={(ord) => {
            setPlacedOrder(ord);
            setCurrentRoute('order-confirmation');
          }}
          onNavigateToDashboard={() => {
            setIsAccountOpen(false);
            setCurrentRoute('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {isAiAssistantOpen && (
        <AiAssistantModal
          isOpen={true}
          onClose={() => setIsAiAssistantOpen(false)}
          onSelectProduct={(cake) => setSelectedProduct(cake)}
          onAddToCart={(cake) => handleAddToCart(cake)}
          onStartCustomOrder={() => {
            setCurrentRoute('custom-order');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}
