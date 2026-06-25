'use client';

// ============================================================
// Image Utilities — compression, resizing, EXIF orientation
// ============================================================

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  /** 0-1, default 0.82 */
  quality?: number;
  /** Output MIME type; default 'image/webp' */
  outputType?: string;
}

/**
 * Read EXIF orientation tag from a JPEG ArrayBuffer.
 * Returns orientation 1-8 (1 = normal).
 */
function readExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.getUint16(0, false) !== 0xffd8) return 1; // not JPEG
  let offset = 2;
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset, false);
    offset += 2;
    if (marker === 0xffe1) {
      // APP1 = EXIF
      const length = view.getUint16(offset, false);
      const exifStart = offset + 2;
      // Check for 'Exif\0\0'
      if (
        view.getUint32(exifStart, false) === 0x45786966 &&
        view.getUint16(exifStart + 4, false) === 0x0000
      ) {
        const tiffStart = exifStart + 6;
        const littleEndian = view.getUint16(tiffStart, false) === 0x4949;
        const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
        const numEntries = view.getUint16(tiffStart + ifdOffset, littleEndian);
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) break;
          const tag = view.getUint16(entryOffset, littleEndian);
          if (tag === 0x0112) {
            // Orientation tag
            return view.getUint16(entryOffset + 8, littleEndian);
          }
        }
      }
      offset += length - 2;
    } else if ((marker & 0xff00) === 0xff00) {
      const len = view.getUint16(offset, false);
      offset += len;
    } else {
      break;
    }
  }
  return 1;
}

/**
 * Load an image from a File and return an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get image dimensions from a File.
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  URL.revokeObjectURL(img.src);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

/**
 * Compress and resize an image file.
 * Returns a new File with the compressed image data.
 *
 * @example
 * ```ts
 * const compressed = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.8 });
 * console.log(`Compressed: ${file.size} → ${compressed.size} bytes`);
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    outputType = 'image/webp',
  } = options;

  const img = await loadImage(file);

  // Read EXIF orientation
  let orientation = 1;
  if (file.type === 'image/jpeg') {
    try {
      const buffer = await file.arrayBuffer();
      orientation = readExifOrientation(buffer);
    } catch {
      // ignore
    }
  }

  let { naturalWidth: w, naturalHeight: h } = img;

  // Swap dimensions for orientations that rotate 90°
  const swapDimensions = orientation >= 5 && orientation <= 8;
  if (swapDimensions) {
    [w, h] = [h, w];
  }

  // Calculate scaled dimensions maintaining aspect ratio
  let targetW = w;
  let targetH = h;
  if (targetW > maxWidth) {
    targetH = Math.round(targetH * (maxWidth / targetW));
    targetW = maxWidth;
  }
  if (targetH > maxHeight) {
    targetW = Math.round(targetW * (maxHeight / targetH));
    targetH = maxHeight;
  }

  // Create canvas and draw
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d')!;

  // Apply EXIF orientation transform
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, targetW, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, targetW, targetH); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, targetH); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, targetH, 0);
      canvas.width = targetH; canvas.height = targetW; break;
    case 7: ctx.transform(0, -1, -1, 0, targetH, targetW);
      canvas.width = targetH; canvas.height = targetW; break;
    case 8: ctx.transform(0, -1, 1, 0, 0, targetW);
      canvas.width = targetH; canvas.height = targetW; break;
  }

  // Use high-quality downscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (swapDimensions && (orientation === 6 || orientation === 8)) {
    ctx.drawImage(img, 0, 0, targetH, targetW);
  } else {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }

  URL.revokeObjectURL(img.src);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      outputType,
      quality,
    );
  });

  // Determine file extension
  const ext = outputType === 'image/webp' ? '.webp' : outputType === 'image/png' ? '.png' : '.jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');

  return new File([blob], `${baseName}${ext}`, { type: outputType });
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate an image file meets requirements.
 */
export function validateImageFile(
  file: File,
  options: { maxSizeMB?: number; allowedTypes?: string[] } = {},
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" not allowed. Accepted: ${allowedTypes.join(', ')}` };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File size (${formatFileSize(file.size)}) exceeds ${maxSizeMB} MB limit.` };
  }

  return { valid: true };
}
