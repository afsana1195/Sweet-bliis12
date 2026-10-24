import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PlacedOrder } from '../types.ts';

interface AdminReceiptModalProps {
  order: PlacedOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

// Number to words helper for Indian Rupee amounts
function numberToWordsINR(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const num = Math.floor(amount);
  if (num === 0) return 'Zero';

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    let str = '';
    if (Math.floor(n / 100) > 0) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
    }
    const rem = n % 100;
    if (rem > 0) {
      str += convertTwoDigits(rem);
    }
    return str.trim();
  }

  let result = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  if (crore > 0) result += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) result += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand > 0) result += convertThreeDigits(thousand) + ' Thousand ';
  if (remainder > 0) result += convertThreeDigits(remainder);

  return result.trim() + ' Rupees Only';
}

export const AdminReceiptModal: React.FC<AdminReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const orderTime = new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Clean iframe-based print to guarantee no popup blocker or sandbox failure
  const handlePrint = () => {
    const printContent = generatePrintableHtml(order);

    // Create an invisible iframe for printer-friendly output
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {
            // Ignore if already cleaned up
          }
        }, 1500);
      }, 350);
    }
  };

  const handleDownloadHtml = () => {
    const html = generatePrintableHtml(order);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${order.orderId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-rose-100 overflow-hidden">
        {/* Modal Top Actions Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#881337] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#881337]">
                  Order Receipt & Invoice
                </h3>
                <span className="bg-rose-100 text-[#881337] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  {order.orderId}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Official printer-ready tax invoice & dispatch receipt for customer and accounting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download HTML file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">HTML</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-rose-200" />
              <span>Print Receipt / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-100/60">
          <div
            ref={printableRef}
            className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-stone-200 max-w-2xl mx-auto space-y-6 text-[#2C1810]"
          >
            {/* Bakery Brand Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-[#881337] gap-4">
              <div className="flex items-start gap-4">
                <img
                  src="/assets/aistudio/file_0000000061b481f4ab617a424b614604_7c5ac529.png"
                  alt="Sweet Bliss Official Logo"
                  className="w-16 h-16 rounded-full border border-rose-200 object-contain bg-white p-0.5 shadow-xs shrink-0"
                />
                <div>
                  <span className="text-xs uppercase tracking-widest font-bold text-[#881337]">
                    Tax Invoice & Delivery Receipt
                  </span>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#881337] tracking-tight">
                    Sweet Bliss
                  </h1>
                  <p className="text-xs font-medium text-stone-600 mt-0.5">
                    Artisan Patisserie & Custom Cake Studio
                  </p>
                  <div className="text-[11px] text-stone-500 mt-2 space-y-0.5 leading-relaxed">
                    <p>Chandapura - Anekal Road, Bangalore, Karnataka - 562162</p>
                    <p>FSSAI: 11223334000892 • GSTIN: 29AABCS1429B1Z8</p>
                    <p>Phone: +91 6297201943 • Email: ansariwazid1995@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right bg-rose-50/70 p-3.5 rounded-xl border border-rose-100 sm:min-w-[190px]">
                <div className="text-[10px] uppercase font-bold text-stone-500">Invoice / Order ID</div>
                <div className="font-mono text-base font-extrabold text-[#881337]">
                  {order.orderId}
                </div>
                <div className="text-[11px] text-stone-600 mt-1">
                  <strong>Date:</strong> {orderDate}
                </div>
                <div className="text-[11px] text-stone-600">
                  <strong>Time:</strong> {orderTime}
                </div>
                <div className="mt-2 inline-block">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Delivery Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-[#881337]">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Information</span>
                </div>
                <div className="text-sm font-bold text-stone-900">{order.customer.fullName}</div>
                <div className="text-stone-600 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-stone-400" />
                  <span>+91 {order.customer.phone}</span>
                </div>
                {order.customer.email && (
                  <div className="text-stone-600 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-stone-400" />
                    <span>{order.customer.email}</span>
                  </div>
                )}
                <div className="text-stone-600 flex items-start gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>
                    {order.customer.address}, {order.customer.city} - {order.customer.pincode}
                    {order.customer.landmark ? ` (Near ${order.customer.landmark})` : ''}
                  </span>
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-[#881337]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Fulfillment & Payment</span>
                </div>
                <div>
                  <span className="text-stone-500">Delivery Date:</span>{' '}
                  <strong className="text-stone-900">{order.deliveryDate}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Slot:</span>{' '}
                  <span className="capitalize font-semibold text-stone-800">{order.deliverySlot} Slot</span>
                </div>
                <div>
                  <span className="text-stone-500">Payment Mode:</span>{' '}
                  <span className="font-semibold text-stone-800">{order.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-stone-500">Payment Status:</span>{' '}
                  <span className={`font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.transactionId && (
                  <div className="text-[11px] text-stone-500 pt-1 font-mono">
                    Ref: {order.transactionId}
                  </div>
                )}
              </div>
            </div>

            {/* Special Order Notes */}
            {order.orderNotes && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Kitchen Instructions:</strong> {order.orderNotes}
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Order Items & Specifications
              </div>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold">
                    <tr>
                      <th className="p-2.5 w-8 text-center">#</th>
                      <th className="p-2.5">Item & Customizations</th>
                      <th className="p-2.5 text-center">Weight</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/20">
                        <td className="p-2.5 text-center text-stone-400">{idx + 1}</td>
                        <td className="p-2.5">
                          <strong className="text-stone-900 block">{item.name}</strong>
                          <div className="text-[11px] text-stone-500">
                            {item.isEggless ? '100% Eggless' : 'Contains Egg'}
                            {item.flavour ? ` • ${item.flavour}` : ''}
                          </div>
                          {item.cakeMessage && (
                            <div className="text-[11px] text-[#881337] italic mt-0.5">
                              Message on Cake: "{item.cakeMessage}"
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center tabular-nums text-stone-600 font-medium">
                          {item.weightKg} kg
                        </td>
                        <td className="p-2.5 text-center tabular-nums font-bold text-stone-800">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-stone-600">
                          ₹{item.price}
                        </td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-stone-900">
                          ₹{item.price * item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger & Totals */}
            <div className="flex flex-col sm:flex-row justify-between items-start pt-2 gap-4 text-xs">
              <div className="space-y-1.5 max-w-xs text-stone-500">
                <div className="text-[11px] font-medium">
                  <strong>Amount in Words:</strong> {numberToWordsINR(order.total)}
                </div>
                <div className="text-[10px] text-stone-400 leading-relaxed">
                  All bakery products are freshly baked using premium ingredients and natural cream. Store refrigerated at 4°C - 6°C and consume within 48 hours for best taste.
                </div>
              </div>

              <div className="w-full sm:w-64 space-y-1.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Charge:</span>
                  <span className="tabular-nums font-semibold">
                    {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                  </span>
                </div>
                {order.discount ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Applied:</span>
                    <span className="tabular-nums font-semibold">-₹{order.discount}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-extrabold text-[#881337] pt-2 border-t border-stone-200">
                  <span>Total Amount:</span>
                  <span className="tabular-nums">₹{order.total}</span>
                </div>
              </div>
            </div>

            {/* Footer with Bakery Seal & Chef Jyoti Stamp */}
            <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Quality & Freshness Guarantee • Sweet Bliss Bakery</span>
              </div>
              <div className="text-center sm:text-right">
                <div className="font-serif italic font-bold text-stone-800 text-xs">
                  Jyoti Tanti
                </div>
                <div className="text-[10px] text-stone-400">Head Pastry Chef & Owner</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 bg-white border-t border-rose-100 flex items-center justify-between">
          <span className="text-xs text-stone-500 hidden sm:inline">
            Print dialog opens printer or "Save as PDF" option directly in your browser.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-[#881337] hover:bg-[#9F1239] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-rose-200" />
              <span>Print Order Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generates pristine, self-contained HTML for native print / PDF export
function generatePrintableHtml(order: PlacedOrder): string {
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const orderTime = new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const itemsRows = (order.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${idx + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 700; color: #111827;">${escapeHtml(item.name)}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
            ${item.isEggless ? '100% Eggless' : 'Contains Egg'}${item.flavour ? ` • ${escapeHtml(item.flavour)}` : ''}
          </div>
          ${item.cakeMessage ? `<div style="font-size: 11px; color: #881337; font-style: italic; margin-top: 2px;">Message: "${escapeHtml(item.cakeMessage)}"</div>` : ''}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.weightKg} kg</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 700;">${item.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #111827;">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt_${escapeHtml(order.orderId)}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 720px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #881337;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #881337;
      margin: 0 0 2px 0;
      letter-spacing: -0.5px;
    }
    .brand-tag {
      font-size: 11px;
      color: #6b7280;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .brand-meta {
      font-size: 11px;
      color: #4b5563;
      line-height: 1.4;
    }
    .invoice-badge-box {
      background: #fff1f2;
      border: 1px solid #ffe4e6;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: right;
      min-width: 180px;
    }
    .inv-id {
      font-family: monospace;
      font-size: 15px;
      font-weight: 800;
      color: #881337;
      margin-top: 2px;
    }
    .status-pill {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 8px;
      background: #d1fae5;
      color: #065f46;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
    }
    .box-title {
      font-size: 10px;
      font-weight: 700;
      color: #881337;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 4px;
    }
    .notes-box {
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 20px;
      color: #92400e;
      font-size: 11px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f9fafb;
      color: #374151;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      padding: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .totals-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 10px;
      margin-bottom: 24px;
    }
    .words-box {
      max-width: 380px;
      font-size: 11px;
      color: #6b7280;
    }
    .totals-box {
      width: 240px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      color: #4b5563;
    }
    .grand-total {
      border-top: 2px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 800;
      color: #881337;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #6b7280;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #881337; text-transform: uppercase; letter-spacing: 1px;">TAX INVOICE & ORDER RECEIPT</div>
        <h1 class="brand-title">Sweet Bliss</h1>
        <div class="brand-tag">Artisan Patisserie & Custom Cake Studio</div>
        <div class="brand-meta">
          Chandapura - Anekal Road, Bangalore, Karnataka - 562162<br/>
          FSSAI: 11223334000892 | GSTIN: 29AABCS1429B1Z8<br/>
          Phone: +91 6297201943 | Email: ansariwazid1995@gmail.com
        </div>
      </div>
      <div class="invoice-badge-box">
        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 700;">Order Reference</div>
        <div class="inv-id">${escapeHtml(order.orderId)}</div>
        <div style="font-size: 11px; margin-top: 4px;"><strong>Date:</strong> ${orderDate}</div>
        <div style="font-size: 11px;"><strong>Time:</strong> ${orderTime}</div>
        <span class="status-pill">${escapeHtml(order.status)}</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <div class="box-title">Customer Information</div>
        <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px;">${escapeHtml(order.customer.fullName)}</div>
        <div style="color: #4b5563;">Phone: +91 ${escapeHtml(order.customer.phone)}</div>
        ${order.customer.email ? `<div style="color: #4b5563;">Email: ${escapeHtml(order.customer.email)}</div>` : ''}
        <div style="color: #4b5563; margin-top: 4px;">
          <strong>Delivery Address:</strong><br/>
          ${escapeHtml(order.customer.address)}, ${escapeHtml(order.customer.city)} - ${escapeHtml(order.customer.pincode)}
          ${order.customer.landmark ? `<br/>Landmark: ${escapeHtml(order.customer.landmark)}` : ''}
        </div>
      </div>

      <div class="box">
        <div class="box-title">Delivery & Payment Details</div>
        <div><strong>Scheduled Delivery:</strong> ${escapeHtml(order.deliveryDate)}</div>
        <div><strong>Slot:</strong> <span style="text-transform: capitalize;">${escapeHtml(order.deliverySlot)}</span> Slot</div>
        <div style="margin-top: 6px;"><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod || 'Online')}</div>
        <div><strong>Payment Status:</strong> <span style="font-weight: 700; color: ${order.paymentStatus === 'PAID' ? '#059669' : '#d97706'};">${escapeHtml(order.paymentStatus || 'PAID')}</span></div>
        ${order.transactionId ? `<div style="font-family: monospace; font-size: 10px; color: #6b7280; margin-top: 4px;">Txn Ref: ${escapeHtml(order.transactionId)}</div>` : ''}
      </div>
    </div>

    ${order.orderNotes ? `<div class="notes-box"><strong>Special Kitchen Notes:</strong> ${escapeHtml(order.orderNotes)}</div>` : ''}

    <table>
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th style="text-align: left;">Item Description</th>
          <th style="width: 70px; text-align: center;">Weight</th>
          <th style="width: 50px; text-align: center;">Qty</th>
          <th style="width: 80px; text-align: right;">Rate (₹)</th>
          <th style="width: 90px; text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="words-box">
        <div style="margin-bottom: 6px;"><strong>Amount in Words:</strong><br/><em>${numberToWordsINR(order.total)}</em></div>
        <div style="font-size: 10px; color: #9ca3af; line-height: 1.4;">
          Thank you for celebrating with Sweet Bliss! Keep cake refrigerated at 4°C - 6°C. Handcrafted fresh by Chef Jyoti Tanti.
        </div>
      </div>

      <div class="totals-box">
        <div class="tot-row">
          <span>Items Subtotal:</span>
          <span style="font-weight: 600;">₹${order.subtotal}</span>
        </div>
        <div class="tot-row">
          <span>Delivery Charge:</span>
          <span style="font-weight: 600;">${order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
        </div>
        ${order.discount ? `
        <div class="tot-row" style="color: #059669;">
          <span>Discount Applied:</span>
          <span style="font-weight: 600;">-₹${order.discount}</span>
        </div>` : ''}
        <div class="tot-row grand-total">
          <span>Grand Total:</span>
          <span>₹${order.total}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>100% Quality & Freshness Guarantee • Sweet Bliss Bakery</div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: #111827; font-style: italic;">Jyoti Tanti</div>
        <div style="font-size: 10px; color: #9ca3af;">Master Pastry Chef & Founder</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
