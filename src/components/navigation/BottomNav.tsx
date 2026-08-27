'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Building2, Home, Store, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', tamil: 'முகப்பு', icon: Home },
  { href: '/jobs', label: 'Jobs', tamil: 'வேலை', icon: Briefcase },
  { href: '/businesses', label: 'Business', tamil: 'நிறுவனம்', icon: Building2 },
  { href: '/services', label: 'Services', tamil: 'சேவை', icon: Store },
  { href: '/profile', label: 'Profile', tamil: 'சுயவிவரம்', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around py-1.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-colors ${
                isActive ? 'text-[#2563eb]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                  isActive ? 'bg-blue-50' : 'bg-transparent'
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className="truncate max-w-[64px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
