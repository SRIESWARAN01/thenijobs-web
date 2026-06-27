'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, X } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * A premium, non-intrusive notification banner that displays at the very top
 * of the screen when the client device is offline.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] transition-all duration-300">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-3 flex items-center justify-between text-xs font-bold tracking-wide shadow-2xl font-outfit border-b border-red-500/20">
        <div className="flex items-center gap-2 mx-auto">
          <WifiOff size={15} className="animate-bounce" />
          <span>உங்களுடைய இணைய இணைப்பு துண்டிக்கப்பட்டுள்ளது. Connection lost. Working offline.</span>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="text-white/80 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
          aria-label="Close offline banner"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
