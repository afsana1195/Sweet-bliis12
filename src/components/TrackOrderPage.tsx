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
  Thermometer,
  Compass,
  Send,
  RefreshCw,
  Play,
  RotateCcw,
  Bike,
  Check,
  Star,
  X,
  Volume2,
  Copy,
  ChevronDown,
  ChevronUp,
  Layers,
  Crosshair,
  Maximize2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { PlacedOrder, PageRoute } from '../types.ts';
import { BUSINESS_CONFIG, PRODUCTS } from '../data/bakeryData.ts';

interface TrackOrderPageProps {
  initialOrderId?: string;
  onNavigate: (route: PageRoute) => void;
}

interface DeliveryPartner {
  name: string;
  phone: string;
  rating: number;
  totalDeliveries: number;
  vehicle: string;
  vehicleNumber: string;
  avatar: string;
  temperatureChecked: boolean;
  maskVerified: boolean;
}

const DEFAULT_RIDER: DeliveryPartner = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  rating: 4.9,
  totalDeliveries: 1480,
  vehicle: 'Electric Eco-Scooter (Refrigerated Cake Carrier)',
  vehicleNumber: 'KA 51 SB 2026',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  temperatureChecked: true,
  maskVerified: true,
};

const TRACKING_STAGES = [
  {
    key: 'Order Placed',
    label: 'Order Placed',
    shortDesc: 'Order registered in kitchen queue',
    detailedDesc: 'Our order desk accepted your celebration order and scheduled the pastry baking slot.',
    icon: Clock,
    etaMins: 45,
  },
  {
    key: 'Order Confirmed',
    label: 'Order Confirmed',
    shortDesc: 'Ingredients reserved & accepted',
    detailedDesc: 'Master Chef has verified high-cocoa butter, fresh dairy cream, and eggless sponge batter.',
    icon: CheckCircle2,
    etaMins: 40,
  },
  {
    key: 'Preparing Your Order',
    label: 'Baking & Frosting',
    shortDesc: 'Chef baking fresh sponge & piping icing',
    detailedDesc: 'Warm sponge fresh from the oven! Rosettes are piped by hand with Belgian chocolate truffle.',
    icon: ChefHat,
    etaMins: 28,
  },
  {
    key: 'Ready for Dispatch',
    label: 'Quality Checked & Packed',
    shortDesc: 'Chilled insulated box sealed',
    detailedDesc: 'Plaque message inspected. Secured with food-grade shock absorbers and dry-ice cold packs.',
    icon: Package,
    etaMins: 20,
  },
  {
    key: 'Out for Delivery',
    label: 'Out for Delivery',
    shortDesc: 'Rahul is on the way to your doorstep',
    detailedDesc: 'Rahul picked up the cake carrier from Sweet Bliss Bakery. Live GPS tracking active on scooter.',
    icon: Bike,
    etaMins: 12,
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    shortDesc: 'Celebration handed over!',
    detailedDesc: 'Delivered to your hands with love. Enjoy your sweet bliss celebration moment!',
    icon: Sparkles,
    etaMins: 0,
  },
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'rider';
  text: string;
  time: string;
}

// Real Bangalore Geographic Coordinates (Chandapura - Electronic City, Bangalore 562162):
// Origin: Sweet Bliss Patisserie by Jyoti Tanti, Chandapura Main Rd, Bangalore 562162
// Destination: Customer Residence, Electronic City Phase 2 / Chandapura, Bangalore
const BAKERY_COORDS: [number, number] = [12.7932, 77.6975];
const DESTINATION_COORDS: [number, number] = [12.8460, 77.6550];

// Detailed Real Road Coordinates Waypoints across Bangalore Corridor
const REAL_ROUTE_COORDS: [number, number][] = [
  [12.7932, 77.6975], // Bakery (Chandapura Hub 562162)
  [12.8050, 77.6910], // Surya City Junction
  [12.8150, 77.6880], // Chandapura-Anekal Flyover
  [12.8240, 77.6840], // Hebbagodi Main Road
  [12.8350, 77.6800], // Bommasandra Industrial Hub
  [12.8420, 77.6740], // Electronic City Toll Plaza
  [12.8510, 77.6680], // Electronic City Phase 2 Elevated Corridor
  [12.8550, 77.6620], // Tech Park Avenue
  [12.8480, 77.6580], // Neeladri Road Cross
  [12.8460, 77.6550], // Destination (Customer Doorstep, Bangalore)
];

const REAL_ROUTE_GOOGLE_COORDS = REAL_ROUTE_COORDS.map(([lat, lng]) => ({
  lat,
  lng,
}));

// Calculate cumulative segment distances for smooth interpolation along real road polyline
function getInterpolatedPoint(progress: number): [number, number] {
  const p = Math.max(0, Math.min(1, progress));
  if (p === 0) return REAL_ROUTE_COORDS[0];
  if (p === 1) return REAL_ROUTE_COORDS[REAL_ROUTE_COORDS.length - 1];

  // Calculate cumulative distances
  const distances: number[] = [0];
  let totalDist = 0;
  for (let i = 0; i < REAL_ROUTE_COORDS.length - 1; i++) {
    const [lat1, lon1] = REAL_ROUTE_COORDS[i];
    const [lat2, lon2] = REAL_ROUTE_COORDS[i + 1];
    const d = Math.hypot(lat2 - lat1, lon2 - lon1);
    totalDist += d;
    distances.push(totalDist);
  }

  const targetDist = p * totalDist;
  for (let i = 0; i < distances.length - 1; i++) {
    if (targetDist >= distances[i] && targetDist <= distances[i + 1]) {
      const segStart = distances[i];
      const segEnd = distances[i + 1];
      const segT = segEnd === segStart ? 0 : (targetDist - segStart) / (segEnd - segStart);
      const [lat1, lon1] = REAL_ROUTE_COORDS[i];
      const [lat2, lon2] = REAL_ROUTE_COORDS[i + 1];
      return [
        lat1 + (lat2 - lat1) * segT,
        lon1 + (lon2 - lon1) * segT,
      ];
    }
  }

  return REAL_ROUTE_COORDS[REAL_ROUTE_COORDS.length - 1];
}

