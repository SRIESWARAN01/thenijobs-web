'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Store, User, Menu, X, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function ShopNavbar() {
  const { cartCount } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Store', href: '/shop' },
    { label: 'Products', href: '/shop/products' },
  ];

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-16">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/shop" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </span>
          <span className="font-outfit font-bold text-white hidden sm:block">
            THENIJOBS <span className="gradient-text">Store</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search link */}
          <Link
            href="/shop/products"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Search products"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Cart */}
          <Link
            href="/shop/cart"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label={`Cart (${cartCount} items)`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <Link
            href="/shop/login"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-t border-white/[0.06] px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'bg-purple-600/20 text-purple-300'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/shop/login"
            onClick={() => setMobileOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Account
          </Link>
        </div>
      )}
    </nav>
  );
}
