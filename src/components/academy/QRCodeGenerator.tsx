'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  includeLogo?: boolean;
}

export default function QRCodeGenerator({
  value,
  size = 120,
  includeLogo = true,
}: QRCodeGeneratorProps) {
  // Construct absolute validation URL
  const absoluteUrl = value.startsWith('http')
    ? value
    : `${window.location.origin}${value}`;

  return (
    <div className="p-2.5 bg-white rounded-2xl inline-block shadow-lg border border-white/[0.08]">
      <QRCodeSVG
        value={absoluteUrl}
        size={size}
        level="H" // High correction level to allow logo embedding
        bgColor="#FFFFFF"
        fgColor="#000000"
        imageSettings={includeLogo ? {
          src: '/favicon.ico', // Embed app favicon inside the QR code center
          x: undefined,
          y: undefined,
          height: Math.round(size * 0.2),
          width: Math.round(size * 0.2),
          excavate: true,
        } : undefined}
      />
    </div>
  );
}
