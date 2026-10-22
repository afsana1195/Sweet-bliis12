import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Search,
  Package,
  Clock,
  ChefHat,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  MessageCircle,
  Phone,
  Navigation,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Bike,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Maximize2,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { PlacedOrder, PageRoute, CustomerUser } from '../types.ts';
import { BUSINESS_CONFIG, PRODUCTS } from '../data/bakeryData.ts';

interface TrackOrderPageProps {
  initialOrderId?: string;
  initialContact?: string;
  onNavigate: (route: PageRoute) => void;
  currentUser?: CustomerUser | null;
}

const TRACKING_STAGES = [
  {
    key: 'Order Placed',
    label: 'Order Placed',
    shortDesc: 'Order registered in kitchen queue',
    detailedDesc: 'Our bakery order desk accepted your celebration order and scheduled the pastry baking slot.',
    icon: Clock,
  },
  {
    key: 'Order Confirmed',
    label: 'Order Confirmed',
    shortDesc: 'Ingredients reserved & accepted',
    detailedDesc: 'Master Chef Jyoti has confirmed high-cocoa Belgian chocolate, fresh dairy cream, and eggless sponge batter.',
    icon: CheckCircle2,
  },
  {
    key: 'Preparing Your Order',
    label: 'Baking & Frosting',
    shortDesc: 'Chef baking fresh sponge & piping icing',
    detailedDesc: 'Warm sponge fresh from the oven! Rosettes are piped by hand with artisan frosting and custom message.',
    icon: ChefHat,
  },
  {
    key: 'Ready for Dispatch',
    label: 'Quality Checked & Packed',
    shortDesc: 'Chilled insulated box sealed',
    detailedDesc: 'Plaque message inspected. Secured in specialized food-grade cake carrier box with cold packs.',
    icon: Package,
  },
  {
    key: 'Out for Delivery',
    label: 'Out for Delivery',
    shortDesc: 'Dispatched to your doorstep',
    detailedDesc: 'Cake carrier picked up from Sweet Bliss Bakery. Moving along the Bangalore delivery corridor.',
    icon: Bike,
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    shortDesc: 'Celebration handed over!',
    detailedDesc: 'Delivered to your hands with love. Enjoy your sweet bliss celebration moment!',
    icon: Sparkles,
  },
];

// Sweet Bliss Patisserie by Jyoti Tanti, Chandapura Main Rd, Bangalore 562162
const BAKERY_COORDS: [number, number] = [12.7932, 77.6975];

// Map Bangalore delivery areas and pincodes to coordinates
function getDestinationCoordsForOrder(order: PlacedOrder | null): [number, number] {
  if (!order?.customer) return [12.8460, 77.6550];
  const pin = (order.customer.pincode || '').trim();
  const address = (order.customer.address || '').toLowerCase();
  const landmark = (order.customer.landmark || '').toLowerCase();
  const fullText = `${address} ${landmark}`;

  if (pin === '562162' || fullText.includes('chandapura') || fullText.includes('anekal') || fullText.includes('surya city')) {
    return [12.7980, 77.6960];
  }
  if (pin === '560100' || fullText.includes('electronic city') || fullText.includes('neeladri') || fullText.includes('wipro')) {
    return [12.8452, 77.6602];
  }
  if (pin === '560068' || fullText.includes('bommanahalli') || fullText.includes('hosur road') || fullText.includes('garvebhavipalya')) {
    return [12.9080, 77.6240];
  }
  if (pin === '560034' || pin === '560095' || fullText.includes('koramangala')) {
    return [12.9352, 77.6245];
  }
  if (pin === '560102' || fullText.includes('hsr') || fullText.includes('sector 1') || fullText.includes('sector 2')) {
    return [12.9121, 77.6446];
  }
  if (pin === '560076' || fullText.includes('bannerghatta') || fullText.includes('arekere') || fullText.includes('hulimavu')) {
    return [12.8876, 77.5970];
  }
  if (pin === '560037' || pin === '560066' || fullText.includes('whitefield') || fullText.includes('marathahalli')) {
    return [12.9698, 77.7500];
  }

  // Default within Bangalore delivery radius
  return [12.8460, 77.6550];
}

