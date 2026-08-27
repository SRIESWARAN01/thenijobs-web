'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const categories = [
  { label: 'IT & Software', icon: '💻', color: '#EFF6FF', textColor: '#1E40AF', href: '/jobs?category=it' },
  { label: 'Healthcare', icon: '🏥', color: '#ECFDF5', textColor: '#065F46', href: '/jobs?category=healthcare' },
  { label: 'Agriculture', icon: '🌾', color: '#FFFBEB', textColor: '#78350F', href: '/jobs?category=agriculture' },
  { label: 'Education', icon: '📚', color: '#F5F3FF', textColor: '#5B21B6', href: '/jobs?category=education' },
  { label: 'Construction', icon: '🏗️', color: '#FFF1F2', textColor: '#9F1239', href: '/jobs?category=construction' },
  { label: 'Sales & Marketing', icon: '📈', color: '#F0F9FF', textColor: '#075985', href: '/jobs?category=sales' },
  { label: 'Manufacturing', icon: '🏭', color: '#FEF3C7', textColor: '#78350F', href: '/jobs?category=manufacturing' },
  { label: 'Transport', icon: '🚛', color: '#F0FDF4', textColor: '#166534', href: '/jobs?category=transport' },
];

export default function CategoriesSection() {
  return (
    <section className="py-14" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-800 text-xs font-semibold mb-3">
            🎯 Browse by Category
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Explore Jobs by Category
          </h2>
          <p className="text-sm text-gray-600 mt-2">Explore opportunities across every industry</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link key={cat.label} href={cat.href} className="group">
              <div
                className="rounded-2xl p-5 text-center border-2 border-transparent hover:shadow-md transition-all duration-200 cursor-pointer group-hover:-translate-y-1"
                style={{ background: cat.color }}
              >
                <div className="text-3xl mb-2" aria-hidden="true">{cat.icon}</div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{cat.label}</p>
                <p className="text-xs font-bold" style={{ color: cat.textColor }}>View jobs →</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Categories <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
