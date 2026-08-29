/* Server component — no hooks, purely static content */

import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';

const locations = [
  { name: 'Theni', href: '/jobs-in-theni' },
  { name: 'Cumbum', href: '/jobs-in-cumbum' },
  { name: 'Periyakulam', href: '/jobs-in-periyakulam' },
  { name: 'Bodinayakanur', href: '/jobs-in-bodinayakanur' },
  { name: 'Chinnamanur', href: '/jobs-in-chinnamanur' },
  { name: 'Uthamapalayam', href: '/jobs-in-uthamapalayam' },
  { name: 'Andipatti', href: '/jobs-in-andipatti' },
  { name: 'Madurai', href: '/jobs-in-madurai' },
  { name: 'Dindigul', href: '/jobs-in-dindigul' },
];

export default function LocationsSection() {
  return (
    <section className="py-14" style={{ background: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 text-xs font-semibold mb-3">
            <MapPin size={12} /> Browse by Location
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Find Jobs Near You
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Explore opportunities across Theni district and surrounding areas
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {locations.map((loc) => (
            <Link key={loc.href} href={loc.href} className="group">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group-hover:-translate-y-0.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {loc.name}
                  </p>
                  <p className="text-xs text-gray-600">View jobs</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Job Locations <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
