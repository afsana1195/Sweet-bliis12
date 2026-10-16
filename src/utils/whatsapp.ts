import { BUSINESS_CONFIG } from '../data/bakeryData.ts';
import { CartItem } from '../types.ts';

export function getWhatsAppInquiryUrl(customText?: string): string {
  const text = customText || `Hello Sweet Bliss! 👋 I would like to inquire about ordering artisan celebration cakes.`;
  return `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function getProductWhatsAppUrl(
  productName: string,
  price: number,
  sizeLabel: string,
  isEggless: boolean,
  message?: string
): string {
  const egglessText = isEggless ? '100% Eggless' : 'With Egg';
  let text = `🎂 *Sweet Bliss Cake Order Inquiry*\n\n`;
  text += `*Cake:* ${productName}\n`;
  text += `*Size:* ${sizeLabel}\n`;
  text += `*Preference:* ${egglessText}\n`;
  text += `*Price:* ₹${price}\n`;
  if (message && message.trim()) {
    text += `*Message on Cake:* "${message.trim()}"\n`;
  }
  text += `\nPlease confirm availability and delivery slot. Thank you!`;

  return `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function getCartWhatsAppUrl(
  items: CartItem[],
  subtotal: number,
  deliveryFee: number,
  total: number,
  customerName?: string,
  deliveryDate?: string
): string {
  let text = `🍰 *Sweet Bliss Order Inquiry (Cart)*\n\n`;
  if (customerName) text += `*Customer:* ${customerName}\n`;
  if (deliveryDate) text += `*Target Date:* ${deliveryDate}\n`;
  text += `\n*Selected Items:*\n`;

  items.forEach((item, idx) => {
    text += `${idx + 1}. *${item.product.name}* (x${item.quantity})\n`;
    text += `   - Size: ${item.selectedSizeLabel}\n`;
    text += `   - Type: ${item.isEggless ? 'Eggless' : 'With Egg'}\n`;
    if (item.cakeMessage) text += `   - Message: "${item.cakeMessage}"\n`;
    text += `   - Price: ₹${item.unitPrice * item.quantity}\n`;
  });

  text += `\n*Subtotal:* ₹${subtotal}\n`;
  text += `*Delivery:* ${deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}\n`;
  text += `*Total Amount:* ₹${total}\n\n`;
  text += `Please check availability and confirm payment instructions. Thank you!`;

  return `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function getCustomCakeWhatsAppUrl(details: {
  customerName: string;
  occasion: string;
  guestCount: number;
  weightKg: number;
  flavour: string;
  themeDescription: string;
  colorPalette: string;
  deliveryDate: string;
  messageOnCake?: string;
  estimatedPrice?: number;
}): string {
  let text = `✨ *Sweet Bliss Custom Cake Order Inquiry*\n\n`;
  text += `*Customer:* ${details.customerName}\n`;
  text += `*Occasion:* ${details.occasion}\n`;
  text += `*Guest Count:* ${details.guestCount} guests (~${details.weightKg} kg)\n`;
  text += `*Flavour:* ${details.flavour}\n`;
  text += `*Theme & Design:* ${details.themeDescription}\n`;
  text += `*Color Palette:* ${details.colorPalette}\n`;
  text += `*Delivery Date:* ${details.deliveryDate}\n`;
  if (details.messageOnCake) {
    text += `*Message on Cake:* "${details.messageOnCake}"\n`;
  }
  if (details.estimatedPrice) {
    text += `*Est. Price:* ~₹${details.estimatedPrice}\n`;
  }
  text += `\nI would love to discuss custom styling and finalize this order!`;

  return `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function getOwnerNewOrderWhatsAppUrl(order: {
  orderId: string;
  customer: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    weightKg: number;
    price: number;
    isEggless: boolean;
    cakeMessage?: string;
  }>;
  total: number;
  deliveryDate: string;
  deliverySlot: string;
  paymentMethod: string;
  paymentStatus: string;
  orderNotes?: string;
}): string {
  let text = `🚨 *NEW CAKE ORDER RECEIVED — SWEET BLISS*\n\n`;
  text += `*Order ID:* ${order.orderId}\n`;
  text += `*Owner Alert:* Chef Jyoti Tanti\n`;
  text += `*Delivery Date:* ${order.deliveryDate} (${order.deliverySlot})\n`;
  text += `*Payment:* ${order.paymentMethod} (${order.paymentStatus})\n`;
  text += `*Total Amount:* ₹${order.total}\n\n`;
  text += `👤 *Customer Details:*\n`;
  text += `• Name: ${order.customer.fullName}\n`;
  text += `• Phone: +91 ${order.customer.phone}\n`;
  text += `• Address: ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}\n`;
  if (order.customer.landmark) text += `• Landmark: ${order.customer.landmark}\n`;
  text += `\n🎂 *Ordered Items:*\n`;
  order.items.forEach((item, i) => {
    text += `${i + 1}. ${item.name} (${item.weightKg} kg x${item.quantity}) - ₹${item.price * item.quantity}\n`;
    text += `   [${item.isEggless ? '100% Eggless' : 'With Egg'}]\n`;
    if (item.cakeMessage) text += `   Piping Text: "${item.cakeMessage}"\n`;
  });
  if (order.orderNotes) {
    text += `\n📝 *Kitchen Instructions:* ${order.orderNotes}\n`;
  }
  const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/#track-${order.orderId}` : '';
  if (trackingUrl) {
    text += `\n📍 *Live Tracking Link:* ${trackingUrl}\n`;
  }
  text += `\nPlease accept and commence kitchen preparation!`;

  return `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function getCustomerOrderConfirmationWhatsAppUrl(order: {
  orderId: string;
  customer: {
    fullName: string;
    phone: string;
  };
  total: number;
  deliveryDate: string;
  deliverySlot: string;
}): string {
  const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/#track-${order.orderId}` : '';
  let text = `🎉 *Sweet Bliss by Jyoti Tanti — Order Confirmed!*\n\n`;
  text += `Dear ${order.customer.fullName},\n`;
  text += `Thank you for choosing Sweet Bliss! Chef Jyoti Tanti and our artisan pastry kitchen have confirmed your order.\n\n`;
  text += `*Order ID:* ${order.orderId}\n`;
  text += `*Scheduled Delivery:* ${order.deliveryDate} (${order.deliverySlot} Slot)\n`;
  text += `*Amount:* ₹${order.total} (Free Delivery)\n\n`;
  if (trackingUrl) {
    text += `🛵 *Live GPS Tracking & Kitchen Progress:* \n${trackingUrl}\n\n`;
  }
  text += `For any immediate customizations, WhatsApp Chef Jyoti at +91 ${BUSINESS_CONFIG.phone}. Have a sweet celebration! 🍰✨`;

  const cleanCustomerPhone = order.customer.phone.replace(/\D/g, '').slice(-10);
  return `https://wa.me/91${cleanCustomerPhone}?text=${encodeURIComponent(text)}`;
}
