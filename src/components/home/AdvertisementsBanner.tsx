'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

interface Advertisement {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  priority?: number;
  status: string;
  startDate?: any;
  endDate?: any;
  type?: string;
}

export default function AdvertisementsBanner() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'advertisements'),
      where('status', '==', 'active'),
      where('startDate', '<=', now),
      orderBy('startDate', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeAds: Advertisement[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Check if ad has not expired
        const endDate = data.endDate?.toDate?.() || null;
        if (!endDate || endDate > new Date()) {
          activeAds.push({ id: doc.id, ...data } as Advertisement);
        }
      });
      // Sort by priority (higher first)
      activeAds.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      setAds(activeAds);
    }, () => {
      // Silently handle permission errors — ads are optional
      setAds([]);
    });

    return () => unsubscribe();
  }, []);

  // Auto-rotate ads every 5 seconds
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const visibleAds = ads.filter((ad) => !dismissed.has(ad.id));

  if (visibleAds.length === 0) return null;

  const currentAd = visibleAds[currentIndex % visibleAds.length];
  if (!currentAd) return null;

  const handleDismiss = (adId: string) => {
    setDismissed((prev) => new Set(prev).add(adId));
  };

  const content = (
    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      {currentAd.imageUrl && (
        <div className="relative w-full aspect-[3/1] sm:aspect-[4/1]">
          <Image
            src={currentAd.imageUrl}
            alt={currentAd.title || 'Advertisement'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        </div>
      )}
      {(currentAd.title || currentAd.description) && !currentAd.imageUrl && (
        <div className="p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{currentAd.title}</p>
            {currentAd.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{currentAd.description}</p>
            )}
          </div>
          {currentAd.linkUrl && (
            <ExternalLink size={14} className="text-teal-600 shrink-0" />
          )}
        </div>
      )}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDismiss(currentAd.id); }}
        className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-white/80 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Dismiss advertisement"
      >
        <X size={14} />
      </button>
      {visibleAds.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {visibleAds.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex % visibleAds.length ? 'w-4 bg-teal-600' : 'w-1.5 bg-black/20'
              }`}
            />
          ))}
        </div>
      )}
      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/30 text-white/70 backdrop-blur-sm">
        Ad
      </span>
    </div>
  );

  return (
    <section className="px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {currentAd.linkUrl ? (
          <Link href={currentAd.linkUrl} target="_blank" rel="noopener noreferrer">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </section>
  );
}