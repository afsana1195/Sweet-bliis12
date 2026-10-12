import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { PRODUCTS, BUSINESS_CONFIG } from './src/data/bakeryData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent storage file paths
const ORDERS_FILE = path.join(__dirname, 'orders_store.json');
const CUSTOM_CAKES_FILE = path.join(__dirname, 'custom_cakes_store.json');

export interface StoredOrder {
  orderId: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    pincode: string;
    city: string;
    landmark?: string;
  };
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
  paymentStatus: 'PAID' | 'PENDING' | 'PAYMENT_FAILED';
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  orderNotes?: string;
  createdAt: string;
  status:
    | 'Order Placed'
    | 'Order Confirmed'
    | 'Preparing Your Order'
    | 'Ready for Dispatch'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled';
  razorpayOrderId?: string;
  transactionId?: string;
  cancellationReason?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

interface StoredCustomCake {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  occasion: string;
  flavour: string;
  weightKg: number;
  guestCount: number;
  themeDescription: string;
  colorPalette: string;
  messageOnCake: string;
  dietaryPreference: string;
  deliveryDate: string;
  budgetBudget: string;
  estimatedPrice: number;
  status: 'Inquiry' | 'Quoted' | 'Confirmed';
  createdAt: string;
  hasReferenceImage: boolean;
}

// Helpers for file persistence
function loadOrders(): StoredOrder[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read orders from disk:', err);
  }
  return [];
}

function saveOrders(orders: StoredOrder[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save orders to disk:', err);
  }
}

