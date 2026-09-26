'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'thenijobs_ref_code';

export function useReferral() {
  const [referralCode, setReferralCodeState] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check URL query parameters
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referral');
      if (urlRef) {
        const cleanRef = urlRef.trim().toUpperCase();
        localStorage.setItem(STORAGE_KEY, cleanRef);
        setReferralCodeState(cleanRef);
        return;
      }

      // 2. Check localStorage fallback
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setReferralCodeState(stored.trim().toUpperCase());
      }
    } catch {
      // Ignore storage/url errors in SSR
    }
  }, []);

  const setReferralCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    try {
      localStorage.setItem(STORAGE_KEY, clean);
    } catch {}
    setReferralCodeState(clean);
  };

  const clearReferralCode = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setReferralCodeState(null);
  };

  return { referralCode, setReferralCode, clearReferralCode };
}
