import QRCode from 'qrcode';
import type { PosterData, GeneratedPoster, TemplateId } from './types';
import { POSTER_TEMPLATES, getTemplateById } from './posterTemplates';
import { getCategoryTheme } from './categoryThemes';

// Helper to safely load images on canvas
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Rounded rectangle utility
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = true,
  stroke = false
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Multiline text wrapper
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
): number {
  const words = text.split(' ');
  let line = '';
  let linesDrawn = 0;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines - 1 && n < words.length - 1) {
        // truncate remaining
        ctx.fillText(words.slice(n).join(' ') + '...', x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

// Draw Company Logo or Initials Avatar
async function drawLogo(
  ctx: CanvasRenderingContext2D,
  data: PosterData,
  x: number,
  y: number,
  size: number,
  bgColor = '#FFFFFF',
  textColor = '#0F172A'
) {
  ctx.save();
  if (data.companyLogoUrl) {
    try {
      const img = await loadImage(data.companyLogoUrl);
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
      return;
    } catch {
      // fallback to initials
    }
  }
  // Draw Initials
  ctx.fillStyle = bgColor;
  roundRect(ctx, x, y, size, size, size / 4, true, false);
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.floor(size * 0.42)}px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const initials = (data.companyName || 'TJ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
  ctx.fillText(initials || 'TJ', x + size / 2, y + size / 2);
  ctx.restore();
}

// Draw Footer Watermark
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lightTheme = true
) {
  ctx.save();
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillStyle = lightTheme ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.45)';
  ctx.textAlign = 'center';
  ctx.fillText('www.thenijobs.com • Theni District Hyperlocal Employment Portal', width / 2, height - 35);
  ctx.restore();
}

/**
 * 1. CORPORATE EXECUTIVE TEMPLATE
 */
async function renderCorporateExecutive(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, w, h);

  // Top header banner
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, '#0F172A');
  gradient.addColorStop(1, '#1E293B');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, 140);

  // Top header brand
  ctx.fillStyle = '#38BDF8';
  ctx.font = "bold 28px 'Inter', sans-serif";
  ctx.fillText('THENIJOBS', 60, 80);
  ctx.fillStyle = '#94A3B8';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText('• OFFICIAL CAREER OPPORTUNITY', 230, 80);

  // Urgent Tag if applicable
  if (data.isUrgent) {
    ctx.fillStyle = '#DC2626';
    roundRect(ctx, w - 240, 50, 180, 42, 21, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 16px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('⚡ URGENT HIRING', w - 150, 77);
    ctx.textAlign = 'left';
  }

  // Company Card
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, 60, 180, w - 120, 110, 16, true, false);
  ctx.shadowColor = 'transparent';

  await drawLogo(ctx, data, 80, 200, 70, '#0284C7', '#FFFFFF');

  ctx.fillStyle = '#0F172A';
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.fillText(data.companyName, 175, 235);
  ctx.fillStyle = '#64748B';
  ctx.font = "20px 'Inter', sans-serif";
  ctx.fillText(`📍 ${data.location || data.district || 'Theni District'} • ${data.category || 'General Employment'}`, 175, 268);

  // Main Job Title Card
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, 320, w - 120, 260, 20, true, false);

  ctx.fillStyle = '#0284C7';
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText('WE ARE HIRING FOR', 100, 370);

  ctx.fillStyle = '#0F172A';
  ctx.font = "bold 44px 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, 100, 430, w - 200, 52, 2);

  // 4 Spec Badges
  const specs = [
    { label: 'SALARY', val: data.salaryText || 'Attractive / Best in Industry' },
    { label: 'EXPERIENCE', val: data.experience || 'Freshers / Experienced' },
    { label: 'JOB TYPE', val: data.jobType ? data.jobType.replace('_', ' ').toUpperCase() : 'FULL TIME' },
    { label: 'VACANCIES', val: data.openings ? `${data.openings} Positions` : 'Multiple Openings' }
  ];

  const colW = (w - 120 - 45) / 2;
  const startY = 610;
  specs.forEach((s, idx) => {
    const r = Math.floor(idx / 2);
    const c = idx % 2;
    const bx = 60 + c * (colW + 15);
    const by = startY + r * 115;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, bx, by, colW, 100, 14, true, false);

    ctx.fillStyle = '#64748B';
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.fillText(s.label, bx + 24, by + 36);

    ctx.fillStyle = '#0F172A';
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText(s.val, bx + 24, by + 74);
  });

  // Requirements / Highlights
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, 865, w - 120, 180, 16, true, false);
  ctx.fillStyle = '#0F172A';
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillText('KEY HIGHLIGHTS & ELIGIBILITY', 90, 905);

  const highlights = data.highlights && data.highlights.length > 0
    ? data.highlights.slice(0, 3)
    : [
        data.education ? `Qualification: ${data.education}` : 'Standard qualification required',
        'Immediate joiners preferred in Theni district',
        'Verified corporate recruitment on THENIJOBS platform'
      ];

  highlights.forEach((h, i) => {
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(102, 940 + i * 36, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.font = "18px 'Inter', sans-serif";
    ctx.fillText(h, 125, 946 + i * 36);
  });

  // Bottom QR Apply Box
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, 60, 1070, w - 120, 210, 20, true, false);

  // QR container
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 90, 1095, 160, 160, 12, true, false);
  ctx.drawImage(qrImg, 100, 1105, 140, 140);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 28px 'Inter', sans-serif";
  ctx.fillText('SCAN TO APPLY NOW', 280, 1145);

  ctx.fillStyle = '#94A3B8';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText('Open camera on your mobile phone to scan the QR code', 280, 1180);
  ctx.fillText('and submit your application directly on THENIJOBS.', 280, 1210);

  ctx.fillStyle = '#38BDF8';
  ctx.font = "bold 16px 'Inter', sans-serif";
  ctx.fillText(`Official URL: ${data.publicUrl.replace('https://www.', '')}`, 280, 1245);

  drawWatermark(ctx, w, h, true);
}

