import jsPDF from 'jspdf';
import { SITE_CONTACT } from '@/lib/constants';
import { getReceiptGrowthSlogan } from '@/lib/branding/slogans';

export interface ReceiptData {
  receiptNo: string;
  paymentId?: string;
  orderId?: string;
  planName: string;
  planSlug?: string;
  amount: number;
  startDate: string;
  expiryDate: string;
  date?: string;
  billedTo: string;
  address?: string;
  email?: string;
  phone?: string;
  gst?: string;
  paymentMethod?: string;
  status?: string;
  // Dynamic Unique Slogan fields
  sloganText?: string;
  sloganLanguage?: 'ta' | 'en';
  sloganId?: string;
  sloganCycle?: number;
}

/**
 * Ultra-crisp Canvas rasterizer for rendering Tamil and English slogans cleanly in PDF.
 * Ensures complex Tamil glyphs and typography render perfectly without missing characters.
 */
function renderSloganBadgeCanvas(
  slogan: string,
  widthMm: number,
  heightMm: number,
): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    const scale = 3; // 3x ultra-sharp rendering
    const widthPx = Math.round(widthMm * 3.7795); // 1mm ~= 3.7795px
    const heightPx = Math.round(heightMm * 3.7795);

    canvas.width = widthPx * scale;
    canvas.height = heightPx * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);

    // Draw background rounded box
    ctx.fillStyle = '#EFF6FF'; // Blue-50
    ctx.strokeStyle = '#BFDBFE'; // Blue-200
    ctx.lineWidth = 1;
    const r = 6;
    ctx.beginPath();
    ctx.roundRect(0, 0, widthPx, heightPx, r);
    ctx.fill();
    ctx.stroke();

    // Slogan Text (Supports Tamil & English)
    ctx.font = "italic 600 13px 'Mukta Malar', 'Noto Sans Tamil', 'Latha', 'Nirmala UI', system-ui, -apple-system, sans-serif";
    ctx.fillStyle = '#1D4ED8'; // Blue-700
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`“${slogan}”`, widthPx / 2, heightPx / 2 - 7);

    // Subtext
    ctx.font = "500 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = '#475569'; // Slate-600
    ctx.fillText('Thank you for choosing THENIJOBS.', widthPx / 2, heightPx / 2 + 8);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[renderSloganBadgeCanvas] Canvas render error:', err);
    return null;
  }
}

function numberToIndianWords(num: number): string {
  if (num === 999) return 'Nine Hundred and Ninety-Nine Rupees';
  if (num === 1800) return 'One Thousand Eight Hundred Rupees';
  if (num === 3500) return 'Three Thousand Five Hundred Rupees';
  if (num === 5000) return 'Five Thousand Rupees';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees';
  if (num < 20) return `${a[num]} Rupees`;
  if (num < 100) return `${b[Math.floor(num / 10)]}${num % 10 !== 0 ? ' ' + a[num % 10] : ''} Rupees`;
  if (num < 1000) return `${a[Math.floor(num / 100)]} Hundred${num % 100 !== 0 ? ' and ' + numberToIndianWords(num % 100).replace(' Rupees', '') : ''} Rupees`;
  if (num < 100000) return `${numberToIndianWords(Math.floor(num / 1000)).replace(' Rupees', '')} Thousand${num % 1000 !== 0 ? ' ' + numberToIndianWords(num % 1000).replace(' Rupees', '') : ''} Rupees`;
  return `${num.toLocaleString('en-IN')} Rupees`;
}

/**
 * Generates an official, publication-quality A4 PDF invoice and payment receipt for THENIJOBS subscriptions.
 * Fully compatible with all desktop and mobile browsers.
 */
