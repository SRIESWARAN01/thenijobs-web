'use client';

import { useState, useCallback } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { extractStoragePath } from '@/lib/storage/imageOptimizer';

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
  /** Delete a file at the given storage path or download URL */
  deleteFile: (pathOrUrl: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// ───────────────────────── Default limits ────────────────────────

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ──────────────────── Error Diagnostic Tracking ──────────────────

export interface StorageErrorRecord {
  timestamp: number;
  code: string;
  userMessage: string;
  adminDiagnostic: string;
  isQuotaExceeded: boolean;
}

// Global in-memory diagnostic state shared across the client session
let lastStorageDiagnostic: StorageErrorRecord | null = null;
const diagnosticListeners: Set<(record: StorageErrorRecord | null) => void> = new Set();

export function getLastStorageDiagnostic(): StorageErrorRecord | null {
  return lastStorageDiagnostic;
}

export function subscribeStorageDiagnostic(callback: (record: StorageErrorRecord | null) => void): () => void {
  diagnosticListeners.add(callback);
  return () => diagnosticListeners.delete(callback);
}

/**
 * Format raw Firebase Storage errors into secure user-friendly messages and admin diagnostics.
 */
export function formatStorageError(err: any): { userMessage: string; isQuota: boolean; adminDiagnostic: string } {
  const code = err?.code || '';
  const rawMsg = err?.message || '';
  const isQuota =
    code === 'storage/quota-exceeded' ||
    code === 'storage/retry-limit-exceeded' ||
    rawMsg.toLowerCase().includes('quota') ||
    rawMsg.toLowerCase().includes('quota-exceeded');

  let userMessage = 'Upload failed: An unexpected error occurred. Please try again.';
  let adminDiagnostic = rawMsg || 'Unknown storage error';

  if (isQuota) {
    userMessage = 'Image upload is temporarily unavailable because storage capacity has been reached. Please try again later or contact support.';
    adminDiagnostic = 'Firebase Storage quota exceeded. Bucket: thenijobs-9f01d.firebasestorage.app';
  } else if (code === 'storage/unauthorized') {
    userMessage = 'You do not have permission to upload to this location. Please check your login status.';
    adminDiagnostic = 'Firebase Storage unauthorized write attempt (storage/unauthorized).';
  } else if (code === 'storage/canceled') {
    userMessage = 'Upload was canceled.';
    adminDiagnostic = 'Upload operation canceled by client.';
  } else if (code === 'storage/invalid-format') {
    userMessage = 'File format is not accepted. Please upload a standard PNG, JPG, or WebP image.';
    adminDiagnostic = `Invalid file format rejected by storage rules: ${rawMsg}`;
  } else if (rawMsg) {
    userMessage = rawMsg;
  }

  // Record for admin security monitor
  lastStorageDiagnostic = {
    timestamp: Date.now(),
    code,
    userMessage,
    adminDiagnostic,
    isQuotaExceeded: isQuota
  };
  diagnosticListeners.forEach(listener => listener(lastStorageDiagnostic));

  return { userMessage, isQuota, adminDiagnostic };
}

// ───────────────────────────── useUploadFile ─────────────────────

/**
 * Upload a file to Firebase Cloud Storage with progress tracking,
 * graceful quota-exceeded handling, and user-friendly error formatting.
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
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type || 'application/octet-stream'
        });

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            setProgress(pct);
          },
          (err) => {
            const formatted = formatStorageError(err);
            setError(formatted.userMessage);
            setLoading(false);
            const userError = new Error(formatted.userMessage);
            (userError as any).code = err.code;
            (userError as any).isQuota = formatted.isQuota;
            reject(userError);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setUrl(downloadURL);
              setLoading(false);
              resolve(downloadURL);
            } catch (err) {
              const formatted = formatStorageError(err);
              setError(formatted.userMessage);
              setLoading(false);
              reject(new Error(formatted.userMessage));
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
 * Delete a file from Firebase Cloud Storage by path or full download URL.
 * Automatically resolves relative storage paths from HTTPS URLs and suppresses
 * 'object-not-found' errors to ensure idempotent cleanup.
 */
export function useDeleteFile(): UseDeleteFileReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFile = useCallback(async (pathOrUrl: string): Promise<void> => {
    if (!pathOrUrl) return;

    // Resolve relative path from download URL or pass-through path
    const resolvedPath = extractStoragePath(pathOrUrl);
    if (!resolvedPath) {
      // If it's an external URL (e.g. Unsplash, placeholder), do not attempt deletion
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const storageRef = ref(storage, resolvedPath);
      await deleteObject(storageRef);
    } catch (err: any) {
      // If object already deleted or never existed, do not treat as fatal error
      if (err?.code === 'storage/object-not-found') {
        return;
      }
      const formatted = formatStorageError(err);
      setError(formatted.userMessage);
      console.warn('Firebase Storage delete warning:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteFile, loading, error };
}
