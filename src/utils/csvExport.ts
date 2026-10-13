import { PlacedOrder } from '../types.ts';

/**
 * Escapes values according to RFC 4180 standard for CSV.
 * Properly wraps strings containing commas, quotes, or newlines, and escapes inner quotes.
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts array of rows into RFC 4180 CSV string with UTF-8 BOM.
 */
function buildCSVString(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map((r) => r.map(escapeCSV).join(',')).join('\r\n');
  return `\uFEFF${headerLine}\r\n${rowLines}`;
}

export type CSVReportType = 'accounting' | 'inventory' | 'master';

/**
 * 1. ACCOUNTING & FINANCIAL REPORT
 * Tailored for store bookkeepers, accountants, GST filing, and daily sales reconciliation.
 */
export function generateAccountingCSV(orders: PlacedOrder[]): string {
  const headers = [
    'Order ID',
    'Booking Date',
    'Booking Time',
    'Customer Name',
    'Phone Number',
    'Email Address',
    'Delivery Date',
    'Delivery Slot',
    'Delivery City',
    'Pincode',
    'Delivery Address',
    'Items Summary',
    'Total Units',
    'Total Cake Weight (kg)',
    'Subtotal (₹)',
    'Delivery Fee (₹)',
    'Discount Applied (₹)',
    'Total Order Value (₹)',
    'Payment Method',
    'Payment Status',
    'Transaction / Razorpay ID',
    'Fulfillment Status',
    'Cancellation Reason',
    'Special Instructions',
  ];

  const rows = orders.map((o) => {
    const bookingDateObj = new Date(o.createdAt || Date.now());
    const bookingDateStr = bookingDateObj.toISOString().split('T')[0];
    const bookingTimeStr = bookingDateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsSummary = (o.items || [])
      .map(
        (i) =>
          `${i.quantity}x ${i.name} (${i.weightKg}kg${i.isEggless ? ', Eggless' : ''}${
            i.cakeMessage ? ` - Msg: "${i.cakeMessage}"` : ''
          })`
      )
      .join(' | ');

    const totalUnits = (o.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
    const totalWeightKg = (o.items || []).reduce(
      (acc, i) => acc + (i.weightKg || 0) * (i.quantity || 1),
      0
    );

    return [
      o.orderId,
      bookingDateStr,
      bookingTimeStr,
      o.customer?.fullName || '',
      o.customer?.phone || '',
      o.customer?.email || '',
      o.deliveryDate || '',
      o.deliverySlot || '',
      o.customer?.city || 'Hyderabad',
      o.customer?.pincode || '',
      o.customer?.address || '',
      itemsSummary,
      totalUnits,
      totalWeightKg.toFixed(1),
      o.subtotal || 0,
      o.deliveryFee || 0,
      o.discount || 0,
      o.total || 0,
      o.paymentMethod || 'ONLINE_UPI',
      o.paymentStatus || 'PAID',
      o.transactionId || o.razorpayOrderId || 'N/A',
      o.status || 'Order Confirmed',
      o.cancellationReason || '',
      o.orderNotes || '',
    ];
  });

  return buildCSVString(headers, rows);
}

/**
 * 2. KITCHEN & INVENTORY PRODUCTION REPORT
 * Tailored for Head Chef, kitchen bakers, and ingredient procurement planning.
 * Outputs item-level rows with required batch weights and custom inscriptions.
 */
export function generateInventoryCSV(orders: PlacedOrder[]): string {
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
    'Message Written on Cake',
    'Fulfillment Status',
    'Customer Name',
    'Customer Phone',
    'Special Kitchen Notes',
    'Est. Flour Needed (g)',
    'Est. Sugar Needed (g)',
    'Est. Butter / Cream Needed (g)',
  ];

  const rows: (string | number)[][] = [];

  orders.forEach((o) => {
    (o.items || []).forEach((i) => {
      const itemWeightKg = (i.weightKg || 0.5) * (i.quantity || 1);
      // Rough baking ingredient estimation (approx 300g flour, 200g sugar, 250g dairy/cream per 1kg cake)
      const estFlourGrams = Math.round(itemWeightKg * 300);
      const estSugarGrams = Math.round(itemWeightKg * 200);
      const estCreamGrams = Math.round(itemWeightKg * 250);

      rows.push([
        o.orderId,
        o.deliveryDate || '',
        o.deliverySlot || '',
        i.name,
        i.productId || '',
        i.weightKg || 0.5,
        i.quantity || 1,
        itemWeightKg.toFixed(2),
        i.isEggless ? '100% Eggless' : 'Regular (Egg)',
        i.flavour || 'Original Chef Special',
        i.cakeMessage || '(No inscription)',
        o.status || 'Confirmed',
        o.customer?.fullName || '',
        o.customer?.phone || '',
        o.orderNotes || '',
        estFlourGrams,
        estSugarGrams,
        estCreamGrams,
      ]);
    });
  });

  return buildCSVString(headers, rows);
}

