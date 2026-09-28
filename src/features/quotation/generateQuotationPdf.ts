import jsPDF from 'jspdf';
import { BUSINESS, QUOTATION_ENQUIRY_TERMS } from '../../config/business';
import { formatLKR } from '../../lib/format';
import type { QuoteItem } from '../../types';
import { getPublicPrice } from '../catalog/pricing';
import { computeQuoteTotals } from './quoteItems';

export interface QuotationPdfOptions {
  quoteItems: QuoteItem[];
  customerInfo: {
    name: string;
    company: string;
    phone: string;
    email: string;
    notes: string;
  };
  quoteReference: string;
}

export const generateQuotationPDF = (options: QuotationPdfOptions): jsPDF => {
  const {
    quoteItems,
    customerInfo,
    quoteReference,
  } = options;

  // Totals use public prices only (see features/catalog/pricing.ts).
  const totals = computeQuoteTotals(quoteItems);
  const allItemsHavePublicPrice = totals.allLinesPriced;
  const indicativeSubtotal = totals.pricedSubtotal;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  let currentY = 18;

  // 1. Top Decorative Header Bar
  doc.setFillColor(16, 40, 61); // Deep navy #10283D
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Company Brand Letterhead
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(16, 40, 61);
  doc.text(BUSINESS.brandName, margin, currentY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(39, 91, 134); // Primary blue #275B86
  doc.text(BUSINESS.tagline, margin, currentY + 4.5);

  // Company Details (Right-aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(98, 121, 140); // Secondary text #62798C
  doc.text(BUSINESS.legalName.value, pageWidth - margin, currentY - 1, { align: 'right' });
  doc.text(BUSINESS.location.value, pageWidth - margin, currentY + 3.5, { align: 'right' });
  doc.text(`${BUSINESS.salesEmail.value} | ${BUSINESS.phone.value.display}`, pageWidth - margin, currentY + 8, { align: 'right' });

  currentY += 16;

  // Divider line
  doc.setDrawColor(220, 231, 239); // Soft border #DCE7EF
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;

  // 3. Document Title & Reference Metadata Box
  doc.setFillColor(247, 250, 253); // #F7FAFD
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(220, 231, 239);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'S');

  // Left column: Document title & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(16, 40, 61);
  doc.text('QUOTATION ENQUIRY', margin + 4, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(98, 121, 140);
  doc.text(`Reference No: ${quoteReference}`, margin + 4, currentY + 12);
  doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin + 4, currentY + 17);
  doc.text(
    BUSINESS.quotationValidityDays.confirmed && BUSINESS.quotationValidityDays.value
      ? `Validity: ${BUSINESS.quotationValidityDays.value} days from date of issue`
      : 'Status: Enquiry only - not a confirmed quotation',
    margin + 4,
    currentY + 21.5,
  );

  // Right column: Customer / Client Info
  const clientX = margin + contentWidth / 2 + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 40, 61);
  doc.text('REQUESTED FOR:', clientX, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 59, 87);
  doc.text(`Client: ${customerInfo.name || 'Valued Corporate Client'}`, clientX, currentY + 11.5);
  if (customerInfo.company) {
    doc.text(`Company: ${customerInfo.company}`, clientX, currentY + 15.5);
  }
  const contactText = [customerInfo.phone, customerInfo.email].filter(Boolean).join(' | ') || 'Direct Inquire';
  doc.text(`Contact: ${contactText}`, clientX, currentY + (customerInfo.company ? 19.5 : 15.5));

  currentY += 30;

  // 4. Quotation Items Table
  // Table Header
  const colX = {
    idx: margin + 3,
    desc: margin + 12,
    sku: margin + 85,
    qty: margin + 125,
    unitPrice: margin + 145,
    total: pageWidth - margin - 3,
  };

  doc.setFillColor(39, 91, 134); // #275B86
  doc.rect(margin, currentY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('#', colX.idx, currentY + 5.5);
  doc.text('ITEM DESCRIPTION / BRAND', colX.desc, currentY + 5.5);
  doc.text('SKU CODE', colX.sku, currentY + 5.5);
  doc.text('QTY', colX.qty, currentY + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', colX.unitPrice + 12, currentY + 5.5, { align: 'right' });
  doc.text('TOTAL (LKR)', colX.total, currentY + 5.5, { align: 'right' });

  currentY += 8;

  // Table Rows
  quoteItems.forEach((item, index) => {
    // Check if new page is needed
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
      // Re-draw table header on new page
      doc.setFillColor(39, 91, 134);
      doc.rect(margin, currentY, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('#', colX.idx, currentY + 5.5);
      doc.text('ITEM DESCRIPTION / BRAND', colX.desc, currentY + 5.5);
      doc.text('SKU CODE', colX.sku, currentY + 5.5);
      doc.text('QTY', colX.qty, currentY + 5.5, { align: 'center' });
      doc.text('UNIT PRICE', colX.unitPrice + 12, currentY + 5.5, { align: 'right' });
      doc.text('TOTAL (LKR)', colX.total, currentY + 5.5, { align: 'right' });
      currentY += 8;
    }

    const rowHeight = 11;
    const isEven = index % 2 === 0;

    if (isEven) {
      doc.setFillColor(247, 250, 253);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(235, 243, 248);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    // Index
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(98, 121, 140);
    doc.text((index + 1).toString(), colX.idx, currentY + 6);

    // Description & Model
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 40, 61);
    const modelStr = doc.splitTextToSize(item.product.model, 68);
    doc.text(modelStr[0] || item.product.model, colX.desc, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(98, 121, 140);
    doc.text(`${item.product.brand} · ${item.product.category}`, colX.desc, currentY + 8.5);

    // SKU
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(24, 59, 87);
    doc.text(item.product.sku, colX.sku, currentY + 6);

    // Quantity
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 40, 61);
    doc.text(item.quantity.toString(), colX.qty, currentY + 6, { align: 'center' });

    // Unit Price & Total Price
    const publicPrice = getPublicPrice(item.product);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    if (publicPrice !== null) {
      doc.setTextColor(24, 59, 87);
      doc.text(formatLKR(publicPrice), colX.unitPrice + 12, currentY + 6, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 40, 61);
      doc.text(formatLKR(publicPrice * item.quantity), colX.total, currentY + 6, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(39, 91, 134);
      doc.text('On request', colX.unitPrice + 12, currentY + 6, { align: 'right' });
      doc.text('Price on Request', colX.total, currentY + 6, { align: 'right' });
    }

    currentY += rowHeight;
  });

  // Table Bottom Border
  doc.setDrawColor(220, 231, 239);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4;

  // 5. Totals & Pricing Breakdown Box
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(247, 250, 253);
  doc.roundedRect(summaryBoxX, currentY, summaryBoxWidth, 22, 1.5, 1.5, 'F');
  doc.setDrawColor(220, 231, 239);
  doc.roundedRect(summaryBoxX, currentY, summaryBoxWidth, 22, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(98, 121, 140);
  doc.text('Items Count:', summaryBoxX + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 40, 61);
  doc.text(`${quoteItems.reduce((acc, i) => acc + i.quantity, 0)} units (${quoteItems.length} lines)`, summaryBoxX + summaryBoxWidth - 4, currentY + 5.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(98, 121, 140);
  doc.text('Indicative Subtotal:', summaryBoxX + 4, currentY + 11);

  if (allItemsHavePublicPrice) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 40, 61);
    doc.text(formatLKR(indicativeSubtotal), summaryBoxX + summaryBoxWidth - 4, currentY + 11, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(39, 91, 134);
    doc.text('Price on Request', summaryBoxX + summaryBoxWidth - 4, currentY + 11, { align: 'right' });
  }

  // Divider
  doc.setDrawColor(220, 231, 239);
  doc.line(summaryBoxX + 4, currentY + 13.5, summaryBoxX + summaryBoxWidth - 4, currentY + 13.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 40, 61);
  doc.text('ESTIMATED TOTAL:', summaryBoxX + 4, currentY + 18.5);

  if (allItemsHavePublicPrice) {
    doc.setTextColor(39, 91, 134);
    doc.text(formatLKR(indicativeSubtotal), summaryBoxX + summaryBoxWidth - 4, currentY + 18.5, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(39, 91, 134);
    doc.text('Subject to confirmation', summaryBoxX + summaryBoxWidth - 4, currentY + 18.5, { align: 'right' });
  }

  currentY += 26;

  // 6. Notes / Custom Requirements (if any)
  if (customerInfo.notes && customerInfo.notes.trim()) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 40, 61);
    doc.text('CLIENT SPECIFICATIONS & PROJECT NOTES:', margin, currentY);

    currentY += 4;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 231, 239);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(24, 59, 87);
    const splitNotes = doc.splitTextToSize(customerInfo.notes.trim(), contentWidth - 8);
    doc.text(splitNotes.slice(0, 3), margin + 4, currentY + 4.5);

    currentY += 18;
  }

  // 7. Commercial Terms & Warranty Conditions Box
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  const termLines = QUOTATION_ENQUIRY_TERMS.flatMap((t, i) => doc.splitTextToSize(`${i + 1}. ${t}`, contentWidth - 8) as string[]);
  const termsBoxHeight = 8 + termLines.length * 3.8;
  doc.setFillColor(247, 250, 253);
  doc.roundedRect(margin, currentY, contentWidth, termsBoxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(220, 231, 239);
  doc.roundedRect(margin, currentY, contentWidth, termsBoxHeight, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 40, 61);
  doc.text('IMPORTANT NOTES:', margin + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(98, 121, 140);
  termLines.forEach((line, i) => doc.text(line, margin + 4, currentY + 9 + i * 3.8));

  currentY += termsBoxHeight + 4;

  // 8. Sign-off Footer (details from src/config/business.ts)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(98, 121, 140);
  doc.text(`For enquiries please contact ${BUSINESS.salesEmail.value} or call ${BUSINESS.phone.value.display}.`, margin, currentY);
  const regNo = BUSINESS.companyRegistrationNo.confirmed ? BUSINESS.companyRegistrationNo.value : null;
  doc.text(
    [BUSINESS.legalName.value, regNo ? `Company Reg: ${regNo}` : null, BUSINESS.location.value].filter(Boolean).join(' · '),
    margin,
    currentY + 4,
  );

  // Bottom footer strip
  doc.setFillColor(16, 40, 61);
  doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

  return doc;
};
