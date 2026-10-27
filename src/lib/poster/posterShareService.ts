import type { GeneratedPoster, PosterData } from './types';

export interface ShareResult {
  method: 'native_file_share' | 'whatsapp_link_with_download' | 'clipboard_copied';
  success: boolean;
  message: string;
}

function triggerDownload(dataUrl: string, filename: string): void {
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
 * Format high-contrast Tamil & English WhatsApp Status sharing text
 * Features "ஆட்கள் தேவை", Salary, Location, Contact Phone, and direct Apply link.
 */
export function formatWhatsAppStatusShareText(data: PosterData): string {
  const lines: string[] = [
    '🔥 *ஆட்கள் தேவை • WE ARE HIRING!*',
    '',
    `📌 *பணி / Role:* ${data.title}`,
    `🏢 *நிறுவனம் / Company:* ${data.companyName}`,
  ];

  if (data.salaryText) {
    lines.push(`💰 *மாத சம்பளம் / Salary:* ${data.salaryText}`);
  }

  if (data.location || data.district) {
    lines.push(`📍 *பணி இடம் / Location:* ${data.location || data.district}`);
  }

  if (data.contactPhone) {
    lines.push(`📞 *தொடர்புக்கு / Contact:* ${data.contactPhone}`);
  }

  if (data.education) {
    lines.push(`🎓 *கல்வித்தகுதி / Qualification:* ${data.education}`);
  }

  if (data.jobType) {
    lines.push(`⏱ *பணி வகை / Type:* ${data.jobType.replace('_', ' ').toUpperCase()}`);
  }

  lines.push('');
  lines.push('👇 *விண்ணப்பிக்க லிங்க் (Apply Direct Link):*');
  lines.push(data.publicUrl);
  lines.push('');
  lines.push('📲 *தேனி மாவட்ட வேலைவாய்ப்பு தளம் • THENIJOBS.IN*');
  lines.push('👉 *உங்கள் வாட்ஸ்அப் ஸ்டேட்டஸில் வைத்து நண்பர்களுக்கும் பகிருங்கள்!*');

  return lines.join('\n');
}

/**
 * Normalizes any Job document or custom job object into a standard PosterData object
 * guaranteeing accurate public URL, location, salary, contact phone, and Tamil headline readiness.
 */
export function normalizeJobToPosterData(job: any, company?: any): PosterData {
  if (job?.type === 'job' && job.publicUrl && job.companyName) {
    return job as PosterData;
  }

  const rawSalary = job.salaryMin && job.salaryMax
    ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} - ₹${Number(job.salaryMax).toLocaleString('en-IN')}/${job.salaryType || 'மாதம்'}`
    : (job.salary || 'தகுதிக்கேற்ப சிறந்த சம்பளம் (Attractive)');

  const contactPhone = job.whatsapp || job.phone || job.contactPhone || company?.phone || company?.whatsapp || '';
  const jobId = job.id || job._id || 'job';
  const slugOrId = job.slug || jobId;
  const canonicalUrl = `https://www.thenijobs.com/jobs/${slugOrId}`;

  return {
    id: jobId,
    type: 'job',
    title: job.title || 'வேலைவாய்ப்பு (Job Opportunity)',
    companyName: company?.name || job.companyName || job.company || 'தேனி நிறுவனம் (Theni Company)',
    companyLogoUrl: company?.logoUrl || job.companyLogoUrl || job.logoUrl || (job.logo?.startsWith('http') ? job.logo : undefined),
    category: job.category || company?.category || 'General Employment',
    location: job.location || job.district || company?.district || 'தேனி (Theni)',
    district: job.district || company?.district || 'தேனி மாவட்டம் (Theni District)',
    salaryText: rawSalary,
    jobType: job.jobType || job.type || 'full_time',
    experience: job.experience || 'Freshers / Any',
    education: job.education || '10th / 12th / ITI / Diploma / Any Degree',
    openings: job.openings ? Number(job.openings) : 1,
    contactPhone,
    contactEmail: company?.email || job.contactEmail,
    highlights: job.skills || job.requirements || [],
    publicUrl: canonicalUrl,
    isUrgent: !!job.isUrgent,
    isFeatured: !!job.isFeatured,
    isVerified: !!company?.isVerified || !!job.isVerified,
  };
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
  const isStory = poster.templateId === 'social_story';
  const shareText = isStory ? formatWhatsAppStatusShareText(data) : formatWhatsAppShareText(data);
  const filename = isStory
    ? `THENIJOBS_WhatsApp_Status_${data.title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30)}.png`
    : `THENIJOBS_${poster.templateId}_Poster_${String(index).padStart(2, '0')}.png`;

  // 1. Check if native Web Share with files is supported (Android/iOS Chrome, Safari)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator && navigator.canShare) {
    try {
      const file = dataUrlToFile(poster.dataUrlPng, filename);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: isStory ? `ஆட்கள் தேவை: ${data.title} (${data.companyName})` : `${data.title} – ${data.companyName}`,
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
  triggerDownload(poster.dataUrlPng, filename);
  const encodedText = encodeURIComponent(shareText);
  if (typeof window !== 'undefined') {
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  }

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
