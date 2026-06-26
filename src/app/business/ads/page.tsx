'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import {
  Megaphone, TrendingUp, BarChart3, Plus, Calendar, Clock,
  ArrowRight, ShieldCheck, CreditCard, Sparkles, AlertCircle, Loader2, Play, Pause, ExternalLink
} from 'lucide-react';
import { getCompanyActivePlan } from '@/lib/subscriptions';

interface Campaign {
  id: string;
  title: string;
  type: string;
  placement: 'job' | 'product' | 'service';
  targetId: string;
  status: 'active' | 'paused' | 'ended';
  startDate: any;
  endDate: any;
  impressions: number;
  clicks: number;
  contactClicks?: number;
  applicationsGenerated?: number;
  amount: number;
}

export default function BusinessAdsPage() {
  const { user } = useAuth();
  
  // 1. Fetch company details
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch business's ad campaigns
  const { data: campaigns, loading: campaignsLoading } = useCollection<Campaign>('advertisements', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  // 3. Fetch promote-able jobs, products, and services
  const { data: jobs } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('status', '==', 'active')
  ], { skip: !companyId });

  const { data: products } = useCollection<any>('products', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true)
  ], { skip: !companyId });

  const { data: services } = useCollection<any>('services', [
    where('providerId', '==', user?.uid || ''),
    where('status', '==', 'active')
  ], { skip: !user?.uid });

  // Modal & Purchase State
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteType, setPromoteType] = useState<'job' | 'product' | 'service'>('job');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<{ days: number; price: number }>({ days: 7, price: 100 });
  
  // Sim checkout state
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Local actions loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Overall Statistics
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalApplications = campaigns.reduce((sum, c) => sum + (c.applicationsGenerated || 0), 0);
  const totalContacts = campaigns.reduce((sum, c) => sum + (c.contactClicks || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.amount || 0), 0);

  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0.00%';

  const handleOpenPromote = () => {
    setIsPromoteModalOpen(true);
    setCheckoutStep('details');
    setSelectedItemId('');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setPaymentError('');
  };

  const handlePauseCampaign = async (campaignId: string, itemType: string, targetId: string) => {
    setActionLoadingId(campaignId);
    try {
      // Pause in advertisements collection
      const adRef = doc(db, 'advertisements', campaignId);
      await updateDoc(adRef, { status: 'paused' });

      // Pause promotion on actual item
      const collectionName = itemType === 'job' ? 'jobs' : itemType === 'product' ? 'products' : 'services';
      const itemRef = doc(db, collectionName, targetId);
      await updateDoc(itemRef, { isPromoted: false });

      alert('Ad campaign paused.');
    } catch (err) {
      console.error(err);
      alert('Failed to pause campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResumeCampaign = async (campaignId: string, itemType: string, targetId: string, endDate: any) => {
    // Check if campaign already ended
    const end = endDate?.toDate ? endDate.toDate() : new Date(endDate);
    if (end.getTime() < Date.now()) {
      alert('This campaign has expired. Please create a new promotion.');
      return;
    }

    setActionLoadingId(campaignId);
    try {
      // Resume in advertisements collection
      const adRef = doc(db, 'advertisements', campaignId);
      await updateDoc(adRef, { status: 'active' });

      // Resume promotion on actual item
      const collectionName = itemType === 'job' ? 'jobs' : itemType === 'product' ? 'products' : 'services';
      const itemRef = doc(db, collectionName, targetId);
      await updateDoc(itemRef, { isPromoted: true });

      alert('Ad campaign resumed.');
    } catch (err) {
      console.error(err);
      alert('Failed to resume campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('Please select an item to promote.');
      return;
    }

    if (checkoutStep === 'details') {
      setCheckoutStep('payment');
      return;
    }

    // Card Details Validation simulation
    if (!cardName || cardNumber.length < 15 || !cardExpiry || cardCvv.length < 3) {
      setPaymentError('Please enter valid credit card details.');
      return;
    }

    setPaymentError('');
    setCheckoutStep('processing');

    setTimeout(async () => {
      try {
        const promoDays = selectedPlan.days;
        const promotedUntil = new Date(Date.now() + promoDays * 24 * 60 * 60 * 1000);

        let targetTitle = '';
        let targetDocName = '';
        if (promoteType === 'job') {
          const item = jobs.find(j => j.id === selectedItemId);
          targetTitle = item?.title || 'Job Posting';
          targetDocName = 'jobs';
        } else if (promoteType === 'product') {
          const item = products.find(p => p.id === selectedItemId);
          targetTitle = item?.name || 'Product';
          targetDocName = 'products';
        } else {
          const item = services.find(s => s.id === selectedItemId);
          targetTitle = item?.title || 'Service';
          targetDocName = 'services';
        }

        // 1. Update target document in Firestore to enable promotion
        const itemRef = doc(db, targetDocName, selectedItemId);
        await updateDoc(itemRef, {
          isPromoted: true,
          promotedUntil: Timestamp.fromDate(promotedUntil),
          promotedAt: serverTimestamp(),
          // Boost prioritization score
          promotionScore: 100
        });

        // 2. Add ad document to `advertisements` collection for admin dashboard and business logs
        const adData = {
          companyId,
          companyName: company?.name || 'My Company',
          title: targetTitle,
          targetId: selectedItemId,
          type: 'Sponsored',
          placement: promoteType,
          status: 'active',
          startDate: serverTimestamp(),
          endDate: Timestamp.fromDate(promotedUntil),
          impressions: 0,
          clicks: 0,
          contactClicks: 0,
          applicationsGenerated: 0,
          amount: selectedPlan.price,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'advertisements'), adData);

        setCheckoutStep('success');
      } catch (err) {
        console.error('Error promoting listing:', err);
        setPaymentError('Database transaction failed. Please try again.');
        setCheckoutStep('payment');
      }
    }, 1800);
  };

  const getRemainingDays = (endDate: any) => {
    if (!endDate) return 0;
    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
    const diff = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const currentListingsToSelect = promoteType === 'job' ? jobs : promoteType === 'product' ? products : services;

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="text-cyan-400 w-7 h-7" />
            Advertisement Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">Boost job posts, product catalog, and services for maximum visibility</p>
        </div>
        <button
          onClick={handleOpenPromote}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Impressions', value: totalImpressions.toLocaleString(), desc: 'Views on main screens', color: 'text-cyan-400 bg-cyan-500/5' },
          { label: 'Clicks', value: totalClicks.toLocaleString(), desc: 'Page details clicks', color: 'text-blue-400 bg-blue-500/5' },
          { label: 'Avg. CTR', value: ctr, desc: 'Click-through rate', color: 'text-emerald-400 bg-emerald-500/5' },
          { label: 'Conversions', value: (totalApplications + totalContacts).toLocaleString(), desc: 'Applies & contact calls', color: 'text-violet-400 bg-violet-500/5' },
          { label: 'Total Invested', value: `₹${totalSpent.toLocaleString()}`, desc: 'Promotions cost', color: 'text-amber-400 bg-amber-500/5' }
        ].map(stat => (
          <div key={stat.label} className={`glass-card rounded-2xl p-5 border border-white/[0.05] ${stat.color.split(' ')[1]}`}>
            <p className={`text-2xl font-black ${stat.color.split(' ')[0]}`}>{stat.value}</p>
            <p className="text-xs text-white font-medium mt-1.5">{stat.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* active campaigns list */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/[0.06]">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" />
            Active Campaigns & Analytics
          </h2>
          <span className="text-xs text-gray-500">{campaigns.length} campaigns listed</span>
        </div>
        <div className="overflow-x-auto">
          {campaignsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <p className="text-xs text-gray-400">Loading campaign statistics...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
              No active promotions. Promote a job or product to get started!
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500">Promoted Listing</th>
                  <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center">Type</th>
                  <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center">Impressions</th>
                  <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center">Clicks</th>
                  <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center">CTR</th>
                  <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center">Remaining</th>
                  <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center">Status</th>
                  <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {campaigns.map(c => {
                  const remDays = getRemainingDays(c.endDate);
                  const isExpired = remDays === 0;
                  const itemStatus = isExpired ? 'ended' : c.status;

                  const campaignCtr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) + '%' : '0.0%';

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white truncate max-w-xs">{c.title}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5">Budget: ₹{c.amount}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] text-gray-400 capitalize">
                          {c.placement}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center text-sm font-semibold text-gray-300">
                        {c.impressions?.toLocaleString() || '0'}
                      </td>
                      <td className="px-3 py-4 text-center text-sm font-semibold text-cyan-400">
                        {c.clicks?.toLocaleString() || '0'}
                      </td>
                      <td className="px-3 py-4 text-center text-sm font-semibold text-emerald-400">
                        {campaignCtr}
                      </td>
                      <td className="px-3 py-4 text-center text-xs text-gray-400 font-medium">
                        {isExpired ? (
                          <span className="text-rose-500 font-semibold flex items-center justify-center gap-1">
                            <Clock size={12} /> Expired
                          </span>
                        ) : (
                          `${remDays} Days`
                        )}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          itemStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                          itemStatus === 'paused' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {itemStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {actionLoadingId === c.id ? (
                            <Loader2 size={14} className="text-cyan-400 animate-spin" />
                          ) : (
                            <>
                              {!isExpired && (
                                c.status === 'active' ? (
                                  <button
                                    onClick={() => handlePauseCampaign(c.id, c.placement, c.targetId)}
                                    className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                    title="Pause Promotion"
                                  >
                                    <Pause size={13} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleResumeCampaign(c.id, c.placement, c.targetId, c.endDate)}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                    title="Resume Promotion"
                                  >
                                    <Play size={13} />
                                  </button>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Promotion purchase Modal */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c0c20] border border-white/[0.08] rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.05] flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" />
                {checkoutStep === 'success' ? 'Promotion Created!' : 'Promote Your Listing'}
              </h3>
              {checkoutStep !== 'processing' && (
                <button
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  Close
                </button>
              )}
            </div>

            {/* Modal Body */}
            {checkoutStep === 'details' && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Promotion Target Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'job', label: 'Job Post' },
                      { type: 'product', label: 'Product' },
                      { type: 'service', label: 'Service' }
                    ].map(btn => (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => {
                          setPromoteType(btn.type as any);
                          setSelectedItemId('');
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          promoteType === btn.type
                            ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400'
                            : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Select Listing to Boost *</label>
                  {currentListingsToSelect.length === 0 ? (
                    <div className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                      No active {promoteType}s found. Please create one before promoting.
                    </div>
                  ) : (
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all cursor-pointer bg-[#0c0c20]"
                    >
                      <option value="">-- Choose item --</option>
                      {currentListingsToSelect.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title || item.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Select Promotion Budget Plan</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { days: 7, price: 100, label: '7 Days Boost', desc: 'Perfect for quick hiring / sales' },
                      { days: 30, price: 250, label: '30 Days Boost', desc: 'Extended maximum local visibility' }
                    ].map(plan => (
                      <button
                        key={plan.days}
                        type="button"
                        onClick={() => setSelectedPlan({ days: plan.days, price: plan.price })}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          selectedPlan.days === plan.days
                            ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400'
                            : 'bg-white/[0.01] border-white/[0.06] text-gray-400 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className="text-xs font-black text-white">{plan.label}</span>
                        <span className="text-xs text-gray-500 mt-1">{plan.desc}</span>
                        <span className="text-sm font-black mt-3 text-cyan-400">₹{plan.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.05] flex justify-end">
                  <button
                    onClick={() => {
                      if (!selectedItemId) {
                        alert('Please select a listing to promote');
                        return;
                      }
                      setCheckoutStep('payment');
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-semibold text-white hover:opacity-90 flex items-center justify-center gap-1"
                  >
                    Proceed to Payment <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 'payment' && (
              <form onSubmit={handleProcessPayment} className="p-5 space-y-4">
                <div className="flex justify-between items-center bg-cyan-500/5 border border-cyan-500/10 p-3.5 rounded-2xl text-xs">
                  <div>
                    <span className="text-gray-400">Campaign Duration</span>
                    <span className="block font-bold text-white text-sm mt-0.5">{selectedPlan.days} Days Boost</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400">Total Price</span>
                    <span className="block font-black text-cyan-400 text-base mt-0.5">₹{selectedPlan.price}</span>
                  </div>
                </div>

                {paymentError && (
                  <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider font-bold">Name on Card</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none"
                      placeholder="CARD HOLDER NAME"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider font-bold">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none font-mono"
                      placeholder="4111 2222 3333 4444"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider font-bold">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider font-bold">CVV Code</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none font-mono"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.05] flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('details')}
                    className="flex-1 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs text-gray-400 hover:text-white font-medium"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-semibold text-white hover:opacity-90 flex items-center justify-center gap-1.5"
                  >
                    <CreditCard size={14} /> Pay ₹{selectedPlan.price}
                  </button>
                </div>
              </form>
            )}

            {checkoutStep === 'processing' && (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                <h4 className="font-bold text-sm text-white">Authorizing Secure Transaction...</h4>
                <p className="text-xs text-gray-500 max-w-xs">Simulating payment gateway validation. Do not close or refresh this window.</p>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  <ShieldCheck size={28} />
                </div>
                <h4 className="font-black text-white text-base">Payment Authorized Successfully!</h4>
                <p className="text-xs text-gray-400 max-w-xs">Your listing has been boosted. It will now rank at the top of search listings and user recommendation feeds.</p>
                <button
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="w-full mt-4 py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
