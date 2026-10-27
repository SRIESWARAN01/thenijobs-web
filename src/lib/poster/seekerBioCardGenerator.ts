import QRCode from 'qrcode';
import type { GeneratedPoster } from './types';
import { sanitizeWhatsAppPhone } from '@/lib/constants';

// Helper to safely load images on canvas (client-side)
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
  maxLines = 3
): number {
  if (!text) return y;
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

export interface SeekerBioData {
  uid?: string;
  name?: string;
  displayName?: string;
  headline?: string;
  currentRole?: string;
  highestDegree?: string;
  education?: Array<{ degree?: string; field?: string; institution?: string }>;
  experience?: Array<{ role?: string; company?: string; isCurrent?: boolean }>;
  experienceYears?: string;
  skills?: string[];
  skillsWithLevels?: Array<{ name: string; level: string }>;
  preferredLocations?: string[];
  targetRoles?: string;
  district?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  noticePeriod?: string;
  isOpenToWork?: boolean;
}

/**
 * 3.1 1-Tap "My THENIJOBS Profile" WhatsApp Story Card Generator
 * Produces a vertical 9:16 (1080x1920) formatted card showing:
 * - Candidate Photo & Full Name
 * - "வேலை தேடுகிறேன் • OPEN TO WORK" High-Contrast Banner
 * - Top Skills (e.g., B.Com + Tally GST, Two-Wheeler License)
 * - Preferred Taluks & Job Roles
 * - Official Verified Candidate Seal & Profile QR Code Link
 */
export async function generateSeekerWhatsAppBioCard(
  profile: SeekerBioData,
  uid = 'SEEKER'
): Promise<{ poster: GeneratedPoster; profileUrl: string }> {
  const w = 1080;
  const h = 1920;

  // Determine canonical profile URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.thenijobs.com';
  const profileUrl = `${baseUrl}/portfolio/seeker/${uid}`;

  // Pre-generate scannable QR Code targeting the seeker's live portfolio
  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    width: 340,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // 1. Sleek Modern Obsidian/Navy Gradient Background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#060A12');
  bg.addColorStop(0.25, '#0B132B');
  bg.addColorStop(0.65, '#09152C');
  bg.addColorStop(1, '#020610');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 2. Dynamic Ambient Radial Glows (Emerald & Electric Cyan)
  const glowTop = ctx.createRadialGradient(w / 2, 220, 20, w / 2, 220, 520);
  glowTop.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  glowTop.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
  glowTop.addColorStop(1, 'rgba(6, 10, 18, 0)');
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, w, 560);

  const glowBottom = ctx.createRadialGradient(w / 2, 1680, 20, w / 2, 1680, 480);
  glowBottom.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
  glowBottom.addColorStop(1, 'rgba(2, 6, 16, 0)');
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 1400, w, 520);

  // 3. Header Bar: THENIJOBS Brand + Verified Seeker Tag
  const headerY = 70;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, 60, headerY, w - 120, 64, 32, true, false);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 60, headerY, w - 120, 64, 32, false, true);

  ctx.fillStyle = '#10B981';
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡ THENIJOBS.COM', 90, headerY + 32);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = "bold 18px 'Inter', 'Noto Sans Tamil', sans-serif";
  ctx.textAlign = 'right';
  ctx.fillText('தேனி மாவட்ட வேலைவாய்ப்பு மையம் • BIO CARD', w - 90, headerY + 32);

  // 4. Vibrant High-Contrast Status Banner: "வேலை தேடுகிறேன் • OPEN TO WORK"
  const bannerY = 160;
  const bannerH = 74;
  const bannerW = w - 120;
  const bannerGradient = ctx.createLinearGradient(60, bannerY, 60 + bannerW, bannerY);
  bannerGradient.addColorStop(0, '#059669'); // Emerald 600
  bannerGradient.addColorStop(0.5, '#10B981'); // Emerald 500
  bannerGradient.addColorStop(1, '#047857'); // Emerald 700
  ctx.fillStyle = bannerGradient;
  roundRect(ctx, 60, bannerY, bannerW, bannerH, 37, true, false);

  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 2.5;
  roundRect(ctx, 60, bannerY, bannerW, bannerH, 37, false, true);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 32px 'Noto Sans Tamil', 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🟢 வேலை தேடுகிறேன் • OPEN TO WORK', w / 2, bannerY + 37);

  // 5. Candidate Profile Card (Glassmorphic Container)
  const cardY = 265;
  const cardH = 500;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  roundRect(ctx, 60, cardY, w - 120, cardH, 36, true, false);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, 60, cardY, w - 120, cardH, 36, false, true);

  // Avatar (Photo or Fallback Monogram)
  const avatarSize = 180;
  const avatarX = w / 2 - avatarSize / 2;
  const avatarY = cardY + 40;

  // Outer Glowing Ring
  ctx.beginPath();
  ctx.arc(w / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 4;
  ctx.stroke();

  let photoDrawn = false;
  if (profile.photoUrl) {
    try {
      const avatarImg = await loadImage(profile.photoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
      photoDrawn = true;
    } catch {
      photoDrawn = false;
    }
  }

  if (!photoDrawn) {
    const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    avatarGrad.addColorStop(0, '#059669');
    avatarGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = avatarGrad;
    ctx.beginPath();
    ctx.arc(w / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();

    const candidateName = profile.name || profile.displayName || 'Job Seeker';
    const initials = candidateName
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TJ';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 64px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, w / 2, avatarY + avatarSize / 2);
  }

  // Candidate Name
  const candidateName = profile.name || profile.displayName || 'Job Seeker';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 44px 'Inter', 'Noto Sans Tamil', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(candidateName, w / 2, cardY + 245);

  // Professional Headline / Role
  const headline = profile.headline || profile.currentRole || 'Looking for Job Opportunities in Theni District';
  ctx.fillStyle = '#34D399'; // Emerald 400
  ctx.font = "bold 26px 'Noto Sans Tamil', 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  drawWrappedText(ctx, headline, w / 2, cardY + 305, w - 200, 36, 2);

  // 3-Column Highlights Inside Identity Card (Education, Experience, Location)
  const highlightY = cardY + 390;
  const colW = (w - 180) / 3;

  const highlights = [
    {
      title: 'கல்வி / Education',
      value: profile.highestDegree || profile.education?.[0]?.degree || 'Graduate',
      icon: '🎓',
    },
    {
      title: 'அனுபவம் / Exp',
      value: profile.experienceYears || (profile.experience?.length ? `${profile.experience.length} Exp` : 'Fresher'),
      icon: '💼',
    },
    {
      title: 'மாவட்டம் / District',
      value: `${profile.district || 'Theni'}, TN`,
      icon: '📍',
    },
  ];

  highlights.forEach((item, idx) => {
    const colX = 90 + idx * (colW + 15);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    roundRect(ctx, colX, highlightY, colW, 82, 18, true, false);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, colX, highlightY, colW, 82, 18, false, true);

    ctx.fillStyle = '#94A3B8';
    ctx.font = "bold 15px 'Noto Sans Tamil', 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${item.icon} ${item.title}`, colX + colW / 2, highlightY + 12);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 20px 'Inter', 'Noto Sans Tamil', sans-serif";
    ctx.textBaseline = 'top';
    ctx.fillText(item.value, colX + colW / 2, highlightY + 42);
  });

  // 6. Top Skills & Competencies Card
  const skillsY = 790;
  const skillsH = 260;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  roundRect(ctx, 60, skillsY, w - 120, skillsH, 32, true, false);
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 60, skillsY, w - 120, skillsH, 32, false, true);

  // Section Header
  ctx.fillStyle = '#F59E0B'; // Amber 500
  ctx.font = "bold 24px 'Noto Sans Tamil', 'Inter', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('⚡ முக்கிய திறமைகள் & தகுதிகள் (Top Skills & Competencies)', 95, skillsY + 24);

  // Extract skills list
  const skillItems: string[] = [];
  if (profile.skills && profile.skills.length > 0) {
    skillItems.push(...profile.skills);
  } else if (profile.skillsWithLevels && profile.skillsWithLevels.length > 0) {
    skillItems.push(...profile.skillsWithLevels.map((s) => s.name));
  } else {
    skillItems.push('B.Com + Tally GST', 'MS Excel', 'Accounts', 'Two-Wheeler License', 'Computer Operations', 'Customer Service');
  }

  // Draw skills badges (up to 8 badges)
  const displaySkills = skillItems.slice(0, 8);
  let badgeX = 95;
  let badgeY = skillsY + 75;
  const badgeH = 50;

  ctx.font = "bold 20px 'Inter', 'Noto Sans Tamil', sans-serif";
  displaySkills.forEach((skill) => {
    const textW = ctx.measureText(skill).width;
    const badgeW = textW + 44;

    if (badgeX + badgeW > w - 95) {
      badgeX = 95;
      badgeY += 62;
    }

    if (badgeY + badgeH <= skillsY + skillsH - 15) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 14, true, false);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.5;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 14, false, true);

      ctx.fillStyle = '#A7F3D0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skill, badgeX + badgeW / 2, badgeY + badgeH / 2);

      badgeX += badgeW + 16;
    }
  });

  // 7. Preferred Taluks & Job Roles Card
  const prefY = 1075;
  const prefH = 220;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  roundRect(ctx, 60, prefY, w - 120, prefH, 32, true, false);
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 60, prefY, w - 120, prefH, 32, false, true);

  // Preferred Taluks
  const preferredTaluks = (profile.preferredLocations && profile.preferredLocations.length > 0)
    ? profile.preferredLocations.join(', ')
    : `${profile.district || 'Theni'}, Periyakulam, Cumbum, Bodinayakanur`;

  ctx.fillStyle = '#60A5FA'; // Blue 400
  ctx.font = "bold 22px 'Noto Sans Tamil', 'Inter', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('📍 விருப்பமான வட்டங்கள் / ஊர்கள் (Preferred Taluks):', 95, prefY + 24);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 24px 'Inter', 'Noto Sans Tamil', sans-serif";
  ctx.fillText(preferredTaluks, 95, prefY + 58);

  // Target Roles
  const targetRoles = profile.targetRoles || profile.currentRole || 'Accounts / Cashier / Sales / Office Admin / Nursing';
  ctx.fillStyle = '#60A5FA';
  ctx.font = "bold 22px 'Noto Sans Tamil', 'Inter', sans-serif";
  ctx.fillText('🎯 எதிர்பார்க்கும் பணிகள் (Preferred Job Roles):', 95, prefY + 115);

  ctx.fillStyle = '#FDE047'; // Yellow 300
  ctx.font = "bold 24px 'Inter', 'Noto Sans Tamil', sans-serif";
  ctx.fillText(targetRoles, 95, prefY + 149);

  // 8. Contact & Availability Card (Green Accent)
  const contactY = 1320;
  const contactH = 135;
  ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
  roundRect(ctx, 60, contactY, w - 120, contactH, 28, true, false);
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  roundRect(ctx, 60, contactY, w - 120, contactH, 28, false, true);

  const phone = profile.phone || 'Available on THENIJOBS';
  const notice = profile.noticePeriod || 'Immediate (Available Now)';

  ctx.fillStyle = '#34D399';
  ctx.font = "bold 20px 'Noto Sans Tamil', 'Inter', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('📞 தொடர்பு எண் (Phone):', 95, contactY + 22);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.fillText(phone, 95, contactY + 54);

  ctx.fillStyle = '#34D399';
  ctx.font = "bold 20px 'Noto Sans Tamil', 'Inter', sans-serif";
  ctx.textAlign = 'right';
  ctx.fillText('⏰ பணியில் சேர (Notice Period):', w - 95, contactY + 22);

  ctx.fillStyle = '#FDE047';
  ctx.font = "bold 24px 'Inter', 'Noto Sans Tamil', sans-serif";
  ctx.fillText(notice, w - 95, contactY + 58);

  // 9. QR Code & Verified Candidate Seal Box
  const qrBoxY = 1480;
  const qrBoxH = 340;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  roundRect(ctx, 60, qrBoxY, w - 120, qrBoxH, 36, true, false);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 60, qrBoxY, w - 120, qrBoxH, 36, false, true);

  // Load and draw QR Code
  try {
    const qrImg = await loadImage(qrDataUrl);
    const qrSize = 250;
    const qrX = 95;
    const qrY = qrBoxY + (qrBoxH - qrSize) / 2;

    // White backing for QR code
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 24, true, false);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Callout text next to QR Code
    const textLeft = qrX + qrSize + 40;
    ctx.fillStyle = '#38BDF8';
    ctx.font = "bold 26px 'Noto Sans Tamil', 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('📲 QR ஸ்கேன் செய்து பார்க்கவும்', textLeft, qrBoxY + 45);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 22px 'Noto Sans Tamil', 'Inter', sans-serif";
    ctx.fillText('Scan to view full verified bio-data,', textLeft, qrBoxY + 85);
    ctx.fillText('certificates & contact directly on', textLeft, qrBoxY + 115);

    ctx.fillStyle = '#10B981';
    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.fillText('www.thenijobs.com', textLeft, qrBoxY + 152);

    // Official Verification Seal Badge
    const sealY = qrBoxY + 200;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    roundRect(ctx, textLeft, sealY, 440, 56, 16, true, false);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    roundRect(ctx, textLeft, sealY, 440, 56, 16, false, true);

    ctx.fillStyle = '#6EE7B7';
    ctx.font = "bold 18px 'Inter', 'Noto Sans Tamil', sans-serif";
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡️ Official Verified Candidate Seal #TNJ', textLeft + 20, sealY + 28);
  } catch (err) {
    console.error('Failed to render QR Code on bio card:', err);
  }

  // 10. Footer Disclaimer
  ctx.fillStyle = '#64748B';
  ctx.font = "bold 18px 'Inter', 'Noto Sans Tamil', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('THENIJOBS — தேனி மாவட்டத்தின் நம்பகமான உள்ளூர் வேலைவாய்ப்பு தளம்', w / 2, 1865);

  const dataUrlPng = canvas.toDataURL('image/png');
  const dataUrlJpeg = canvas.toDataURL('image/jpeg', 0.92);

  return {
    poster: {
      templateId: 'social_story',
      templateName: 'WhatsApp Story Bio Card (9:16)',
      templateNameTa: 'வாட்ஸ்அப் ஸ்டேட்டஸ் பயோ அட்டை',
      canvas,
      dataUrlPng,
      dataUrlJpeg,
      width: w,
      height: h,
    },
    profileUrl,
  };
}

