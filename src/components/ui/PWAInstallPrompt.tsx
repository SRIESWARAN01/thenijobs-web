'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Smartphone, Download } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'thenijobs.pwa_prompt_dismissed';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is already running in standalone/installed mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      console.log('beforeinstallprompt event fired and deferred.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation event
    const handleAppInstalled = () => {
      console.log('PWA was installed successfully.');
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Timer to trigger prompt display after 12 seconds
    const timer = setTimeout(() => {
      const isDismissed = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
      
      // Only show the prompt if:
      // 1. We have the deferred prompt event (supports installation)
      // 2. Not already in standalone mode
      // 3. Not dismissed previously in Local Storage
      if (deferredPrompt && !isStandalone && !isDismissed) {
        setShowPrompt(true);
      }
    }, 12000); // 12 seconds delay

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [deferredPrompt, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    }

    // Clear the deferred prompt variable
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleLaterClick = () => {
    // Store dismiss preference in Local Storage so they don't see it again
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 max-w-sm md:w-[350px] bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md p-5 z-[100] transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">
      <button 
        onClick={handleLaterClick}
        className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        aria-label="Close installation prompt"
      >
        <X size={16} />
      </button>

      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-lg shadow-purple-500/20">
          <Image 
            src="/logo.png" 
            alt="TheniJobs Logo" 
            width={48} 
            height={48} 
            className="w-full h-full object-contain rounded-xl"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-outfit font-bold text-white text-sm flex items-center gap-1.5 leading-snug">
            Install TheniJobs
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
            Install the app for faster access, offline capability and a better overall experience.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <button
          onClick={handleLaterClick}
          className="min-h-9 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-all active:scale-95"
        >
          Later
        </button>
        <button
          onClick={handleInstallClick}
          className="min-h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-[11px] font-bold text-white shadow-md shadow-purple-600/10 hover:shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Download size={12} />
          Install Now
        </button>
      </div>
    </div>
  );
}
