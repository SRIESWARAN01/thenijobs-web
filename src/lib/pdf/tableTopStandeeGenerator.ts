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
  logoUrl?: string;
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
 * Draws the authentic vector THENIJOBS Verified District Seal
 */
function drawTheniJobsSeal(doc: jsPDF, x: number, y: number, radius: number) {
  // Gold / Amber outer ring
  doc.setDrawColor(217, 119, 6); // #D97706 Amber 600
  doc.setLineWidth(0.8);
  doc.setFillColor(254, 243, 199); // #FEF3C7 Amber 100
  doc.circle(x, y, radius, 'FD');

  // Inner dashed concentric ring
  doc.setDrawColor(180, 83, 9); // #B45309 Amber 700
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.circle(x, y, radius - 1.8, 'S');
  doc.setLineDashPattern([], 0); // reset dash

  // Seal typography
  doc.setTextColor(146, 64, 14); // #92400E Amber 800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(radius * 0.42);
  doc.text('THENIJOBS', x, y - 2.2, { align: 'center' });
  doc.setFontSize(radius * 0.36);
  doc.text('VERIFIED', x, y + 1.2, { align: 'center' });
  doc.setFontSize(radius * 0.26);
  doc.text('★ DISTRICT SEAL ★', x, y + 4.2, { align: 'center' });
}

/**
 * Helper to safely convert an image URL to Data URL via HTMLImageElement & canvas
 */
