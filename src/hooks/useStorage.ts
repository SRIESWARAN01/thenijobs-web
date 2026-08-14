'use client';

import { useState, useCallback } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

// ───────────────────────────── Types ─────────────────────────────

export interface UploadOptions {
  /** Allowed MIME types, e.g. ['image/jpeg', 'image/png', 'application/pdf'] */
  allowedTypes?: string[];
  /** Maximum file size in bytes (default: 5 MB) */
  maxSizeBytes?: number;
}

export interface UseUploadFileReturn {
  /** Upload a file to the given storage path */
  uploadFile: (file: File, path: string, options?: UploadOptions) => Promise<string>;
  /** Upload progress 0-100 */
  progress: number;
  /** Download URL of the last successful upload */
  url: string | null;
  loading: boolean;
  error: string | null;
}

export interface UseDeleteFileReturn {
  /** Delete a file at the given storage path */
  deleteFile: (path: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// ───────────────────────── Default limits ────────────────────────

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ───────────────────────────── useUploadFile ─────────────────────

/**
 * Upload a file to Firebase Cloud Storage with progress tracking.
 *
 * @example
 * ```tsx
 * const { uploadFile, progress, url, loading } = useUploadFile();
 *
 * const handleUpload = async (file: File) => {
 *   const downloadUrl = await uploadFile(file, `resumes/${userId}/${file.name}`);
 *   console.log('Uploaded to', downloadUrl);
 * };
 * ```
 */
export function useUploadFile(): UseUploadFileReturn {
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File, path: string, options?: UploadOptions): Promise<string> => {
      const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE;
      const allowedTypes = options?.allowedTypes;

      // ── Validate file type ───────────────────────────────────
      if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        const msg = `File type "${file.type}" is not allowed. Accepted: ${allowedTypes.join(', ')}`;
        setError(msg);
        throw new Error(msg);
      }

      // ── Validate file size ───────────────────────────────────
      if (file.size > maxSize) {
        const mbLimit = (maxSize / (1024 * 1024)).toFixed(1);
        const msg = `File size exceeds the ${mbLimit} MB limit.`;
        setError(msg);
        throw new Error(msg);
      }

      setLoading(true);
      setError(null);
      setProgress(0);
      setUrl(null);

      return new Promise<string>((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            setProgress(pct);
          },
          (err) => {
            const message = err.message || 'Upload failed';
            setError(message);
            setLoading(false);
            reject(err);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setUrl(downloadURL);
              setLoading(false);
              resolve(downloadURL);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Failed to get download URL';
              setError(message);
              setLoading(false);
              reject(err);
            }
          },
        );
      });
    },
    [],
  );

  return { uploadFile, progress, url, loading, error };
}

// ───────────────────────────── useDeleteFile ─────────────────────

/**
 * Delete a file from Firebase Cloud Storage.
 *
 * @example
 * ```tsx
 * const { deleteFile, loading } = useDeleteFile();
 * await deleteFile(`resumes/${userId}/old_resume.pdf`);
 * ```
 */
export function useDeleteFile(): UseDeleteFileReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteFile, loading, error };
}
