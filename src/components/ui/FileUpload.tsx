'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  FileImage,
  FileText,
  File as FileIcon,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // bytes
  label?: string;
  preview?: boolean;
  loading?: boolean;
  progress?: number; // 0-100
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (type === 'application/pdf') return FileText;
  return FileIcon;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FileUpload({
  onUpload,
  accept,
  maxSize,
  label = 'Drop your file here or click to browse',
  preview = true,
  loading = false,
  progress,
  className = '',
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (f: File): string | null => {
      if (accept) {
        const accepted = accept.split(',').map((t) => t.trim());
        const matchesType = accepted.some((t) => {
          if (t.startsWith('.')) return f.name.toLowerCase().endsWith(t.toLowerCase());
          if (t.endsWith('/*')) return f.type.startsWith(t.replace('/*', '/'));
          return f.type === t;
        });
        if (!matchesType) return `File type not accepted. Allowed: ${accept}`;
      }
      if (maxSize && f.size > maxSize)
        return `File too large. Max: ${formatFileSize(maxSize)}`;
      return null;
    },
    [accept, maxSize],
  );

  const handleFile = useCallback(
    (f: File) => {
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setFile(f);

      if (preview && f.type.startsWith('image/')) {
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      onUpload(f);
    },
    [onUpload, preview, validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const Icon = file ? getFileIcon(file.type) : Upload;
  const isUploading = loading || (progress !== undefined && progress < 100);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label="File upload"
      />

      <AnimatePresence mode="wait">
        {!file ? (
          /* ---- Dropzone ---- */
          <motion.button
            key="dropzone"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`relative w-full rounded-2xl border-2 border-dashed p-8
              flex flex-col items-center justify-center gap-3
              transition-all duration-300 cursor-pointer group
              ${
                isDragOver
                  ? 'border-purple-500/60 bg-purple-500/[0.08]'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }`}
            style={{
              boxShadow: isDragOver
                ? '0 0 40px rgba(124,58,237,0.2), inset 0 0 40px rgba(124,58,237,0.05)'
                : 'none',
            }}
          >
            <div
              className={`rounded-xl p-3 transition-colors ${
                isDragOver ? 'bg-purple-500/20' : 'bg-gray-100 group-hover:bg-gray-200'
              }`}
            >
              <Upload
                className={`w-7 h-7 transition-colors ${
                  isDragOver ? 'text-purple-400' : 'text-slate-500 group-hover:text-gray-600'
                }`}
                strokeWidth={1.5}
              />
            </div>
            <div className="text-center">
              <p
                className={`text-sm font-semibold transition-colors ${
                  isDragOver ? 'text-purple-600' : 'text-slate-800'
                }`}
              >
                {label}
              </p>
              {(accept || maxSize) && (
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {accept && <span>{accept}</span>}
                  {accept && maxSize && <span> · </span>}
                  {maxSize && <span>Max {formatFileSize(maxSize)}</span>}
                </p>
              )}
            </div>
          </motion.button>
        ) : (
          /* ---- File preview ---- */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-2xl p-4 space-y-3"
          >
            {/* Image preview */}
            {previewUrl && (
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* File info row */}
            <div className="flex items-center gap-3">
              <div className="shrink-0 rounded-xl bg-purple-500/10 p-2.5">
                <Icon className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>

              {/* Status / remove */}
              {isUploading ? (
                <span className="text-xs text-purple-400 font-medium shrink-0">
                  {progress !== undefined ? `${Math.round(progress)}%` : 'Uploading…'}
                </span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <button
                    onClick={handleRemove}
                    className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-gray-600
                      hover:bg-gray-100 transition-all"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Progress bar */}
            {isUploading && progress !== undefined && (
              <Progress.Root
                value={progress}
                className="h-1.5 w-full rounded-full bg-white overflow-hidden"
              >
                <Progress.Indicator
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                  }}
                />
              </Progress.Root>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-2 px-1"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="text-xs text-rose-600">{error}</span>
        </motion.div>
      )}
    </div>
  );
}

export default FileUpload;