export function generatePaymentReceiptPDF(data: ReceiptData): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 180mm
  let y = 16;

  // ── 1. Top Decorative Brand Bar ──────────────────────────────────────────
  pdf.setFillColor(37, 99, 235); // Primary Blue
  pdf.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // ── 2. Header: Logo & Company / Platform Details ──────────────────────────
  // Brand Logo Box
  pdf.setFillColor(239, 246, 255); // Blue-50
  pdf.roundedRect(margin, y, 14, 14, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(37, 99, 235);
  pdf.text('TJ', margin + 7, y + 9, { align: 'center' });

  // Brand Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42); // Slate-900
  pdf.text('THENI', margin + 18, y + 7);
  pdf.setTextColor(37, 99, 235); // Blue-600
  pdf.text('JOBS', margin + 41, y + 7);

  // Platform Subtitle & Official Address
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text("Tamil Nadu's Hyperlocal Job & Business Network Platform", margin + 18, y + 12);
  pdf.text('Address: North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu - 625533', margin + 18, y + 16);
  pdf.text(`Phone: ${SITE_CONTACT.phone1}  |  WhatsApp: +${SITE_CONTACT.whatsapp}  |  Email: ${SITE_CONTACT.supportEmail}`, margin + 18, y + 20);

  // Top Right: Invoice Title & Status
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);
  pdf.text('TAX INVOICE & RECEIPT', pageWidth - margin, y + 5, { align: 'right' });

  // Paid Pill Badge
  pdf.setFillColor(209, 250, 229); // Emerald-100
  pdf.roundedRect(pageWidth - margin - 38, y + 8, 38, 6.5, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(5, 150, 105); // Emerald-600
  pdf.text('✓ PAID / ACTIVE', pageWidth - margin - 19, y + 12.5, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text(`Receipt #: ${data.receiptNo}`, pageWidth - margin, y + 19, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Date: ${data.date || new Date().toLocaleDateString('en-IN')}`, pageWidth - margin, y + 23, { align: 'right' });

  y += 28;

  // Horizontal Divider Line
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── 3. Two-Column Card: Billed To vs Payment / Subscription Info ───────────
  const colWidth = (contentWidth - 6) / 2;
  const cardHeight = 38;

  // Left Card: Billed To (Customer)
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, colWidth, cardHeight, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text('BILLED TO (BUSINESS / EMPLOYER)', margin + 4, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  const cleanBilledTo = data.billedTo.length > 32 ? data.billedTo.slice(0, 32) + '...' : data.billedTo;
  pdf.text(cleanBilledTo, margin + 4, y + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  const addressText = data.address || 'Theni District, Tamil Nadu, India';
  const splitAddress = pdf.splitTextToSize(addressText, colWidth - 8);
  pdf.text(splitAddress.slice(0, 2), margin + 4, y + 17);

  const contactY = y + 26;
  if (data.email) pdf.text(`Email: ${data.email}`, margin + 4, contactY);
  if (data.phone) pdf.text(`Phone: ${data.phone}`, margin + 4, contactY + 4);
  if (data.gst) pdf.text(`GST / Reg: ${data.gst}`, margin + 4, contactY + 8);

  // Right Card: Subscription & Validity
  const rightX = margin + colWidth + 6;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(rightX, y, colWidth, cardHeight, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text('SUBSCRIPTION & PAYMENT DETAILS', rightX + 4, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);

  pdf.text('Subscription Plan:', rightX + 4, y + 12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(37, 99, 235);
  pdf.text(`${data.planName} Annual Plan`, rightX + 38, y + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Start Date:', rightX + 4, y + 17);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(data.startDate, rightX + 38, y + 17);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Ending Date:', rightX + 4, y + 22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 38, 38); // Highlighted Expiry
  pdf.text(data.expiryDate, rightX + 38, y + 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Duration:', rightX + 4, y + 27);
  pdf.text('1 Full Year (365 Days Access)', rightX + 38, y + 27);

  pdf.text('Payment Ref / ID:', rightX + 4, y + 32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  const cleanPayId = data.paymentId || 'pay_online_verified';
  pdf.text(cleanPayId.length > 22 ? cleanPayId.slice(0, 22) + '...' : cleanPayId, rightX + 38, y + 32);

  y += cardHeight + 8;

  // ── 4. Line Items Table ───────────────────────────────────────────────────
  // Table Header
  pdf.setFillColor(241, 245, 249); // Slate-100
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(margin, y, contentWidth, 8, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('#', margin + 4, y + 5.5);
  pdf.text('Description / Service', margin + 14, y + 5.5);
  pdf.text('Billing Cycle', margin + 85, y + 5.5);
  pdf.text('Start Date', margin + 115, y + 5.5);
  pdf.text('Ending Date', margin + 142, y + 5.5);
  pdf.text('Amount (INR)', pageWidth - margin - 4, y + 5.5, { align: 'right' });
  y += 8;

  // Table Row 1
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, y, contentWidth, 16, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1', margin + 4, y + 6);
  pdf.text(`${data.planName} Employer Subscription`, margin + 14, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Full Company Website, Job Postings, Digital ID Card & Candidate Portal', margin + 14, y + 11);

  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(8);
  pdf.text('1 Year (Annual)', margin + 85, y + 6);
  pdf.text(data.startDate, margin + 115, y + 6);
  pdf.text(data.expiryDate, margin + 142, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Rs. ${data.amount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 6, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(16, 185, 129);
  pdf.text('100% Tax Inclusive', pageWidth - margin - 4, y + 11, { align: 'right' });

  y += 16;

  // Table Summary / Totals
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, y, contentWidth, 22, 'FD');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Subtotal:', margin + 115, y + 6);
  pdf.text(`Rs. ${data.amount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 6, { align: 'right' });

  pdf.text('GST & Applicable Platform Fees:', margin + 115, y + 11);
  pdf.text('Inclusive (Rs. 0 Extra)', pageWidth - margin - 4, y + 11, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Total Amount Paid:', margin + 115, y + 18);
  pdf.setTextColor(5, 150, 105);
  pdf.text(`Rs. ${data.amount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 18, { align: 'right' });

  // Amount in words (on left of summary)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Amount in Words:', margin + 4, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59);
  const words = numberToIndianWords(data.amount);
  pdf.text(words, margin + 4, y + 11);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(5, 150, 105);
  pdf.text('Payment Gateway: Razorpay 256-Bit SSL Secured (Paid in Full)', margin + 4, y + 17);

  y += 26;

  // ── 5. Enterprise Growth Slogan & Plan Highlights ──────────────────────────
  const slogan = data.sloganText || getReceiptGrowthSlogan(data.planSlug || 'standard', data.receiptNo);
  const sloganBoxHeight = 15;

  const canvasImg = renderSloganBadgeCanvas(slogan, contentWidth, sloganBoxHeight);
  if (canvasImg) {
    pdf.addImage(canvasImg, 'PNG', margin, y, contentWidth, sloganBoxHeight);
  } else {
    // Vector fallback
    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(191, 219, 254);
    pdf.roundedRect(margin, y, contentWidth, sloganBoxHeight, 2, 2, 'FD');

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8.5);
    pdf.setTextColor(29, 78, 216);
    pdf.text(`"${slogan}"`, pageWidth / 2, y + 6.5, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Thank you for choosing THENIJOBS.', pageWidth / 2, y + 11.5, { align: 'center' });
  }
  y += sloganBoxHeight + 4;

  // Key Features Unlocked Box
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('PLAN ENTITLEMENTS & ACTIVE FEATURES', margin + 4, y + 5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('✓ Verified Company Profile & Digital ID Card', margin + 4, y + 10);
  pdf.text('✓ Full Company Website & Product/Service Catalogue', margin + 4, y + 14);
  pdf.text('✓ Priority Candidate Leads & WhatsApp Inquiries', margin + 4, y + 18);

  pdf.text(`✓ Active Job Postings Quota (${data.planName} Tier)`, margin + 95, y + 10);
  pdf.text('✓ 365 Days Guaranteed Platform Hosting & Security', margin + 95, y + 14);
  pdf.text('✓ Priority Theni Support & Local Business Promotion', margin + 95, y + 18);

  y += 27;

  // ── 6. Official Footer, Legal & Signature Section ─────────────────────────
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Left Legal / Support Notes
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 41, 59);
  pdf.text('IMPORTANT TERMS & CONDITIONS', margin, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('1. This is an electronically generated official platform invoice and payment voucher. No physical signature is required.', margin, y + 4);
  pdf.text('2. Subscription is activated immediately upon successful payment gateway confirmation and remains valid for 365 days.', margin, y + 7.5);
  pdf.text(`3. For billing questions, tax reconciliation or GST invoices, email ${SITE_CONTACT.supportEmail} or WhatsApp ${SITE_CONTACT.whatsapp}.`, margin, y + 11);
  pdf.text('4. THENIJOBS Platform Services • Registered Office: North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu - 625533.', margin, y + 14.5);

  // Right Seal & Signature Block
  const sigX = pageWidth - margin - 50;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(sigX, y - 2, 50, 20, 1.5, 1.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(37, 99, 235);
  pdf.text('THENIJOBS PLATFORM SERVICES', sigX + 25, y + 4, { align: 'center' });
  pdf.setTextColor(5, 150, 105);
  pdf.text('★ DIGITALLY VERIFIED ★', sigX + 25, y + 9, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Authorized Finance Signatory', sigX + 25, y + 14, { align: 'center' });
  pdf.text('Theni, Tamil Nadu, India', sigX + 25, y + 17.5, { align: 'center' });

  return pdf;
}
