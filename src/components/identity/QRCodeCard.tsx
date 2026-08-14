'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Share2, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeCardProps {
  url: string;
  title?: string;
  subtitle?: string;
  theniJobsId?: string;
}

export default function QRCodeCard({ url, title = 'Digital Portfolio QR Code', subtitle = 'Scan to view website', theniJobsId }: QRCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (url) {
      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      })
        .then(data => setQrDataUrl(data))
        .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [url]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `thenijobs-qr-${theniJobsId || 'portfolio'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center max-w-sm mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 flex items-center justify-center mb-3">
        <QrCode size={20} className="text-blue-600" />
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>

      {/* QR Code Container */}
      <div className="my-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 inline-block shadow-inner">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg" />
        ) : (
          <div className="w-48 h-48 mx-auto flex items-center justify-center text-gray-300 text-xs">
            Generating QR Code...
          </div>
        )}
      </div>

      {theniJobsId && (
        <p className="text-xs font-mono font-bold text-blue-600 mb-4 bg-blue-50 py-1.5 px-3 rounded-lg inline-block">
          ID: {theniJobsId}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={!qrDataUrl}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
        >
          <Download size={13} /> Download
        </button>
        <button
          onClick={handleCopy}
          className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all"
        >
          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}
