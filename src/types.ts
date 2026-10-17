import { CakeProduct } from './data/bakeryData.ts';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  pincode?: string;
  memberTier: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  loyaltyPoints: number;
  createdAt: string;
}

export interface CartItem {
  id: string; // unique item id
  product: CakeProduct;
  selectedSizeLabel: string;
  weightKg: number;
  unitPrice: number;
  quantity: number;
  isEggless: boolean;
  cakeMessage: string;
  flavour: string;
  selectedVariant?: string;
}

export type PageRoute =
  | 'home'
  | 'shop'
  | 'product-detail'
  | 'custom-order'
  | 'cart'
  | 'checkout'
  | 'order-confirmation'
  | 'track-order'
  | 'admin'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms';

export interface OrderCustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  landmark?: string;
}

export interface PlacedOrder {
  orderId: string;
  customer: OrderCustomerInfo;
  items: Array<{
    productId: string;
    name: string;
    weightKg: number;
    price: number;
    quantity: number;
    isEggless: boolean;
    cakeMessage?: string;
    flavour?: string;
  }>;
  deliveryDate: string;
  deliverySlot: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  orderNotes?: string;
  createdAt: string;
  status: string;
  cancellationReason?: string;
  razorpayOrderId?: string;
  transactionId?: string;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string }>;
}

export type IngredientCategory =
  | 'Flour & Grains'
  | 'Dairy & Fats'
  | 'Sugars & Sweeteners'
  | 'Chocolate & Cocoa'
  | 'Flavourings & Extracts'
  | 'Leavening & Additives'
  | 'Packaging & Kitchen';

export type IngredientUnit = 'kg' | 'liters' | 'grams' | 'ml' | 'packets';

export interface BakingIngredient {
  id: string;
  name: string;
  category: IngredientCategory;
  currentStock: number;
  unit: IngredientUnit;
  minimumThreshold: number; // Low stock alert below this
  idealStock: number; // Par level
  costPerUnit: number; // Cost in INR
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  storageLocation: string; // e.g. "Dry Storage Bin A", "Cold Room / Walk-in 4°C"
  notes?: string;
}
