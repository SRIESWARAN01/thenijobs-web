'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus, Briefcase, Building2, ArrowLeft, Copy, Download,
  Check, Loader2, Eye, EyeOff, RefreshCw, Mail, Phone, MapPin, Lock, User
} from 'lucide-react';
import { adminCreateUser, generatePassword } from '@/lib/firebase/adminUserService';
import { logActivity } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { TN_DISTRICTS } from '@/lib/types';
import type { UserRole } from '@/lib/types';

type CreateRole = 'job_seeker' | 'employer' | 'business_owner';

const ROLE_OPTIONS: { id: CreateRole; label: string; icon: typeof Briefcase; desc: string; color: string; bg: string }[] = [
  { id: 'job_seeker', label: 'Job Seeker', icon: Briefcase, desc: 'Create a job seeker account', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'employer', label: 'Employer / HR', icon: Building2, desc: 'Create an employer account', color: '#059669', bg: '#ECFDF5' },
  { id: 'business_owner', label: 'Business Owner', icon: Building2, desc: 'Create a business owner account', color: '#D97706', bg: '#FFFBEB' },
];

export default function AdminCreateUserPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState('');
  const [result, setResult] = useState<{
    success: boolean; uid?: string; email?: string; password?: string; role?: string; error?: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    district: 'Theni',
    role: 'job_seeker' as CreateRole,
    password: generatePassword(),
    companyName: '',
  });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const regeneratePassword = () => {
    update('password', generatePassword());
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (!form.email.trim()) return;
    if (!form.password.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await adminCreateUser({
        displayName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        district: form.district,
        role: form.role,
        companyName: form.companyName.trim() || undefined,
      });

      setResult(res);

      if (res.success && user) {
        await logActivity({
          userId: user.uid,
          userName: user.displayName || 'Admin',
          action: `Created ${form.role} account`,
          target: form.email,
          targetId: res.uid || '',
          details: `Name: ${form.name}, District: ${form.district}`,
        });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const copyAllCredentials = () => {
    if (!result) return;
    const text = `THENIJOBS Account Credentials\n\nName: ${form.name}\nEmail: ${result.email}\nPassword: ${result.password}\nRole: ${result.role}\nUser ID: ${result.uid}\n\nLogin: https://thenijobs.com/login`;
    navigator.clipboard.writeText(text);
    setCopied('all');
    setTimeout(() => setCopied(''), 2000);
  };

  const resetForm = () => {
    setResult(null);
    setForm({
      name: '', email: '', phone: '', district: 'Theni',
      role: 'job_seeker', password: generatePassword(), companyName: '',
    });
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all";
  const labelCls = "text-xs font-semibold text-gray-600 block mb-1.5";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Create User Account
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manually create a company or job seeker account</p>
        </div>
      </div>

      {/* Success Result */}
      {result?.success && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Account Created Successfully!</p>
              <p className="text-xs text-emerald-600">Share these credentials with the user</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-emerald-200 divide-y divide-emerald-100">
            {[
              { label: 'Name', value: form.name, key: 'name' },
              { label: 'Email', value: result.email || '', key: 'email' },
              { label: 'Password', value: result.password || '', key: 'password' },
              { label: 'Role', value: result.role || '', key: 'role' },
              { label: 'User ID', value: result.uid || '', key: 'uid' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 font-mono">{item.value}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(item.value, item.key)}
                  className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all"
                >
                  {copied === item.key ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyAllCredentials}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
            >
              {copied === 'all' ? <Check size={15} /> : <Copy size={15} />}
              {copied === 'all' ? 'Copied!' : 'Copy All Credentials'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
            >
              <UserPlus size={15} />
              Create Another
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {result && !result.success && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          <p className="font-semibold">❌ Failed to create account</p>
          <p className="mt-1 text-xs">{result.error}</p>
        </div>
      )}

      {/* Form */}
      {!result?.success && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Role Selection */}
          <div>
            <label className={labelCls}>Account Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ROLE_OPTIONS.map(r => {
                const Icon = r.icon;
                const sel = form.role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => update('role', r.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      sel ? 'shadow-md' : 'border-gray-100 hover:border-gray-200'
                    }`}
                    style={sel ? { borderColor: r.color, background: r.bg } : {}}
                  >
                    <Icon size={18} style={{ color: r.color }} />
                    <span className="text-sm font-semibold text-gray-900 mt-1.5">{r.label}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}><User size={12} className="inline mr-1" />Full Name *</label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="Enter full name" className={inputCls} />
          </div>

          {/* Company Name (for employer/business_owner) */}
          {(form.role === 'employer' || form.role === 'business_owner') && (
            <div>
              <label className={labelCls}><Building2 size={12} className="inline mr-1" />Company Name</label>
              <input type="text" value={form.companyName} onChange={e => update('companyName', e.target.value)}
                placeholder="Enter company/business name" className={inputCls} />
            </div>
          )}

          {/* Email */}
          <div>
            <label className={labelCls}><Mail size={12} className="inline mr-1" />Email Address *</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="user@example.com" className={inputCls} />
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}><Phone size={12} className="inline mr-1" />Phone Number</label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
              placeholder="+91 98765 43210" className={inputCls} />
          </div>

          {/* District */}
          <div>
            <label className={labelCls}><MapPin size={12} className="inline mr-1" />District</label>
            <select value={form.district} onChange={e => update('district', e.target.value)} className={inputCls}>
              {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className={labelCls}><Lock size={12} className="inline mr-1" />Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                className={inputCls + ' pr-20'}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all tap-target-auto">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={regeneratePassword}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all tap-target-auto"
                  title="Generate new password">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Auto-generated secure password. Click 🔄 to regenerate.</p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name.trim() || !form.email.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
            ) : (
              <><UserPlus size={16} /> Create Account</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
