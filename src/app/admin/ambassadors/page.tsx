'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award, Users, Wallet, TrendingUp, Search, CheckCircle2,
  XCircle, Clock, ExternalLink, ArrowUpRight, Copy, Check,
  Loader2, Filter, Building2, Phone, AlertCircle
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import {
  collection, getDocs, doc, updateDoc,
  query, orderBy, serverTimestamp, increment
} from 'firebase/firestore';
import type { Ambassador, PayoutRequest, Referral } from '@/lib/types/ambassador';
import { Building, Smartphone, Zap, CheckCircle, ShieldCheck } from 'lucide-react';

export default function AdminAmbassadorsPage() {
  const [loading, setLoading] = useState(true);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [activeTab, setActiveTab] = useState<'payouts' | 'referrals' | 'directory'>('payouts');

  const [searchTerm, setSearchTerm] = useState('');
  const [talukFilter, setTalukFilter] = useState('All');

  // Payout Completion Modal
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [completingPayout, setCompletingPayout] = useState(false);
  const [approvingRefId, setApprovingRefId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Ambassadors
      const ambSnap = await getDocs(collection(db, 'ambassadors'));
      const ambList: Ambassador[] = [];
      ambSnap.forEach((d) => ambList.push({ uid: d.id, ...d.data() } as Ambassador));
      setAmbassadors(ambList);

      // Fetch Payout Requests
      const paySnap = await getDocs(collection(db, 'payoutRequests'));
      const payList: PayoutRequest[] = [];
      paySnap.forEach((d) => payList.push({ id: d.id, ...d.data() } as PayoutRequest));
      // Sort pending first, then by date desc
      payList.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
      setPayouts(payList);

      // Fetch Referrals for Admin Verification & Approval
      const refSnap = await getDocs(collection(db, 'referrals'));
      const refList: Referral[] = [];
      refSnap.forEach((d) => refList.push({ id: d.id, ...d.data() } as Referral));
      setReferrals(refList);
    } catch (err) {
      console.error('Error fetching admin ambassador data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(id);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  const handleCompletePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    try {
      setCompletingPayout(true);
      const payRef = doc(db, 'payoutRequests', selectedPayout.id);
      await updateDoc(payRef, {
        status: 'completed',
        utrNumber: utrNumber.trim() || 'UPI-TRANSFERRED',
        processedAt: serverTimestamp(),
      });

      // Update Ambassador Record: increment paidPayoutINR
      if (selectedPayout.ambassadorUid) {
        const ambRef = doc(db, 'ambassadors', selectedPayout.ambassadorUid);
        await updateDoc(ambRef, {
          paidPayoutINR: increment(selectedPayout.requestedAmountINR),
          updatedAt: serverTimestamp(),
        });
      }

      setActionMessage(`Payout of ₹${selectedPayout.requestedAmountINR} marked as completed.`);
      setTimeout(() => setActionMessage(''), 4000);
      setSelectedPayout(null);
      setUtrNumber('');
      fetchData();
    } catch (err: any) {
      console.error('Failed to complete payout:', err);
      alert('Error updating payout: ' + err.message);
    } finally {
      setCompletingPayout(false);
    }
  };

  const handleApproveReferral = async (refItem: Referral) => {
    try {
      setApprovingRefId(refItem.id);
      const refDoc = doc(db, 'referrals', refItem.id);
      await updateDoc(refDoc, {
        status: 'credited',
        adminVerifiedAt: serverTimestamp(),
      });

      // Update Ambassador wallet balance
      if (refItem.ambassadorUid) {
        const ambRef = doc(db, 'ambassadors', refItem.ambassadorUid);
        await updateDoc(ambRef, {
          pendingPayoutINR: increment(refItem.commissionAmountINR),
          totalEarningsINR: increment(refItem.commissionAmountINR),
          referredShopsCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }

      setActionMessage(`Referral for "${refItem.companyName}" verified & approved! ₹${refItem.commissionAmountINR} added to Ambassador's Withdrawable Wallet.`);
      setTimeout(() => setActionMessage(''), 5000);
      fetchData();
    } catch (err: any) {
      console.error('Failed to approve referral:', err);
      alert('Error approving referral: ' + err.message);
    } finally {
      setApprovingRefId(null);
    }
  };

  const handleRejectReferral = async (refId: string) => {
    if (!confirm('Are you sure you want to reject this referral?')) return;
    try {
      await updateDoc(doc(db, 'referrals', refId), {
        status: 'rejected',
        adminVerifiedAt: serverTimestamp(),
      });
      setActionMessage('Referral marked as rejected.');
      setTimeout(() => setActionMessage(''), 4000);
      fetchData();
    } catch (err: any) {
      alert('Error rejecting referral: ' + err.message);
    }
  };

  // Metrics
  const totalAmbassadors = ambassadors.length;
  const totalShops = ambassadors.reduce((acc, a) => acc + (a.referredShopsCount || 0), 0);
  const totalCommissionsEarned = ambassadors.reduce((acc, a) => acc + (a.totalEarningsINR || 0), 0);
  const pendingPayoutsTotal = payouts
    .filter((p) => p.status === 'pending')
    .reduce((acc, p) => acc + (p.requestedAmountINR || 0), 0);

  const pendingPayoutsList = payouts.filter((p) => p.status === 'pending');

  const filteredAmbassadors = ambassadors.filter((a) => {
    const matchesSearch =
      (a.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.referralCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.phone || '').includes(searchTerm);
    const matchesTaluk = talukFilter === 'All' || a.taluk === talukFilter;
    return matchesSearch && matchesTaluk;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Village Ambassador & Referral Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Ambassador & Referral Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitor ground-level sales partners, referral codes, and process UPI commission payouts.
          </p>
        </div>

        <Link
          href="/ambassador"
          target="_blank"
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow transition-all self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Public Page
        </Link>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {actionMessage}
        </div>
      )}

      {/* METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Ambassadors
          </span>
          <div className="text-3xl font-black text-slate-900">{totalAmbassadors}</div>
          <p className="text-xs text-slate-500 mt-1">Registered agents across Theni</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Referred Shops
          </span>
          <div className="text-3xl font-black text-slate-900">{totalShops}</div>
          <p className="text-xs text-slate-500 mt-1">Subscribed companies</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Commission Earned
          </span>
          <div className="text-3xl font-black text-slate-900">
            ₹{totalCommissionsEarned.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Generated by ambassadors</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/40 shadow-sm">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
            Pending Payouts
          </span>
          <div className="text-3xl font-black text-amber-900">
            ₹{pendingPayoutsTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-amber-700 mt-1">
            {pendingPayoutsList.length} withdrawal requests awaiting transfer
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payouts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Withdrawal Requests ({pendingPayoutsList.length})
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'referrals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Referral Approvals ({referrals.filter(r => r.status === 'pending_verification' || r.status === 'approved').length})
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'directory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Ambassadors Directory ({ambassadors.length})
        </button>
      </div>

      {/* TAB 1: PENDING PAYOUTS */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Withdrawal Requests Queue
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  ⚡ 8-Hour SLA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Process via IMPS / NEFT Bank Transfer or UPI (GPay/PhonePe). Enter UTR to mark paid.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {pendingPayoutsList.length} awaiting transfer
            </span>
          </div>

          {payouts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No payout requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">Ambassador</th>
                    <th className="py-3 px-4 font-bold">Method</th>
                    <th className="py-3 px-4 font-bold">Transfer Details</th>
                    <th className="py-3 px-4 font-bold">Amount</th>
                    <th className="py-3 px-4 font-bold">SLA & Status</th>
                    <th className="py-3 px-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{pay.ambassadorName}</div>
                        <div className="text-xs text-slate-500 font-mono">{pay.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {pay.payoutMethod === 'bank_transfer' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Building size={12} />
                            Bank
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            <Smartphone size={12} />
                            UPI
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {pay.payoutMethod === 'bank_transfer' ? (
                          <div className="space-y-1 text-xs">
                            <div className="font-bold text-slate-900">{pay.bankAccountName || 'Account Holder'}</div>
                            <div className="flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                              <span>A/C: {pay.bankAccountNumber}</span>
                              <button
                                onClick={() => {
                                  if (pay.bankAccountNumber) {
                                    navigator.clipboard.writeText(pay.bankAccountNumber);
                                    setCopiedAccount(pay.id);
                                    setTimeout(() => setCopiedAccount(null), 2000);
                                  }
                                }}
                                className="text-slate-400 hover:text-blue-600"
                                title="Copy Account No"
                              >
                                {copiedAccount === pay.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              IFSC: {pay.bankIfscCode} {pay.bankName ? `• ${pay.bankName}` : ''}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                            <span>{pay.upiId}</span>
                            <button
                              onClick={() => pay.upiId && copyToClipboard(pay.upiId, pay.id)}
                              className="text-slate-500 hover:text-blue-600"
                              title="Copy UPI ID"
                            >
                              {copiedUpi === pay.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 font-mono text-base">
                        ₹{pay.requestedAmountINR.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            pay.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pay.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {pay.status === 'completed' ? 'Paid' : pay.status === 'pending' ? 'Pending Action' : 'Rejected'}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                          <Zap size={11} className="text-amber-600" />
                          <span>8-Hour Express SLA</span>
                        </div>
                        {pay.utrNumber && (
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            UTR: {pay.utrNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {pay.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedPayout(pay);
                              setUtrNumber('');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REFERRAL APPROVALS */}
      {activeTab === 'referrals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Referral Verification & Wallet Credit Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify newly subscribed shops onboarded via ambassador referral codes. Approving credits the commission to the ambassador's withdrawable wallet.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {referrals.filter(r => r.status === 'pending_verification' || r.status === 'approved').length} Pending Approval
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No referrals recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">Referred Company</th>
                    <th className="py-3 px-4 font-bold">Plan & Amount</th>
                    <th className="py-3 px-4 font-bold">Ambassador Code</th>
                    <th className="py-3 px-4 font-bold">Commission</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((refItem) => {
                    const isPending = refItem.status === 'pending_verification' || refItem.status === 'approved';
                    return (
                      <tr key={refItem.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{refItem.companyName}</div>
                          <div className="text-xs text-slate-500 font-mono">ID: {refItem.companyId}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          <div className="capitalize font-semibold text-slate-900">{refItem.subscribedPlan || refItem.planSlug}</div>
                          <div className="text-xs text-slate-500">₹{(refItem.amountPaidINR || refItem.subscriptionAmountINR || 0).toLocaleString('en-IN')}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                            {refItem.ambassadorCode || refItem.referralCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-700 font-mono text-base">
                          +₹{refItem.commissionAmountINR.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            refItem.status === 'credited'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {refItem.status === 'credited' ? 'Credited to Wallet' : isPending ? 'Pending Admin Verify' : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveReferral(refItem)}
                                disabled={approvingRefId === refItem.id}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {approvingRefId === refItem.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={13} />
                                )}
                                <span>Verify & Approve (Credit)</span>
                              </button>
                              <button
                                onClick={() => handleRejectReferral(refItem.id)}
                                className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Verified & Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AMBASSADOR DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* SEARCH & FILTERS */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, code, phone..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Taluk:</span>
              <select
                value={talukFilter}
                onChange={(e) => setTalukFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Taluks</option>
                <option value="Theni">Theni</option>
                <option value="Periyakulam">Periyakulam</option>
                <option value="Bodinayakanur">Bodinayakanur</option>
                <option value="Cumbum">Cumbum</option>
                <option value="Uthamapalayam">Uthamapalayam</option>
                <option value="Chinnamanur">Chinnamanur</option>
                <option value="Andipatti">Andipatti</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Ambassador</th>
                  <th className="py-3 px-4 font-bold">Taluk</th>
                  <th className="py-3 px-4 font-bold">Referral Code</th>
                  <th className="py-3 px-4 font-bold">UPI ID</th>
                  <th className="py-3 px-4 font-bold">Shops Onboarded</th>
                  <th className="py-3 px-4 font-bold">Lifetime Earned</th>
                  <th className="py-3 px-4 font-bold">Available Balance</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAmbassadors.map((amb) => (
                  <tr key={amb.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{amb.fullName}</div>
                      <div className="text-xs text-slate-500">{amb.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {amb.taluk || 'Theni'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {amb.referralCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {amb.upiId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-center sm:text-left">
                      {amb.referredShopsCount || 0}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                      ₹{(amb.totalEarningsINR || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      ₹{(amb.pendingPayoutINR || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {amb.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MARK AS PAID MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Confirm Bank Transfer
            </h3>
            <p className="text-slate-600 text-xs mb-4">
              Enter the bank transaction or UPI UTR reference number to mark this payout as completed.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Ambassador:</span>
                <span className="font-bold text-slate-900">{selectedPayout.ambassadorName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payout Method:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedPayout.payoutMethod === 'bank_transfer' ? 'Bank Transfer (IMPS/NEFT)' : 'UPI Transfer'}</span>
              </div>
              {selectedPayout.payoutMethod === 'bank_transfer' ? (
                <>
                  <div className="flex justify-between">
                    <span>Account Holder:</span>
                    <span className="font-bold text-slate-900">{selectedPayout.bankAccountName || selectedPayout.ambassadorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>A/C Number:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedPayout.bankAccountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IFSC Code:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedPayout.bankIfscCode}</span>
                  </div>
                  {selectedPayout.bankName && (
                    <div className="flex justify-between">
                      <span>Bank Name:</span>
                      <span className="font-semibold text-slate-700">{selectedPayout.bankName}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between">
                  <span>UPI ID:</span>
                  <span className="font-mono font-bold text-blue-700">{selectedPayout.upiId}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span>Amount to Transfer:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  ₹{selectedPayout.requestedAmountINR.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handleCompletePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bank / UPI Transaction Reference (UTR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 423987123901 or UPI-REC-01"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingPayout}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {completingPayout ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirm & Mark Paid'
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
