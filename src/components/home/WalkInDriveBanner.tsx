'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, MapPin, Building2, Calendar, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { where, limit } from 'firebase/firestore';

export default function WalkInDriveBanner() {
  const { data: walkInJobs, loading } = useCollection<any>('jobs', [
    where('isWalkIn', '==', true),
    limit(3)
  ]);

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 23,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !walkInJobs || walkInJobs.length === 0) return null;

  const current = walkInJobs[0];

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white py-3 px-4 shadow-lg border-y border-red-500/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Urgent Pulsing Badge & Job Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2.5 py-0.5 rounded-full bg-white text-red-700 font-black text-[10px] tracking-wider uppercase shrink-0 flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            URGENT WALK-IN DRIVE
          </span>
          <p className="font-bold truncate text-white">
            <span className="underline decoration-white/60">{current.title}</span> at <span className="font-extrabold">{current.companyName}</span>
          </p>
          <span className="hidden sm:inline text-white/80">• {current.district || 'Theni'}</span>
        </div>

        {/* Center: Walk-in Details & Countdown */}
        <div className="flex items-center gap-4 shrink-0 font-medium">
          <div className="flex items-center gap-1 text-white/90">
            <Calendar size={13} className="text-amber-200" />
            <span>{current.walkInDate || 'Today / Tomorrow'}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg font-mono font-bold text-amber-200">
            <Clock size={12} />
            <span>
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>

          {/* Action Link */}
          <Link
            href={`/jobs/${current.id}`}
            className="px-3.5 py-1 rounded-xl bg-white text-red-700 font-bold hover:bg-white/90 transition-all flex items-center gap-1 shrink-0 shadow-xs"
          >
            <span>Venue Details</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