async function getBase64Image(url: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 200;
          canvas.height = img.naturalHeight || 200;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

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

  // 1. Generate High-Resolution QR Code
  const qrDataUrl = await QRCode.toDataURL(options.websiteUrl, {
    width: 600,
    margin: 1,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  // 2. Fetch Logo if provided
  let logoDataUrl: string | null = null;
  if (options.logoUrl) {
    logoDataUrl = await getBase64Image(options.logoUrl);
  }

  // 3. Draw Top Header Banner
  const headerHeight = isA4 ? 54 : 40;
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, width, headerHeight, 'F');

  // Accent stripe
  doc.setFillColor(...colors.accent);
  doc.rect(0, headerHeight - (isA4 ? 4 : 3), width, (isA4 ? 4 : 3), 'F');

  // Brand Badge Top Bar
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 11 : 8.5);
  doc.text('THENIJOBS.COM • OFFICIAL THENI DISTRICT PLATFORM', width / 2, isA4 ? 11 : 8.5, { align: 'center' });

  // Company Logo or Monogram Badge
  const logoSize = isA4 ? 18 : 13;
  const logoX = isA4 ? 16 : 10;
  const logoY = isA4 ? 18 : 14;

  if (logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(logoX - 1, logoY - 1, logoSize + 2, logoSize + 2, 2, 2, 'F');
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch {
      // Fallback monogram
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'F');
      doc.setTextColor(...colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isA4 ? 14 : 10);
      doc.text(options.companyName.charAt(0).toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2 + (isA4 ? 5 : 3.5), { align: 'center' });
    }
  } else {
    // Elegant Monogram box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'F');
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA4 ? 14 : 10);
    doc.text(options.companyName.charAt(0).toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2 + (isA4 ? 5 : 3.5), { align: 'center' });
  }

  // Company Name in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 22 : 16);
  const companyNameX = logoX + logoSize + (isA4 ? 6 : 4);
  const maxNameWidth = width - companyNameX - (isA4 ? 16 : 10);
  const truncatedName = doc.splitTextToSize(options.companyName.toUpperCase(), maxNameWidth)[0];
  doc.text(truncatedName, companyNameX, isA4 ? 27 : 21);

  // Tagline / Location
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 10 : 7.5);
  doc.setTextColor(226, 232, 240); // Slate 200
  const locationText = options.tagline ? `${options.tagline} • ${options.location}` : `${options.location}, Theni District`;
  const truncatedLocation = doc.splitTextToSize(locationText, maxNameWidth)[0];
  doc.text(truncatedLocation, companyNameX, isA4 ? 35 : 27);

  // 4. Main Call to Action Headline
  const ctaY = headerHeight + (isA4 ? 22 : 15);
  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 24 : 17);

  const defaultHeadline = options.mode === 'hiring'
    ? 'WE ARE HIRING!'
    : 'SCAN TO VIEW OUR CATALOG & OFFERS';
  const headline = options.customHeadline || defaultHeadline;
  doc.text(headline, width / 2, ctaY, { align: 'center' });

  // Tamil Subheading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 13 : 9.5);
  doc.setTextColor(...colors.secondary);
  const tamilHeadline = options.mode === 'hiring'
    ? 'வேலைக்கு ஆட்கள் தேவை!'
    : 'எங்கள் தயாரிப்புகள் மற்றும் சலுகைகள்';
  doc.text(tamilHeadline, width / 2, ctaY + (isA4 ? 8 : 5.5), { align: 'center' });

  // Description / Subtext
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 11 : 8);
  doc.setTextColor(71, 85, 105); // Slate 600
  const defaultSubtext = options.mode === 'hiring'
    ? 'We are hiring! Scan to apply on THENIJOBS • உடனே விண்ணப்பிக்க ஸ்கேன் செய்யவும்'
    : 'Scan to view our product catalog & daily offers • எங்கள் தயாரிப்புகள் மற்றும் சலுகைகளை காண்க';
  const subtext = options.customSubtext || defaultSubtext;
  
  const textLines = doc.splitTextToSize(subtext, width - (isA4 ? 40 : 24));
  doc.text(textLines, width / 2, ctaY + (isA4 ? 17 : 12), { align: 'center' });

  // 5. Center QR Code Container Box
  const qrBoxSize = isA4 ? 82 : 56;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = ctaY + (isA4 ? 26 : 19);

  // QR Frame with rounded shadow effect
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(1.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrBoxX - 4, qrBoxY - 4, qrBoxSize + 8, qrBoxSize + 8, 3, 3, 'FD');

  // Insert QR Code image
  doc.addImage(qrDataUrl, 'PNG', qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

  // Draw Official THENIJOBS Verification Seal on Standee
  const sealRadius = isA4 ? 17 : 12.5;
  const sealX = qrBoxX + qrBoxSize + (isA4 ? 16 : 10);
  const sealY = qrBoxY + (isA4 ? 18 : 12);
  if (sealX + sealRadius <= width - 4) {
    drawTheniJobsSeal(doc, sealX, sealY, sealRadius);
  }

  // Scan Instruction Pill under QR Code
  const pillY = qrBoxY + qrBoxSize + (isA4 ? 10 : 7);
  doc.setFillColor(...colors.primary);
  const pillWidth = isA4 ? 110 : 78;
  doc.roundedRect((width - pillWidth) / 2, pillY - (isA4 ? 5.5 : 4), pillWidth, isA4 ? 10 : 7, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 9.5 : 6.8);
  doc.text('📱 POINT CAMERA TO SCAN • கேமராவில் ஸ்கேன் செய்யவும்', width / 2, pillY + 1, { align: 'center' });

  // 6. Contact & Placement Callout
  const contactY = pillY + (isA4 ? 18 : 13);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 11 : 8);
  doc.text(`Phone / WhatsApp: ${options.phone}`, width / 2, contactY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 9.5 : 6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Direct Web Address: ${options.websiteUrl}`, width / 2, contactY + (isA4 ? 6 : 4.5), { align: 'center' });

  // 7. Standee Cutting & Folding Guide (Bottom edge for table-top standing)
  const foldY = height - (isA4 ? 24 : 16);
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, foldY, width - 10, foldY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(isA4 ? 8 : 5.8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('✂️ FOLD HERE FOR CASH COUNTER DISPLAY STAND • கடை கல்லாப்பெட்டியில் வைக்க இங்கே மடிக்கவும்', width / 2, foldY - 2, { align: 'center' });
  doc.text('OFFICIAL THENIJOBS VERIFIED PARTNER STANDEE • WWW.THENIJOBS.COM', width / 2, height - (isA4 ? 8 : 5), { align: 'center' });

  return doc;
}

/**
 * 1-Click Quick Standee Downloader for Employer Dashboard
 */
export async function downloadQuickStandee(
  company: {
    id: string;
    slug?: string;
    name: string;
    tagline?: string;
    location?: string;
    district?: string;
    phone?: string;
    whatsapp?: string;
    logoUrl?: string;
    companyLogo?: string;
  },
  mode: StandeeMode = 'hiring',
  size: StandeeSize = 'a5',
  theme: StandeeTheme = 'blue'
): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.thenijobs.com';
  const websiteUrl = `${origin}/${company.slug || company.id}`;
  const location = company.location
    ? `${company.location}, ${company.district || 'Theni'} District`
    : `${company.district || 'Theni'} District`;
  const phone = company.whatsapp || company.phone || '+91 93605 19460';
  const logoUrl = company.logoUrl || company.companyLogo;

  const doc = await generateTableTopStandeePdf({
    mode,
    size,
    theme,
    companyName: company.name || 'Company',
    tagline: company.tagline,
    location,
    phone,
    websiteUrl,
    logoUrl,
  });

  const safeName = (company.name || 'standee').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `THENIJOBS_${safeName}_${mode}_standee_${size.toUpperCase()}.pdf`;
  doc.save(filename);
  return filename;
}
