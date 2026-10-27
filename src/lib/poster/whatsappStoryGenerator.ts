import QRCode from 'qrcode';
import type { GeneratedPoster, PosterData } from './types';
import {
  sharePosterOnWhatsApp,
  type ShareResult,
  formatWhatsAppStatusShareText,
  normalizeJobToPosterData
} from './posterShareService';

export { normalizeJobToPosterData, formatWhatsAppStatusShareText };

/**
 * 1-Tap Generator: Produces a 9:16 (1080x1920) vertical WhatsApp Status & Story card
 * with high-contrast Tamil headlines ("ஆட்கள் தேவை", Salary, Location, Contact Phone, and QR code).
 */
export async function generateWhatsAppStatusStory(
  jobOrData: any,
  company?: any
): Promise<{ poster: GeneratedPoster; posterData: PosterData }> {
  const posterData = normalizeJobToPosterData(jobOrData, company);

  // Pre-generate scannable QR Code targeting the canonical job posting
  const qrDataUrl = await QRCode.toDataURL(posterData.publicUrl, {
    width: 360,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  const fullData: PosterData = {
    ...posterData,
    qrDataUrl,
  };

  // Render the dedicated 9:16 'social_story' canvas
  const { renderPoster } = await import('./posterCanvasEngine');
  const poster = await renderPoster('social_story', fullData);

  return {
    poster,
    posterData: fullData,
  };
}

/**
 * 1-Tap Trigger: Shares the generated 9:16 story card to WhatsApp.
 * - On Mobile: Uses Web Share API (navigator.share) with the PNG file attached,
 *   allowing 1-tap "My Status" (என் ஸ்டேட்டஸ்) posting.
 * - On Desktop: Immediately downloads the 1080x1920 PNG file and opens wa.me with prefilled Tamil text.
 */
export async function triggerWhatsAppStatusShare(
  poster: GeneratedPoster,
  data: PosterData
): Promise<ShareResult> {
  return sharePosterOnWhatsApp(poster, data);
}

/**
 * Combined 1-Tap Generation + Immediate WhatsApp Dispatch
 */
export async function generateAndShareWhatsAppStatus(
  jobOrData: any,
  company?: any
): Promise<{ poster: GeneratedPoster; posterData: PosterData; shareResult: ShareResult }> {
  const { poster, posterData } = await generateWhatsAppStatusStory(jobOrData, company);
  const shareResult = await triggerWhatsAppStatusShare(poster, posterData);
  return { poster, posterData, shareResult };
}
