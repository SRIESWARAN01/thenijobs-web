'use client';

import { useEffect } from 'react';

/**
 * On mobile, opening the on-screen keyboard shrinks the *visual* viewport without
 * resizing the *layout* viewport, so `100vh`-based layouts don't reflow and a focused
 * input near the bottom of the form can end up hidden behind the keyboard. Real mobile
 * browsers usually scroll the focused field into view on their own — but that native
 * behavior is unreliable inside an Android WebView, which is how this app ships
 * (see the in-app webview overrides in git history). This hook re-centers whatever
 * input/textarea is currently focused once the VisualViewport actually finishes
 * resizing, which is more robust than a fixed setTimeout guess at the keyboard's
 * animation duration.
 */
export function useKeyboardAwareScroll() {
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;

    const handleResize = () => {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        active.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);
}