/**
 * 2. TECH & STARTUP DARK GRADIENT TEMPLATE
 */
async function renderTechGradient(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Dark Background
  ctx.fillStyle = '#090D16';
  ctx.fillRect(0, 0, w, h);

  // Glowing Gradient Spheres
  const g1 = ctx.createRadialGradient(200, 200, 20, 200, 200, 450);
  g1.addColorStop(0, 'rgba(79, 70, 229, 0.35)');
  g1.addColorStop(1, 'rgba(9, 13, 22, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  const g2 = ctx.createRadialGradient(w - 200, 700, 20, w - 200, 700, 400);
  g2.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
  g2.addColorStop(1, 'rgba(9, 13, 22, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  // Top Bar
  ctx.fillStyle = '#131B2E';
  roundRect(ctx, 60, 60, w - 120, 80, 16, true, false);

  await drawLogo(ctx, data, 80, 75, 50, '#4F46E5', '#FFFFFF');

  ctx.fillStyle = '#F8FAFC';
  ctx.font = "bold 26px 'Inter', sans-serif";
  ctx.fillText(data.companyName, 145, 108);

  ctx.fillStyle = '#06B6D4';
  ctx.font = "bold 16px 'Inter', sans-serif";
  ctx.textAlign = 'right';
  ctx.fillText('THENIJOBS TECH NETWORK', w - 90, 108);
  ctx.textAlign = 'left';

  // Hero Title Block
  ctx.fillStyle = '#22D3EE';
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillText('// NOW HIRING • CAREER EXPANSION', 65, 200);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 50px 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, 65, 270, w - 130, 62, 2);

  // Neon Badges Row
  const badges = [
    data.location || data.district || 'Theni',
    data.jobType ? data.jobType.replace('_', ' ') : 'Full Time',
    data.category || 'Tech & Modern'
  ];
  let badgeX = 65;
  badges.forEach(b => {
    ctx.font = "bold 16px 'Inter', sans-serif";
    const bW = ctx.measureText(b).width + 36;
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, badgeX, 370, bW, 40, 20, true, false);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    roundRect(ctx, badgeX, 370, bW, 40, 20, false, true);

    ctx.fillStyle = '#38BDF8';
    ctx.fillText(b, badgeX + 18, 396);
    badgeX += bW + 15;
  });

  // Middle Data Cards
  const cards = [
    { title: 'COMPENSATION', val: data.salaryText || 'Competitive Market Rate' },
    { title: 'EXPERIENCE', val: data.experience || 'Entry / Experienced' },
    { title: 'EDUCATION', val: data.education || 'Degree / Diploma / Any' },
    { title: 'OPENINGS', val: data.openings ? `${data.openings} Candidates` : 'Immediate Slots' }
  ];

  const cardW = (w - 120 - 20) / 2;
  cards.forEach((c, i) => {
    const rx = 60 + (i % 2) * (cardW + 20);
    const ry = 450 + Math.floor(i / 2) * 140;

    ctx.fillStyle = '#131B2E';
    roundRect(ctx, rx, ry, cardW, 120, 16, true, false);

    ctx.fillStyle = '#94A3B8';
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.fillText(c.title, rx + 24, ry + 40);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText(c.val, rx + 24, ry + 82);
  });

  // Central QR Cyber Spotlight
  ctx.fillStyle = '#131B2E';
  ctx.strokeStyle = '#6366F1';
  ctx.lineWidth = 2;
  roundRect(ctx, 60, 770, w - 120, 480, 24, true, true);

  // Centered QR Code
  ctx.fillStyle = '#FFFFFF';
  const qrBoxSize = 240;
  const qrX = (w - qrBoxSize) / 2;
  roundRect(ctx, qrX, 810, qrBoxSize, qrBoxSize, 16, true, false);
  ctx.drawImage(qrImg, qrX + 15, 825, qrBoxSize - 30, qrBoxSize - 30);

  ctx.fillStyle = '#22D3EE';
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('SCAN QR CODE TO APPLY', w / 2, 1100);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = "20px 'Inter', sans-serif";
  ctx.fillText('Instant 1-Tap Mobile Application on THENIJOBS', w / 2, 1145);

  ctx.fillStyle = '#94A3B8';
  ctx.font = "16px 'Inter', sans-serif";
  ctx.fillText(data.publicUrl, w / 2, 1190);
  ctx.textAlign = 'left';

  drawWatermark(ctx, w, h, false);
}

/**
 * 3. THENI REGIONAL CLASSIC HERITAGE TEMPLATE
 */