// Google Map Camera and View Controller Hook Component
const GoogleMapViewController: React.FC<{
  riderCoords: { lat: number; lng: number };
  isSimulating: boolean;
  recenterCount: number;
  fitRouteCount: number;
}> = ({ riderCoords, isSimulating, recenterCount, fitRouteCount }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (isSimulating) {
      map.panTo(riderCoords);
    }
  }, [map, riderCoords, isSimulating]);

  useEffect(() => {
    if (!map || recenterCount === 0) return;
    map.panTo(riderCoords);
    map.setZoom(16);
  }, [map, recenterCount, riderCoords]);

  useEffect(() => {
    if (!map || fitRouteCount === 0) return;
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      bounds.extend({ lat: BAKERY_COORDS[0], lng: BAKERY_COORDS[1] });
      bounds.extend({ lat: DESTINATION_COORDS[0], lng: DESTINATION_COORDS[1] });
      map.fitBounds(bounds, 60);
    }
  }, [map, fitRouteCount]);

  return null;
};

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderId, onNavigate }) => {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<PlacedOrder | null>(null);

  // Google Maps API Key & Provider State
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyCUMcEreJEEQesdc6yVQkGEIyY7oysp3PE';
  const [mapProvider, setMapProvider] = useState<'google' | 'leaflet'>('google');
  const [googleMapType, setGoogleMapType] = useState<'roadmap' | 'hybrid' | 'terrain'>('roadmap');

  // Automatic seamless fallback to Leaflet OSM if Google Maps quota is reached or auth fails
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setMapProvider('leaflet');
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Camera triggers for Google Map
  const [recenterCount, setRecenterCount] = useState(0);
  const [fitRouteCount, setFitRouteCount] = useState(0);

  // Simulation & Map Animation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [riderProgress, setRiderProgress] = useState(0.35); // 0 (Bakery) to 1 (Destination)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'detailed'>('streets');
  const [copiedId, setCopiedId] = useState(false);

  // Rider Interaction Modals
  const [showCallModal, setShowCallModal] = useState(false);
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callSeconds, setCallSeconds] = useState(0);

  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'rider',
      text: 'Namaste! I have securely placed your cake in our flat refrigerated box. Driving with extra caution.',
      time: 'Just now',
    },
  ]);
  const [inputChatText, setInputChatText] = useState('');
  const [isRiderTyping, setIsRiderTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (showChatModal) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isRiderTyping, showChatModal]);

  // Tipping State
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [tipSuccess, setTipSuccess] = useState(false);

  // Collapse Details Card
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Refs for timers and map
  const timerRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Fetch Order
  const fetchOrder = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(id.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || 'No matching order found. Please check your Order ID.');
      }
      setTrackedOrder(data.order);
      syncRiderProgressFromStatus(data.order.status);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load order tracking.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Latest Order if no initialOrderId
  useEffect(() => {
    if (initialOrderId) {
      fetchOrder(initialOrderId);
    } else {
      fetch('/api/orders/latest')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data.order) {
            setOrderIdInput(data.order.orderId);
            setTrackedOrder(data.order);
            syncRiderProgressFromStatus(data.order.status);
          }
        })
        .catch(() => {});
    }
  }, [initialOrderId]);

  // Stage calculation
  const getStageIndex = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('placed')) return 0;
    if (s.includes('confirmed') || s.includes('received')) return 1;
    if (s.includes('prepar') || s.includes('baking')) return 2;
    if (s.includes('dispatch') || s.includes('ready')) return 3;
    if (s.includes('out') || s.includes('transit')) return 4;
    if (s.includes('deliver')) return 5;
    return 1;
  };

  const currentStageIdx = trackedOrder ? getStageIndex(trackedOrder.status) : 1;
  const isDelivered = currentStageIdx === 5;
  const isOutForDelivery = currentStageIdx === 4;

  const syncRiderProgressFromStatus = (status: string) => {
    const idx = getStageIndex(status);
    if (idx <= 1) setRiderProgress(0.05);
    else if (idx === 2) setRiderProgress(0.18);
    else if (idx === 3) setRiderProgress(0.32);
    else if (idx === 4) setRiderProgress(0.65);
    else if (idx === 5) setRiderProgress(1.0);
  };

  // Handle Advance Stage (Simulate progression like Zomato/Swiggy)
  const handleAdvanceStage = async (targetStage?: string) => {
    if (!trackedOrder) return;
    try {
      const res = await fetch(`/api/orders/${trackedOrder.orderId}/simulate-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStage }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setTrackedOrder(data.order);
        syncRiderProgressFromStatus(data.order.status);
      }
    } catch (e) {
      console.error('Failed to advance stage:', e);
    }
  };

  // Auto-play simulation loop
  useEffect(() => {
    if (!isSimulating || !trackedOrder) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRiderProgress((prev) => {
        if (prev >= 0.98) {
          handleAdvanceStage('Delivered');
          setIsSimulating(false);
          return 1.0;
        }
        const next = Math.min(1.0, prev + 0.05);
        if (next > 0.4 && currentStageIdx < 4) {
          handleAdvanceStage('Out for Delivery');
        }
        return next;
      });
    }, 1500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, trackedOrder, currentStageIdx]);

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
      const centerCoords = getInterpolatedPoint(riderProgress);
      const map = L.map(mapContainerRef.current, {
        center: centerCoords,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const getTileUrl = (style: 'streets' | 'satellite' | 'detailed') => {
        if (style === 'satellite') {
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        }
        if (style === 'detailed') {
          return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        }
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      };

      const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      L.polyline(REAL_ROUTE_COORDS, {
        color: '#BE123C',
        weight: 8,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const routeLine = L.polyline(REAL_ROUTE_COORDS, {
        color: '#881337',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      routePolylineRef.current = routeLine;

      const bakeryIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-white border-2 border-[#881337] shadow-lg px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#881337] mb-0.5">
              🎂 Sweet Bliss
            </div>
            <div class="w-8 h-8 rounded-full bg-[#881337] text-white flex items-center justify-center shadow-md border-2 border-white text-xs">
              🧁
            </div>
          </div>
        `,
        className: 'custom-bakery-pin',
        iconSize: [100, 48],
        iconAnchor: [50, 44],
      });
      L.marker(BAKERY_COORDS, { icon: bakeryIcon }).addTo(map);

      const destIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-white border-2 border-emerald-600 shadow-lg px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-800 mb-0.5">
              🏠 Doorstep
            </div>
            <div class="relative">
              <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white text-xs">
                📍
              </div>
              <div class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60"></div>
            </div>
          </div>
        `,
        className: 'custom-dest-pin',
        iconSize: [100, 48],
        iconAnchor: [50, 44],
      });
      L.marker(DESTINATION_COORDS, { icon: destIcon }).addTo(map);

      const riderCoords = getInterpolatedPoint(riderProgress);
      const riderIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-stone-900 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg border border-white/40 mb-0.5 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Rahul</span>
            </div>
            <div class="relative flex items-center justify-center">
              <div class="w-10 h-10 rounded-full bg-[#BE123C] text-white flex items-center justify-center shadow-xl border-2 border-white text-sm">
                🛵
              </div>
              <div class="absolute -inset-2 rounded-full border-2 border-rose-500/50 animate-ping pointer-events-none"></div>
            </div>
          </div>
        `,
        className: 'custom-rider-pin',
        iconSize: [120, 60],
        iconAnchor: [60, 52],
      });

      const riderMarker = L.marker(riderCoords, { icon: riderIcon, zIndexOffset: 1000 }).addTo(map);
      riderMarkerRef.current = riderMarker;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapProvider]);

  // Update Leaflet rider position
  useEffect(() => {
    if (mapProvider !== 'leaflet' || !riderMarkerRef.current || !mapInstanceRef.current) return;
    const riderCoords = getInterpolatedPoint(riderProgress);
    riderMarkerRef.current.setLatLng(riderCoords);
    if (isSimulating) {
      mapInstanceRef.current.panTo(riderCoords, { animate: true, duration: 1.2 });
    }
  }, [riderProgress, isSimulating, mapProvider]);

  // Center on Rider Action
  const handleCenterOnRider = () => {
    if (mapProvider === 'google') {
      setRecenterCount((c) => c + 1);
    } else if (mapInstanceRef.current) {
      const riderCoords = getInterpolatedPoint(riderProgress);
      mapInstanceRef.current.setView(riderCoords, 16, { animate: true });
    }
  };

  // Fit Entire Route Action
  const handleFitRoute = () => {
    if (mapProvider === 'google') {
      setFitRouteCount((c) => c + 1);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(L.latLngBounds([BAKERY_COORDS, DESTINATION_COORDS]), {
        padding: [60, 60],
        animate: true,
      });
    }
  };

  // Handle Call Simulator
  useEffect(() => {
    if (showCallModal) {
      setCallState('ringing');
      setCallSeconds(0);
      const ringTimer = setTimeout(() => {
        setCallState('connected');
        callTimerRef.current = setInterval(() => {
          setCallSeconds((s) => s + 1);
        }, 1000);
      }, 2500);

      return () => {
        clearTimeout(ringTimer);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
      };
    }
  }, [showCallModal]);

  const getRiderSmartReply = (rawText: string): string => {
    const t = rawText.toLowerCase().trim();

    // 1. हाय / Hi / Hey / Hello / नमस्ते
    if (
      t === 'hi' ||
      t === 'hey' ||
      t === 'hello' ||
      t.includes('हाय') ||
      t.includes('हेल्लो') ||
      t.includes('हेलो') ||
      t.includes('नमस्ते') ||
      t.includes('namaste') ||
      t.startsWith('hi ') ||
      t.startsWith('hey ') ||
      t.startsWith('hello ')
    ) {
      return 'हेलो! नमस्ते जी! मैं राहुल शर्मा (आपका डिलीवरी पार्टनर)। बताइए, मैं आपकी क्या मदद कर सकता हूँ? 😊';
    }

    // 2. गुड मॉर्निंग / Good morning / Suprabhat
    if (
      t.includes('गुड मॉर्निंग') ||
      t.includes('good morning') ||
      t.includes('suprabhat') ||
      t.includes('सुप्रभात') ||
      t === 'gm'
    ) {
      return 'गुड मॉर्निंग जी! ☀️ आपका दिन मंगलमय और मिठास भरा हो। आपका फ्रेश केक रास्ते में है और समय पर सुरक्षित पहुँच रहा हूँ।';
    }

    // 3. गुड नाइट / Good night / Shubh ratri
    if (
      t.includes('गुड नाइट') ||
      t.includes('good night') ||
      t.includes('goodnight') ||
      t.includes('shubh ratri') ||
      t.includes('शुभ रात्रि') ||
      t === 'gn'
    ) {
      return 'शुभ रात्रि (Good Night) जी! 🌙 उम्मीद है आज की सेलिब्रेशन बहुत यादगार रहेगी। स्वीट ब्लिस से जुड़ने के लिए दिल से धन्यवाद!';
    }

    // 4. गुड आफ्टरनून / Good afternoon
    if (t.includes('गुड आफ्टरनून') || t.includes('good afternoon') || t.includes('afternoon')) {
      return 'गुड आफ्टरनून जी! 🌤️ आपका केक बिल्कुल सेफ और टेम्परेचर-कंट्रोल्ड बॉक्स में ठंडा व फ्रेश सुरक्षित है।';
    }

    // 5. गुड इवनिंग / Good evening
    if (t.includes('गुड इवनिंग') || t.includes('good evening') || t.includes('evening')) {
      return 'गुड इवनिंग जी! 🌆 शाम की पार्टी के लिए आपका स्वादिष्ट केक बस कुछ ही मिनटों में आपके दरवाज़े पर होगा।';
    }

    // 6. हाउ आर यू / How are you / Kaise ho
    if (
      t.includes('हाउ आर यू') ||
      t.includes('how are you') ||
      t.includes('kaise ho') ||
      t.includes('कैसे हो') ||
      t.includes('aap kaise ho') ||
      t.includes('kaisa hai') ||
      t.includes('how r u')
    ) {
      return 'मैं बिल्कुल बढ़िया और सेफ हूँ जी! आप कैसे हैं? आपकी सेवा के लिए हमेशा तैयार। 🛵';
    }

    // 7. फाइन / Fine / I am fine / Theek hu / Badhiya
    if (
      t === 'fine' ||
      t.includes('फाइन') ||
      t.includes('i am fine') ||
      t.includes('im fine') ||
      t.includes('theek hu') ||
      t.includes('ठीक हूँ') ||
      t.includes('badhiya') ||
      t.includes('बढ़िया') ||
      t.includes('all good') ||
      t === 'good'
    ) {
      return 'यह जानकर बहुत खुशी हुई जी! 😊 अगर डिलीवरी के लिए कोई खास निर्देश हो तो बेझिझक बताएं।';
    }

    // 8. डिलीवरी टाइम / Delivery time / Kab tak / Kitna time / ETA
    if (
      t.includes('डिलीवरी टाइम') ||
      t.includes('delivery time') ||
      t.includes('kab tak') ||
      t.includes('कब तक') ||
      t.includes('kitna time') ||
      t.includes('kitni der') ||
      t.includes('eta') ||
      t.includes('when will you reach') ||
      t.includes('time lagega') ||
      t.includes('kitna der') ||
      t.includes('टाइम')
    ) {
      return 'मैं अभी आपके इलाके के काफी करीब हूँ! ट्रैफिक सामान्य है और अगले 10 से 15 मिनट में आपके पते पर पहुँच जाऊँगा। ⏱️';
    }

    // 9. लोकेशन / Location / Where are you / Kahan ho
    if (
      t.includes('लोकेशन') ||
      t.includes('location') ||
      t.includes('kahan ho') ||
      t.includes('कहाँ हो') ||
      t.includes('kidhar ho') ||
      t.includes('where are you') ||
      t.includes('live location') ||
      t.includes('rastay')
    ) {
      return 'मैं अभी मैप पर दिखाए अनुसार आपके डिलीवरी रूट पर आगे बढ़ रहा हूँ। आप ऊपर लाइव जीपीएस मैप पर मेरी रियल-टाइम लोकेशन भी देख सकते हैं! 📍';
    }

    // 10. केक सेफ है / Cake safe / Sambhal ke lana
    if (
      t.includes('केक सेफ') ||
      t.includes('cake safe') ||
      t.includes('sambhal') ||
      t.includes('संभाल') ||
      t.includes('careful') ||
      t.includes('toot') ||
      t.includes('damage') ||
      t.includes('horizontal') ||
      t.includes('flat')
    ) {
      return 'जी हाँ, 100% बेफिक्र रहिए! 🎂 हमारे पास विशेष शॉक-प्रूफ और लेवल्ड केक बॉक्स है। मैं बेहद सावधानी और धीमी गति से ड्राइव कर रहा हूँ ताकि केक बिल्कुल परफेक्ट रहे।';
    }

    // 11. डोरबेल मत बजाना / Doorbell / Don't ring bell / Baby sleeping
    if (
      t.includes('डोरबेल') ||
      t.includes('doorbell') ||
      t.includes('bell') ||
      t.includes('घंटी') ||
      t.includes('ring') ||
      t.includes('baby') ||
      t.includes('sleeping') ||
      t.includes('knock')
    ) {
      return 'बिल्कुल समझ गया जी! मैं डोरबेल बिल्कुल नहीं बजाऊँगा, दरवाज़े पर धीरे से नॉक करूँगा या मैसेज कर दूँगा। 🤫👍';
    }

    // 12. सिक्योरिटी गार्ड / Security guard / Guard ko de do
    if (
      t.includes('सिक्योरिटी') ||
      t.includes('गार्ड') ||
      t.includes('guard') ||
      t.includes('security') ||
      t.includes('watchman') ||
      t.includes('gatekeeper') ||
      t.includes('reception')
    ) {
      return 'जी बिल्कुल! मैं केक आपके अपार्टमेंट के मेन गेट / सिक्योरिटी डेस्क पर आपका नाम और फ्लैट नंबर लिखकर सुरक्षित सौंप दूँगा। 🛡️';
    }

    // 13. कॉल करो / Call me / Phone karo
    if (
      t.includes('कॉल करो') ||
      t.includes('call me') ||
      t.includes('phone') ||
      t.includes('फोन') ||
      t.includes('call') ||
      t.includes('contact') ||
      t.includes('baat karo')
    ) {
      return 'जी ज़रूर! जैसे ही मैं आपकी बिल्डिंग/गेट के पास पहुँचूँगा, तुरंत आपको कॉल कर लूँगा। आप चाहें तो ऊपर दिए कॉल बटन से भी सीधे बात कर सकते हैं। 📞';
    }

    // 14. ऑनलाइन पेमेंट / UPI QR / GPay / PhonePe / Cash
    if (
      t.includes('पेमेंट') ||
      t.includes('payment') ||
      t.includes('upi') ||
      t.includes('qr') ||
      t.includes('gpay') ||
      t.includes('phonepe') ||
      t.includes('paytm') ||
      t.includes('cash') ||
      t.includes('कैश')
    ) {
      return 'हाँजी, बिल्कुल! मेरे पास डिलीवरी पर कंपनी का UPI QR कोड उपलब्ध है। आप Google Pay, PhonePe, Paytm या कैश से आसानी से पेमेंट कर सकते हैं। 💳📲';
    }

    // 15. लेट क्यों / Late / Traffic / Jaldi aao
    if (
      t.includes('लेट') ||
      t.includes('late') ||
      t.includes('traffic') ||
      t.includes('jam') ||
      t.includes('jaldi') ||
      t.includes('hurry') ||
      t.includes('der')
    ) {
      return 'हल्का सा सिग्नल पर ट्रैफिक था जी, पर केक की नाजुक सजावट को सुरक्षित रखते हुए मैं तेज़ी से आ रहा हूँ, बस 5-8 मिनट में हाज़िर हूँ! 🛵💨';
    }

    // 16. एड्रेस / Landmark / Address / Flat No / Rasta
    if (
      t.includes('एड्रेस') ||
      t.includes('address') ||
      t.includes('landmark') ||
      t.includes('flat') ||
      t.includes('हाउस') ||
      t.includes('house') ||
      t.includes('रास्ता') ||
      t.includes('गली')
    ) {
      return 'जी, अगर कोई खास लैंडमार्क, गली या गेट नंबर हो तो कृपया यहाँ बता दीजिए, मुझे आपके पते तक सीधे पहुँचने में आसानी होगी। 🏡';
    }

    // 17. फ्रेश है / Fresh cake / Eggless / Veg
    if (
      t.includes('फ्रेश') ||
      t.includes('fresh') ||
      t.includes('eggless') ||
      t.includes('एगलेस') ||
      t.includes('veg') ||
      t.includes('ताज़ा') ||
      t.includes('quality')
    ) {
      return 'जी हाँ, यह 100% ताज़ा और आज ही बेक किया हुआ सर्टिफाइड केक है। इसे हाइजीनिक तरीके से सील पैक किया गया है। ✨';
    }

    // 18. कैंडल और चाकू / Candle / Knife / Chaku / Mombatti
    if (
      t.includes('कैंडल') ||
      t.includes('चाकू') ||
      t.includes('candle') ||
      t.includes('knife') ||
      t.includes('chaku') ||
      t.includes('mombatti') ||
      t.includes('spoon') ||
      t.includes('napkin')
    ) {
      return 'जी हाँ! केक बॉक्स के साथ बर्थडे कैंडल्स, केक नाइफ और नैपकिन्स का पाउच पहले से सुरक्षित लगा हुआ है। 🕯️🍴';
    }

    // 19. थैंक यू / Thank you / Thanks / Dhanyawad / Shukriya
    if (
      t.includes('थैंक यू') ||
      t.includes('thank you') ||
      t.includes('thanks') ||
      t.includes('dhanyawad') ||
      t.includes('धन्यवाद') ||
      t.includes('shukriya') ||
      t.includes('शुक्रिया') ||
      t === 'ty' ||
      t === 'thx'
    ) {
      return 'बहुत-बहुत धन्यवाद आपका! 🙏 आपके प्यारे शब्दों से हमारा दिन बन गया। आपकी सेलिब्रेशन बहुत शानदार रहे!';
    }

    // 20. ओके / OK / Theek hai / Alright / Done
    if (
      t === 'ok' ||
      t === 'okay' ||
      t === 'theek hai' ||
      t === 'ठीक है' ||
      t.includes('alright') ||
      t.includes('done') ||
      t.includes('got it') ||
      t.includes('acha') ||
      t === 'k'
    ) {
      return 'जी बहुत बढ़िया! बस कुछ ही पलों में आपसे मुलाक़ात होती है। Have a wonderful day! 🎉';
    }

    // 21. बाय / Bye / Alvida / See you / Take care
    if (
      t.includes('बाय') ||
      t.includes('bye') ||
      t.includes('alvida') ||
      t.includes('अलविदा') ||
      t.includes('see you') ||
      t.includes('take care')
    ) {
      return 'अलविदा और बहुत-बहुत धन्यवाद! अपना ध्यान रखें और केक का हर बाइट भरपूर एन्जॉय करें! 🍰✨';
    }

    // 22. तुम कौन हो / Who are you / Rahul
    if (
      t.includes('तुम कौन हो') ||
      t.includes('who are you') ||
      t.includes('kaun ho') ||
      t.includes('rahul') ||
      t.includes('rider') ||
      t.includes('driver')
    ) {
      return 'नमस्ते! मैं राहुल शर्मा हूँ, स्वीट ब्लिस बेकरी का डेडिकेटेड डिलीवरी पार्टनर (TVS Jupiter - DL 4S CY 9821)। आपका ऑर्डर पूरी सुरक्षा से ला रहा हूँ।';
    }

    // 23. सॉरी / Sorry
    if (t.includes('sorry') || t.includes('सॉरी') || t.includes('maaf')) {
      return 'अरे कोई बात नहीं जी! सब बिल्कुल ठीक है। बेझिझक जो भी ज़रूरत हो बताएं। 😊';
    }

    // 24. ऑर्डर नंबर / Order id
    if (t.includes('order') || t.includes('ऑर्डर') || t.includes('id') || t.includes('नंबर')) {
      return 'जी, आपका ऑर्डर मेरे सिस्टम में वेरिफाइड है और मैं आपके दिए गए पते की ओर पूरे ध्यान से बढ़ रहा हूँ।';
    }

    // 25. Default friendly confirmation
    return 'जी समझ गया सर! मैंने आपका मैसेज नोट कर लिया है और पूरी सावधानी से आपके निर्देश का पालन करूँगा। 👍';
  };

  const handleSendChat = (presetText?: string) => {
    const textToSend = presetText || inputChatText.trim();
    if (!textToSend || isRiderTyping) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: 'Just now',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    if (!presetText) setInputChatText('');
    setIsRiderTyping(true);

    const reply = getRiderSmartReply(textToSend);

    setTimeout(() => {
      setIsRiderTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'rider',
          text: reply,
          time: 'Just now',
        },
      ]);
    }, 850);
  };

  const handleCopyId = () => {
    if (!trackedOrder) return;
    navigator.clipboard.writeText(trackedOrder.orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const currentStageInfo = TRACKING_STAGES[currentStageIdx];
  const remainingMins = Math.max(0, Math.round(currentStageInfo.etaMins * (1 - riderProgress * 0.7)));
  const currentRiderPos = getInterpolatedPoint(riderProgress);
  const currentRiderLatLng = { lat: currentRiderPos[0], lng: currentRiderPos[1] };

  return (
    <div className="bg-[#FFF9F9] min-h-screen py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ================= TOP SEARCH & APP HEADER ================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#881337]">
                Live Order & GPS Tracking
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#881337] text-[10px] font-bold">
                Zomato & Swiggy Style
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Track Your Celebration Cake
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
              Real-time Google Maps telemetry, kitchen baking milestones, and delivery partner GPS radar.
            </p>
          </div>

          {/* Order Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrder(orderIdInput);
            }}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Order ID (e.g. SB-2026-XXXX)"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#881337] focus:border-transparent bg-stone-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#881337] hover:bg-[#9F1239] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Track</span>
              )}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => fetchOrder(orderIdInput)}
              className="text-xs font-bold text-[#881337] hover:underline cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* If No order is loaded */}
        {!trackedOrder && !loading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-rose-100 shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-[#881337] flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900">No Active Order Selected</h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              Enter an Order ID above to see live GPS tracking or explore freshly baked signature cakes.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 rounded-xl bg-[#881337] text-white text-sm font-semibold hover:bg-[#9F1239] transition-all cursor-pointer"
              >
                Browse Cake Menu
              </button>
              <button
                onClick={() => {
                  fetch('/api/orders/latest')
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.success && d.order) {
                        setOrderIdInput(d.order.orderId);
                        setTrackedOrder(d.order);
                        syncRiderProgressFromStatus(d.order.status);
                      }
                    });
                }}
                className="px-6 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-semibold transition-all cursor-pointer"
              >
                Load Sample Order
              </button>
            </div>
          </div>
        )}

        {/* MAIN TRACKING INTERFACE */}
        {trackedOrder && (
          <div className="space-y-6">
            {/* ================= 1. DYNAMIC ETA HERO CARD ================= */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#881337] via-[#9F1239] to-[#BE123C] text-white p-6 sm:p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase">
                      {isDelivered
                        ? 'Delivered with Joy 🎉'
                        : `Estimated Delivery in ~${remainingMins} mins`}
                    </span>
                    <span className="text-[11px] text-rose-100 flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Route Active
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                    {isDelivered
                      ? 'Cake Delivered to Doorstep! 🎂'
                      : isOutForDelivery
                      ? 'Rahul is zooming on scooter towards your address! 🛵'
                      : currentStageIdx === 3
                      ? 'Cake sealed in chilled box & awaiting rider ❄️'
                      : currentStageIdx === 2
                      ? 'Pastry Chef is whipping cream & decorating 🎂'
                      : 'Sweet Bliss accepted your order! 🎉'}
                  </h2>

                  <p className="text-xs sm:text-sm text-rose-100/90 max-w-xl leading-relaxed">
                    {currentStageInfo.detailedDesc}
                  </p>
                </div>

                {/* Simulation Control Badge (Zomato/Swiggy Live Demonstration) */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 shrink-0 flex flex-col sm:items-end gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-rose-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Live Journey Controller</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSimulating(!isSimulating)}
                      className="px-3 py-1.5 rounded-xl bg-white text-[#881337] font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Simulating...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Auto-Play Live</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleAdvanceStage()}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Step Stage ⏩
                    </button>

                    <button
                      onClick={() => {
                        handleAdvanceStage('Order Confirmed');
                        setRiderProgress(0.08);
                      }}
                      title="Reset simulation to initial status"
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 2. OFFICIAL GOOGLE MAPS GPS TRACKER ================= */}
            <div className="bg-white rounded-3xl border border-rose-100 shadow-md overflow-hidden">
              {/* Map Controls Header with API Key Indicator */}
              <div className="p-4 sm:p-5 border-b border-rose-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-100 text-[#881337] flex items-center justify-center font-bold">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 text-xs sm:text-sm">
                        Live Delivery Tracking Radar
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live GPS Active
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      From: <strong>Sweet Bliss Bakery (Somajiguda)</strong> → To: <strong>{trackedOrder.customer.address}, {trackedOrder.customer.city}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Provider & Style Switcher */}
                  <div className="flex bg-white rounded-xl border border-stone-200 p-0.5 shadow-2xs">
                    <button
                      onClick={() => {
                        setMapProvider('google');
                        setGoogleMapType('roadmap');
                        setMapStyle('streets');
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        (mapProvider === 'google' && googleMapType === 'roadmap') || (mapProvider === 'leaflet' && mapStyle === 'streets')
                          ? 'bg-[#881337] text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🗺️ Road
                    </button>
                    <button
                      onClick={() => {
                        setMapProvider('google');
                        setGoogleMapType('hybrid');
                        setMapStyle('satellite');
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        (mapProvider === 'google' && googleMapType === 'hybrid') || (mapProvider === 'leaflet' && mapStyle === 'satellite')
                          ? 'bg-[#881337] text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🛰️ Satellite
                    </button>
                    <button
                      onClick={() => {
                        setMapProvider('leaflet');
                        setMapStyle('detailed');
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        mapProvider === 'leaflet' && mapStyle === 'detailed'
                          ? 'bg-[#881337] text-white'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🌐 OSM
                    </button>
                  </div>

                  {/* Camera Recenter Buttons */}
                  <button
                    onClick={handleCenterOnRider}
                    className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-[#881337] shadow-2xs transition-colors cursor-pointer"
                    title="Center on Delivery Scooter"
                  >
                    <Crosshair className="w-4 h-4 text-[#881337]" />
                  </button>

                  <button
                    onClick={handleFitRoute}
                    className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-[#881337] shadow-2xs transition-colors cursor-pointer"
                    title="Show Full Route"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Map Rendering Container */}
              <div className="relative w-full h-[380px] sm:h-[450px]">
                {mapProvider === 'google' ? (
                  <APIProvider apiKey={apiKey} libraries={['marker', 'routes', 'geometry']}>
                    <GoogleMap
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      defaultCenter={{ lat: 17.4265, lng: 78.4350 }}
                      defaultZoom={14}
                      mapTypeId={googleMapType}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      className="w-full h-full"
                    >
                      {/* Controller for interactive camera movement */}
                      <GoogleMapViewController
                        riderCoords={currentRiderLatLng}
                        isSimulating={isSimulating}
                        recenterCount={recenterCount}
                        fitRouteCount={fitRouteCount}
                      />

                      {/* Route Polyline Glow & Core Line */}
                      <Polyline
                        path={REAL_ROUTE_GOOGLE_COORDS}
                        strokeColor="#BE123C"
                        strokeWeight={9}
                        strokeOpacity={0.3}
                      />
                      <Polyline
                        path={REAL_ROUTE_GOOGLE_COORDS}
                        strokeColor="#881337"
                        strokeWeight={4}
                        strokeOpacity={0.9}
                      />

                      {/* 1. Bakery Origin Marker */}
                      <AdvancedMarker
                        position={{ lat: BAKERY_COORDS[0], lng: BAKERY_COORDS[1] }}
                        title="Sweet Bliss Artisan Bakery"
                      >
                        <div className="flex flex-col items-center cursor-pointer group">
                          <div className="bg-white border-2 border-[#881337] shadow-lg px-2.5 py-1 rounded-xl text-[10px] font-bold text-[#881337] flex items-center gap-1 whitespace-nowrap mb-1">
                            <span>🎂 Sweet Bliss Bakery</span>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-[#881337] text-white flex items-center justify-center shadow-lg border-2 border-white text-sm">
                            🧁
                          </div>
                        </div>
                      </AdvancedMarker>

                      {/* 2. Customer Destination Marker */}
                      <AdvancedMarker
                        position={{ lat: DESTINATION_COORDS[0], lng: DESTINATION_COORDS[1] }}
                        title="Delivery Destination"
                      >
                        <div className="flex flex-col items-center cursor-pointer">
                          <div className="bg-white border-2 border-emerald-600 shadow-lg px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-800 flex items-center gap-1 whitespace-nowrap mb-1">
                            <span>🏠 {trackedOrder.customer.fullName}</span>
                          </div>
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-sm">
                              📍
                            </div>
                            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60"></div>
                          </div>
                        </div>
                      </AdvancedMarker>

                      {/* 3. Real-Time Moving Rider Marker */}
                      <AdvancedMarker
                        position={currentRiderLatLng}
                        title="Delivery Partner: Rahul Sharma"
                        zIndex={100}
                      >
                        <div className="flex flex-col items-center cursor-pointer">
                          <div className="bg-stone-900 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xl border border-white/40 whitespace-nowrap mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Rahul (32 km/h)</span>
                          </div>
                          <div className="relative flex items-center justify-center">
                            <div className="w-11 h-11 rounded-full bg-[#BE123C] text-white flex items-center justify-center shadow-2xl border-3 border-white text-lg">
                              🛵
                            </div>
                            <div className="absolute -inset-2 rounded-full border-2 border-rose-500/50 animate-ping pointer-events-none"></div>
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
                      Rider: <strong>Rahul</strong> (32 km/h)
                    </span>
                  </div>
                  <span className="text-stone-300">|</span>
                  <div className="flex items-center gap-1 text-stone-600">
                    <Compass className="w-3.5 h-3.5 text-[#881337]" />
                    <span>Heading: South-West</span>
                  </div>
                  <span className="text-stone-300 hidden sm:inline">|</span>
                  <div className="hidden sm:flex items-center gap-1 text-stone-600">
                    <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                    <span>Carrier Temp: 4.2°C</span>
                  </div>
                </div>

                {/* Floating Live Telemetry Badge (Top Right) */}
                <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 shadow-md text-[11px] font-medium text-stone-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Cake Shock Suspension Active</span>
                </div>
              </div>
            </div>

            {/* ================= 3. RIDER PROFILE & INTERACTION CARD ================= */}
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Rider Info */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={DEFAULT_RIDER.avatar}
                      alt={DEFAULT_RIDER.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-200 shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 text-base sm:text-lg">
                        {DEFAULT_RIDER.name}
                      </h4>
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {DEFAULT_RIDER.rating}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5">
                      {DEFAULT_RIDER.totalDeliveries}+ safe cake deliveries completed
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-600">
                      <span className="flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-[#881337]" />
                        {DEFAULT_RIDER.vehicleNumber}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5" />
                        Temp Checked (98.4°F)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Communication Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCallModal(true)}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Call Rahul</span>
                  </button>

                  <button
                    onClick={() => setShowChatModal(true)}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#881337] hover:bg-[#9F1239] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/10 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message (Delivery Note)</span>
                  </button>
                </div>
              </div>

              {/* Delivery Tip Section */}
              <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-stone-900 text-xs sm:text-sm">
                    Show your appreciation with a delivery tip
                  </h5>
                  <p className="text-stone-500 text-xs">
                    100% of your tip goes directly to Rahul for handling delicate celebration cakes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {[20, 30, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setSelectedTip(amt);
                        setTipSuccess(true);
                        setTimeout(() => setTipSuccess(false), 2500);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedTip === amt
                          ? 'bg-[#881337] border-[#881337] text-white shadow-xs'
                          : 'border-stone-200 bg-stone-50 hover:bg-rose-50 hover:border-rose-200 text-stone-700'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  {tipSuccess && (
                    <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                      Tip Added! ❤️
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ================= 4. DETAILED 6-STAGE MILESTONE TIMELINE ================= */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                <span>Celebration Progress Tracker</span>
                <span className="text-xs font-sans font-normal text-stone-500">
                  (Stage {currentStageIdx + 1} of 6)
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
                {TRACKING_STAGES.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isDone = idx < currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  const isPending = idx > currentStageIdx;

                  return (
                    <div
                      key={stage.key}
                      onClick={() => handleAdvanceStage(stage.key)}
                      title={`Click to set stage to: ${stage.label}`}
                      className={`relative rounded-2xl p-4 transition-all border cursor-pointer ${
                        isCurrent
                          ? 'bg-rose-50/80 border-[#881337] shadow-sm ring-2 ring-rose-200'
                          : isDone
                          ? 'bg-stone-50/70 border-stone-200 hover:border-rose-200'
                          : 'bg-stone-50/40 border-stone-100 opacity-60 hover:opacity-100'
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
            </div>

            {/* ================= 5. COLLAPSIBLE ORDER RECEIPT & DETAILS ================= */}
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
                      {trackedOrder.items.length} celebration items • Total ₹{trackedOrder.total}
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
                        const itemImg = productMatch?.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&auto=format&fit=crop&q=80';
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
                                  <span>Weight: {item.weightKg} kg</span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity}</span>
                                  {item.cakeMessage && (
                                    <>
                                      <span>•</span>
                                      <span className="italic text-rose-700">
                                        "{item.cakeMessage}"
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
                      <p className="text-stone-500">Phone: {trackedOrder.customer.phone}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <Clock className="w-4 h-4 text-[#881337]" />
                        <span>Payment & Invoice</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="text-stone-500">Payment Status:</span>
                        <span className="font-bold text-emerald-700 uppercase">
                          {trackedOrder.paymentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="text-stone-500">Method:</span>
                        <span className="font-bold text-stone-800">
                          {trackedOrder.paymentMethod === 'razorpay'
                            ? 'Razorpay / UPI Online'
                            : 'Cash on Delivery'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-stone-500 font-bold">Total Paid:</span>
                        <span className="font-extrabold text-[#881337] text-sm">
                          ₹{trackedOrder.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



        {/* ================= MODAL: CALL RIDER SIMULATION ================= */}
        {showCallModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-stone-900 text-white rounded-3xl max-w-sm w-full p-6 text-center space-y-6 shadow-2xl border border-stone-700 animate-in fade-in zoom-in-95">
              <div className="relative mx-auto w-24 h-24">
                <img
                  src={DEFAULT_RIDER.avatar}
                  alt={DEFAULT_RIDER.name}
                  className="w-full h-full rounded-full object-cover border-4 border-rose-500 shadow-xl"
                />
                {callState === 'ringing' && (
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-60" />
                )}
              </div>

              <div>
                <h3 className="font-bold text-lg">{DEFAULT_RIDER.name}</h3>
                <p className="text-xs text-rose-300 font-mono mt-0.5">{DEFAULT_RIDER.phone}</p>
                <div className="mt-2 text-xs font-semibold text-emerald-400">
                  {callState === 'ringing' ? (
                    <span className="animate-pulse">Calling Delivery Partner... 📞</span>
                  ) : (
                    <span>
                      Connected ({Math.floor(callSeconds / 60)}:{(callSeconds % 60).toString().padStart(2, '0')})
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-stone-800/80 rounded-2xl p-3 text-xs text-stone-300 text-left space-y-1">
                <p className="font-semibold text-stone-200">Rahul says:</p>
                <p className="italic">
                  "Hello sir! I am crossing Nagarjuna Circle right now. Cake carrier is kept 100% horizontal and refrigerated. Arriving in ~12 mins!"
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setShowCallModal(false)}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  <Phone className="w-6 h-6 rotate-[135deg]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: CHAT WITH RIDER ================= */}
        {showChatModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full flex flex-col h-[520px] shadow-2xl border border-rose-100 overflow-hidden animate-in fade-in zoom-in-95">
              {/* Chat Header */}
              <div className="p-4 bg-[#881337] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={DEFAULT_RIDER.avatar}
                    alt={DEFAULT_RIDER.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
                  />
                  <div>
                    <h4 className="font-bold text-sm">{DEFAULT_RIDER.name}</h4>
                    <span className="text-[11px] text-rose-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active on Scooter (Handsfree)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#881337] text-white rounded-br-xs shadow-xs'
                          : 'bg-white text-stone-800 border border-stone-200 shadow-2xs rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {/* Live Typing Indicator */}
                {isRiderTyping && (
                  <div className="flex flex-col items-start animate-in fade-in duration-200">
                    <div className="bg-white text-stone-600 border border-rose-100 px-3.5 py-2 rounded-2xl rounded-bl-xs text-xs flex items-center gap-2 shadow-2xs">
                      <span className="text-[11px] font-medium text-rose-800">राहुल लिख रहे हैं...</span>
                      <span className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-[#881337] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-[#881337] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-[#881337] rounded-full animate-bounce" />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Preset Buttons (Hindi & English) */}
              <div className="p-2.5 border-t border-stone-100 bg-white flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleSendChat('हाय')}
                  className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap cursor-pointer font-medium transition-colors"
                >
                  👋 हाय / Hi
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('डिलीवरी टाइम क्या है? कब तक आओगे?')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  ⏰ डिलीवरी टाइम?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('आपकी लोकेशन कहाँ है?')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  📍 लोकेशन कहाँ है?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('क्या केक सेफ है?')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  🎂 क्या केक सेफ है?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('डोरबेल मत बजाना, बच्चे सो रहे हैं।')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  🤫 डोरबेल मत बजाना
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('केक अपार्टमेंट के सिक्योरिटी गार्ड को दे दीजिए।')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  🛡️ गार्ड को दे दो
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('पहुँचते ही मुझे कॉल करना।')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  📞 पहुँचकर कॉल करना
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('मैं डिलीवरी पर UPI QR से पेमेंट करूँगा।')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  💵 UPI से पे करूँगा
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('थैंक यू राहुल जी!')}
                  className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 whitespace-nowrap cursor-pointer transition-colors"
                >
                  🙏 थैंक यू
                </button>
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white border-t border-stone-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="मैसेज लिखें (उदा. हाय, डिलीवरी टाइम, लोकेशन)..."
                  value={inputChatText}
                  onChange={(e) => setInputChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#881337] bg-stone-50"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={isRiderTyping || !inputChatText.trim()}
                  className="p-2.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] disabled:opacity-50 text-white transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
