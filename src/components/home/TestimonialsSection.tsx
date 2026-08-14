'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rajan K',
    role: 'Software Developer',
    location: 'Theni',
    rating: 5,
    text: 'Found my dream job within 2 weeks of signing up. The platform is incredibly easy to use and the employers are all verified. Highly recommend to anyone looking for IT jobs in Theni!',
    avatar: 'RK',
    color: '#EFF6FF',
    textColor: '#2563EB',
  },
  {
    name: 'Priya S',
    role: 'HR Manager, ABC Technologies',
    location: 'Madurai',
    rating: 5,
    text: 'As an employer, we\'ve hired 12 candidates through THENIJOBS in the last 6 months. The quality of applicants is excellent and the platform is very affordable compared to national portals.',
    avatar: 'PS',
    color: '#ECFDF5',
    textColor: '#059669',
  },
  {
    name: 'Murugan V',
    role: 'Field Sales Executive',
    location: 'Dindigul',
    rating: 5,
    text: 'The local focus makes all the difference. I could filter jobs specifically for Theni district and got shortlisted within 3 days. The WhatsApp integration is very convenient.',
    avatar: 'MV',
    color: '#FFFBEB',
    textColor: '#D97706',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-14" style={{ background: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-600 text-xs font-semibold mb-3">
            ⭐ Success Stories
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            What Our Users Say
          </h2>
          <p className="text-sm text-gray-500 mt-2">Thousands of successful placements across Tamil Nadu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              <Quote size={20} className="text-gray-200 mb-3" />

              <p className="text-sm text-gray-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: t.color, color: t.textColor }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '10K+', label: 'Job Seekers' },
            { value: '500+', label: 'Companies' },
            { value: '1,200+', label: 'Active Jobs' },
            { value: '98%', label: 'Satisfaction Rate' },
          ].map(item => (
            <div key={item.label} className="text-center py-6 px-4 rounded-2xl border border-gray-100 bg-gray-50">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {item.value}
              </p>
              <p className="text-sm text-gray-500 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
