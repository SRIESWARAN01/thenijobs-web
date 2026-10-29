'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2, KeyRound, ShieldCheck, Mail, Phone, MapPin, Copy, Check,
  Search, RefreshCw, Loader2, MessageCircle, ExternalLink, AlertTriangle,
  Lock, CheckCircle2, Clock, Sparkles, AlertCircle, X, ShieldAlert,
  Calendar, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/contexts/ToastContext';
import { SITE_CONTACT } from '@/lib/constants';

interface CompanyAccount {
  companyId: string;
  companyName: string;
  slug: string;
  loginEmail: string;
  authUid: string;
  phone: string;
  taluk: string;
  address: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  verificationStatus: string;
  isVerified: boolean;
  canPostJobs: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialEndDate: string | null;
  lastPasswordResetAt: string | null;
  createdAt: string | null;
}

export default function AdminCompanyAccountsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'trial' | 'pending'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Password reset modal state
  const [selectedAccount, setSelectedAccount] = useState<CompanyAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchAccounts = async () => {
    try {
      setRefreshing(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/company-accounts', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch accounts');
      }
      setAccounts(data.accounts || []);
    } catch (err: any) {
      console.error('Fetch company accounts error:', err);
      toast.error(err.message || 'Error loading company accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const handleCopy = (text: string, fieldId: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => {
      setCopiedField(prev => (prev === fieldId ? null : prev));
    }, 2000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !selectedAccount.authUid) {
      toast.error('No valid Firebase Auth UID found for this account.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setResettingPassword(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/company-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          action: 'reset-password',
          companyId: selectedAccount.companyId,
          authUid: selectedAccount.authUid,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success(`Password for ${selectedAccount.companyName} updated successfully in Firebase Auth!`);
      setSelectedAccount(null);
      setNewPassword('');
      fetchAccounts();
    } catch (err: any) {
      console.error('Password reset error:', err);
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch =
        acc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.loginEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.taluk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.authUid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.companyId.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'verified') {
        return acc.verificationStatus === 'verified' || acc.isVerified;
      }
      if (statusFilter === 'trial') {
        return acc.isTrialActive || acc.subscriptionStatus === 'trial';
      }
      if (statusFilter === 'pending') {
        return acc.verificationStatus !== 'verified' && !acc.isVerified;
      }

      return true;
    });
  }, [accounts, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const verified = accounts.filter(a => a.verificationStatus === 'verified' || a.isVerified).length;
    const trial = accounts.filter(a => a.isTrialActive || a.subscriptionStatus === 'trial').length;
    const withAuth = accounts.filter(a => !!a.loginEmail && !!a.authUid).length;

    return { total, verified, trial, withAuth };
  }, [accounts]);

  return (
    <div className="space-y-6 font-outfit">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Firebase Company Accounts</h1>
              <p className="text-xs text-slate-500">
                Manage separate Firebase Authentication accounts, passwords, and 1:1 isolated data access for registered businesses.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAccounts}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Accounts'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Partner Companies</p>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-400 font-medium">All registered businesses</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs space-y-1 bg-emerald-50/20">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Verified Companies</p>
          <p className="text-2xl font-black text-emerald-700">{stats.verified}</p>
          <p className="text-[11px] text-emerald-600 font-medium">Job Posting Unlocked</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs space-y-1 bg-amber-50/20">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Active 15-Day Free Trials</p>
          <p className="text-2xl font-black text-amber-700">{stats.trial}</p>
          <p className="text-[11px] text-amber-600 font-medium">Auto-activated without admin gate</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-xs space-y-1 bg-indigo-50/20">
          <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Auth Accounts Ready</p>
          <p className="text-2xl font-black text-indigo-700">{stats.withAuth}</p>
          <p className="text-[11px] text-indigo-600 font-medium">1:1 Data Isolation Active</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, email, taluk, or Auth UID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'verified', label: 'Verified & Active' },
            { id: 'trial', label: '15-Day Trial' },
            { id: 'pending', label: 'Pending Review' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-xs">
          <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading company accounts from Firebase...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No company accounts match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching between Verified and Trial tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAccounts.map(account => {
            const hasAuth = !!account.loginEmail && !!account.authUid;
            const isVerified = account.verificationStatus === 'verified' || account.isVerified;

            // WhatsApp template link for admin to share credentials with the business owner
            const whatsappText = `Hi *${account.companyName}*,\n\nWelcome to THENIJOBS! Here are your Business Portal access details:\n🌐 Portal Login: https://thenijobs.com/login\n📧 Registered Email: ${account.loginEmail}\n\n${
              account.isTrialActive
                ? `🎁 *15-Day Free Trial is Active!* Access your dashboard and company website preview now.`
                : `⭐ Your business account is active on THENIJOBS.`
            }\n\nFor help or support, contact THENIJOBS Support on WhatsApp (+91 93605 19460).`;

            const whatsappUrl = `https://wa.me/${(account.phone || '').replace(/[^0-9]/g, '') || SITE_CONTACT.whatsapp}?text=${encodeURIComponent(whatsappText)}`;

            return (
              <div
                key={account.companyId}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all p-5 flex flex-col justify-between space-y-4"
              >
                {/* Header: Company Name & Taluk */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-black text-sm shrink-0">
                        {account.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 leading-tight line-clamp-1">
                          {account.companyName}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-slate-400" />
                          <span>{account.taluk || 'Theni District'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 shrink-0">
                        <Clock size={11} /> Review Pending
                      </span>
                    )}
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {account.isTrialActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold">
                        🎁 15-Day Trial ({account.trialDaysRemaining}d remaining)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80 text-[10px] font-bold uppercase">
                        ⭐ {account.subscriptionPlan} Plan
                      </span>
                    )}

                    {account.canPostJobs ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-bold">
                        💼 Job Posting Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                        🔒 Job Posting Locked
                      </span>
                    )}
                  </div>
                </div>

                {/* Details dossier */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                  {/* Login Email */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Firebase Login Email
                    </span>
                    <div className="flex items-center justify-between gap-1.5 mt-0.5">
                      <span className="font-semibold text-slate-800 truncate select-all">
                        {account.loginEmail || 'No email registered'}
                      </span>
                      {account.loginEmail && (
                        <button
                          type="button"
                          onClick={() => handleCopy(account.loginEmail, `email-${account.companyId}`, 'Email')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          title="Copy Email"
                        >
                          {copiedField === `email-${account.companyId}` ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Auth UID */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Firebase Auth UID (1:1 Isolation)
                    </span>
                    <div className="flex items-center justify-between gap-1.5 mt-0.5">
                      <span className="font-mono text-[11px] text-slate-600 truncate select-all">
                        {account.authUid || 'No Auth UID'}
                      </span>
                      {account.authUid && (
                        <button
                          type="button"
                          onClick={() => handleCopy(account.authUid, `uid-${account.companyId}`, 'Auth UID')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          title="Copy UID"
                        >
                          {copiedField === `uid-${account.companyId}` ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Phone */}
                  {account.phone && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-600">
                      <span className="text-slate-400">Contact Phone</span>
                      <span className="font-bold text-slate-800">{account.phone}</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Share on WhatsApp */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Share portal login credentials with business owner"
                    >
                      <MessageCircle size={14} className="text-emerald-600" />
                      <span>Send WhatsApp</span>
                    </a>

                    {/* Reset Password Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccount(account);
                        setNewPassword('');
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <KeyRound size={13} />
                      <span>Set Password</span>
                    </button>
                  </div>

                  {/* View Details Link */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <Link
                      href={`/admin/businesses`}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <span>Manage Business</span>
                      <ExternalLink size={11} />
                    </Link>
                    {account.slug && (
                      <Link
                        href={`/company/${account.slug}`}
                        target="_blank"
                        className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                      >
                        <span>Preview Website</span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Password Reset Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Set Account Password</h3>
                  <p className="text-xs text-slate-500">Firebase Authentication</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="font-bold text-slate-900">{selectedAccount.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Login Email:</span>
                <span className="font-semibold text-slate-900">{selectedAccount.loginEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auth UID:</span>
                <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]">{selectedAccount.authUid}</span>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter secure password..."
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  disabled={resettingPassword}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {resettingPassword ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
