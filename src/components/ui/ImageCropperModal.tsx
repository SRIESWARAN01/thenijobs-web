'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Check, RefreshCw, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatFileSize } from '@/lib/imageUtils';
import { useUploadFile } from '@/hooks/useStorage';

export interface ImageCropperModalProps {
  open: boolean;
  onClose: () => void;
  file: File | null;
  aspectRatio: number; // width / height, e.g. 1 for square, 4 for banner (4:1)
  cropWidth: number;   // target output width (e.g. 400 or 1200)
  cropHeight: number;  // target output height (e.g. 400 or 300)
  onCropComplete?: (croppedFile: File) => void;
  onUploadComplete?: (url: string) => void; // New callback
  uploadPath?: string; // New optional parameter. If provided, uploads internally
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
  onUploadComplete,
  uploadPath,
  title = 'Crop Image',
  isCircular = false,
}: ImageCropperModalProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [stage, setStage] = useState<'crop' | 'preview'>('crop');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  // Dynamic aspect ratio states
  const [currentAspectRatio, setCurrentAspectRatio] = useState(aspectRatio || 1);
  const [targetWidth, setTargetWidth] = useState(cropWidth || 400);
  const [targetHeight, setTargetHeight] = useState(cropHeight || 400);

  // Upload States
  const { uploadFile, progress: fireProgress, loading: fireLoading, error: fireError, clearError } = useUploadFile();
  const [modalUploading, setModalUploading] = useState(false);
  const [modalUploadError, setModalUploadError] = useState<string | null>(null);

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

  // Sync aspect ratio props when they change
  useEffect(() => {
    if (aspectRatio) {
      setCurrentAspectRatio(aspectRatio);
    }
  }, [aspectRatio]);

  useEffect(() => {
    if (cropWidth) setTargetWidth(cropWidth);
    if (cropHeight) setTargetHeight(cropHeight);
  }, [cropWidth, cropHeight]);

  // Create Object URL on load for instant cropper loading
  useEffect(() => {
    if (!file) {
      setImgUrl(null);
      setImageLoaded(false);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImgUrl(objectUrl);
    setImageLoaded(false);
    setStage('crop');
    setPreviewDataUrl(null);
    setCroppedBlob(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setModalUploadError(null);
    setModalUploading(false);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  // Measure container when modal opens or layout changes using ResizeObserver
  useEffect(() => {
    if (!open || !containerRef.current) return;

    const container = containerRef.current;
    
    // ResizeObserver for dynamic changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    resizeObserver.observe(container);

    // Timeout-based retry loop to handle modal entrance transition animation delays
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
          return true;
        }
      }
      return false;
    };

    measure();
    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 150);
    const t3 = setTimeout(measure, 350);
    const t4 = setTimeout(measure, 600);
    const t5 = setTimeout(measure, 1000);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [open]);

  // Calculate viewport size to fit nicely inside container
  const W = containerSize.width;
  const H = containerSize.height;
  let V_w = 0;
  let V_h = 0;

  if (W && H) {
    V_w = W * 0.85;
    V_h = V_w / currentAspectRatio;
    if (V_h > H * 0.72) {
      V_h = H * 0.72;
      V_w = V_h * currentAspectRatio;
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    setImageInfo({ width: naturalW, height: naturalH });

    // Fallback: If container size was not measured yet due to animation delay, measure it now
    if (containerRef.current && (containerSize.width === 0 || containerSize.height === 0)) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }
  };

  // Recalculate zoom and bounds when image metadata and layout are ready
  useEffect(() => {
    if (imageInfo.width && imageInfo.height && V_w && V_h && !imageLoaded) {
      const scaleX = V_w / imageInfo.width;
      const scaleY = V_h / imageInfo.height;
      const calculatedMinZoom = Math.max(scaleX, scaleY);
      
      setMinZoom(calculatedMinZoom);
      setZoom(calculatedMinZoom);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(true);
    }
  }, [imageInfo, V_w, V_h, imageLoaded]);

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

  // Dynamic aspect ratio changes
  const handleRatioChange = (ratio: number | 'original') => {
    let newRatio = 1;
    if (ratio === 'original') {
      newRatio = imageInfo.width && imageInfo.height ? imageInfo.width / imageInfo.height : 1;
    } else {
      newRatio = ratio;
    }
    setCurrentAspectRatio(newRatio);
    
    // Adjust target width & height dynamically to preserve the ratio
    const baseWidth = cropWidth || 400;
    setTargetWidth(baseWidth);
    setTargetHeight(Math.round(baseWidth / newRatio));

    // Recalculate zoom boundaries for new ratio
    if (W && H && imageInfo.width && imageInfo.height) {
      let tempV_w = W * 0.85;
      let tempV_h = tempV_w / newRatio;
      if (tempV_h > H * 0.72) {
        tempV_h = H * 0.72;
        tempV_w = tempV_h * newRatio;
      }
      const scaleX = tempV_w / imageInfo.width;
      const scaleY = tempV_h / imageInfo.height;
      const calculatedMinZoom = Math.max(scaleX, scaleY);
      
      setMinZoom(calculatedMinZoom);
      setZoom(calculatedMinZoom);
      setOffset({ x: 0, y: 0 });
    }
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
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The scale of canvas resolution compared to display viewport
    const resScale = targetWidth / V_w;

    // Calculate drawing parameters on canvas
    const drawWidth = imageInfo.width * zoom * resScale;
    const drawHeight = imageInfo.height * zoom * resScale;
    const drawX = (targetWidth / 2) + (offset.x * resScale) - (drawWidth / 2);
    const drawY = (targetHeight / 2) + (offset.y * resScale) - (drawHeight / 2);

    // Draw to canvas with antialiasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Convert canvas to compressed WebP, fallback to JPEG if WebP is unsupported
    return new Promise<void>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCroppedBlob(blob);
            const dataUrl = URL.createObjectURL(blob);
            setPreviewDataUrl(dataUrl);
            setStage('preview');
            resolve();
          } else {
            // Fallback to JPEG
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  setCroppedBlob(jpegBlob);
                  const dataUrl = URL.createObjectURL(jpegBlob);
                  setPreviewDataUrl(dataUrl);
                  setStage('preview');
                }
                resolve();
              },
              'image/jpeg',
              0.85
            );
          }
        },
        'image/webp',
        0.82
      );
    });
  };

  const handleSave = async () => {
    if (!croppedBlob || !file) return;

    const isWebP = croppedBlob.type === 'image/webp';
    const fileExt = isWebP ? '.webp' : '.jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const croppedFile = new File([croppedBlob], `${baseName}_cropped${fileExt}`, {
      type: croppedBlob.type,
      lastModified: Date.now(),
    });

    if (uploadPath) {
      setModalUploading(true);
      setModalUploadError(null);
      try {
        const downloadUrl = await uploadFile(croppedFile, uploadPath);
        if (onUploadComplete) {
          onUploadComplete(downloadUrl);
        }
        setTimeout(() => {
          setModalUploading(false);
          onClose();
        }, 1000);
      } catch (err: any) {
        console.error('[Modal Upload Error]:', err);
        setModalUploadError(err.message || 'Upload failed. Please try again.');
        setModalUploading(false);
      }
    } else {
      if (onCropComplete) {
        onCropComplete(croppedFile);
      }
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

  // Determine upload progress message
  let uploadStatusText = 'Preparing Image...';
  if (fireProgress > 10 && fireProgress <= 85) {
    uploadStatusText = 'Uploading to Cloud...';
  } else if (fireProgress > 85 && fireProgress < 100) {
    uploadStatusText = 'Almost Done...';
  } else if (fireProgress === 100) {
    uploadStatusText = 'Upload Successful';
  }

  const aspectRatios = [
    { label: 'Square (1:1)', value: 1 },
    { label: 'Portrait (3:4)', value: 3 / 4 },
    { label: 'Landscape (16:9)', value: 16 / 9 },
    { label: 'Custom (Original)', value: 'original' as const },
  ];

  return (
    <Modal
      open={open}
      onClose={modalUploading ? () => {} : onClose}
      title={stage === 'crop' ? title : 'Confirm Crop'}
      size="md"
    >
      <div className="relative flex flex-col h-[540px] font-outfit text-white">
        
        {/* Upload Overlay */}
        {modalUploading && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-fade-in rounded-xl">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
            <h3 className="text-sm font-semibold text-white mb-2">{uploadStatusText}</h3>
            <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-300"
                style={{ width: `${fireProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">{fireProgress}%</span>
          </div>
        )}

        {/* Error Overlay */}
        {(modalUploadError || fireError) && (
          <div className="absolute inset-0 z-50 bg-slate-950/98 flex flex-col items-center justify-center p-6 text-center rounded-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
              <span className="text-rose-400 font-bold text-xl">!</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">Upload Failed</h3>
            <p className="text-xs text-rose-400 mb-6 max-w-xs">{modalUploadError || fireError}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalUploadError(null);
                  clearError();
                }}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300 hover:bg-white/[0.08]"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  clearError();
                  handleSave();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Original File Metadata display */}
        {imageLoaded && file && (
          <div className="flex justify-between items-center px-3.5 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl mb-3 text-[11px] text-gray-400 shrink-0">
            <span className="truncate max-w-[180px]">File: {file.name}</span>
            <span className="shrink-0">
              Size: <strong className="text-gray-300">{formatFileSize(file.size)}</strong> | Res: <strong className="text-gray-300">{imageInfo.width} × {imageInfo.height} px</strong>
            </span>
          </div>
        )}

        {stage === 'crop' ? (
          <>
            {/* Cropping Workspace */}
            <div
              ref={containerRef}
              className="flex-1 w-full bg-black/90 relative overflow-hidden select-none rounded-xl border border-white/[0.06] cursor-move shrink-0"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
               {imgUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                      <span className="text-xs text-gray-400">Loading workspace...</span>
                    </div>
                  )}
                </>
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
            </div>

            {/* Zoom Slider & Aspect Ratios */}
            {imageLoaded && (
              <div className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-xl mt-3 space-y-3 shrink-0">
                {/* Zoom */}
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

                {/* Aspect Ratios Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-gray-400">Aspect Ratio</span>
                  <div className="grid grid-cols-4 gap-2">
                    {aspectRatios.map((ratio) => {
                      const isSelected = ratio.value === 'original' 
                        ? Math.abs(currentAspectRatio - (imageInfo.width / imageInfo.height)) < 0.01
                        : Math.abs(currentAspectRatio - (ratio.value as number)) < 0.01;
                      return (
                        <button
                          key={ratio.label}
                          type="button"
                          onClick={() => handleRatioChange(ratio.value)}
                          className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 mt-3 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-300 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                disabled={!imageLoaded}
                onClick={generateCrop}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                Preview Crop
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview Screen */}
            <div className="flex-1 w-full bg-black/95 border border-white/[0.06] rounded-xl overflow-hidden flex items-center justify-center p-6 relative shrink-0">
              {previewDataUrl ? (
                <div className="relative border border-white/10 rounded-xl overflow-hidden shadow-2xl max-w-full max-h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDataUrl}
                    alt="Cropped Preview"
                    className={`object-contain max-h-[300px] ${isCircular ? 'rounded-full aspect-square' : ''}`}
                    style={{ aspectRatio: `${currentAspectRatio}` }}
                  />
                </div>
              ) : (
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              )}
            </div>

            <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center text-xs text-emerald-300/80 shrink-0">
              Image optimized & converted to WebP for high performance uploads.
            </div>

            {/* Actions Footer */}
            <div className="flex justify-between gap-3 mt-3 shrink-0">
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-xs font-semibold text-white hover:opacity-90 flex items-center gap-1.5"
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

export default ImageCropperModal;