/**
 * Formats Tamil + English text for sharing bio card to WhatsApp Status / Chat
 */
export function formatSeekerWhatsAppBioShareText(profile: SeekerBioData, profileUrl: string): string {
  const name = profile.name || profile.displayName || 'Job Seeker';
  const headline = profile.headline || profile.currentRole || 'Looking for Job in Theni';
  const education = profile.highestDegree || profile.education?.[0]?.degree || 'Graduate';
  const exp = profile.experienceYears || (profile.experience?.length ? `${profile.experience.length} Years` : 'Fresher');
  const skills = profile.skills?.slice(0, 4).join(', ') || 'Tally, Accounts, Office Admin';
  const locations = profile.preferredLocations?.slice(0, 4).join(', ') || `${profile.district || 'Theni'}, Tamil Nadu`;
  const phone = profile.phone || 'Available on THENIJOBS';

  return `🌟 *வேலை தேடுகிறேன் (Looking for Job in Theni District)*
══════════════════════════════
👤 *பெயர் (Name):* ${name}
🎯 *பணித்தகுதி (Role):* ${headline}
🎓 *கல்வி (Education):* ${education}
💼 *அனுபவம் (Experience):* ${exp}
⚡ *திறமைகள் (Skills):* ${skills}
📍 *விருப்பமான இடம் (Location):* ${locations}

📞 *தொடர்புக்கு:* ${phone}
🔗 *முழு சுயவிவரம் (Full Profile):* ${profileUrl}

வணக்கம்! தேனி மற்றும் சுற்றுவட்டார நிறுவனங்களில் வேலை வாய்ப்பு இருந்தால் தொடர்பு கொள்ளவும். தயவுசெய்து உங்கள் நண்பர்கள் மற்றும் வாட்ஸ்அப் குழுக்களில் பகிரவும்! 🙏`;
}

