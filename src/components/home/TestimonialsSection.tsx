'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { limit, orderBy, where } from 'firebase/firestore';
import { useCollection } from '@/hooks/useFirestore';

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const { data: reviews, loading } = useCollection<any>('reviews', [
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(8),
  ]);

  const testimonials = useMemo(() => reviews.map((review) => ({
    id: review.id,
    name: review.userName || review.name || 'Verified user',
    role: review.userRole || review.type || 'THENIJOBS member',
    company: review.companyName || '',
    location: review.district || review.location || '',
    text: review.comment || review.content || review.title || '',
    rating: Math.max(1, Math.min(5, Number(review.rating || 5))),
    avatar: String(review.userName || review.name || 'U').slice(0, 1).toUpperCase(),
  })).filter((review) => review.text), [reviews]);

  if (loading || testimonials.length === 0) {
    return null;
  }

  const prev = () => setCurrent((value) => (value - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((value) => (value + 1) % testimonials.length);
  const active = testimonials[current % testimonials.length];

  return (
    <section className="px-4 py-12 sm:px-6 bg-[#0a0a1a]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Community</p>
          <h2 className="mt-1 font-outfit text-2xl font-black text-white sm:text-3xl tracking-tight">
            Verified Member Reviews
          </h2>
          <p className="mt-1 text-sm text-slate-400">Approved reviews from real THENIJOBS users.</p>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 text-center shadow-2xl backdrop-blur-md sm:p-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
            <Quote size={20} />
          </div>
          <div className="mb-4 flex justify-center">
            {Array.from({ length: active.rating }).map((_, index) => (
              <Star key={index} size={18} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="mx-auto mb-6 max-w-2xl text-base font-semibold leading-8 text-slate-300 sm:text-lg italic">
            &quot;{active.text}&quot;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-lg font-black text-white shadow-md">
              {active.avatar}
            </div>
            <div className="text-left">
              <div className="font-bold text-white">{active.name}</div>
              <div className="text-xs text-slate-400">
                {[active.role, active.company, active.location].filter(Boolean).join(' - ')}
              </div>
            </div>
          </div>
        </div>

        {testimonials.length > 1 && (
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 shadow-md hover:bg-white/10 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`h-2 rounded-full transition-all ${index === current ? 'w-8 bg-violet-500' : 'w-2 bg-white/10'}`}
                  aria-label={`Show testimonial ${index + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 shadow-md hover:bg-white/10 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
