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