/**
 * 3. MASTER COMPREHENSIVE REPORT
 * Combines all customer, financial, product, and status audit points.
 */
export function generateMasterCSV(orders: PlacedOrder[]): string {
  const headers = [
    'Order ID',
    'Booking Timestamp',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Address',
    'Landmark',
    'City',
    'Pincode',
    'Delivery Date',
    'Delivery Slot',
    'Item Count',
    'All Items Ordered',
    'Total Cake Weight (kg)',
    'Subtotal Amount (₹)',
    'Delivery Fee (₹)',
    'Discount (₹)',
    'Grand Total (₹)',
    'Payment Method',
    'Payment Status',
    'Transaction Ref',
    'Order Status',
    'Cancellation Reason',
    'Customer Order Notes',
  ];

  const rows = orders.map((o) => {
    const itemsDescription = (o.items || [])
      .map(
        (i) =>
          `${i.name} [Qty: ${i.quantity}, ${i.weightKg}kg, ${i.isEggless ? 'Eggless' : 'Egg'}${
            i.cakeMessage ? `, Msg: "${i.cakeMessage}"` : ''
          }]`
      )
      .join('; ');

    const totalWeight = (o.items || []).reduce(
      (sum, i) => sum + (i.weightKg || 0) * (i.quantity || 1),
      0
    );

    return [
      o.orderId,
      o.createdAt || new Date().toISOString(),
      o.customer?.fullName || '',
      o.customer?.phone || '',
      o.customer?.email || '',
      o.customer?.address || '',
      o.customer?.landmark || '',
      o.customer?.city || 'Hyderabad',
      o.customer?.pincode || '',
      o.deliveryDate || '',
      o.deliverySlot || '',
      (o.items || []).length,
      itemsDescription,
      totalWeight.toFixed(2),
      o.subtotal || 0,
      o.deliveryFee || 0,
      o.discount || 0,
      o.total || 0,
      o.paymentMethod || 'ONLINE_UPI',
      o.paymentStatus || 'PAID',
      o.transactionId || o.razorpayOrderId || 'N/A',
      o.status || 'Order Confirmed',
      o.cancellationReason || '',
      o.orderNotes || '',
    ];
  });

  return buildCSVString(headers, rows);
}

/**
 * Triggers a browser file download of CSV content with sanitized filename.
 */
export function downloadCSVFile(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculates quick inventory & accounting metrics for the selection preview
 */
export function calculateReportSummary(orders: PlacedOrder[]) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalWeightKg = orders.reduce(
    (sum, o) =>
      sum +
      (o.items || []).reduce((iSum, i) => iSum + (i.weightKg || 0) * (i.quantity || 1), 0),
    0
  );
  let totalEgglessCakes = 0;
  let totalRegularCakes = 0;
  let totalItemsCount = 0;

  orders.forEach((o) => {
    (o.items || []).forEach((i) => {
      totalItemsCount += i.quantity || 1;
      if (i.isEggless) {
        totalEgglessCakes += i.quantity || 1;
      } else {
        totalRegularCakes += i.quantity || 1;
      }
    });
  });

  return {
    totalOrders,
    totalRevenue,
    totalWeightKg: Math.round(totalWeightKg * 10) / 10,
    totalEgglessCakes,
    totalRegularCakes,
    totalItemsCount,
  };
}