async function renderTheniHeritage(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Heritage Cream Background
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, w, h);

  // Ornamental Double Frame
  ctx.strokeStyle = '#D97706'; // Gold
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, w - 60, h - 60);

  ctx.strokeStyle = '#065F46'; // Deep Emerald
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, w - 84, h - 84);

  // Top Heritage Banner
  ctx.fillStyle = '#064E3B';
  ctx.fillRect(44, 44, w - 88, 150);

  ctx.fillStyle = '#FEF08A'; // Gold Tamil font
  ctx.font = "bold 34px 'Mukta Malar', 'Noto Sans Tamil', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('வேலைவாய்ப்பு அறிவிப்பு', w / 2, 105);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText('THENI DISTRICT EMPLOYMENT NOTIFICATION', w / 2, 150);
  ctx.textAlign = 'left';

  // Company Details Block
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  roundRect(ctx, 70, 225, w - 140, 110, 14, true, true);

  await drawLogo(ctx, data, 90, 240, 80, '#065F46', '#FFFFFF');

  ctx.fillStyle = '#064E3B';
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.fillText(data.companyName, 190, 280);

  ctx.fillStyle = '#78350F';
  ctx.font = "bold 20px 'Mukta Malar', 'Noto Sans Tamil', sans-serif";
  ctx.fillText(`📍 ${data.location || 'தேனி'} மாவட்டம் • ${data.category || 'முன்னணி நிறுவனம்'}`, 190, 315);

  // Big Job Title Box
  ctx.fillStyle = '#FEF3C7'; // Light Gold
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2;
  roundRect(ctx, 70, 360, w - 140, 230, 16, true, true);

  ctx.fillStyle = '#92400E';
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText('VACANCY / பணிக்கான விபரம்', 100, 405);

  ctx.fillStyle = '#1E293B';
  ctx.font = "bold 44px 'Mukta Malar', 'Noto Sans Tamil', 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, 100, 465, w - 200, 52, 2);

  // Specifications
  const specs = [
    { title: 'சம்பளம் (Salary)', val: data.salaryText || 'திறமைக்கேற்ப சிறந்த ஊதியம்' },
    { title: 'பணி வகை (Job Type)', val: data.jobType || 'முழு நேரம் (Full Time)' },
    { title: 'அனுபவம் (Experience)', val: data.experience || 'முன் அனுபவம் / புதியவர்கள்' },
    { title: 'கல்வித்தகுதி (Education)', val: data.education || 'ஏதேனும் ஒரு பட்டம் / டிப்ளமோ' }
  ];

  const colW = (w - 140 - 20) / 2;
  specs.forEach((s, idx) => {
    const rx = 70 + (idx % 2) * (colW + 20);
    const ry = 615 + Math.floor(idx / 2) * 135;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    roundRect(ctx, rx, ry, colW, 115, 12, true, true);

    ctx.fillStyle = '#065F46';
    ctx.font = "bold 17px 'Mukta Malar', 'Noto Sans Tamil', sans-serif";
    ctx.fillText(s.title, rx + 20, ry + 40);

    ctx.fillStyle = '#1F2937';
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText(s.val, rx + 20, ry + 82);
  });

  // QR Code Seal Box
  ctx.fillStyle = '#064E3B';
  roundRect(ctx, 70, 915, w - 140, 330, 20, true, false);

  // White QR holder
  ctx.fillStyle = '#FFFFFF';
  const qrX = (w - 200) / 2;
  roundRect(ctx, qrX, 945, 200, 200, 14, true, false);
  ctx.drawImage(qrImg, qrX + 10, 955, 180, 180);

  ctx.fillStyle = '#FEF08A';
  ctx.font = "bold 28px 'Mukta Malar', 'Noto Sans Tamil', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('விண்ணப்பிக்க QR குறியீட்டை ஸ்கேன் செய்யவும்', w / 2, 1185);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText('Apply Online: ' + data.publicUrl, w / 2, 1220);
  ctx.textAlign = 'left';

  drawWatermark(ctx, w, h, true);
}

/**
 * 4. URGENT WALK-IN HIRING TEMPLATE
 */
