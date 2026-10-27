import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export type StandeeMode = 'hiring' | 'catalog';
export type StandeeSize = 'a4' | 'a5';
export type StandeeTheme = 'blue' | 'emerald' | 'navy';

export interface StandeeOptions {
  mode: StandeeMode;
  size: StandeeSize;
  theme: StandeeTheme;
  companyName: string;
  tagline?: string;
  location: string;
  phone: string;
  websiteUrl: string;
  customHeadline?: string;
  customSubtext?: string;
}

const THEME_COLORS: Record<StandeeTheme, { primary: [number, number, number]; secondary: [number, number, number]; accent: [number, number, number] }> = {
  blue: {
    primary: [30, 64, 175],    // #1E40AF Theni Royal Blue
    secondary: [37, 99, 235],  // #2563EB
    accent: [245, 158, 11],    // #F59E0B Amber
  },
  emerald: {
    primary: [6, 95, 70],      // #065F46 Theni Forest Emerald
    secondary: [5, 150, 105],  // #059669
    accent: [245, 158, 11],
  },
  navy: {
    primary: [15, 23, 42],     // #0F172A Slate Navy
    secondary: [30, 41, 59],   // #1E293B
    accent: [239, 68, 68],     // #EF4444
  },
};

/**
 * Generates an authoritative, print-ready PDF Table-Top QR Standee
 * formatted for counter displays in retail shops, showrooms, hospitals, and offices.
 */
export async function generateTableTopStandeePdf(options: StandeeOptions): Promise<jsPDF> {
  const isA4 = options.size === 'a4';
  const width = isA4 ? 210 : 148;
  const height = isA4 ? 297 : 210;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.size,
  });

  const colors = THEME_COLORS[options.theme] || THEME_COLORS.blue;

  // 1. Generate High-Resolution QR Code (Paired with the URL)
  const qrDataUrl = await QRCode.toDataURL(options.websiteUrl, {
    width: 600,
    margin: 1,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  // 2. Draw Top Header Banner
  const headerHeight = isA4 ? 50 : 36;
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, width, headerHeight, 'F');

  // Accent stripe
  doc.setFillColor(...colors.accent);
  doc.rect(0, headerHeight - (isA4 ? 4 : 3), width, (isA4 ? 4 : 3), 'F');

  // Brand Badge
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 12 : 9);
  doc.text('THENIJOBS.COM • THE OFFICIAL DISTRICT DIRECTORY', width / 2, isA4 ? 12 : 9, { align: 'center' });

  // Company Name in Header
  doc.setFontSize(isA4 ? 24 : 17);
  doc.text(options.companyName.toUpperCase(), width / 2, isA4 ? 26 : 19, { align: 'center' });

  // Tagline or Location
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 11 : 8);
  const locationText = options.tagline ? `${options.tagline} • ${options.location}` : `${options.location}, Theni District`;
  doc.text(locationText, width / 2, isA4 ? 36 : 26, { align: 'center' });

  // 3. Main Call to Action Headline
  const ctaY = headerHeight + (isA4 ? 24 : 16);
  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 26 : 18);

  const defaultHeadline = options.mode === 'hiring'
    ? 'WE ARE HIRING!'
    : 'EXPLORE OUR PRODUCTS & OFFERS';
  const headline = options.customHeadline || defaultHeadline;
  doc.text(headline, width / 2, ctaY, { align: 'center' });

  // Tamil Subheading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 14 : 10);
  doc.setTextColor(...colors.secondary);
  const tamilHeadline = options.mode === 'hiring'
    ? 'வேலைக்கு ஆட்கள் தேவை!'
    : 'எங்கள் தயாரிப்புகள் & சலுகைகள்';
  doc.text(tamilHeadline, width / 2, ctaY + (isA4 ? 9 : 6), { align: 'center' });

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 12 : 8.5);
  doc.setTextColor(71, 85, 105); // Slate 600
  const defaultSubtext = options.mode === 'hiring'
    ? 'Scan the QR code below with any smartphone to view open vacancies and apply directly on THENIJOBS'
    : 'Scan the QR code below to browse our live digital catalog, price list, and exclusive daily offers';
  const subtext = options.customSubtext || defaultSubtext;
  
  const textLines = doc.splitTextToSize(subtext, width - (isA4 ? 40 : 26));
  doc.text(textLines, width / 2, ctaY + (isA4 ? 18 : 13), { align: 'center' });

  // 4. Center QR Code Container Box
  const qrBoxSize = isA4 ? 85 : 58;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = ctaY + (isA4 ? 30 : 22);

  // QR Frame with rounded corners effect & shadow border
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(1.5);
  doc.setFillColor(255, 255, 255);
  doc.rect(qrBoxX - 4, qrBoxY - 4, qrBoxSize + 8, qrBoxSize + 8, 'FD');

  // Insert QR Code image
  doc.addImage(qrDataUrl, 'PNG', qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

  // Scan Instruction Pill under QR Code
  const pillY = qrBoxY + qrBoxSize + (isA4 ? 10 : 7);
  doc.setFillColor(...colors.primary);
  const pillWidth = isA4 ? 100 : 72;
  doc.roundedRect((width - pillWidth) / 2, pillY - (isA4 ? 6 : 4), pillWidth, isA4 ? 10 : 7, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 10 : 7);
  doc.text('📱 POINT CAMERA TO SCAN • கேமராவில் ஸ்கேன் செய்யவும்', width / 2, pillY, { align: 'center' });

  // 5. Contact & Support Details Footer
  const contactY = pillY + (isA4 ? 20 : 14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 12 : 8.5);
  doc.text(`Phone / WhatsApp: ${options.phone}`, width / 2, contactY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 10 : 7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Direct Web Address: ${options.websiteUrl}`, width / 2, contactY + (isA4 ? 7 : 5), { align: 'center' });

  // 6. Standee Cutting & Folding Guide (Bottom edge for table-top standing)
  const foldY = height - (isA4 ? 24 : 16);
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, foldY, width - 10, foldY);

  doc.setFontSize(isA4 ? 8 : 6);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('✂️ FOLD HERE FOR TABLE-TOP DISPLAY STAND • மேஜையில் வைக்க இங்கே மடிக்கவும்', width / 2, foldY - 2, { align: 'center' });
  doc.text('POWERED BY THENIJOBS • VERIFIED LOCAL BUSINESS NETWORK • WWW.THENIJOBS.COM', width / 2, height - (isA4 ? 8 : 5), { align: 'center' });

  return doc;
}