/**
 * 1-Tap Trigger to share Seeker Bio Card to WhatsApp
 */
export async function shareSeekerBioCard(
  poster: GeneratedPoster,
  profile: SeekerBioData,
  uid = 'SEEKER'
): Promise<{ success: boolean; method: string; message?: string }> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.thenijobs.com';
  const profileUrl = `${baseUrl}/portfolio/seeker/${uid}`;
  const shareText = formatSeekerWhatsAppBioShareText(profile, profileUrl);
  const filename = `THENIJOBS_BioCard_${(profile.name || 'Seeker').replace(/[^a-zA-Z0-9]/g, '_')}.png`;

  // Check Web Share API with files
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && poster.canvas?.toBlob) {
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        poster.canvas.toBlob(resolve, 'image/png');
      });
      if (blob) {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `My THENIJOBS Bio Card — ${profile.name || 'Job Seeker'}`,
            text: shareText,
            files: [file],
          });
          return { success: true, method: 'native_file_share' };
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled', message: 'Share was cancelled' };
      }
      console.warn('Native share failed, falling back to download:', err);
    }
  }

  // Fallback: Download PNG and open WhatsApp
  const downloadLink = document.createElement('a');
  downloadLink.href = poster.dataUrlPng;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  const encodedMsg = encodeURIComponent(shareText);
  window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');

  return {
    success: true,
    method: 'fallback_download_and_chat',
    message: '9:16 Bio Card downloaded! Opening WhatsApp to set on your Status.',
  };
}