async function renderUrgentWalkin(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Bold Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // Diagonal High-Urgency Top Banner
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(0, 0, w, 160);

  ctx.fillStyle = '#FEF08A';
  ctx.font = "bold 44px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('⚡ URGENT HIRING • IMMEDIATE JOINING', w / 2, 75);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 24px 'Mukta Malar', 'Noto Sans Tamil', sans-serif";
  ctx.fillText('உடனடி வேலைவாய்ப்பு • நேர்காணல் அறிவிப்பு', w / 2, 125);
  ctx.textAlign = 'left';

  // Company Name
  ctx.fillStyle = '#18181B';
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.fillText(data.companyName.toUpperCase(), 70, 220);

  ctx.fillStyle = '#DC2626';
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText(`📍 ${data.location || 'Theni'} • DIRECT RECRUITMENT`, 70, 255);

  // Big Job Title Box
  ctx.fillStyle = '#FEF2F2';
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 3;
  roundRect(ctx, 60, 280, w - 120, 220, 20, true, true);

  ctx.fillStyle = '#991B1B';
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillText('JOB ROLE / பணி:', 95, 335);

  ctx.fillStyle = '#18181B';
  ctx.font = "bold 48px 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, 95, 400, w - 190, 56, 2);

  // Urgent Details Banner
  ctx.fillStyle = '#DC2626';
  roundRect(ctx, 60, 525, w - 120, 110, 16, true, false);

  ctx.fillStyle = '#FEF08A';
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText('💰 OFFERED SALARY / சம்பளம்:', 95, 565);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 36px 'Inter', sans-serif";
  ctx.fillText(data.salaryText || 'Best in Industry + PF + ESI + Incentives', 95, 610);

  // 3 Urgent Bullet Highlights
  const bullets = [
    `🎓 Qualification: ${data.education || '10th, 12th, ITI, Diploma, Any Degree'}`,
    `⏳ Experience: ${data.experience || 'Freshers or Experienced welcome'}`,
    `📞 Immediate Contact: ${data.contactPhone || 'Available via QR Code Apply'}`
  ];

  ctx.fillStyle = '#F4F4F5';
  roundRect(ctx, 60, 660, w - 120, 220, 18, true, false);

  ctx.fillStyle = '#18181B';
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillText('CRITICAL REQUIREMENTS & PERKS', 95, 705);

  bullets.forEach((b, i) => {
    ctx.fillStyle = '#DC2626';
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.fillText('✔', 95, 755 + i * 42);

    ctx.fillStyle = '#27272A';
    ctx.font = "20px 'Inter', sans-serif";
    ctx.fillText(b, 130, 755 + i * 42);
  });

  // Action Bottom Card
  ctx.fillStyle = '#18181B';
  roundRect(ctx, 60, 910, w - 120, 360, 24, true, false);

  // QR Code
  ctx.fillStyle = '#FFFFFF';
  const qrX = (w - 220) / 2;
  roundRect(ctx, qrX, 940, 220, 220, 16, true, false);
  ctx.drawImage(qrImg, qrX + 10, 950, 200, 200);

  ctx.fillStyle = '#FEF08A';
  ctx.font = "bold 30px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO APPLY OR CALL IMMEDIATELY', w / 2, 1205);

  ctx.fillStyle = '#A1A1AA';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText('Verified Opportunity on www.thenijobs.com', w / 2, 1240);
  ctx.textAlign = 'left';

  drawWatermark(ctx, w, h, true);
}

/**
 * 5. CREATIVE INDUSTRY SPOTLIGHT TEMPLATE
 */
async function renderIndustrySpotlight(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  const theme = getCategoryTheme(data.category);

  // Background
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(0, 0, w, h);

  // Top Curved Header
  const g = ctx.createLinearGradient(0, 0, w, 300);
  g.addColorStop(0, theme.accentColor);
  g.addColorStop(1, '#4F46E5');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, 280);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(w - 100, 50, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 26px 'Inter', sans-serif";
  ctx.fillText('THENIJOBS CAREER SPOTLIGHT', 70, 80);

  ctx.font = "20px 'Mukta Malar', 'Noto Sans Tamil', sans-serif";
  ctx.fillText(`சிறப்பு வேலைவாய்ப்பு • ${theme.nameTa}`, 70, 120);

  // Floating Company Card
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, 60, 170, w - 120, 140, 20, true, false);
  ctx.shadowColor = 'transparent';

  await drawLogo(ctx, data, 90, 195, 90, theme.accentColor, '#FFFFFF');

  ctx.fillStyle = '#0F172A';
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.fillText(data.companyName, 205, 240);

  ctx.fillStyle = '#64748B';
  ctx.font = "20px 'Inter', sans-serif";
  ctx.fillText(`📍 ${data.location || 'Theni District'} • Verified Employer`, 205, 275);

  // Job Title Card
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, 340, w - 120, 230, 20, true, false);

  ctx.fillStyle = theme.accentColor;
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText('OPPORTUNITY / ROLE', 95, 390);

  ctx.fillStyle = '#111827';
  ctx.font = "bold 44px 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, 95, 450, w - 190, 52, 2);

  // Category Highlights Grid
  const perks = data.highlights && data.highlights.length > 0
    ? data.highlights.slice(0, 4)
    : theme.defaultHighlights;

  ctx.fillStyle = theme.lightBg;
  roundRect(ctx, 60, 600, w - 120, 250, 20, true, false);

  ctx.fillStyle = '#0F172A';
  ctx.font = "bold 24px 'Inter', sans-serif";
  ctx.fillText('ROLE ADVANTAGES & BENCHMARKS', 95, 645);

  perks.forEach((p, idx) => {
    const rx = 95 + (idx % 2) * 450;
    const ry = 690 + Math.floor(idx / 2) * 60;

    ctx.fillStyle = theme.accentColor;
    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillText('✦', rx, ry + 22);

    ctx.fillStyle = '#1F2937';
    ctx.font = "bold 19px 'Inter', sans-serif";
    ctx.fillText(p, rx + 30, ry + 22);
  });

  // Bottom QR Container
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, 60, 880, w - 120, 390, 24, true, false);

  ctx.fillStyle = '#FFFFFF';
  const qrX = (w - 220) / 2;
  roundRect(ctx, qrX, 915, 220, 220, 16, true, false);
  ctx.drawImage(qrImg, qrX + 10, 925, 200, 200);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 30px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO APPLY NOW', w / 2, 1180);

  ctx.fillStyle = '#38BDF8';
  ctx.font = "20px 'Inter', sans-serif";
  ctx.fillText(`Salary: ${data.salaryText || 'Best in Industry'}`, w / 2, 1220);
  ctx.textAlign = 'left';

  drawWatermark(ctx, w, h, true);
}

