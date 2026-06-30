'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  onComplete: () => void;
  onTimeUpdate?: (seconds: number) => void;
  initialTime?: number;
}

export default function YouTubePlayer({
  videoId,
  onComplete,
  onTimeUpdate,
  initialTime = 0,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Track max watched time to prevent skipping/fast-forwarding
  const maxWatchedRef = useRef<number>(initialTime);

  useEffect(() => {
    // 1. Load YouTube IFrame Player API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      // Define callback
      (window as any).onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (!containerRef.current) return;

      try {
        playerRef.current = new (window as any).YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            controls: 0, // Disable standard scrubbing progress bar
            disablekb: 1, // Disable keyboard controls
            modestbranding: 1,
            rel: 0,
            fs: 0, // Disable full screen to prevent overlay bypasses on mobile
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              setLoading(false);
              if (initialTime > 0) {
                event.target.seekTo(initialTime, true);
              }
              startTracking();
            },
            onStateChange: (event: any) => {
              // event.data matches YT.PlayerState
              // UNSTARTED = -1, ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5
              if (event.data === 1) {
                // Check if user skips ahead
                startTracking();
              } else {
                stopTracking();
              }

              if (event.data === 0) {
                // Completed video
                onComplete();
              }
            },
            onError: () => {
              setError(true);
              setLoading(false);
            },
          },
        });
      } catch (err) {
        console.error('YouTube Player Init Error:', err);
        setError(true);
        setLoading(false);
      }
    }

    function startTracking() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!playerRef.current || !playerRef.current.getCurrentTime) return;

        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration() || 0;

        // Anti-skip check: if user seeks past maxWatched + 2 seconds
        if (currentTime > maxWatchedRef.current + 2) {
          // Force rewind
          playerRef.current.seekTo(maxWatchedRef.current, true);
        } else {
          // Keep tracking highest reached timestamp
          maxWatchedRef.current = Math.max(maxWatchedRef.current, currentTime);
        }

        if (onTimeUpdate) {
          onTimeUpdate(currentTime);
        }

        // Completion fallback (watched 95% of video)
        if (duration > 0 && maxWatchedRef.current >= duration * 0.95) {
          onComplete();
        }
      }, 500);
    }

    function stopTracking() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      stopTracking();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, onComplete, onTimeUpdate, initialTime]);

  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-gray-400 z-10">
          <Loader2 size={32} className="animate-spin text-violet-400 mb-2" />
          <p className="text-xs">Initializing secure video stream...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-rose-400 z-10 p-4 text-center">
          <AlertCircle size={32} className="mb-2" />
          <p className="text-sm font-semibold">Video Streaming Failed</p>
          <p className="text-xs text-gray-500 mt-1">This YouTube video could not be loaded or embed playing is restricted.</p>
        </div>
      )}
      <div className="w-full h-full" ref={containerRef} />
    </div>
  );
}
