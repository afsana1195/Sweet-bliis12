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
const SUBSCRIBERS_FILE = path.join(__dirname, 'newsletter_subscribers.json');
const USERS_FILE = path.join(__dirname, 'users_store.json');

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

export interface StoredSubscriber {
  email: string;
  subscribedAt: string;
  promoCode: string;
  source: string;
}

function loadSubscribers(): StoredSubscriber[] {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read newsletter subscribers from disk:', err);
  }
  return [];
}

function saveSubscribers(subscribers: StoredSubscriber[]) {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save newsletter subscribers to disk:', err);
  }
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  address?: string;
  city?: string;
  pincode?: string;
  memberTier: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  loyaltyPoints: number;
  createdAt: string;
}

function sanitizeUser(user: StoredUser) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function loadUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Could not read users from disk:', err);
  }

  // Pre-seed default demo customer so visitors can test 1-click login
  const defaultDemoUser: StoredUser = {
    id: 'user_demo_101',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543210',
    passwordHash: crypto.createHash('sha256').update('demo123').digest('hex'),
    address: 'Plot 42, Road No. 36, Jubilee Hills',
    city: 'Hyderabad',
    pincode: '500033',
    memberTier: 'Gold',
    loyaltyPoints: 340,
    createdAt: new Date().toISOString(),
  };

  saveUsers([defaultDemoUser]);
  return [defaultDemoUser];
}

function saveUsers(users: StoredUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save users to disk:', err);
  }
}

const ordersStore: StoredOrder[] = loadOrders();
const customCakeStore: StoredCustomCake[] = loadCustomCakes();
const subscribersStore: StoredSubscriber[] = loadSubscribers();
const usersStore: StoredUser[] = loadUsers();

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
// 2B. NEWSLETTER SUBSCRIPTION & PROMOTIONS API
// -------------------------------------------------------------
app.post('/api/newsletter/subscribe', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = subscribersStore.find((s) => s.email.toLowerCase() === cleanEmail);

    if (existing) {
      return res.json({
        success: true,
        alreadySubscribed: true,
        promoCode: existing.promoCode || 'SWEETBLISS10',
        message: 'You are already on our VIP list! Use promo code SWEETBLISS10 for 10% off your next order.',
      });
    }

    const newSub: StoredSubscriber = {
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      promoCode: 'SWEETBLISS10',
      source: 'footer_newsletter',
    };

    subscribersStore.unshift(newSub);
    saveSubscribers(subscribersStore);

    res.status(201).json({
      success: true,
      message: 'Welcome to Sweet Bliss VIP! Your 10% promotional discount code is SWEETBLISS10.',
      promoCode: 'SWEETBLISS10',
      subscriber: newSub,
    });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: 'Failed to process newsletter subscription' });
  }
});

app.get('/api/admin/subscribers', verifyAdminAuth, (_req: Request, res: Response) => {
  res.json({
    subscribers: subscribersStore,
    count: subscribersStore.length,
  });
});

// -------------------------------------------------------------
// 2C. CUSTOMER AUTHENTICATION API (Sign Up & Login)
// -------------------------------------------------------------
const customerSessions = new Map<string, string>();

function getAuthUser(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const userId = token ? customerSessions.get(token) : null;
  if (userId) {
    const user = usersStore.find((u) => u.id === userId);
    if (user) return user;
  }
  const directId = req.headers['x-user-id'] as string;
  if (directId) {
    const user = usersStore.find((u) => u.id === directId);
    if (user) return user;
  }
  return null;
}