/**
 * 6. SPLIT COLUMN INFOGRAPHIC TEMPLATE
 */
async function renderSplitInfographic(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Left 35% Dark Column, Right 65% White Column
  const splitX = w * 0.35;

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, splitX, h);

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(splitX, 0, w - splitX, h);

  // Left Column Content (Branding & QR)
  await drawLogo(ctx, data, 50, 80, 100, '#38BDF8', '#0F172A');

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 26px 'Inter', sans-serif";
  drawWrappedText(ctx, data.companyName, 50, 230, splitX - 90, 32, 2);

  ctx.fillStyle = '#94A3B8';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText(`📍 ${data.location || 'Theni'}`, 50, 310);

  // Left QR Code
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 40, 420, splitX - 80, splitX - 80, 16, true, false);
  ctx.drawImage(qrImg, 50, 430, splitX - 100, splitX - 100);

  ctx.fillStyle = '#38BDF8';
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO APPLY', splitX / 2, splitX + 410);

  ctx.fillStyle = '#94A3B8';
  ctx.font = "14px 'Inter', sans-serif";
  ctx.fillText('www.thenijobs.com', splitX / 2, splitX + 440);
  ctx.textAlign = 'left';

  // Right Column Content (Specifications & Highlights)
  const rX = splitX + 50;
  const rW = w - splitX - 100;

  ctx.fillStyle = '#2563EB';
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText('CAREER OPPORTUNITY //', rX, 100);

  ctx.fillStyle = '#0F172A';
  ctx.font = "bold 44px 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, rX, 160, rW, 52, 2);

  // Salary Banner
  ctx.fillStyle = '#EFF6FF';
  ctx.strokeStyle = '#BFDBFE';
  ctx.lineWidth = 1;
  roundRect(ctx, rX, 290, rW, 110, 16, true, true);

  ctx.fillStyle = '#1E40AF';
  ctx.font = "bold 16px 'Inter', sans-serif";
  ctx.fillText('OFFERED SALARY', rX + 24, 330);

  ctx.fillStyle = '#1D4ED8';
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.fillText(data.salaryText || 'Attractive / Competitive Package', rX + 24, 375);

  // Metadata Grid
  const meta = [
    { label: 'EXPERIENCE', val: data.experience || 'Entry / Exp' },
    { label: 'EDUCATION', val: data.education || 'Graduate / Any' },
    { label: 'JOB TYPE', val: data.jobType ? data.jobType.replace('_', ' ') : 'Full Time' },
    { label: 'VACANCIES', val: data.openings ? `${data.openings} Openings` : 'Immediate' }
  ];

  const mColW = (rW - 15) / 2;
  meta.forEach((m, idx) => {
    const rx = rX + (idx % 2) * (mColW + 15);
    const ry = 430 + Math.floor(idx / 2) * 115;

    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, rx, ry, mColW, 100, 12, true, false);

    ctx.fillStyle = '#64748B';
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(m.label, rx + 18, ry + 36);

    ctx.fillStyle = '#0F172A';
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.fillText(m.val, rx + 18, ry + 72);
  });

  // Eligibility Checklist
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, rX, 680, rW, 350, 16, true, false);

  ctx.fillStyle = '#0F172A';
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillText('POSITION REQUIREMENTS', rX + 24, 725);

  const duties = [
    'Immediate employment verification on THENIJOBS',
    'Candidate must hold relevant educational credentials',
    'Both local Theni residents and surrounding talent welcome',
    'Good work ethic, punctuality, and commitment'
  ];

  duties.forEach((d, i) => {
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(rX + 35, 775 + i * 50, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.font = "18px 'Inter', sans-serif";
    ctx.fillText(d, rX + 55, 782 + i * 50);
  });

  // Call to action button
  ctx.fillStyle = '#2563EB';
  roundRect(ctx, rX, 1060, rW, 80, 14, true, false);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 24px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('APPLY ONLINE NOW', rX + rW / 2, 1110);
  ctx.textAlign = 'left';

  drawWatermark(ctx, w, h, true);
}

/**
 * 7. FORMAL GAZETTE EDITORIAL TEMPLATE
 */