// Generate realistic route waypoints along Bangalore corridor
function generateRouteWaypoints(
  start: [number, number],
  end: [number, number]
): [number, number][] {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const count = 6;
  const pts: [number, number][] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // Slight realistic road curvature
    const curve = Math.sin(t * Math.PI) * 0.004;
    const lat = lat1 + (lat2 - lat1) * t + curve;
    const lon = lon1 + (lon2 - lon1) * t - curve * 0.5;
    pts.push([lat, lon]);
  }

  return pts;
}

// Map stage calculation from order status string
function getStageIndex(status: string): number {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return -1;
  if (s.includes('placed')) return 0;
  if (s.includes('confirmed') || s.includes('received')) return 1;
  if (s.includes('prepar') || s.includes('baking')) return 2;
  if (s.includes('dispatch') || s.includes('ready')) return 3;
  if (s.includes('out') || s.includes('transit')) return 4;
  if (s.includes('deliver')) return 5;
  return 1;
}

// Google Map Camera and View Controller Hook Component
const GoogleMapViewController: React.FC<{
  bakeryCoords: { lat: number; lng: number };
  destCoords: { lat: number; lng: number };
  recenterCount: number;
  fitRouteCount: number;
}> = ({ bakeryCoords, destCoords, recenterCount, fitRouteCount }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || recenterCount === 0) return;
    map.panTo(destCoords);
    map.setZoom(14);
  }, [map, recenterCount, destCoords]);

  useEffect(() => {
    if (!map || fitRouteCount === 0) return;
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      bounds.extend(bakeryCoords);
      bounds.extend(destCoords);
      map.fitBounds(bounds, 60);
    }
  }, [map, fitRouteCount, bakeryCoords, destCoords]);

  return null;
};

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({
  initialOrderId,
  initialContact,
  onNavigate,
  currentUser,
}) => {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || '');
  const [contactInput, setContactInput] = useState(
    initialContact || currentUser?.phone || currentUser?.email || ''
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<PlacedOrder | null>(null);

  // Recent orders stored in browser for quick access
  const [recentOrders, setRecentOrders] = useState<PlacedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('sb_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Google Maps API Key & Provider State
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyCUMcEreJEEQesdc6yVQkGEIyY7oysp3PE';
  const [mapProvider, setMapProvider] = useState<'google' | 'leaflet'>('google');
  const [googleMapType, setGoogleMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  // Automatic seamless fallback to Leaflet OSM if Google Maps quota is reached or auth fails
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setMapProvider('leaflet');
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Camera triggers
  const [recenterCount, setRecenterCount] = useState(0);
  const [fitRouteCount, setFitRouteCount] = useState(0);
  const [copiedId, setCopiedId] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Dynamic destination and waypoints calculated from verified order
  const destCoords = getDestinationCoordsForOrder(trackedOrder);
  const routeWaypoints = generateRouteWaypoints(BAKERY_COORDS, destCoords);
  const googleRouteCoords = routeWaypoints.map(([lat, lng]) => ({ lat, lng }));

  // Primary Fetch Order Function with Verification
  const executeOrderLookup = async (idToSearch: string, contactToVerify: string) => {
    if (loading) return;

    const id = idToSearch.trim().toUpperCase();
    const contact = contactToVerify.trim();

    // 1. Validate Order ID
    if (!id) {
      setErrorMsg('Please enter your Sweet Bliss Order ID (e.g. SB-2026-970FFE).');
      setSuccessMsg('');
      return;
    }

    // 2. Detect if user accidentally typed phone or email into the Order ID input
    const cleanDigits = id.replace(/\D/g, '');
    const looksLikePhone = cleanDigits.length === 10 && /^[6-9]\d{9}$/.test(cleanDigits) && !id.startsWith('SB-');
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(id);

    if (looksLikePhone || looksLikeEmail) {
      setContactInput(id);
      setOrderIdInput('');
      setErrorMsg(
        looksLikePhone
          ? `You entered a mobile number ("${id}") in the Order ID box. We moved it to the contact verification field below. Please enter your Order ID (e.g. SB-2026-970FFE) above.`
          : `You entered an email ("${id}") in the Order ID box. We moved it to the contact verification field below. Please enter your Order ID (e.g. SB-2026-970FFE) above.`
      );
      setSuccessMsg('');
      return;
    }

    // 3. Detect if user typed an Order ID into the Contact field
    if (contact.toUpperCase().startsWith('SB-')) {
      setOrderIdInput(contact.toUpperCase());
      setContactInput('');
      setErrorMsg('You entered an Order ID in the contact field. We moved it to the Order ID box. Please enter your registered 10-digit mobile number or email below.');
      setSuccessMsg('');
      return;
    }

    // 4. Validate Contact Verification Field
    const token = localStorage.getItem('sb_auth_token');
    const isCurrentUserMatching = currentUser && (
      (currentUser.phone && currentUser.phone.replace(/\D/g, '').slice(-10) === contact.replace(/\D/g, '').slice(-10)) ||
      (currentUser.email && currentUser.email.toLowerCase() === contact.toLowerCase())
    );

    if (!contact && !token && !isCurrentUserMatching) {
      setErrorMsg('Please enter your registered 10-digit mobile number or email address to verify order ownership.');
      setSuccessMsg('');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let url = `/api/orders/track?orderId=${encodeURIComponent(id)}`;
      if (contact) {
        url += `&phoneOrEmail=${encodeURIComponent(contact)}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        setTrackedOrder(null);
        if (res.status === 404) {
          setErrorMsg(
            data.error ||
            `No order found with the provided Order ID "${id}". Please verify the Order ID from your booking confirmation or receipt.`
          );
        } else if (res.status === 403) {
          setErrorMsg(
            data.error ||
            `The mobile number or email does not match our records for Order ID "${id}". Please enter the contact detail used during checkout.`
          );
        } else if (res.status === 400) {
          setErrorMsg(data.error || 'Please provide both your Order ID and registered mobile number or email.');
        } else {
          setErrorMsg(data.error || 'Unable to load order tracking details. Please try again.');
        }
        return;
      }

      // Successful verified order retrieval
      setTrackedOrder(data.order);
      setOrderIdInput(data.order.orderId);
      if (data.order.customer?.phone && !contactInput) {
        setContactInput(data.order.customer.phone);
      }
      setSuccessMsg(`Order ${data.order.orderId} verified successfully.`);

      // Sync recent orders store in browser if not already present
      setRecentOrders((prev) => {
        const exists = prev.some((o) => o.orderId === data.order.orderId);
        if (!exists) {
          const updated = [data.order, ...prev.slice(0, 4)];
          try {
            localStorage.setItem('sb_orders', JSON.stringify(updated));
          } catch (e) {
            console.warn('LocalStorage save failed:', e);
          }
          return updated;
        }
        return prev;
      });
    } catch (err: any) {
      setTrackedOrder(null);
      setErrorMsg(err.message || 'Network error while checking order tracking. Please check your internet connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  // Form submit handler with event cancellation
  const handleTrackSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    executeOrderLookup(orderIdInput, contactInput);
  };

  // Mount logic: If initialOrderId exists from navigation/deep-link, auto-fetch
  useEffect(() => {
    if (initialOrderId && initialContact) {
      executeOrderLookup(initialOrderId, initialContact);
    }
  }, [initialOrderId, initialContact]);

  const currentStageIdx = trackedOrder ? getStageIndex(trackedOrder.status) : 1;
  const isCancelled = currentStageIdx === -1;
  const isDelivered = currentStageIdx === 5;
  const isOutForDelivery = currentStageIdx === 4;

  // Leaflet map lifecycle for fallback mode
  useEffect(() => {
    if (mapProvider !== 'leaflet') {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.8200, 77.6750],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      const poly = L.polyline(routeWaypoints, {
        color: '#BE123C',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
      routePolylineRef.current = poly;

      const bakeryIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-white border-2 border-[#881337] shadow-lg px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#881337] whitespace-nowrap mb-1">
              Sweet Bliss Bakery
            </div>
            <div class="w-8 h-8 rounded-full bg-[#881337] text-white flex items-center justify-center shadow-lg border-2 border-white text-xs">
              🧁
            </div>
          </div>
        `,
        className: 'custom-leaflet-icon',
        iconSize: [120, 50],
        iconAnchor: [60, 45],
      });
      L.marker(BAKERY_COORDS, { icon: bakeryIcon }).addTo(map);

      const destIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-white border-2 border-emerald-600 shadow-lg px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-800 whitespace-nowrap mb-1">
              ${trackedOrder?.customer.fullName || 'Doorstep Destination'}
            </div>
            <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-xs">
              📍
            </div>
          </div>
        `,
        className: 'custom-leaflet-icon',
        iconSize: [140, 50],
        iconAnchor: [70, 45],
      });
      L.marker(destCoords, { icon: destIcon }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(routeWaypoints);
      }
    }
  }, [mapProvider, trackedOrder]);

  // Center On Customer Destination
  const handleCenterOnDest = () => {
    if (mapProvider === 'google') {
      setRecenterCount((c) => c + 1);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(destCoords, 15, { animate: true });
    }
  };

  // Fit Entire Delivery Route Action
  const handleFitRoute = () => {
    if (mapProvider === 'google') {
      setFitRouteCount((c) => c + 1);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(L.latLngBounds([BAKERY_COORDS, destCoords]), {
        padding: [60, 60],
        animate: true,
      });
    }
  };

  const handleCopyId = () => {
    if (!trackedOrder) return;
    navigator.clipboard.writeText(trackedOrder.orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const currentStageInfo = currentStageIdx >= 0 ? TRACKING_STAGES[currentStageIdx] : null;

  return (
    <div className="bg-[#FFF9F9] min-h-screen pt-6 pb-28 sm:py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ================= TOP SEARCH & APP HEADER ================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#881337]">
                  Order Fulfillment & Delivery Tracker
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#881337] text-[10px] font-bold">
                  Sweet Bliss Kitchen
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Track Your Celebration Cake
              </h1>
              <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                Real-time kitchen milestones, scheduled delivery time, and verified route progress.
              </p>
            </div>

            {currentUser && (
              <div className="bg-rose-50/70 border border-rose-200/60 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs text-rose-900 shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Verified Customer</span>
                  <span className="text-[11px] text-stone-600">
                    {currentUser.name} • {currentUser.phone || currentUser.email}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* TWO-FIELD SECURE SEARCH FORM */}
          <form
            onSubmit={handleTrackSubmit}
            noValidate
            className="pt-2 border-t border-rose-100/70 flex flex-col md:flex-row items-stretch md:items-end gap-3"
          >
            {/* Field 1: Order ID */}
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#881337]" />
                <span>Sweet Bliss Order ID</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. SB-2026-970FFE"
                  value={orderIdInput}
                  onChange={(e) => {
                    setOrderIdInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTrackSubmit(e);
                  }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#881337] focus:border-transparent bg-stone-50/50 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Field 2: Registered Phone or Email */}
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Registered Mobile or Email</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal lowercase">for security verification</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. 6297201943 or email@example.com"
                  value={contactInput}
                  onChange={(e) => {
                    setContactInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTrackSubmit(e);
                  }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#881337] focus:border-transparent bg-stone-50/50 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Submit Track Button */}
            <button
              type="submit"
              onClick={handleTrackSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-[#881337] hover:bg-[#9F1239] active:bg-[#70102e] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2 h-[42px]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>

          {/* Recent Orders Shortcut Chips if stored in browser */}
          <div className="pt-1">
            {recentOrders.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-stone-400 text-[11px] font-medium">Recent Orders:</span>
                {recentOrders.slice(0, 4).map((ro) => (
                  <button
                    key={ro.orderId}
                    type="button"
                    onClick={() => {
                      setOrderIdInput(ro.orderId);
                      setErrorMsg('');
                      setSuccessMsg('');
                      const contactToUse =
                        contactInput.trim() ||
                        ro.customer?.phone ||
                        ro.customer?.email ||
                        currentUser?.phone ||
                        currentUser?.email ||
                        '';
                      if (contactToUse) {
                        setContactInput(contactToUse);
                        executeOrderLookup(ro.orderId, contactToUse);
                      } else {
                        setErrorMsg(`Order ID ${ro.orderId} selected. Please enter your registered 10-digit mobile number or email below to verify.`);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-mono border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      trackedOrder?.orderId === ro.orderId
                        ? 'bg-[#881337] text-white border-[#881337]'
                        : 'bg-stone-50 hover:bg-rose-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{ro.orderId}</span>
                    <span className="text-[10px] opacity-75">
                      ({ro.items[0]?.name || 'Cake'})
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-stone-400">
                No recent orders found on this device. Enter your Order ID and registered phone or email above.
              </p>
            )}
          </div>

          {/* Privacy Footnote */}
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Customer Privacy Protected: Doorstep address and live status are only visible after verification.</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMsg}</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Need assistance? WhatsApp Master Chef Jyoti at{' '}
                  <a
                    href={`https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(
                      `Hi Chef Jyoti, I need help tracking my order: ${orderIdInput || 'Cake Order'}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold"
                  >
                    +91 {BUSINESS_CONFIG.phone}
                  </a>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTrackSubmit}
              className="text-xs font-bold text-[#881337] hover:underline cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && !errorMsg && trackedOrder && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* If No order is loaded */}
        {!trackedOrder && !loading && (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-rose-100 shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-[#881337] flex items-center justify-center mx-auto shadow-2xs">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              No Active Order Selected
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Enter your Order ID (from your booking confirmation message or WhatsApp) and registered contact detail above to view real-time bakery status.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 rounded-xl bg-[#881337] text-white text-xs sm:text-sm font-semibold hover:bg-[#9F1239] transition-all cursor-pointer shadow-sm"
              >
                Browse Cake Menu
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-6 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Contact Bakery Desk
              </button>
            </div>
          </div>
        )}

        {/* MAIN TRACKING INTERFACE (When genuine order is verified) */}
        {trackedOrder && (
          <div className="space-y-6">
            {/* ================= 1. DYNAMIC ETA HERO CARD ================= */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#881337] via-[#9F1239] to-[#BE123C] text-white p-6 sm:p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase">
                      {isCancelled
                        ? 'Order Cancelled'
                        : isDelivered
                        ? 'Delivered with Joy 🎉'
                        : `Scheduled Delivery: ${trackedOrder.deliveryDate} (${trackedOrder.deliverySlot.toUpperCase()} Slot)`}
                    </span>
                    <span className="text-[11px] text-rose-100 flex items-center gap-1 font-medium bg-black/20 px-2.5 py-0.5 rounded-full">
                      <span className={`w-2 h-2 rounded-full ${isCancelled ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                      Status: {trackedOrder.status}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                    {isCancelled
                      ? 'Celebration Order Cancelled'
                      : isDelivered
                      ? 'Cake Delivered to Doorstep! 🎂'
                      : isOutForDelivery
                      ? 'Out for Delivery to Your Doorstep! 🛵'
                      : currentStageIdx === 3
                      ? 'Cake inspected & sealed in chilled carrier box ❄️'
                      : currentStageIdx === 2
                      ? 'Executive Pastry Chef is baking fresh & decorating 🎂'
                      : 'Sweet Bliss kitchen accepted your celebration order! 🎉'}
                  </h2>

                  <p className="text-xs sm:text-sm text-rose-100/90 max-w-xl leading-relaxed">
                    {isCancelled
                      ? 'This celebration order was marked as cancelled. For questions, adjustments, or refund inquiries, please message Chef Jyoti via WhatsApp or call our desk.'
                      : currentStageInfo?.detailedDesc}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 flex flex-col items-start md:items-end gap-1.5 text-xs">
                  <span className="text-rose-200 text-[11px]">Order Reference</span>
                  <span className="font-mono font-bold text-base tracking-wider text-white">
                    {trackedOrder.orderId}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-medium">
                    Verified Customer: {trackedOrder.customer.fullName}
                  </span>
                </div>
              </div>
            </div>

            {/* ================= 2. DELIVERY ROUTE & CORRIDOR MAP ================= */}
            <div className="bg-white rounded-3xl border border-rose-100 shadow-md overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-rose-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center font-bold">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 text-xs sm:text-sm">
                        Bakery to Doorstep Delivery Route & Service Corridor
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Bangalore Corridor
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      From: <strong>Sweet Bliss Bakery (Chandapura, Bangalore 562162)</strong> → To:{' '}
                      <strong>
                        {trackedOrder.customer.address}, {trackedOrder.customer.city} - {trackedOrder.customer.pincode}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-white rounded-xl border border-stone-200 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setMapProvider('google');
                        setGoogleMapType('roadmap');
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        mapProvider === 'google' && googleMapType === 'roadmap'
                          ? 'bg-[#881337] text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🗺️ Road
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMapProvider('google');
                        setGoogleMapType('hybrid');
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        mapProvider === 'google' && googleMapType === 'hybrid'
                          ? 'bg-[#881337] text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🛰️ Satellite
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMapProvider('leaflet');
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        mapProvider === 'leaflet'
                          ? 'bg-[#881337] text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🌐 OSM
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCenterOnDest}
                    className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-[#881337] shadow-2xs transition-colors cursor-pointer"
                    title="Center on Destination"
                  >
                    <Crosshair className="w-4 h-4 text-[#881337]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleFitRoute}
                    className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-[#881337] shadow-2xs transition-colors cursor-pointer"
                    title="Show Full Route"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Map Rendering Container */}
              <div className="relative w-full h-[360px] sm:h-[420px]">
                {mapProvider === 'google' ? (
                  <APIProvider apiKey={apiKey} libraries={['marker', 'routes', 'geometry']}>
                    <GoogleMap
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      defaultCenter={{ lat: 12.8200, lng: 77.6750 }}
                      defaultZoom={13}
                      mapTypeId={googleMapType}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      className="w-full h-full"
                    >
                      <GoogleMapViewController
                        bakeryCoords={{ lat: BAKERY_COORDS[0], lng: BAKERY_COORDS[1] }}
                        destCoords={{ lat: destCoords[0], lng: destCoords[1] }}
                        recenterCount={recenterCount}
                        fitRouteCount={fitRouteCount}
                      />

                      <Polyline
                        path={googleRouteCoords}
                        strokeColor="#BE123C"
                        strokeWeight={8}
                        strokeOpacity={0.3}
                      />
                      <Polyline
                        path={googleRouteCoords}
                        strokeColor="#881337"
                        strokeWeight={4}
                        strokeOpacity={0.9}
                      />

                      {/* Bakery Marker */}
                      <AdvancedMarker
                        position={{ lat: BAKERY_COORDS[0], lng: BAKERY_COORDS[1] }}
                        title="Sweet Bliss Artisan Bakery • Chandapura, Bangalore"
                      >
                        <div className="flex flex-col items-center cursor-pointer">
                          <div className="bg-white border-2 border-[#881337] shadow-lg px-2.5 py-1 rounded-xl text-[10px] font-bold text-[#881337] flex items-center gap-1 whitespace-nowrap mb-1">
                            <span>🧁 Sweet Bliss Bakery</span>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-[#881337] text-white flex items-center justify-center shadow-lg border-2 border-white text-sm">
                            🎂
                          </div>
                        </div>
                      </AdvancedMarker>

                      {/* Customer Destination Marker */}
                      <AdvancedMarker
                        position={{ lat: destCoords[0], lng: destCoords[1] }}
                        title={`Destination: ${trackedOrder.customer.fullName}`}
                      >
                        <div className="flex flex-col items-center cursor-pointer">
                          <div className="bg-white border-2 border-emerald-600 shadow-lg px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-800 flex items-center gap-1 whitespace-nowrap mb-1">
                            <span>🏠 {trackedOrder.customer.fullName}</span>
                          </div>
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-sm">
                              📍
                            </div>
                            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60 pointer-events-none" />
                          </div>
                        </div>
                      </AdvancedMarker>
                    </GoogleMap>
                  </APIProvider>
                ) : (
                  <div ref={mapContainerRef} className="w-full h-full z-10" />
                )}

                {/* Floating Bottom HUD Pill */}
                <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200 shadow-lg flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-stone-800">
                      Destination: <strong>{trackedOrder.customer.city} ({trackedOrder.customer.pincode})</strong>
                    </span>
                  </div>
                  <span className="text-stone-300">|</span>
                  <div className="flex items-center gap-1 text-stone-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Refrigerated Box Transport</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 3. DETAILED 6-STAGE MILESTONE TIMELINE ================= */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                  <span>Celebration Progress Tracker</span>
                  <span className="text-xs font-sans font-normal text-stone-500">
                    (Current Stage: {trackedOrder.status})
                  </span>
                </h3>
                <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {trackedOrder.deliveryDate} ({trackedOrder.deliverySlot.toUpperCase()} Slot)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                {TRACKING_STAGES.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isDone = idx < currentStageIdx;
                  const isCurrent = idx === currentStageIdx;

                  return (
                    <div
                      key={stage.key}
                      className={`rounded-2xl p-4 transition-all border ${
                        isCurrent
                          ? 'bg-rose-50/80 border-[#881337] shadow-sm ring-2 ring-rose-200'
                          : isDone
                          ? 'bg-stone-50/70 border-stone-200'
                          : 'bg-stone-50/40 border-stone-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isCurrent
                              ? 'bg-[#881337] text-white shadow-md'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>

                        {isCurrent && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#881337] bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                            Active
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-[#881337]'
                            : isDone
                            ? 'text-stone-900'
                            : 'text-stone-500'
                        }`}
                      >
                        {stage.label}
                      </h4>

                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                        {stage.shortDesc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Real Status History Log from Database */}
              {trackedOrder.statusHistory && trackedOrder.statusHistory.length > 0 && (
                <div className="pt-4 border-t border-stone-100 space-y-2.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#881337]" />
                    <span>Kitchen & Delivery Activity Log</span>
                  </h5>
                  <div className="space-y-2">
                    {trackedOrder.statusHistory.map((sh, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-50/80 rounded-xl p-3 border border-stone-200/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-stone-700"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#881337]" />
                          <strong className="text-stone-900">{sh.status}</strong>
                          {sh.note && <span className="text-stone-600">— {sh.note}</span>}
                        </div>
                        <span className="text-[11px] text-stone-400 font-mono">
                          {new Date(sh.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ================= 4. REAL ORDER RECEIPT & DETAILS ================= */}
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsDetailsOpen(!isDetailsOpen);
                  }
                }}
                className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-stone-50/60 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#881337] flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm sm:text-base">
                        Order #{trackedOrder.orderId}
                      </span>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyId();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            e.preventDefault();
                            handleCopyId();
                          }
                        }}
                        title="Copy Order ID"
                        className="text-stone-400 hover:text-[#881337] p-1 cursor-pointer"
                      >
                        {copiedId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-stone-500">
                      {trackedOrder.items.length} celebration item{trackedOrder.items.length > 1 ? 's' : ''} • Total ₹
                      {trackedOrder.total} ({trackedOrder.paymentStatus})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#881337] hidden sm:inline">
                    {isDetailsOpen ? 'Hide Receipt' : 'View Full Receipt'}
                  </span>
                  {isDetailsOpen ? (
                    <ChevronUp className="w-5 h-5 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400" />
                  )}
                </div>
              </div>

              {isDetailsOpen && (
                <div className="p-6 border-t border-stone-100 bg-stone-50/40 space-y-6">
                  {/* Itemized List */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                      Celebration Cakes Ordered
                    </h5>
                    <div className="divide-y divide-stone-100 bg-white rounded-2xl border border-stone-200 overflow-hidden">
                      {trackedOrder.items.map((item, i) => {
                        const productMatch = PRODUCTS.find((p) => p.id === item.productId);
                        const itemImg = productMatch?.image || '/src/assets/images/featured_chocolate_truffle_1791733075545.jpg';
                        return (
                          <div key={i} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={itemImg}
                                alt={item.name}
                                className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                              />
                              <div>
                                <h6 className="font-bold text-sm text-stone-900">{item.name}</h6>
                                <div className="flex flex-wrap gap-2 text-xs text-stone-500 mt-0.5">
                                  <span>{item.weightKg} kg</span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity}</span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-medium">
                                    {item.isEggless ? '100% Eggless' : 'Regular'}
                                  </span>
                                  {item.flavour && (
                                    <>
                                      <span>•</span>
                                      <span>Flavour: {item.flavour}</span>
                                    </>
                                  )}
                                  {item.cakeMessage && (
                                    <>
                                      <span>•</span>
                                      <span className="italic text-rose-700 font-medium">
                                        Piping: "{item.cakeMessage}"
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right font-bold text-sm text-stone-900">
                              ₹{item.price * item.quantity}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery & Payment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <MapPin className="w-4 h-4 text-[#881337]" />
                        <span>Delivery Destination</span>
                      </div>
                      <p className="text-stone-700 font-semibold">{trackedOrder.customer.fullName}</p>
                      <p className="text-stone-500">{trackedOrder.customer.address}</p>
                      <p className="text-stone-500">
                        {trackedOrder.customer.city}, {trackedOrder.customer.pincode}
                      </p>
                      {trackedOrder.customer.landmark && (
                        <p className="text-stone-500">Landmark: {trackedOrder.customer.landmark}</p>
                      )}
                      <p className="text-stone-500">Phone: +91 {trackedOrder.customer.phone}</p>
                      {trackedOrder.customer.email && (
                        <p className="text-stone-500">Email: {trackedOrder.customer.email}</p>
                      )}
                      {trackedOrder.orderNotes && (
                        <p className="text-amber-800 font-medium pt-1">
                          Kitchen Note: {trackedOrder.orderNotes}
                        </p>
                      )}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <Clock className="w-4 h-4 text-[#881337]" />
                        <span>Payment & Invoice</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="text-stone-500">Payment Status:</span>
                        <span
                          className={`font-bold uppercase ${
                            trackedOrder.paymentStatus === 'PAID'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {trackedOrder.paymentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="text-stone-500">Method:</span>
                        <span className="font-bold text-stone-800">
                          {trackedOrder.paymentMethod}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="text-stone-500">Delivery Fee:</span>
                        <span className="font-semibold text-emerald-700">FREE</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-stone-500 font-bold">Total Amount:</span>
                        <span className="font-extrabold text-[#881337] text-sm">
                          ₹{trackedOrder.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp & Call Direct Bakery CTA */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href={`https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(
                        `Hi Chef Jyoti, I am inquiring about my Sweet Bliss order ${trackedOrder.orderId} (${trackedOrder.items.map((i) => i.name).join(', ')}). Could you provide a live kitchen update?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-stone-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Chef Jyoti (+91 {BUSINESS_CONFIG.phone})</span>
                    </a>

                    <a
                      href={`tel:+91${BUSINESS_CONFIG.phone}`}
                      className="py-3 px-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Call Bakery Desk</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onNavigate('shop')}
                      className="py-3 px-5 rounded-xl border border-rose-200 hover:bg-rose-50 text-[#881337] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Browse More Cakes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