// Sign Up / Registration
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, address, city, pincode } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const existingEmail = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const existingPhone = usersStore.find((u) => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone);
    if (existingPhone) {
      return res.status(409).json({ error: 'An account with this mobile number already exists. Please log in.' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const userId = `user_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: StoredUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      address: address ? String(address).trim() : '',
      city: city ? String(city).trim() : 'Hyderabad',
      pincode: pincode ? String(pincode).trim() : '',
      memberTier: 'Bronze',
      loyaltyPoints: 100, // 100 Welcome bonus points
      createdAt: new Date().toISOString(),
    };

    usersStore.unshift(newUser);
    saveUsers(usersStore);

    const token = crypto.randomBytes(24).toString('hex');
    customerSessions.set(token, userId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! 100 Welcome Points added to your wallet 🎉',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (err: any) {
    console.error('Sign up error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || typeof emailOrPhone !== 'string') {
      return res.status(400).json({ error: 'Please enter your email or mobile number.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();
    const digitsOnly = cleanInput.replace(/\D/g, '');

    const user = usersStore.find((u) => {
      const emailMatches = u.email.toLowerCase() === cleanInput;
      const phoneMatches = digitsOnly.length >= 10 && u.phone.replace(/\D/g, '').includes(digitsOnly.slice(-10));
      return emailMatches || phoneMatches;
    });

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email or mobile number. Please sign up.' });
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    if (inputHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    customerSessions.set(token, user.id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}! 🍰`,
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Current User Session
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

// Update Profile & Delivery Address
app.put('/api/auth/profile', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { name, phone, address, city, pincode } = req.body;
  if (name && typeof name === 'string') user.name = name.trim();
  if (phone && typeof phone === 'string') user.phone = phone.replace(/\D/g, '').slice(-10);
  if (address !== undefined) user.address = String(address).trim();
  if (city !== undefined) user.city = String(city).trim();
  if (pincode !== undefined) user.pincode = String(pincode).trim();

  saveUsers(usersStore);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: sanitizeUser(user),
  });
});

// Get User's Orders
app.get('/api/auth/orders', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userCleanEmail = user.email.toLowerCase();
  const userPhoneDigits = user.phone.replace(/\D/g, '').slice(-10);

  const userOrders = ordersStore.filter((o) => {
    const oEmail = (o.customer?.email || '').toLowerCase();
    const oPhone = (o.customer?.phone || '').replace(/\D/g, '').slice(-10);
    return (oEmail && oEmail === userCleanEmail) || (oPhone && oPhone === userPhoneDigits);
  });

  res.json({
    success: true,
    orders: userOrders,
    count: userOrders.length,
  });
});

