import JSZip from 'jszip';
import type { GeneratedPoster, PosterData } from './types';

function sanitizeFilenamePart(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9_\u0B80-\u0BFF]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
}

/**
 * Convert dataURL (base64) to Uint8Array or Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export interface ZipPosterEntry {
  poster: GeneratedPoster;
  index: number;
}

/**
 * Generate a ZIP file of posters and trigger native browser download
 */
export async function downloadPostersAsZip(
  posters: GeneratedPoster[],
  data: PosterData,
  zipTitleSuffix = 'All_10'
): Promise<{ success: boolean; filename: string; count: number }> {
  if (!posters || posters.length === 0) {
    throw new Error('No posters selected for ZIP download');
  }

  const zip = new JSZip();
  const safeJob = sanitizeFilenamePart(data.title || 'Job');
  const safeCompany = sanitizeFilenamePart(data.companyName || 'Company');

  posters.forEach((p, idx) => {
    const posterNumber = String(idx + 1).padStart(2, '0');
    const filename = `THENIJOBS_${safeJob}_${safeCompany}_Poster_${posterNumber}_${p.templateId}.png`;
    const blob = dataUrlToBlob(p.dataUrlPng);
    zip.file(filename, blob);
  });

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const zipFilename = `THENIJOBS_${safeJob}_${safeCompany}_Posters_${zipTitleSuffix}.zip`;

  // Trigger download
  const downloadUrl = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 30000);

  return {
    success: true,
    filename: zipFilename,
    count: posters.length
  };
}
