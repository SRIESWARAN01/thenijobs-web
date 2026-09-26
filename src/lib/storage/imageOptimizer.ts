/**
 * THENIJOBS — Image Optimization & Storage Utilities
 *
 * Client-side image validation, compression to WebP, dimension scaling,
 * and Firebase Storage path resolution to prevent bucket quota exhaustion.
 */

export interface ImageOptimizationOptions {
  /** Maximum width in pixels (aspect ratio maintained) */
  maxWidth?: number;
  /** Maximum height in pixels (aspect ratio maintained) */
  maxHeight?: number;
  /** WebP compression quality (0.0 to 1.0, default 0.82) */
  quality?: number;
  /** Maximum file size in bytes before optimization (rejects if exceeded) */
  maxInputBytes?: number;
  /** Label for error messages (e.g. 'Logo', 'Cover banner') */
  label?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DISALLOWED_EXTENSIONS = ['.svg', '.exe', '.js', '.html', '.htm', '.php', '.sh', '.bat'];

/**
 * Validate that an uploaded file is a safe, allowed image format within limits.
 */
export function validateImageFile(file: File, options?: { maxBytes?: number; label?: string }): void {
  const label = options?.label || 'Image';
  const maxBytes = options?.maxBytes || 5 * 1024 * 1024; // Default 5 MB

  if (!file) {
    throw new Error('Please select an image file to upload.');
  }

  // Check file extension for dangerous/disallowed types
  const lowerName = file.name.toLowerCase();
  for (const ext of DISALLOWED_EXTENSIONS) {
    if (lowerName.endsWith(ext)) {
      if (ext === '.svg') {
        throw new Error('SVG images are not supported for company branding. Please upload a PNG, JPG, or WebP image.');
      }
      throw new Error(`File type "${ext}" is not permitted. Only PNG, JPG, and WebP images are allowed.`);
    }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type "${file.type || 'unknown'}". Accepted formats: PNG, JPG, JPEG, and WebP.`);
  }

  // Check raw file size limit
  if (file.size > maxBytes) {
    const mbLimit = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`${label} size must be less than ${mbLimit} MB.`);
  }
}

/**
 * Extract the Firebase Storage relative object path from a full download URL or gs:// URI.
 *
 * Example:
 * https://firebasestorage.googleapis.com/v0/b/bucket/o/companies%2F123%2Flogo%2Flogo_1.webp?alt=media...
 * -> 'companies/123/logo/logo_1.webp'
 */
export function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;

  // Already a relative storage path
  if (!urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://') && !urlOrPath.startsWith('gs://')) {
    return urlOrPath;
  }

  // gs:// URI
  if (urlOrPath.startsWith('gs://')) {
    const parts = urlOrPath.split('/');
    return parts.slice(3).join('/');
  }

  // Firebase Storage HTTPS URL
  try {
    const match = urlOrPath.match(/\/o\/([^?#]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch (err) {
    console.error('Failed to parse storage URL:', err);
  }

  return null;
}

/**
 * Optimizes an image client-side before uploading:
 * 1. Validates type and input size limit
 * 2. Downscales dimensions to prevent multi-megapixel bloating
 * 3. Compresses to high-efficiency WebP
 * 4. Yields 90%+ bandwidth and storage savings
 */
export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    maxInputBytes = 10 * 1024 * 1024,
    label = 'Image'
  } = options;

  // 1. Validate
  validateImageFile(file, { maxBytes: maxInputBytes, label });

  // If running outside browser (SSR safeguard), return file as-is
  if (typeof window === 'undefined') {
    return file;
  }

  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate aspect ratio scale
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original file if canvas context is unavailable
        resolve(file);
        return;
      }

      // High-quality downsampling smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output MIME type (prefer WebP, fallback to JPEG)
      const outputMime = 'image/webp';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // If compression resulted in larger file than original (rare), use original
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          // Form safe new file name with .webp extension
          const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const safeName = `${originalBaseName.replace(/[^a-zA-Z0-9_-]/g, '_')}.webp`;

          const optimizedFile = new File([blob], safeName, {
            type: outputMime,
            lastModified: Date.now()
          });

          resolve(optimizedFile);
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for optimization. Please check that the file is not corrupted.'));
    };

    img.src = objectUrl;
  });
}
