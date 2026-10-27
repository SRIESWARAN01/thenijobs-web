import { GeneratedPoster, PosterData } from './types';
import { downloadPosterImage } from './posterExportService';

export interface ShareResult {
  method: 'native_file_share' | 'whatsapp_link_with_download' | 'clipboard_copied';
  success: boolean;
  message: string;
}

/**
 * Format standard professional WhatsApp sharing text
 */
export function formatWhatsAppShareText(data: PosterData): string {
  const lines: string[] = [
    '🌟 *New Career Opportunity on THENIJOBS!*',
    '',
    `📌 *Job:* ${data.title}`,
    `🏢 *Company:* ${data.companyName}`,
  ];

  if (data.location || data.district) {
    lines.push(`📍 *Location:* ${data.location || data.district}`);
  }

  if (data.salaryText) {
    lines.push(`💰 *Salary:* ${data.salaryText}`);
  }

  if (data.jobType) {
    lines.push(`⏱ *Type:* ${data.jobType.replace('_', ' ').toUpperCase()}`);
  }

  if (data.experience) {
    lines.push(`🎯 *Experience:* ${data.experience}`);
  }

  lines.push('');
  lines.push('👇 *Apply directly here:*');
  lines.push(data.publicUrl);
  lines.push('');
  lines.push('⚡ *Powered by THENIJOBS • Theni District Employment Portal*');

  return lines.join('\n');
}

/**
 * Convert dataURL to File for Web Share API
 */
function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Share poster on WhatsApp using native file sharing on mobile or desktop URL fallback
 */
export async function sharePosterOnWhatsApp(
  poster: GeneratedPoster,
  data: PosterData,
  index = 1
): Promise<ShareResult> {
  const shareText = formatWhatsAppShareText(data);
  const filename = `THENIJOBS_${poster.templateId}_Poster.png`;

  // 1. Check if native Web Share with files is supported (Android/iOS Chrome, Safari)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator && navigator.canShare) {
    try {
      const file = dataUrlToFile(poster.dataUrlPng, filename);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${data.title} – ${data.companyName}`,
          text: shareText,
          files: [file],
        });
        return {
          method: 'native_file_share',
          success: true,
          message: 'Poster image and job details sent to your device share sheet!'
        };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          method: 'native_file_share',
          success: false,
          message: 'Share cancelled by user.'
        };
      }
      // If native file share failed unexpectedly, fallback below
    }
  }

  // 2. Desktop Fallback: Download the poster image + open WhatsApp Web/App with text
  downloadPosterImage(poster, data, 'png', index);
  const encodedText = encodeURIComponent(shareText);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');

  return {
    method: 'whatsapp_link_with_download',
    success: true,
    message: 'Poster downloaded to your computer and WhatsApp opened! You can now attach the image to your chat.'
  };
}

/**
 * Copy public job link to clipboard
 */
export async function copyPublicJobLink(data: PosterData): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(data.publicUrl);
    return true;
  } catch {
    return false;
  }
}
