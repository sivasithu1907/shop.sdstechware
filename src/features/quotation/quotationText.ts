import { BUSINESS, contactLine } from '../../config/business';
import { formatLKR } from '../../lib/format';
import type { CustomerQuoteEnquiry, QuoteItem } from '../../types';
import { getPublicPrice } from '../catalog/pricing';
import { computeQuoteTotals } from './quoteItems';

export function createQuoteReference(now: Date = new Date()): string {
  return `SDS-ENQ-${now.getFullYear()}-${now.getTime().toString().slice(-6)}`;
}

/** Plain-text enquiry for copying into email. Uses public prices only. */
export function buildEnquiryText(items: QuoteItem[], customer: CustomerQuoteEnquiry, now: Date = new Date()): string {
  const totals = computeQuoteTotals(items);
  const lines = [
    '========================================',
    `${BUSINESS.brandName} - QUOTATION ENQUIRY`,
    '========================================',
    `Date: ${now.toLocaleDateString('en-GB')}`,
    `Customer Name: ${customer.name || 'Not provided'}`,
    `Company / Organization: ${customer.company || 'Not provided'}`,
    `Contact Phone: ${customer.phone || 'Not provided'}`,
    `Email: ${customer.email || 'Not provided'}`,
    '',
    'REQUESTED ITEMS:',
    '----------------------------------------',
  ];

  items.forEach((item, index) => {
    const price = getPublicPrice(item.product);
    lines.push(`${index + 1}. [${item.product.brand}] ${item.product.model}${item.product.sku ? ` (SKU: ${item.product.sku})` : ''}`);
    lines.push(`   Quantity: ${item.quantity} unit(s)`);
    lines.push(`   Price status: ${price !== null ? `${formatLKR(price)} each (indicative)` : 'Price on Request'}`);
    if (item.source === 'custom' && item.product.specifications.length > 0) {
      item.product.specifications.forEach(s => lines.push(`   - ${s.key}: ${s.value}`));
    }
    lines.push('');
  });

  lines.push(
    totals.allLinesPriced
      ? `INDICATIVE TOTAL: ${formatLKR(totals.pricedSubtotal)} (to be confirmed in a formal quotation)`
      : 'INDICATIVE TOTAL: Not available — one or more items are Price on Request',
  );

  if (customer.notes.trim()) {
    lines.push('----------------------------------------');
    lines.push(`Additional Notes / Project Requirements:\n${customer.notes.trim()}`);
  }

  lines.push('========================================');
  lines.push('Please confirm pricing, availability, warranty and delivery in a formal quotation.');
  lines.push(contactLine());
  return lines.join('\n');
}

/** Short message text for WhatsApp (copied by the user; nothing is sent by the app). */
export function buildWhatsAppText(items: QuoteItem[], customer: CustomerQuoteEnquiry): string {
  const lines = [
    `*${BUSINESS.brandName} - QUOTATION REQUEST*`,
    `*Client:* ${customer.name || 'Not provided'} ${customer.company ? `(${customer.company})` : ''}`.trim(),
    `*Phone:* ${customer.phone || 'Not provided'}`,
    `*Email:* ${customer.email || 'Not provided'}`,
    '',
    '*Items requested:*',
  ];
  items.forEach(item => lines.push(`• *${item.product.brand} ${item.product.model}* x ${item.quantity} qty`));
  if (customer.notes.trim()) {
    lines.push('');
    lines.push(`*Notes:* ${customer.notes.trim()}`);
  }
  lines.push('');
  lines.push('_Please confirm pricing, availability and a formal quotation._');
  return lines.join('\n');
}
