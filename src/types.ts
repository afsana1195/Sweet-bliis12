import { CakeProduct } from './data/bakeryData.ts';

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
