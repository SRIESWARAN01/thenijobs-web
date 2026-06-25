'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Check, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatFileSize } from '@/lib/imageUtils';

export interface ImageCropperModalProps {
  open: boolean;
  onClose: () => void;
  file: File | null;
  aspectRatio: number; // width / height, e.g. 1 for square, 4 for banner (4:1)
  cropWidth: number;   // target output width (e.g. 400 or 1200)
  cropHeight: number;  // target output height (e.g. 400 or 300)
  onCropComplete: (croppedFile: File) => void;
  title?: string;
  isCircular?: boolean; // visually displays a circle for logos/avatars
}

export function ImageCropperModal({
  open,
  onClose,
  file,
  aspectRatio,
  cropWidth,
  cropHeight,
  onCropComplete,
  title = 'Crop Image',
  isCircular = false,
}: ImageCropperModalProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [stage, setStage] = useState<'crop' | 'preview'>('crop');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  // Translation and zoom state
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });

  // Touch pinch zoom state
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);

  // Workspace and viewport dimensions
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Read file as Data URL on load
  useEffect(() => {
    if (!file) {
      setImgUrl(null);
      setImageLoaded(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImgUrl(reader.result as string);
      setImageLoaded(false);
      setStage('crop');
      setPreviewDataUrl(null);
      setCroppedBlob(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Measure container when modal opens or layout changes
  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, [open, imageLoaded]);

  // Calculate viewport size to fit nicely inside container
  const W = containerSize.width;
  const H = containerSize.height;
  let V_w = 0;
  let V_h = 0;

  if (W && H) {
    V_w = W * 0.85;
    V_h = V_w / aspectRatio;
    if (V_h > H * 0.85) {
      V_h = H * 0.85;
      V_w = V_h * aspectRatio;
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    setImageInfo({ width: naturalW, height: naturalH });

    if (V_w && V_h) {
      // Calculate minZoom to cover the viewport fully
      const scaleX = V_w / naturalW;
      const scaleY = V_h / naturalH;
      const calculatedMinZoom = Math.max(scaleX, scaleY);
      
      setMinZoom(calculatedMinZoom);
      setZoom(calculatedMinZoom);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(true);
    }
  };

  // Keep image aligned with bounds when zoom changes or resizing occurs
  const getBoundedOffset = useCallback(
    (x: number, y: number, currentZoom: number) => {
      if (!imageInfo.width || !V_w || !V_h) return { x: 0, y: 0 };

      const halfW = (imageInfo.width * currentZoom) / 2;
      const halfH = (imageInfo.height * currentZoom) / 2;

      const limitX = Math.max(0, halfW - V_w / 2);
      const limitY = Math.max(0, halfH - V_h / 2);

      return {
        x: Math.min(Math.max(x, -limitX), limitX),
        y: Math.min(Math.max(y, -limitY), limitY),
      };
    },
    [imageInfo, V_w, V_h]
  );

  // Adjust zoom slider
  const handleZoomChange = (newZoom: number) => {
    const nextZoom = Math.max(minZoom, Math.min(newZoom, minZoom * 4));
    setZoom(nextZoom);
    setOffset((prev) => getBoundedOffset(prev.x, prev.y, nextZoom));
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOffsetStart({ ...offset });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const newX = offsetStart.x + dx;
    const newY = offsetStart.y + dy;

    setOffset(getBoundedOffset(newX, newY, zoom));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile support (drag & pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageLoaded) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setOffsetStart({ ...offset });
      setTouchStartDist(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      setTouchStartZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!imageLoaded) return;
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      const newX = offsetStart.x + dx;
      const newY = offsetStart.y + dy;

      setOffset(getBoundedOffset(newX, newY, zoom));
    } else if (e.touches.length === 2 && touchStartDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist;
      const newZoom = touchStartZoom * factor;
      handleZoomChange(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(null);
  };

  // Generate cropped image in memory
  const generateCrop = async () => {
    if (!imgRef.current || !imageLoaded) return;

    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The scale of canvas resolution compared to display viewport
    const resScale = cropWidth / V_w;

    // Calculate drawing parameters on canvas
    const drawWidth = imageInfo.width * zoom * resScale;
    const drawHeight = imageInfo.height * zoom * resScale;
    const drawX = (cropWidth / 2) + (offset.x * resScale) - (drawWidth / 2);
    const drawY = (cropHeight / 2) + (offset.y * resScale) - (drawHeight / 2);

    // Draw to canvas with antialiasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Convert canvas to compressed WebP
    return new Promise<void>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCroppedBlob(blob);
            const dataUrl = URL.createObjectURL(blob);
            setPreviewDataUrl(dataUrl);
            setStage('preview');
          }
          resolve();
        },
        'image/webp',
        0.8
      );
    });
  };

  const handleSave = () => {
    if (croppedBlob && file) {
      // Re-create a File object from the blob
      const croppedFile = new File([croppedBlob], file.name.replace(/\.[^/.]+$/, '') + '_cropped.webp', {
        type: 'image/webp',
        lastModified: Date.now(),
      });
      onCropComplete(croppedFile);
      onClose();
    }
  };

  // Clear URLs when component unmounts or resets
  useEffect(() => {
    return () => {
      if (previewDataUrl) {
        URL.revokeObjectURL(previewDataUrl);
      }
    };
  }, [previewDataUrl]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={stage === 'crop' ? title : 'Confirm Crop'}
      size="md"
    >
      <div className="flex flex-col h-[480px] font-outfit text-white">
        {stage === 'crop' ? (
          <>
            {/* Cropping Screen */}
            <div
              ref={containerRef}
              className="flex-1 w-full bg-black/90 relative overflow-hidden select-none rounded-xl border border-white/[0.06] cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {imgUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  ref={imgRef}
                  src={imgUrl}
                  alt="Crop Source"
                  onLoad={handleImageLoad}
                  className="absolute origin-center max-w-none pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    display: imageLoaded ? 'block' : 'none',
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              )}

              {/* Viewport Mask Overlay */}
              {imageLoaded && V_w && V_h && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`border border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] ${
                      isCircular ? 'rounded-full' : 'rounded-lg'
                    }`}
                    style={{
                      width: `${V_w}px`,
                      height: `${V_h}px`,
                    }}
                  />
                </div>
              )}

              {!imageLoaded && imgUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Slider & Zoom Controls */}
            {imageLoaded && (
              <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="range"
                    min={minZoom}
                    max={minZoom * 4}
                    step={minZoom / 50}
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Drag image to adjust position</span>
                  <span className="font-semibold text-cyan-400">Zoom: {Math.round((zoom / minZoom) * 100)}%</span>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                disabled={!imageLoaded}
                onClick={generateCrop}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
              >
                Preview Crop
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview Screen */}
            <div className="flex-1 w-full bg-black/95 border border-white/[0.06] rounded-xl overflow-hidden flex items-center justify-center p-6 relative">
              {previewDataUrl ? (
                <div className="relative border border-white/10 rounded-xl overflow-hidden shadow-2xl max-w-full max-h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDataUrl}
                    alt="Cropped Preview"
                    className={`object-contain max-h-[300px] ${isCircular ? 'rounded-full aspect-square' : ''}`}
                    style={{ aspectRatio: `${aspectRatio}` }}
                  />
                </div>
              ) : (
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              )}
            </div>

            <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-center text-xs text-cyan-300/80">
              The image has been optimized and compressed for fast load speeds.
            </div>

            {/* Actions Footer */}
            <div className="flex justify-between gap-3 mt-4">
              <button
                onClick={() => setStage('crop')}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300 hover:bg-white/[0.08] flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Adjust Crop
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300 hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-xs font-semibold text-white hover:opacity-90 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save & Upload
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
