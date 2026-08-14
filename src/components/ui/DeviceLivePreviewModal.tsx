'use client';

import { useState } from 'react';
import {
  Laptop, Tablet, Smartphone, ExternalLink, X,
  Sparkles, Check, Globe
} from 'lucide-react';

export type DeviceMode = 'laptop' | 'tablet' | 'mobile';

interface DeviceLivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  publicUrl?: string;
  children: React.ReactNode;
}

const DEVICE_SPECS: Record<DeviceMode, { name: string; icon: any; width: string; height: string; label: string }> = {
  laptop: {
    name: 'Laptop / Desktop',
    icon: Laptop,
    width: 'w-full max-w-[1240px]',
    height: 'h-[80vh]',
    label: '1240px × 800px',
  },
  tablet: {
    name: 'Tablet (iPad)',
    icon: Tablet,
    width: 'w-[768px]',
    height: 'h-[82vh]',
    label: '768px × 1024px',
  },
  mobile: {
    name: 'Mobile (Phone)',
    icon: Smartphone,
    width: 'w-[375px]',
    height: 'h-[82vh]',
    label: '375px × 812px',
  },
};

export default function DeviceLivePreviewModal({
  isOpen,
  onClose,
  title = 'Live Portfolio Preview',
  publicUrl,
  children,
}: DeviceLivePreviewModalProps) {
  const [device, setDevice] = useState<DeviceMode>('laptop');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentSpec = DEVICE_SPECS[device];

  const handleCopyLink = () => {
    if (!publicUrl) return;
    const fullUrl = publicUrl.startsWith('http') ? publicUrl : `${window.location.origin}${publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenNewTab = () => {
    if (!publicUrl) return;
    const fullUrl = publicUrl.startsWith('http') ? publicUrl : `${window.location.origin}${publicUrl}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/90 backdrop-blur-md animate-fade-in font-outfit">
      {/* Top Device Toolbar */}
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6">
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white sm:text-base flex items-center gap-2">
              {title}
              <span className="hidden sm:inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                Live Sync
              </span>
            </h2>
            <p className="text-xs text-slate-400">Real-time device ratio preview & responsive check</p>
          </div>
        </div>

        {/* Device Selector Pills */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
          {(['laptop', 'tablet', 'mobile'] as DeviceMode[]).map((mode) => {
            const SpecIcon = DEVICE_SPECS[mode].icon;
            const isActive = device === mode;
            return (
              <button
                key={mode}
                onClick={() => setDevice(mode)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                title={`${DEVICE_SPECS[mode].name} (${DEVICE_SPECS[mode].label})`}
              >
                <SpecIcon size={15} />
                <span className="hidden md:inline">{DEVICE_SPECS[mode].name}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-2">
          {publicUrl && (
            <>
              <button
                onClick={handleCopyLink}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                title="Copy Public Link"
              >
                {copiedLink ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Globe size={14} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenNewTab}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="Open in new tab"
              >
                <span>Full Page</span>
                <ExternalLink size={13} />
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all"
            title="Close Preview"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Simulated Device Frame Container */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/70">
        <div
          className={`relative transition-all duration-300 ease-out shadow-2xl flex flex-col ${currentSpec.width} ${
            device === 'laptop'
              ? 'rounded-2xl border border-slate-800 bg-slate-900 shadow-blue-900/10'
              : device === 'tablet'
              ? 'rounded-[32px] border-[12px] border-slate-800 bg-slate-900 shadow-slate-900/50'
              : 'rounded-[40px] border-[14px] border-slate-900 bg-slate-950 shadow-2xl shadow-black ring-1 ring-slate-800'
          }`}
        >
          {/* Mobile Phone Top Notch / Speaker Indicator */}
          {device === 'mobile' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-900 rounded-b-xl z-50 flex items-center justify-center gap-1.5">
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
              <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>
          )}

          {/* Browser Address Bar Simulation */}
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 rounded-t-[inherit]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 mx-2 bg-slate-950/80 rounded-lg px-3 py-1 text-xs text-slate-400 font-mono flex items-center gap-2 border border-slate-800 truncate">
              <span className="text-emerald-400 font-sans">https://</span>
              <span className="truncate text-slate-200">
                {publicUrl ? `thenijobs.com${publicUrl}` : 'thenijobs.com/portfolio/preview'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {currentSpec.label}
            </span>
          </div>

          {/* Scrollable Page Body */}
          <div className={`overflow-y-auto ${currentSpec.height} rounded-b-[inherit] bg-slate-50 text-slate-900 no-scrollbar`}>
            {children}
          </div>

          {/* Mobile Home Bar Indicator */}
          {device === 'mobile' && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-700 rounded-full z-50 pointer-events-none" />
          )}
        </div>
      </main>
    </div>
  );
}