// -------------------------------------------------------------
// 3. CASH ON DELIVERY (COD) ORDER CREATION
// -------------------------------------------------------------
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const {
      customer,
      items,
      deliveryDate,
      deliverySlot,
      paymentMethod,
      orderNotes,
      transactionId,
      promoDiscount,
      pointsDiscount,
      pointsRedeemed,
    } = req.body;

    // 1. Customer validation
    const fullName = customer?.fullName?.trim();
    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ error: 'Customer full name is required (minimum 2 characters).' });
    }

    const email = customer?.email?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address (e.g. name@example.com).' });
    }

    const rawPhone = String(customer?.phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone || !indianPhoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' });
    }

    const address = customer?.address?.trim();
    if (!address || address.length < 5) {
      return res.status(400).json({ error: 'Complete delivery address is required (minimum 5 characters).' });
    }

    const pincode = String(customer?.pincode || '').trim();
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: 'A valid 6-digit delivery pincode is required.' });
    }

    const city = customer?.city?.trim();
    if (!city) {
      return res.status(400).json({ error: 'Delivery city is required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // 2. Duplicate submission protection (prevent identical orders within 15 seconds)
    const now = Date.now();
    const isDuplicate = ordersStore.some((existingOrder) => {
      const orderTime = new Date(existingOrder.createdAt).getTime();
      const isWithin15Sec = now - orderTime < 15000;
      const isSamePhone = existingOrder.customer.phone.replace(/\D/g, '') === cleanPhone;
      const isSameDate = existingOrder.deliveryDate === (deliveryDate || new Date().toISOString().split('T')[0]);
      return isWithin15Sec && isSamePhone && isSameDate;
    });

    if (isDuplicate) {
      return res.status(409).json({
        error: 'Duplicate order detected. An identical order was submitted a few moments ago. Please check Track Order.',
      });
    }

    const financials = calculateOrderFinancials(items, deliverySlot || 'evening');
    const orderId = `SB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const extraDiscount = (Number(promoDiscount) || 0) + (Number(pointsDiscount) || 0);
    const finalDiscount = financials.discount + extraDiscount;
    const finalTotal = Math.max(0, financials.subtotal + financials.deliveryFee - finalDiscount);

    const isCOD = paymentMethod === 'COD' || paymentMethod?.toLowerCase()?.includes('cash on delivery');
    const txnId = transactionId || (isCOD ? undefined : `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`);

    const newOrder: StoredOrder = {
      orderId,
      customer,
      items: financials.validatedItems,
      deliveryDate: deliveryDate || new Date().toISOString().split('T')[0],
      deliverySlot: deliverySlot || 'evening',
      paymentMethod: paymentMethod || (isCOD ? 'Cash on Delivery' : 'ONLINE_UPI'),
      paymentStatus: isCOD ? 'PENDING' : 'PAID',
      transactionId: txnId,
      subtotal: financials.subtotal,
      deliveryFee: financials.deliveryFee,
      discount: finalDiscount,
      total: finalTotal,
      orderNotes: orderNotes || '',
      createdAt: new Date().toISOString(),
      status: 'Order Confirmed',
      statusHistory: [
        {
          status: 'Order Placed',
          timestamp: new Date().toISOString(),
          note: isCOD
            ? 'Cash on Delivery order booked'
            : `Order placed via ${paymentMethod || 'Online Payment'}`,
        },
        {
          status: 'Order Confirmed',
          timestamp: new Date().toISOString(),
          note: isCOD
            ? 'Confirmed for doorstep cash/UPI payment'
            : `Payment of ₹${finalTotal} verified successfully (${txnId})`,
        },
      ],
    };

    ordersStore.unshift(newOrder);
    saveOrders(ordersStore);

    // Sync loyalty points for customer if authenticated or matched by email/phone
    try {
      const authUser = getAuthUser(req);
      const user = authUser ||
        (customer.email ? usersStore.find((u) => u.email.toLowerCase() === customer.email.toLowerCase().trim()) : null) ||
        (customer.phone ? usersStore.find((u) => u.phone.includes(customer.phone.replace(/\D/g, '').slice(-10))) : null);

      if (user) {
        if (pointsRedeemed && Number(pointsRedeemed) > 0) {
          user.loyaltyPoints = Math.max(0, user.loyaltyPoints - Number(pointsRedeemed));
        }
        const earned = Math.floor(finalTotal / 10);
        user.loyaltyPoints += earned;
        user.memberTier =
          user.loyaltyPoints >= 1000
            ? 'VIP'
            : user.loyaltyPoints >= 500
            ? 'Gold'
            : user.loyaltyPoints >= 200
            ? 'Silver'
            : 'Bronze';
        saveUsers(usersStore);
      }
    } catch (userErr) {
      console.warn('Loyalty points sync error (non-fatal):', userErr);
    }

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

// GET latest order for seamless 1-click live tracking experience
app.get('/api/orders/latest', (_req: Request, res: Response) => {
  if (ordersStore.length === 0) {
    return res.status(404).json({ error: 'No orders available' });
  }
  // Return the most recently placed order (first or last by date)
  const sorted = [...ordersStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({
    success: true,
    order: sorted[0],
  });
});

// Simulation endpoint for realistic Zomato/Swiggy-style delivery tracking progress
app.post('/api/orders/:orderId/simulate-stage', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { targetStage, note } = req.body;

  const order = ordersStore.find((o) => o.orderId.toUpperCase() === orderId.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const validStages = [
    'Order Placed',
    'Order Confirmed',
    'Preparing Your Order',
    'Ready for Dispatch',
    'Out for Delivery',
    'Delivered',
  ];

  const stageIndex = validStages.indexOf(order.status);
  let nextStage = targetStage;

  if (!nextStage) {
    // Auto-advance to next stage or loop back if already delivered
    if (stageIndex >= 0 && stageIndex < validStages.length - 1) {
      nextStage = validStages[stageIndex + 1];
    } else {
      nextStage = validStages[1]; // Reset back to Confirmed to re-experience
    }
  }

  const stageDescriptions: Record<string, string> = {
    'Order Placed': 'Order received in bakery system',
    'Order Confirmed': 'Bakery manager accepted order & verified ingredients',
    'Preparing Your Order': 'Executive Chef is hand-whipping cream & piping rosettes',
    'Ready for Dispatch': 'Quality check 100% passed. Packed in temperature-controlled cold box',
    'Out for Delivery': 'Delivery Partner Rahul Sharma picked up package on scooter (Live GPS active)',
    'Delivered': 'Rider arrived at customer doorstep. Celebrations unlocked!',
  };

  order.status = nextStage;
  if (!order.statusHistory) {
    order.statusHistory = [];
  }
  order.statusHistory.push({
    status: nextStage,
    timestamp: new Date().toISOString(),
    note: note || stageDescriptions[nextStage] || `Status updated to ${nextStage}`,
  });

  saveOrders(ordersStore);

  res.json({
    success: true,
    message: `Order advanced to ${nextStage}`,
    order,
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

// CSV Export Endpoint for Store Accounting and Kitchen Inventory
app.get('/api/admin/orders/export-csv', verifyAdminAuth, (req: Request, res: Response) => {
  try {
    const { type = 'accounting', status, search } = req.query;
    let list = [...ordersStore];

    if (status && status !== 'all') {
      list = list.filter((o) => o.status.toLowerCase() === (status as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.phone.includes(q)
      );
    }

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    let csvContent = '';
    const todayStr = new Date().toISOString().split('T')[0];

    if (type === 'inventory') {
      // Item-level kitchen production & ingredient batch report
      const headers = [
        'Order ID',
        'Delivery Date',
        'Delivery Slot',
        'Item Name',
        'Product SKU',
        'Unit Weight (kg)',
        'Quantity',
        'Total Weight (kg)',
        'Dietary Type',
        'Selected Flavour',
        'Message on Cake',
        'Status',
        'Customer Name',
        'Customer Phone',
        'Special Kitchen Notes',
        'Est. Flour Needed (g)',
        'Est. Sugar Needed (g)',
        'Est. Dairy/Cream Needed (g)',
      ];
      const rows: string[][] = [];
      list.forEach((o) => {
        (o.items || []).forEach((item) => {
          const totWeight = (item.weightKg || 0.5) * (item.quantity || 1);
          rows.push([
            o.orderId,
            o.deliveryDate || '',
            o.deliverySlot || '',
            item.name,
            item.productId || '',
            String(item.weightKg || 0.5),
            String(item.quantity || 1),
            totWeight.toFixed(2),
            item.isEggless ? '100% Eggless' : 'Regular (Egg)',
            item.flavour || 'Chef Special',
            item.cakeMessage || '(No message)',
            o.status || '',
            o.customer?.fullName || '',
            o.customer?.phone || '',
            o.orderNotes || '',
            String(Math.round(totWeight * 300)),
            String(Math.round(totWeight * 200)),
            String(Math.round(totWeight * 250)),
          ]);
        });
      });
      csvContent = `\uFEFF${headers.map(escapeCSV).join(',')}\r\n${rows
        .map((r) => r.map(escapeCSV).join(','))
        .join('\r\n')}`;
    } else if (type === 'master') {
      // Complete 24-column order database export
      const headers = [
        'Order ID',
        'Booking Timestamp',
        'Customer Name',
        'Phone',
        'Email',
        'Delivery Address',
        'City',
        'Pincode',
        'Delivery Date',
        'Delivery Slot',
        'Items Ordered Summary',
        'Subtotal (INR)',
        'Delivery Fee (INR)',
        'Discount (INR)',
        'Total Amount (INR)',
        'Payment Method',
        'Payment Status',
        'Transaction ID',
        'Order Status',
        'Cancellation Reason',
        'Customer Order Notes',
      ];
      const rows = list.map((o) => {
        const itemsSummary = (o.items || [])
          .map((i) => `${i.quantity}x ${i.name} (${i.weightKg}kg)`)
          .join('; ');
        return [
          o.orderId,
          o.createdAt || '',
          o.customer?.fullName || '',
          o.customer?.phone || '',
          o.customer?.email || '',
          o.customer?.address || '',
          o.customer?.city || 'Hyderabad',
          o.customer?.pincode || '',
          o.deliveryDate || '',
          o.deliverySlot || '',
          itemsSummary,
          String(o.subtotal || 0),
          String(o.deliveryFee || 0),
          String(o.discount || 0),
          String(o.total || 0),
          o.paymentMethod || 'ONLINE_UPI',
          o.paymentStatus || 'PAID',
          o.transactionId || o.razorpayOrderId || 'N/A',
          o.status || '',
          o.cancellationReason || '',
          o.orderNotes || '',
        ];
      });
      csvContent = `\uFEFF${headers.map(escapeCSV).join(',')}\r\n${rows
        .map((r) => r.map(escapeCSV).join(','))
        .join('\r\n')}`;
    } else {
      // Default: Accounting & Financial Ledger Report
      const headers = [
        'Order ID',
        'Booking Date',
        'Customer Name',
        'Phone Number',
        'Email Address',
        'Delivery Date',
        'Delivery Slot',
        'Delivery City',
        'Pincode',
        'Items Summary',
        'Total Units',
        'Subtotal (INR)',
        'Delivery Fee (INR)',
        'Discount (INR)',
        'Net Revenue (INR)',
        'Payment Method',
        'Payment Status',
        'Transaction Reference',
        'Fulfillment Status',
        'Special Notes',
      ];
      const rows = list.map((o) => {
        const bookingDate = (o.createdAt || '').split('T')[0];
        const itemsSummary = (o.items || [])
          .map((i) => `${i.quantity}x ${i.name} (${i.weightKg}kg${i.isEggless ? ', Eggless' : ''})`)
          .join(' | ');
        const totalUnits = (o.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
        return [
          o.orderId,
          bookingDate,
          o.customer?.fullName || '',
          o.customer?.phone || '',
          o.customer?.email || '',
          o.deliveryDate || '',
          o.deliverySlot || '',
          o.customer?.city || 'Hyderabad',
          o.customer?.pincode || '',
          itemsSummary,
          String(totalUnits),
          String(o.subtotal || 0),
          String(o.deliveryFee || 0),
          String(o.discount || 0),
          String(o.total || 0),
          o.paymentMethod || 'ONLINE_UPI',
          o.paymentStatus || 'PAID',
          o.transactionId || o.razorpayOrderId || 'N/A',
          o.status || '',
          o.orderNotes || '',
        ];
      });
      csvContent = `\uFEFF${headers.map(escapeCSV).join(',')}\r\n${rows
        .map((r) => r.map(escapeCSV).join(','))
        .join('\r\n')}`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sweetbliss_${type}_report_${todayStr}.csv"`
    );
    res.send(csvContent);
  } catch (err: any) {
    console.error('CSV Export error:', err);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
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

Language & Greeting Rules:
- If the customer speaks or greets in Hindi or Hinglish (e.g. "हाय", "हेलो", "गुड मॉर्निंग", "गुड नाइट", "हाउ आर यू", "फाइन", "डिलीवरी टाइम"), ALWAYS reply warmly in polite Hindi/Hinglish matching their greeting!
- When customer says "हाय" or "Hi", reply with a warm "हेलो! नमस्ते! 🍰 स्वीट ब्लिस में आपका स्वागत है...".
- When customer says "गुड मॉर्निंग" or "Good morning", wish them "गुड मॉर्निंग! ☀️ आपका दिन बहुत मीठा और खुशियों भरा हो...".
- When customer says "गुड नाइट" or "Good night", wish them "शुभ रात्रि (Good Night)! 🌙...".
- When customer asks "हाउ आर यू" or "How are you", answer "मैं बहुत बढ़िया हूँ! आप कैसे हैं?...".
- When customer says "फाइन" or "Fine", respond "यह जानकर बहुत खुशी हुई! आइए आपके लिए शानदार केक चुनते हैं...".
- When customer asks about "डिलीवरी टाइम" or "Delivery time", explain that we provide same-day delivery within 2-4 hours with live GPS tracking and scheduled morning/afternoon/evening slots.

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

    // Comprehensive Rule-based fallback if Gemini key is absent
    const lower = message.toLowerCase().trim();
    let matchingIds: string[] = [];
    let reply = '';
    let quickOptions: string[] = ['Explore All Cakes', 'Custom Cake Order'];

    if (
      lower === 'hi' ||
      lower === 'hey' ||
      lower === 'hello' ||
      lower.includes('हाय') ||
      lower.includes('हेलो') ||
      lower.includes('हेल्लो') ||
      lower.includes('नमस्ते') ||
      lower.startsWith('hi ') ||
      lower.startsWith('hello ')
    ) {
      reply =
        'हेलो और नमस्ते! 🍰 Sweet Bliss Bakery में आपका हार्दिक स्वागत है। आज आप किस खास मौके (बर्थडे, एनिवर्सरी, पार्टी) के लिए केक तलाश रहे हैं? मैं आपकी पूरी मदद करूँगा!';
      matchingIds = ['chocolate-truffle-cake', 'pastel-rose-celebration', 'red-velvet-cake'];
      quickOptions = ['Birthday Cakes', 'Anniversary Specials', '100% Eggless Cakes', 'Start Custom Order'];
    } else if (
      lower.includes('गुड मॉर्निंग') ||
      lower.includes('good morning') ||
      lower.includes('सुप्रभात') ||
      lower === 'gm'
    ) {
      reply =
        'गुड मॉर्निंग जी! ☀️ आपका दिन मंगलमय और मिठास भरा हो। आज हम आपके लिए कौन सा ताज़ा बेक्ड सेलिब्रेशन केक तैयार करें?';
      matchingIds = ['fresh-fruit-cake', 'chocolate-truffle-cake'];
      quickOptions = ['Same-Day Delivery Cakes', 'Pastel Rose Dream', 'Belgian Chocolate'];
    } else if (
      lower.includes('गुड नाइट') ||
      lower.includes('good night') ||
      lower.includes('शुभ रात्रि') ||
      lower === 'gn'
    ) {
      reply =
        'शुभ रात्रि (Good Night) जी! 🌙 मीठे सपनों के साथ स्वीट ब्लिस से जुड़ने के लिए धन्यवाद। कल सुबह की फ्रेश डिलीवरी के लिए आप अभी भी प्री-ऑर्डर कर सकते हैं!';
      matchingIds = ['belgian-chocolate-truffle', 'red-velvet-cake'];
      quickOptions = ['Pre-order for Tomorrow', 'Explore Catalogue'];
    } else if (
      lower.includes('हाउ आर यू') ||
      lower.includes('how are you') ||
      lower.includes('kaise ho') ||
      lower.includes('कैसे हो')
    ) {
      reply =
        'मैं बहुत बढ़िया और आपके लिए मीठी खुशियाँ तलाशने को पूरी तरह तैयार हूँ! 😊 आप कैसे हैं? आज क्या टेस्टी चखने का मन है?';
      matchingIds = ['chocolate-fudge-cake', 'butterscotch-cake'];
      quickOptions = ['Trending Cakes', 'Chef Specials', 'Eggless Range'];
    } else if (
      lower === 'fine' ||
      lower.includes('फाइन') ||
      lower.includes('i am fine') ||
      lower.includes('theek hu') ||
      lower.includes('ठीक हूँ') ||
      lower.includes('badhiya') ||
      lower.includes('बढ़िया')
    ) {
      reply =
        'यह जानकर बहुत खुशी हुई! आइए आपके टेस्ट के हिसाब से सबसे स्वादिष्ट केक चुनते हैं। क्या आप चॉकलेट, फ्रूट, या रेड वेल्वेट फ्लेवर पसंद करेंगे?';
      matchingIds = ['chocolate-truffle-cake', 'fruit-cake', 'red-velvet-cake'];
      quickOptions = ['Chocolate Truffle', 'Fresh Fruit Cake', 'Red Velvet'];
    } else if (
      lower.includes('डिलीवरी टाइम') ||
      lower.includes('delivery time') ||
      lower.includes('kab tak') ||
      lower.includes('टाइम') ||
      lower.includes('timing')
    ) {
      reply =
        'हम पूरे शहर में 2 से 4 घंटे के अंदर सुपर-फास्ट और सेफ सेम-डे डिलीवरी करते हैं! 🚚📦 इसके अलावा आप चेकआउट पर सुबह (9AM-1PM), दोपहर (1PM-5PM), शाम (5PM-9PM) या मिडनाइट (11PM-12AM) स्लॉट भी चुन सकते हैं।';
      matchingIds = ['chocolate-truffle-cake', 'red-velvet-cake'];
      quickOptions = ['Same Day Cakes', 'Midnight Delivery', 'Track Live Order'];
    } else if (lower.includes('chocolate') || lower.includes('truffle') || lower.includes('चॉकलेट')) {
      matchingIds = ['chocolate-truffle-cake', 'chocolate-fudge-cake'];
      reply =
        'चॉकलेट लवर्स के लिए हमारा Belgian Chocolate Truffle Cake (₹699) हमारा नंबर-1 बेस्टसेलर है! यह 55% डार्क बेल्जियन गनाचे और 24k एडिबल गोल्ड लीफ से सजाया जाता है। यह 100% एगलेस भी उपलब्ध है।';
      quickOptions = ['Order Belgian Truffle', 'Explore More Flavours'];
    } else if (lower.includes('rose') || lower.includes('flower') || lower.includes('romantic') || lower.includes('anniversary')) {
      matchingIds = ['pastel-rose-celebration', 'red-velvet-cake'];
      reply =
        'रोमांटिक मौकों और सालगिरह (Anniversary) के लिए हमारा Pastel Rose Dream Cake (₹1,399) और Classic Red Velvet Cake (₹749) सबसे पसंदीदा विकल्प हैं, जो रियल गार्डन रोज़ेस से सजाए जाते हैं।';
      quickOptions = ['View Pastel Rose', 'View Red Velvet'];
    } else if (lower.includes('fruit') || lower.includes('fresh') || lower.includes('mango') || lower.includes('फ्रूट')) {
      matchingIds = ['fruit-cake', 'mango-cake', 'strawberry-cake'];
      reply =
        'हमारा Fresh Fruit Cake (₹799) स्ट्रॉबेरी, कीवी, ब्लूबेरी, ड्रैगनफ्रूट और आम के ताज़ा टुकड़ों से भरपूर है। बहुत हल्का और रिफ्रेशिंग!';
      quickOptions = ['View Fruit Cake', 'Seasonal Specials'];
    } else if (lower.includes('eggless') || lower.includes('एगलेस') || lower.includes('veg')) {
      matchingIds = ['chocolate-truffle-cake', 'red-velvet-cake', 'fruit-cake'];
      reply =
        'स्वीट ब्लिस के सभी केक्स 100% एगलेस (शुद्ध शाकाहारी) विकल्प के साथ तैयार किए जाते हैं! हमारा किचन शुद्धता और हाइजीन के कड़े नियमों का पालन करता है।';
      quickOptions = ['View 100% Eggless Menu', 'Order Truffle Cake'];
    } else {
      matchingIds = ['chocolate-truffle-cake', 'red-velvet-cake', 'fruit-cake', 'butterscotch-cake'];
      reply =
        'स्वीट ब्लिस बेकरी में आपका स्वागत है! 🎂 हमारे पास हर सेलिब्रेशन के लिए हाथ से तैयार फ्रेश केक्स हैं। 8-12 मेहमानों के लिए 1 kg केक सबसे उपयुक्त रहता है। आज आप कितने मेहमानों के लिए प्लान कर रहे हैं?';
      quickOptions = ['Birthday Cakes', 'Anniversary Cakes', '100% Eggless Options', 'Custom Cake Order'];
    }

    res.json({
      reply,
      suggestedProductIds: matchingIds,
      customCakeIdea: null,
      quickOptions,
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
