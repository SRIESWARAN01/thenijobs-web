'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { useShopAuth } from '@/hooks/useShopAuth';

export default function ShopRegisterPage() {
  const router = useRouter();
  const { register } = useShopAuth();

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { fullName, phone, email, password, confirmPassword } = form;
    if (!fullName || !phone || !email || !password || !confirmPassword) {
      setError('All fields are required.'); return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError('Mobile number must be 10 digits.'); return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    setError('');
    setSubmitting(true);
    try {
      await register(fullName, email, phone, password);
      router.push('/shop');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a1a] flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-card rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4">
              <ShoppingBag size={28} className="text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white font-outfit gradient-text">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join THENIJOBS Store today</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Your full name"
                  className="search-input w-full pl-10 pr-4 py-3 min-h-12"
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Mobile Number</label>
              <div className="relative flex">
                <span className="flex items-center px-3 bg-white/[0.04] border border-white/[0.08] border-r-0 rounded-l-xl text-gray-500 text-sm font-medium min-h-12">
                  +91
                </span>
                <div className="relative flex-1">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit number"
                    className="search-input w-full pl-10 pr-4 py-3 rounded-l-none min-h-12"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email ID</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="search-input w-full pl-10 pr-4 py-3 min-h-12"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min 8 characters"
                  className="search-input w-full pl-10 pr-10 py-3 min-h-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-gray-500 hover:text-gray-300"
                  style={{ minHeight: '48px' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  className="search-input w-full pl-10 pr-4 py-3 min-h-12"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient w-full min-h-12 py-3 font-semibold text-sm mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href="/shop/login" className="text-violet-400 hover:text-violet-300 font-semibold py-1 inline-block">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
