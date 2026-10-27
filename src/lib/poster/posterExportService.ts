import { jsPDF } from 'jspdf';
import { GeneratedPoster, PosterData } from './types';

function sanitizeFilename(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9_\u0B80-\u0BFF]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 35);
}

/**
 * Download single poster as PNG or JPEG
 */
export function downloadPosterImage(
  poster: GeneratedPoster,
  data: PosterData,
  format: 'png' | 'jpeg',
  index = 1
): string {
  const safeJob = sanitizeFilename(data.title || 'Job');
  const safeCompany = sanitizeFilename(data.companyName || 'Company');
  const num = String(index).padStart(2, '0');
  const filename = `THENIJOBS_${safeJob}_${safeCompany}_Poster_${num}_${poster.templateId}.${format === 'png' ? 'png' : 'jpg'}`;

  const dataUrl = format === 'png' ? poster.dataUrlPng : poster.dataUrlJpeg;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  return filename;
}

/**
 * Export high-resolution poster to print-ready A4 PDF using jsPDF
 */
export function downloadPosterAsPdf(
  poster: GeneratedPoster,
  data: PosterData,
  index = 1
): string {
  const safeJob = sanitizeFilename(data.title || 'Job');
  const safeCompany = sanitizeFilename(data.companyName || 'Company');
  const num = String(index).padStart(2, '0');
  const filename = `THENIJOBS_${safeJob}_${safeCompany}_Poster_${num}_${poster.templateId}.pdf`;

  // Standard A4 dimensions in mm: 210 x 297
  // Orientation: portrait
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297

  // Maintain aspect ratio with clean 10mm margins
  const margin = 10;
  const availWidth = pageWidth - margin * 2;
  const availHeight = pageHeight - margin * 2;

  const imgAspect = poster.width / poster.height;
  let renderW = availWidth;
  let renderH = availWidth / imgAspect;

  if (renderH > availHeight) {
    renderH = availHeight;
    renderW = availHeight * imgAspect;
  }

  const posX = (pageWidth - renderW) / 2;
  const posY = (pageHeight - renderH) / 2;

  pdf.addImage(poster.dataUrlPng, 'PNG', posX, posY, renderW, renderH, undefined, 'FAST');
  pdf.save(filename);

  return filename;
}