function loadCustomCakes(): StoredCustomCake[] {
  try {
    if (fs.existsSync(CUSTOM_CAKES_FILE)) {
      const data = fs.readFileSync(CUSTOM_CAKES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read custom cakes from disk:', err);
  }
  return [];
}

function saveCustomCakes(cakes: StoredCustomCake[]) {
  try {
    fs.writeFileSync(CUSTOM_CAKES_FILE, JSON.stringify(cakes, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save custom cakes to disk:', err);
  }
}

const ordersStore: StoredOrder[] = loadOrders();
const customCakeStore: StoredCustomCake[] = loadCustomCakes();

// Calculation Helper: calculate amounts strictly on server in INR & Paise
function calculateOrderFinancials(items: any[], deliverySlot: string) {
  let calculatedSubtotal = 0;
  const validatedItems = items.map((item: any) => {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    let itemUnitPrice = 0;

    if (product) {
      if (item.variantName && product.productVariants) {
        const v = product.productVariants.find((pv) => pv.name === item.variantName);
        if (v) itemUnitPrice = v.price;
      }
      if (!itemUnitPrice) {
        const weightMultiplier = item.weightKg === 1.0 ? 1.85 : item.weightKg === 2.0 ? 3.5 : 1.0;
        itemUnitPrice = Math.round(product.price * weightMultiplier);
      }
    } else {
      itemUnitPrice = item.price || 120;
    }

    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    calculatedSubtotal += itemUnitPrice * qty;

    return {
      productId: item.productId,
      name: item.variantName
        ? `${product ? product.name : item.name} (${item.variantName})`
        : (product ? product.name : item.name || 'Artisan Treat'),
      weightKg: item.weightKg || 0.5,
      price: itemUnitPrice,
      quantity: qty,
      isEggless: item.isEggless ?? true,
      cakeMessage: item.cakeMessage || '',
      flavour: item.flavour || (product?.flavours?.[0] ?? 'Classic'),
    };
  });

  const isMidnight = deliverySlot === 'midnight';
  const deliveryFee = calculatedSubtotal >= BUSINESS_CONFIG.freeDeliveryThreshold
    ? (isMidnight ? 99 : 0)
    : (isMidnight ? BUSINESS_CONFIG.expressMidnightDeliveryFee : BUSINESS_CONFIG.standardDeliveryFee);

  const discount = calculatedSubtotal > 1500 ? Math.round(calculatedSubtotal * 0.1) : 0;
  const total = Math.max(0, calculatedSubtotal + deliveryFee - discount);
  const totalPaise = total * 100;

  return {
    subtotal: calculatedSubtotal,
    deliveryFee,
    discount,
    total,
    totalPaise,
    validatedItems,
  };
}

// Razorpay Order Creation via Gateway API
async function createRazorpayOrderOnGateway(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const isRealKey = Boolean(keyId && keySecret && !keyId.includes('YourKeyId'));

  if (!isRealKey) {
    // Test mode sandbox order ID
    return {
      id: `order_sandbox_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      amount: amountPaise,
      currency: 'INR',
      receipt,
      isSandbox: true,
    };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Razorpay API error body:', errorBody);
    throw new Error(`Razorpay gateway error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    isSandbox: false,
  };
}

// Signature Verification
function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isRealKey = Boolean(keySecret && !keySecret.includes('YourKeySecret'));

  if (!isRealKey) {
    // In sandbox test mode, accept simulated payment response if paymentId is present
    return Boolean(orderId && paymentId);
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// -------------------------------------------------------------
// 1. PRODUCTS API
// -------------------------------------------------------------
app.get('/api/products', (req: Request, res: Response) => {
  const { category, search, occasion } = req.query;
  let filtered = [...PRODUCTS];

  if (category && category !== 'all') {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (occasion) {
    filtered = filtered.filter((p) =>
      p.occasions.some((o) => o.toLowerCase() === (occasion as string).toLowerCase())
    );
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.flavours.some((f) => f.toLowerCase().includes(q)) ||
        p.categoryLabel.toLowerCase().includes(q)
    );
  }

  res.json({ products: filtered, count: filtered.length });
});

// -------------------------------------------------------------
// 2. PAYMENT GATEWAY API (Razorpay UPI, Cards & Config)
// -------------------------------------------------------------
app.get('/api/payment/config', (_req: Request, res: Response) => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_SweetBlissSandbox';
  const isConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_ID.includes('YourKeyId')
  );

  res.json({
    keyId,
    currency: 'INR',
    isGatewayConfigured: isConfigured,
    mode: isConfigured ? 'live_or_test_key' : 'sandbox_test_mode',
  });
});

// Initiate Razorpay Order with server-calculated amount
app.post('/api/payment/razorpay-order', async (req: Request, res: Response) => {
  try {
    const { customer, items, deliveryDate, deliverySlot, orderNotes } = req.body;

    if (!customer?.fullName || !customer?.phone || !customer?.address) {
      return res.status(400).json({ error: 'Customer name, phone, and delivery address are required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const financials = calculateOrderFinancials(items, deliverySlot || 'evening');
    const orderId = `SB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const rzpOrder = await createRazorpayOrderOnGateway(
      financials.totalPaise,
      `rcpt_${orderId}`,
      {
        orderId,
        customerName: customer.fullName,
        customerPhone: customer.phone,
      }
    );

    // Stage order in database as "Order Placed" with paymentStatus: "PENDING"
    const stagedOrder: StoredOrder = {
      orderId,
      customer,
      items: financials.validatedItems,
      deliveryDate: deliveryDate || new Date().toISOString().split('T')[0],
      deliverySlot: deliverySlot || 'evening',
      paymentMethod: 'ONLINE_UPI',
      paymentStatus: 'PENDING',
      subtotal: financials.subtotal,
      deliveryFee: financials.deliveryFee,
      discount: financials.discount,
      total: financials.total,
      orderNotes: orderNotes || '',
      createdAt: new Date().toISOString(),
      status: 'Order Placed',
      razorpayOrderId: rzpOrder.id,
      statusHistory: [
        {
          status: 'Order Placed',
          timestamp: new Date().toISOString(),
          note: 'Awaiting UPI / online payment confirmation',
        },
      ],
    };

    ordersStore.unshift(stagedOrder);
    saveOrders(ordersStore);

    res.json({
      success: true,
      pendingOrderId: orderId,
      razorpayOrderId: rzpOrder.id,
      amountPaise: financials.totalPaise,
      amountInr: financials.total,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SweetBlissSandbox',
      isSandbox: rzpOrder.isSandbox,
      financials,
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: err.message || 'Failed to initiate Razorpay order' });
  }
});

// Verify cryptographic signature before confirming order
app.post('/api/payment/verify-signature', (req: Request, res: Response) => {
  try {
    const { pendingOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!pendingOrderId || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing required payment verification parameters' });
    }

    const order = ordersStore.find((o) => o.orderId === pendingOrderId);
    if (!order) {
      return res.status(404).json({ error: 'Order record not found' });
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id || order.razorpayOrderId || '',
      razorpay_payment_id,
      razorpay_signature || ''
    );

    if (!isValid) {
      order.paymentStatus = 'PAYMENT_FAILED';
      order.statusHistory.push({
        status: 'Payment Failed',
        timestamp: new Date().toISOString(),
        note: 'Razorpay HMAC signature verification failed',
      });
      saveOrders(ordersStore);
      return res.status(400).json({
        verified: false,
        error: 'Payment signature could not be verified securely. Please retry.',
      });
    }

    // Payment is valid! Mark as PAID & Confirmed
    order.paymentStatus = 'PAID';
    order.status = 'Order Confirmed';
    order.transactionId = razorpay_payment_id;
    order.statusHistory.push({
      status: 'Order Confirmed',
      timestamp: new Date().toISOString(),
      note: `Payment verified via Razorpay UPI (${razorpay_payment_id})`,
    });

    saveOrders(ordersStore);

    res.json({
      verified: true,
      message: 'Payment verified and order confirmed successfully',
      order,
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Razorpay Webhook endpoint for asynchronous server-to-server notifications
app.post('/api/payment/webhook', (req: Request, res: Response) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string;

    if (secret && signature && !secret.includes('YourWebhookSecret')) {
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        console.warn('Webhook signature mismatch');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;
    const rzpOrderId = paymentEntity?.order_id;

    if (rzpOrderId) {
      const order = ordersStore.find((o) => o.razorpayOrderId === rzpOrderId);
      if (order) {
        if (event === 'payment.captured' || event === 'order.paid') {
          order.paymentStatus = 'PAID';
          if (order.status === 'Order Placed') {
            order.status = 'Order Confirmed';
          }
          order.transactionId = paymentEntity?.id || order.transactionId;
          order.statusHistory.push({
            status: 'Order Confirmed',
            timestamp: new Date().toISOString(),
            note: 'Confirmed via Razorpay Webhook notification',
          });
          saveOrders(ordersStore);
        } else if (event === 'payment.failed') {
          order.paymentStatus = 'PAYMENT_FAILED';
          order.statusHistory.push({
            status: 'Payment Failed',
            timestamp: new Date().toISOString(),
            note: 'Payment failed reported via Webhook',
          });
          saveOrders(ordersStore);
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// -------------------------------------------------------------
// 3. CASH ON DELIVERY (COD) ORDER CREATION
// -------------------------------------------------------------
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const { customer, items, deliveryDate, deliverySlot, paymentMethod, orderNotes } = req.body;

    if (!customer?.fullName || !customer?.phone || !customer?.address) {
      return res.status(400).json({ error: 'Customer name, phone, and delivery address are required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const financials = calculateOrderFinancials(items, deliverySlot || 'evening');
    const orderId = `SB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const isCOD = paymentMethod === 'COD';

    const newOrder: StoredOrder = {
      orderId,
      customer,
      items: financials.validatedItems,
      deliveryDate: deliveryDate || new Date().toISOString().split('T')[0],
      deliverySlot: deliverySlot || 'evening',
      paymentMethod: isCOD ? 'COD' : paymentMethod || 'ONLINE_UPI',
      paymentStatus: isCOD ? 'PENDING' : 'PAID',
      subtotal: financials.subtotal,
      deliveryFee: financials.deliveryFee,
      discount: financials.discount,
      total: financials.total,
      orderNotes: orderNotes || '',
      createdAt: new Date().toISOString(),
      status: 'Order Confirmed',
      statusHistory: [
        {
          status: 'Order Placed',
          timestamp: new Date().toISOString(),
          note: isCOD ? 'Cash on Delivery order booked' : 'Order placed',
        },
        {
          status: 'Order Confirmed',
          timestamp: new Date().toISOString(),
          note: isCOD ? 'Confirmed for doorstep cash/UPI payment' : 'Confirmed',
        },
      ],
    };

    ordersStore.unshift(newOrder);
    saveOrders(ordersStore);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: newOrder,
    });
  } catch (err: unknown) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// -------------------------------------------------------------
// 4. ORDER TRACKING API (Customer Verification by Order ID + Phone/Email)
// -------------------------------------------------------------
app.get('/api/orders/track', (req: Request, res: Response) => {
  const { orderId, phoneOrEmail } = req.query;

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const cleanId = orderId.trim().toUpperCase();
  const found = ordersStore.find((o) => o.orderId.toUpperCase() === cleanId);

  if (!found) {
    return res.status(404).json({ error: 'No order found with the provided Order ID.' });
  }

  // If phoneOrEmail is provided, verify match for customer privacy
  if (phoneOrEmail && typeof phoneOrEmail === 'string') {
    const input = phoneOrEmail.trim().toLowerCase();
    const phoneDigits = input.replace(/\D/g, '');
    const phoneMatch = phoneDigits.length >= 4 && found.customer?.phone
      ? found.customer.phone.replace(/\D/g, '').includes(phoneDigits)
      : false;
    const emailMatch = found.customer?.email
      ? found.customer.email.toLowerCase().includes(input)
      : false;

    if (!phoneMatch && !emailMatch) {
      return res.status(403).json({
        error: 'The phone number or email does not match our records for this order.',
      });
    }
  }

  res.json({
    success: true,
    order: found,
  });
});

// -------------------------------------------------------------
// 5. PROTECTED BAKERY ADMIN MANAGEMENT API
// -------------------------------------------------------------
const ADMIN_API_KEY = process.env.ADMIN_KEY || 'sweetbliss-admin-2026';

function verifyAdminAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['x-admin-key'] || req.headers.authorization;
  if (!authHeader || authHeader !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication key required' });
  }
  next();
}

app.get('/api/admin/orders', verifyAdminAuth, (req: Request, res: Response) => {
  const { status, search } = req.query;
  let result = [...ordersStore];

  if (status && status !== 'all') {
    result = result.filter((o) => o.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    result = result.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.phone.includes(q)
    );
  }

  res.json({
    orders: result,
    count: result.length,
    stats: {
      total: ordersStore.length,
      confirmed: ordersStore.filter((o) => o.status === 'Order Confirmed').length,
      preparing: ordersStore.filter((o) => o.status === 'Preparing Your Order').length,
      ready: ordersStore.filter((o) => o.status === 'Ready for Dispatch').length,
      outForDelivery: ordersStore.filter((o) => o.status === 'Out for Delivery').length,
      delivered: ordersStore.filter((o) => o.status === 'Delivered').length,
      cancelled: ordersStore.filter((o) => o.status === 'Cancelled').length,
    },
  });
});

app.patch('/api/admin/orders/:orderId/status', verifyAdminAuth, (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status, note, paymentStatus, cancellationReason } = req.body;

  const order = ordersStore.find((o) => o.orderId.toUpperCase() === orderId.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (status) {
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status} by bakery manager`,
    });
  }

  if (cancellationReason) {
    order.cancellationReason = cancellationReason;
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  saveOrders(ordersStore);

  res.json({
    success: true,
    message: `Order ${order.orderId} updated to ${order.status}`,
    order,
  });
});

// -------------------------------------------------------------
// 6. AI ASSISTANT API (Sweet Bliss AI Assistant)
// -------------------------------------------------------------
app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  try {
    const { message, history = [], userPreferences = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const catalogueSummary = PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.categoryLabel,
      basePrice: p.price,
      rating: p.rating,
      flavours: p.flavours,
      isEgglessAvailable: true,
      occasions: p.occasions,
      description: p.description,
    }));

    if (geminiClient && process.env.GEMINI_API_KEY) {
      const systemInstruction = `
You are the master baker and celebration consultant for "Sweet Bliss", a luxury artisan bakery in Hyderabad.
Tagline: "Cakes • Pastries • Happiness".
Currency: ₹ (INR). All prices are in Indian Rupees.

Your identity: "Sweet Bliss AI Assistant" — your personal bakery assistant.
Do not reference provider brand names in customer conversation.

Your goals:
1. Provide warm, charming, and expert cake suggestions based on the user's occasion (Birthday, Anniversary, Wedding), guest count, budget, flavours, and dietary needs (100% Eggless available on all cakes).
2. Ground all recommendations STRICTLY in the Sweet Bliss catalogue below. Do NOT invent fake cakes or prices.
3. Recommend 1 to 3 specific cakes by exact ID and Name from the catalogue.
4. When relevant, explain portion math (0.5kg serves 4-6; 1kg serves 8-12; 2kg serves 18-24).
5. If bespoke tiered design requested, suggest our "Custom Cake Order" service and summarize their dream theme.
6. Return JSON response strictly:
{
  "reply": "Friendly response to the user.",
  "suggestedProductIds": ["cake-id-1"],
  "customCakeIdea": null,
  "quickOptions": ["Option 1", "Option 2"]
}

Current Sweet Bliss Product Catalogue:
${JSON.stringify(catalogueSummary, null, 2)}
`;

      const prompt = `Customer says: "${message}"\nPreferences context: ${JSON.stringify(userPreferences)}\nRecent history: ${JSON.stringify(history.slice(-4))}`;

      const aiResponse = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = aiResponse.text;
      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          return res.json({
            reply: parsed.reply,
            suggestedProductIds: parsed.suggestedProductIds || [],
            customCakeIdea: parsed.customCakeIdea || null,
            quickOptions: parsed.quickOptions || ['Explore All Cakes', 'Custom Cake Order', 'Order on WhatsApp'],
          });
        } catch {
          return res.json({
            reply: responseText,
            suggestedProductIds: ['chocolate-truffle-cake', 'pastel-rose-celebration'],
            quickOptions: ['View Chocolate Truffle', 'View Red Velvet', 'Start Custom Order'],
          });
        }
      }
    }

    // Rule-based fallback if Gemini key is absent
    const lower = message.toLowerCase();
    let matchingIds: string[] = [];
    let reply = '';

    if (lower.includes('chocolate') || lower.includes('truffle') || lower.includes('dark')) {
      matchingIds = ['chocolate-truffle-cake', 'chocolate-fudge-cake'];
      reply =
        'For chocolate lovers, our Belgian Chocolate Truffle Cake (₹699) is our absolute #1 best seller! Made with 55% Belgian chocolate ganache, moist dark sponge, and edible 24k gold leaf. It is also prepared 100% eggless.';
    } else if (lower.includes('rose') || lower.includes('flower') || lower.includes('romantic') || lower.includes('anniversary')) {
      matchingIds = ['pastel-rose-celebration', 'red-velvet-cake'];
      reply =
        'For romantic celebrations and anniversaries, our Pastel Rose Dream Cake (₹1,399) or Classic Red Velvet Cake (₹749) with cream cheese rosettes are sensational choices decorated with real garden roses.';
    } else if (lower.includes('fruit') || lower.includes('fresh') || lower.includes('mango')) {
      matchingIds = ['fruit-cake', 'mango-cake', 'strawberry-cake'];
      reply =
        'Our Fresh Fruit Cake (₹799) is piled high with strawberries, kiwi, blueberries, dragonfruit, and mango in a delicate glaze. Super light and refreshing!';
    } else {
      matchingIds = ['chocolate-truffle-cake', 'red-velvet-cake', 'fruit-cake', 'butterscotch-cake'];
      reply =
        'Welcome to Sweet Bliss! For celebrations of 8-12 guests, a 1 kg cake is ideal. Our favorites include our signature Belgian Chocolate Truffle, Classic Red Velvet, and Fresh Fruit Cake. How many guests are you celebrating with?';
    }

    res.json({
      reply,
      suggestedProductIds: matchingIds,
      customCakeIdea: null,
      quickOptions: ['Birthday Cakes', 'Anniversary Cakes', '100% Eggless Options', 'Custom Cake Order'],
    });
  } catch (error: unknown) {
    console.error('Error in AI assistant endpoint:', error);
    res.status(500).json({
      reply: 'I am ready to help you discover the dream cake for your celebration! You can also chat directly with our pastry chefs on WhatsApp.',
      suggestedProductIds: ['chocolate-truffle-cake', 'pastel-rose-celebration'],
      quickOptions: ['View Best Sellers', 'Start Custom Cake'],
    });
  }
});

// -------------------------------------------------------------
// 7. CUSTOM CAKE ORDER INQUIRY API
// -------------------------------------------------------------
app.post('/api/ai/cake-brief', async (req: Request, res: Response) => {
  try {
    const { occasion, flavour, guestCount, themeDescription, dietary } = req.body;

    const guestNum = parseInt(guestCount, 10) || 12;
    const recommendedWeight = guestNum <= 6 ? 0.5 : guestNum <= 12 ? 1.0 : guestNum <= 20 ? 2.0 : 3.0;

    let brief = {
      title: `${occasion || 'Celebration'} Bespoke Cake Concept`,
      recommendedWeightKg: recommendedWeight,
      recommendedTiers: recommendedWeight >= 2.5 ? 2 : 1,
      flavourMatch: flavour || 'Belgian Dark Truffle & Rose Vanilla',
      colorPalette: 'Blush Pink, Cream Ivory, and Rose Gold',
      designNotes: themeDescription || 'Artisan textured buttercream with fresh florals and delicate pearl piping.',
      estimatedPriceRange: `₹${Math.round(recommendedWeight * 1100)} - ₹${Math.round(recommendedWeight * 1400)}`,
      dietarySummary: dietary || '100% Eggless',
    };

    if (geminiClient && process.env.GEMINI_API_KEY) {
      try {
        const response = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Create a professional pastry chef brief for: Occasion: ${occasion}, Guests: ${guestCount}, Preferred Flavor: ${flavour}, Theme: ${themeDescription}, Dietary: ${dietary}`,
          config: {
            systemInstruction:
              'You are Sweet Bliss head pastry chef. Output JSON only with keys: title, recommendedWeightKg (number), recommendedTiers (number), flavourMatch (string), colorPalette (string), designNotes (string), estimatedPriceRange (string), dietarySummary (string).',
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          brief = JSON.parse(response.text);
        }
      } catch (err) {
        console.warn('Gemini brief fallback used:', err);
      }
    }

    res.json({ brief });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to generate brief' });
  }
});

app.post('/api/custom-cakes', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.customerName || !data.phone || !data.occasion) {
      return res.status(400).json({ error: 'Name, phone, and occasion are required' });
    }

    const weightKg = parseFloat(data.weightKg) || 1.5;
    const estimatedPrice = Math.round(weightKg * 1250);
    const customId = `SBC-${Math.floor(10000 + Math.random() * 90000)}`;

    const customOrder: StoredCustomCake = {
      id: customId,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || '',
      occasion: data.occasion,
      flavour: data.flavour || 'Belgian Truffle',
      weightKg,
      guestCount: parseInt(data.guestCount, 10) || 12,
      themeDescription: data.themeDescription || 'Custom celebration cake',
      colorPalette: data.colorPalette || 'Blush Pink & Gold',
      messageOnCake: data.messageOnCake || '',
      dietaryPreference: data.dietaryPreference || 'Eggless',
      deliveryDate: data.deliveryDate || '',
      budgetBudget: data.budget || `₹${estimatedPrice}`,
      estimatedPrice,
      status: 'Inquiry',
      createdAt: new Date().toISOString(),
      hasReferenceImage: Boolean(data.hasImage),
    };

    customCakeStore.unshift(customOrder);
    saveCustomCakes(customCakeStore);

    res.status(201).json({
      success: true,
      customOrder,
      message: 'Custom cake inquiry submitted! Our head baker will contact you shortly.',
    });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to submit custom cake inquiry' });
  }
});

// Start dev server with Vite middlewares, or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sweet Bliss Bakery server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