async function renderGazetteEditorial(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Vintage Paper Background
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, w, h);

  // Double Border
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, w - 96, h - 96);

  // Newspaper Header
  ctx.fillStyle = '#111827';
  ctx.font = "bold 46px 'Times New Roman', Georgia, serif";
  ctx.textAlign = 'center';
  ctx.fillText('THENI EMPLOYMENT GAZETTE', w / 2, 110);

  ctx.fillStyle = '#4B5563';
  ctx.font = "italic 18px 'Times New Roman', Georgia, serif";
  ctx.fillText('Official Career & Recruitment Bulletin • Theni District, Tamil Nadu', w / 2, 145);

  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 165);
  ctx.lineTo(w - 70, 165);
  ctx.stroke();

  // Employer Box
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.font = "bold 26px 'Times New Roman', Georgia, serif";
  ctx.fillText('ORGANIZATION: ' + data.companyName.toUpperCase(), 70, 215);

  ctx.fillStyle = '#4B5563';
  ctx.font = "20px 'Times New Roman', Georgia, serif";
  ctx.fillText(`LOCATION: ${data.location || 'Theni District'} | CATEGORY: ${data.category || 'General'}`, 70, 250);

  // Headline
  ctx.fillStyle = '#831843'; // Gazette Burgundy
  ctx.fillRect(68, 280, w - 136, 130);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 38px 'Times New Roman', Georgia, serif";
  ctx.textAlign = 'center';
  drawWrappedText(ctx, data.title, w / 2, 340, w - 180, 48, 2);
  ctx.textAlign = 'left';

  // Formal Gazette Table
  const rows = [
    ['Remuneration / Pay Scale', data.salaryText || 'Commensurate with Ability'],
    ['Prescribed Qualifications', data.education || 'Recognized Board / University Degree'],
    ['Experience Required', data.experience || 'Freshers or Relevant Experience'],
    ['Engagement Type', data.jobType ? data.jobType.replace('_', ' ').toUpperCase() : 'REGULAR / FULL TIME'],
    ['Total Vacancies', data.openings ? `${data.openings} Posts` : 'Multiple Positions']
  ];

  let tY = 445;
  rows.forEach(([k, v]) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.fillRect(70, tY, w - 140, 50);
    ctx.strokeRect(70, tY, w - 140, 50);

    ctx.fillStyle = '#4B5563';
    ctx.font = "bold 17px 'Times New Roman', Georgia, serif";
    ctx.fillText(k, 90, tY + 32);

    ctx.fillStyle = '#111827';
    ctx.font = "bold 18px 'Inter', sans-serif";
    ctx.fillText(v, 420, tY + 32);

    tY += 50;
  });

  // Official QR Seal Notice
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2;
  roundRect(ctx, 70, 730, w - 140, 360, 12, true, true);

  const qrX = (w - 200) / 2;
  ctx.drawImage(qrImg, qrX, 760, 200, 200);

  ctx.fillStyle = '#111827';
  ctx.font = "bold 26px 'Times New Roman', Georgia, serif";
  ctx.textAlign = 'center';
  ctx.fillText('INSTRUCTIONS TO CANDIDATES', w / 2, 995);

  ctx.fillStyle = '#4B5563';
  ctx.font = "17px 'Times New Roman', Georgia, serif";
  ctx.fillText('Scan the official QR barcode above with any smartphone camera', w / 2, 1025);
  ctx.fillText('to inspect the detailed syllabus and tender your online candidature.', w / 2, 1055);
  ctx.textAlign = 'left';

  drawWatermark(ctx, w, h, true);
}

/**
 * 8. GEOMETRIC MODERN AGENCY TEMPLATE
 */
async function renderGeometricAgency(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Slate Background
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(0, 0, w, h);

  // Angular Polygon Shapes
  ctx.fillStyle = '#1D4ED8';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, 220);
  ctx.lineTo(0, 320);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#EAB308';
  ctx.beginPath();
  ctx.moveTo(w - 200, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, 150);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 28px 'Inter', sans-serif";
  ctx.fillText('THENIJOBS CREATIVE HUB', 60, 75);

  ctx.fillStyle = '#93C5FD';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText('OFFICIAL EMPLOYMENT SHOWCASE', 60, 110);

  // Floating Hero Job Card
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, 60, 220, w - 120, 260, 24, true, false);
  ctx.shadowColor = 'transparent';

  await drawLogo(ctx, data, 90, 250, 65, '#1D4ED8', '#FFFFFF');

  ctx.fillStyle = '#1E293B';
  ctx.font = "bold 28px 'Inter', sans-serif";
  ctx.fillText(data.companyName, 175, 290);

  ctx.fillStyle = '#1D4ED8';
  ctx.font = "bold 44px 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, 90, 370, w - 180, 52, 2);

  // Compensation Highlight
  ctx.fillStyle = '#1E293B';
  roundRect(ctx, 60, 510, w - 120, 120, 20, true, false);

  ctx.fillStyle = '#EAB308';
  ctx.font = "bold 18px 'Inter', sans-serif";
  ctx.fillText('COMPENSATION PACKAGE', 95, 555);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 34px 'Inter', sans-serif";
  ctx.fillText(data.salaryText || 'High Growth Opportunity + Incentives', 95, 600);

  // Floating Specs Matrix
  const specs = [
    { label: 'TALUK / LOCATION', val: data.location || 'Theni District' },
    { label: 'WORK TYPE', val: data.jobType ? data.jobType.replace('_', ' ') : 'Full Time' },
    { label: 'DESIRED EXP', val: data.experience || 'Entry / Intermediate' },
    { label: 'MIN EDUCATION', val: data.education || 'Diploma / Any Graduate' }
  ];

  const colW = (w - 120 - 20) / 2;
  specs.forEach((s, i) => {
    const rx = 60 + (i % 2) * (colW + 20);
    const ry = 655 + Math.floor(i / 2) * 125;

    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, rx, ry, colW, 105, 16, true, false);

    ctx.fillStyle = '#64748B';
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(s.label, rx + 20, ry + 36);

    ctx.fillStyle = '#0F172A';
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.fillText(s.val, rx + 20, ry + 75);
  });

  // Bottom QR Callout
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, 925, w - 120, 345, 24, true, false);

  const qrX = (w - 200) / 2;
  ctx.drawImage(qrImg, qrX, 955, 200, 200);

  ctx.fillStyle = '#1D4ED8';
  ctx.font = "bold 30px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO APPLY IN 60 SECONDS', w / 2, 1195);

  ctx.fillStyle = '#64748B';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText('Powered by THENIJOBS Recruitment Network', w / 2, 1230);
  ctx.textAlign = 'left';

  drawWatermark(ctx, w, h, true);
}

