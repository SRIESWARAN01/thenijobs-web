'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  /** The URL or text to encode */
  url: string;
  /** Size in pixels (default 120) */
  size?: number;
  /** Dark color (default #1E293B) */
  darkColor?: string;
  /** Light color (default transparent) */
  lightColor?: string;
  /** CSS class name */
  className?: string;
}

/**
 * Renders a QR code as a canvas element using the `qrcode` library.
 * Used in Company and Seeker Digital ID Cards.
 */
export default function QRCodeGenerator({
  url,
  size = 120,
  darkColor = '#1E293B',
  lightColor = '#FFFFFF',
  className = '',
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !url) return;

    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'M',
    }).catch(() => {
      setError(true);
    });
  }, [url, size, darkColor, lightColor]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-400">QR Error</span>
      </div>
    );
  }

  return <canvas ref={canvasRef} className={`rounded-lg ${className}`} />;
}