/**
 * 9. MOBILE SOCIAL STORY TEMPLATE (9:16 - 1080x1920)
 */
async function renderSocialStory(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Midnight Gradient Background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0B0F19');
  bg.addColorStop(0.5, '#111827');
  bg.addColorStop(1, '#0F172A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Top Glow Ring
  const ring = ctx.createRadialGradient(w / 2, 250, 10, w / 2, 250, 400);
  ring.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
  ring.addColorStop(1, 'rgba(11, 15, 25, 0)');
  ctx.fillStyle = ring;
  ctx.fillRect(0, 0, w, 500);

  // Company Pill
  ctx.fillStyle = '#1E293B';
  roundRect(ctx, 80, 120, w - 160, 90, 45, true, false);

  await drawLogo(ctx, data, 100, 130, 70, '#2563EB', '#FFFFFF');

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 28px 'Inter', sans-serif";
  ctx.fillText(data.companyName, 195, 175);

  // Big Story Headline
  ctx.fillStyle = '#38BDF8';
  ctx.font = "bold 26px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('🚀 WE ARE HIRING!', w / 2, 310);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 56px 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, w / 2, 385, w - 200, 68, 3);

  // Highlight Cards
  const cards = [
    { icon: '📍', label: 'LOCATION', val: data.location || 'Theni District' },
    { icon: '💰', label: 'SALARY', val: data.salaryText || 'Best in Industry' },
    { icon: '🎓', label: 'ELIGIBILITY', val: data.education || 'Diploma / Degree / Any' },
    { icon: '⚡', label: 'JOINING', val: 'Immediate Joining' }
  ];

  cards.forEach((c, idx) => {
    const cy = 600 + idx * 115;
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, 80, cy, w - 160, 95, 20, true, false);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = "32px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(c.icon, 115, cy + 58);

    ctx.fillStyle = '#94A3B8';
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.fillText(c.label, 175, cy + 42);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillText(c.val, 175, cy + 76);
  });

  // Massive Central QR Section
  ctx.fillStyle = '#1E293B';
  roundRect(ctx, 80, 1100, w - 160, 580, 32, true, false);

  ctx.fillStyle = '#FFFFFF';
  const qrBoxSize = 340;
  const qrX = (w - qrBoxSize) / 2;
  roundRect(ctx, qrX, 1150, qrBoxSize, qrBoxSize, 24, true, false);
  ctx.drawImage(qrImg, qrX + 20, 1170, qrBoxSize - 40, qrBoxSize - 40);

  ctx.fillStyle = '#22C55E';
  ctx.font = "bold 38px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO APPLY NOW', w / 2, 1550);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = "22px 'Inter', sans-serif";
  ctx.fillText('Share this flyer on WhatsApp Status or Story', w / 2, 1600);

  ctx.fillStyle = '#38BDF8';
  ctx.font = "bold 18px 'Inter', sans-serif";
  ctx.fillText(data.publicUrl, w / 2, 1640);
  ctx.textAlign = 'left';

  drawWatermark(ctx, w, h, false);
}

/**
 * 10. CLEAN TRUST & HEALTHCARE TEMPLATE
 */
async function renderCleanTrust(ctx: CanvasRenderingContext2D, data: PosterData, qrImg: HTMLImageElement, w: number, h: number) {
  // Soft Mint Background
  ctx.fillStyle = '#F0FDFA';
  ctx.fillRect(0, 0, w, h);

  // Top Teal Accent Bar
  ctx.fillStyle = '#0F766E';
  ctx.fillRect(0, 0, w, 140);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 28px 'Inter', sans-serif";
  ctx.fillText('THENIJOBS VERIFIED RECRUITMENT', 60, 80);

  ctx.fillStyle = '#99F6E4';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText('TRUSTED EMPLOYMENT PARTNER', 60, 110);

  // Verified Company Card
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, 180, w - 120, 110, 16, true, false);

  await drawLogo(ctx, data, 80, 200, 70, '#0F766E', '#FFFFFF');

  ctx.fillStyle = '#134E4A';
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.fillText(data.companyName, 175, 240);

  ctx.fillStyle = '#0D9488';
  ctx.font = "bold 18px 'Inter', sans-serif";
  ctx.fillText('✔ 100% VERIFIED EMPLOYER • ' + (data.location || 'Theni District'), 175, 272);

  // Main Role Block
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, 320, w - 120, 260, 20, true, false);

  ctx.fillStyle = '#0F766E';
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText('JOB VACANCY / பணிக்கான விபரம்', 100, 370);

  ctx.fillStyle = '#0F172A';
  ctx.font = "bold 44px 'Inter', sans-serif";
  drawWrappedText(ctx, data.title, 100, 430, w - 200, 52, 2);

  // Compensation & Trust Grid
  const grid = [
    { title: 'COMPENSATION', val: data.salaryText || 'Fair & Timely Monthly Payout' },
    { title: 'EXPERIENCE LEVEL', val: data.experience || 'All Qualified Applicants' },
    { title: 'MIN QUALIFICATION', val: data.education || 'Diploma / Degree / Certified' },
    { title: 'EMPLOYMENT NATURE', val: data.jobType ? data.jobType.replace('_', ' ').toUpperCase() : 'PERMANENT ROLE' }
  ];

  const colW = (w - 120 - 20) / 2;
  grid.forEach((g, idx) => {
    const rx = 60 + (idx % 2) * (colW + 20);
    const ry = 610 + Math.floor(idx / 2) * 115;

    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, rx, ry, colW, 100, 14, true, false);

    ctx.fillStyle = '#0F766E';
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(g.title, rx + 20, ry + 36);

    ctx.fillStyle = '#134E4A';
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.fillText(g.val, rx + 20, ry + 72);
  });

  // Trust Commitments
  ctx.fillStyle = '#CCFBF1';
  roundRect(ctx, 60, 860, w - 120, 180, 16, true, false);

  ctx.fillStyle = '#115E59';
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.fillText('STANDARDS OF INTEGRITY', 95, 905);

  const perks = [
    'Direct hiring without middleman commissions',
    'Equal opportunity employer upholding labor regulations',
    'Application routed securely to authenticated employer dashboard'
  ];

  perks.forEach((p, i) => {
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.arc(105, 942 + i * 36, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#134E4A';
    ctx.font = "18px 'Inter', sans-serif";
    ctx.fillText(p, 125, 948 + i * 36);
  });

  // QR Block
  ctx.fillStyle = '#0F766E';
  roundRect(ctx, 60, 1065, w - 120, 215, 20, true, false);

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 90, 1090, 165, 165, 12, true, false);
  ctx.drawImage(qrImg, 100, 1100, 145, 145);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 28px 'Inter', sans-serif";
  ctx.fillText('SCAN TO APPLY SAFELY', 285, 1145);

  ctx.fillStyle = '#CCFBF1';
  ctx.font = "18px 'Inter', sans-serif";
  ctx.fillText('All applications processed with candidate privacy protection.', 285, 1180);
  ctx.fillText('Direct employer contact via THENIJOBS portal.', 285, 1210);

  ctx.fillStyle = '#99F6E4';
  ctx.font = "bold 15px 'Inter', sans-serif";
  ctx.fillText(data.publicUrl, 285, 1245);

  drawWatermark(ctx, w, h, true);
}

/**
 * MASTER RENDERER DISPATCHER
 */
export async function renderPoster(
  templateId: TemplateId,
  data: PosterData
): Promise<GeneratedPoster> {
  const template = getTemplateById(templateId);
  const canvas = document.createElement('canvas');
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Generate QR Code data URL if not present
  const qrUrl = data.qrDataUrl || await QRCode.toDataURL(data.publicUrl, {
    width: 320,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const qrImg = await loadImage(qrUrl);

  switch (templateId) {
    case 'corporate_executive':
      await renderCorporateExecutive(ctx, data, qrImg, template.width, template.height);
      break;
    case 'tech_gradient':
      await renderTechGradient(ctx, data, qrImg, template.width, template.height);
      break;
    case 'theni_heritage':
      await renderTheniHeritage(ctx, data, qrImg, template.width, template.height);
      break;
    case 'urgent_walkin':
      await renderUrgentWalkin(ctx, data, qrImg, template.width, template.height);
      break;
    case 'industry_spotlight':
      await renderIndustrySpotlight(ctx, data, qrImg, template.width, template.height);
      break;
    case 'split_infographic':
      await renderSplitInfographic(ctx, data, qrImg, template.width, template.height);
      break;
    case 'gazette_editorial':
      await renderGazetteEditorial(ctx, data, qrImg, template.width, template.height);
      break;
    case 'geometric_agency':
      await renderGeometricAgency(ctx, data, qrImg, template.width, template.height);
      break;
    case 'social_story':
      await renderSocialStory(ctx, data, qrImg, template.width, template.height);
      break;
    case 'clean_trust':
      await renderCleanTrust(ctx, data, qrImg, template.width, template.height);
      break;
    default:
      await renderCorporateExecutive(ctx, data, qrImg, template.width, template.height);
      break;
  }

  const dataUrlPng = canvas.toDataURL('image/png');
  const dataUrlJpeg = canvas.toDataURL('image/jpeg', 0.92);

  return {
    templateId,
    templateName: template.name,
    templateNameTa: template.nameTa,
    canvas,
    dataUrlPng,
    dataUrlJpeg,
    width: template.width,
    height: template.height
  };
}

/**
 * GENERATE ALL 10 POSTER VARIATIONS
 */
export async function generateAll10Posters(data: PosterData): Promise<GeneratedPoster[]> {
  const results: GeneratedPoster[] = [];
  // Ensure QR code is generated once for all 10 templates
  const qrDataUrl = await QRCode.toDataURL(data.publicUrl, {
    width: 320,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });
  const dataWithQR = { ...data, qrDataUrl };

  for (const t of POSTER_TEMPLATES) {
    const poster = await renderPoster(t.id, dataWithQR);
    results.push(poster);
  }

  return results;
}
