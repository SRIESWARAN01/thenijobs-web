'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import {
  Megaphone, TrendingUp, BarChart3, Plus, Calendar, Clock,
  ArrowRight, ShieldCheck, CreditCard, Sparkles, AlertCircle, Loader2, Play, Pause, ExternalLink, Receipt
} from 'lucide-react';
import { getCompanyActivePlan } from '@/lib/subscriptions';
import { useToast } from '@/hooks/useToast';

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

interface AdPlan {
  id: string;
  name: string;
  price: number;
  days: number;
  description: string;
}

const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BusinessAdsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
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

  // 4. Fetch Ad Plans from Firestore
  const { data: dbAdPlans, loading: adPlansLoading } = useCollection<AdPlan>('adPlans');

  // Seed default plans if collection is empty
  useEffect(() => {
    if (!adPlansLoading && dbAdPlans.length === 0) {
      const seedPlans = async () => {
        try {
          const { setDoc, doc } = await import('firebase/firestore');
          const defaultPlans = [
            { id: 'ad_basic', name: 'Ad Basic Boost', price: 100, days: 7, description: 'Perfect for quick hiring & local visibility' },
            { id: 'ad_premium', name: 'Ad Premium Boost', price: 250, days: 30, description: 'Extended maximum target audience reach' },
            { id: 'ad_featured', name: 'Ad Featured Boost', price: 500, days: 90, description: 'Highest placement on trending and homepage lists' }
          ];
          for (const plan of defaultPlans) {
            await setDoc(doc(db, 'adPlans', plan.id), plan);
          }
        } catch (err) {
          console.error('Error seeding ad plans:', err);
        }
      };
      seedPlans();
    }
  }, [dbAdPlans, adPlansLoading]);

  const adPlans = dbAdPlans.length > 0 ? dbAdPlans : [
    { id: 'ad_basic', name: 'Ad Basic Boost', price: 100, days: 7, description: 'Perfect for quick hiring & local visibility' },
    { id: 'ad_premium', name: 'Ad Premium Boost', price: 250, days: 30, description: 'Extended maximum target audience reach' },
    { id: 'ad_featured', name: 'Ad Featured Boost', price: 500, days: 90, description: 'Highest placement on trending and homepage lists' }
  ];

  // 5. Fetch Ad Payment Transactions
  const { data: transactions, loading: transactionsLoading } = useCollection<any>('adTransactions', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'campaigns' | 'transactions'>('campaigns');

  // Modal & Purchase State
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteType, setPromoteType] = useState<'job' | 'product' | 'service'>('job');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('ad_basic');
  
  // Checkout & Payment progress
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Local actions loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Overall Statistics
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.amount || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0.00%';

  const handleOpenPromote = () => {
    setIsPromoteModalOpen(true);
    setCheckoutStep('details');
    setSelectedItemId('');
    setSelectedPlanId(adPlans[0]?.id || 'ad_basic');
    setPaymentMessage('');
    setIsProcessing(false);
  };

  const handlePauseCampaign = async (campaignId: string, itemType: string, targetId: string) => {
    setActionLoadingId(campaignId);
    try {
      const adRef = doc(db, 'advertisements', campaignId);
      await updateDoc(adRef, { status: 'paused' });

      const collectionName = itemType === 'job' ? 'jobs' : itemType === 'product' ? 'products' : 'services';
      const itemRef = doc(db, collectionName, targetId);
      await updateDoc(itemRef, { isPromoted: false });

      toast({ title: 'Success', description: 'Campaign paused successfully.', variant: 'success' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to pause campaign.', variant: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResumeCampaign = async (campaignId: string, itemType: string, targetId: string, endDate: any) => {
    const end = endDate?.toDate ? endDate.toDate() : new Date(endDate);
    if (end.getTime() < Date.now()) {
      toast({ title: 'Failed', description: 'This campaign has expired. Choose a new plan to resume.', variant: 'warning' });
      return;
    }

    setActionLoadingId(campaignId);
    try {
      const adRef = doc(db, 'advertisements', campaignId);
      await updateDoc(adRef, { status: 'active' });

      const collectionName = itemType === 'job' ? 'jobs' : itemType === 'product' ? 'products' : 'services';
      const itemRef = doc(db, collectionName, targetId);
      await updateDoc(itemRef, { isPromoted: true });

      toast({ title: 'Success', description: 'Campaign resumed successfully.', variant: 'success' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to resume campaign.', variant: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Process Razorpay Checkout Flow
  const handleProceedPayment = async () => {
    if (!selectedItemId) {
      alert('Please select a listing to promote.');
      return;
    }

    setIsProcessing(true);
    setPaymentMessage('');

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentMessage('Failed to load payment gateway. Please check your internet connection.');
        setIsProcessing(false);
        return;
      }

      // 2. Call cloud function to create Razorpay Order
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('@/lib/firebase/config');

      const createAdOrderCallable = httpsCallable<any, any>(functions, 'createAdOrder');
      const orderRes = await createAdOrderCallable({
        planId: selectedPlanId,
        targetId: selectedItemId,
        placement: promoteType,
        companyId: companyId
      });

      const { orderId, amount, currency, keyId, mockMode } = orderRes.data;

      const activePlanObj = adPlans.find(p => p.id === selectedPlanId);

      // 3. Define Razorpay checkout options
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'THENIJOBS',
        description: `Promote: ${activePlanObj?.name || 'Boost Campaign'}`,
        order_id: orderId,
        handler: async (response: any) => {
          setCheckoutStep('processing');
          setPaymentMessage('Verifying transaction details...');
          try {
            const verifyAdPaymentCallable = httpsCallable<any, any>(functions, 'verifyAdPayment');
            const verifyRes = await verifyAdPaymentCallable({
              razorpay_payment_id: response.razorpay_payment_id || 'mock_pay_id',
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_signature: response.razorpay_signature || '',
              planId: selectedPlanId,
              targetId: selectedItemId,
              placement: promoteType,
              companyId: companyId
            });

            if (verifyRes.data?.success) {
              setCheckoutStep('success');
              setPaymentMessage('');
            } else {
              setCheckoutStep('details');
              setPaymentMessage('Payment verification failed. Please contact support.');
            }
          } catch (verifyErr: any) {
            console.error('Verification error:', verifyErr);
            setCheckoutStep('details');
            setPaymentMessage(verifyErr?.message || 'Verification failed. Transaction was not credited.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.displayName || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#06b6d4'
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentMessage('Payment cancelled by user.');
          }
        }
      };

      // 4. Handle test mode bypass
      if (mockMode) {
        const confirmMock = window.confirm(`[TEST MODE] Order created: ${orderId}.\nClick OK to simulate successful payment.`);
        if (confirmMock) {
          options.handler({
            razorpay_payment_id: `pay_mock_ad_${Math.random().toString(36).substring(2, 11)}`,
            razorpay_order_id: orderId,
            razorpay_signature: 'mock_sig',
          });
        } else {
          setIsProcessing(false);
          setPaymentMessage('Mock payment verification cancelled.');
        }
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error('Order creation error:', err);
      setPaymentMessage(err?.message || 'Failed to start payment checkout.');
      setIsProcessing(false);
    }
  };

  const getRemainingDays = (endDate: any) => {
    if (!endDate) return 0;
    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
    const diff = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const currentListingsToSelect = promoteType === 'job' ? jobs : promoteType === 'product' ? products : services;
  const currentPlan = adPlans.find(p => p.id === selectedPlanId);

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="text-cyan-400 w-7 h-7" />
            Advertisement Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Sponsor your jobs, products, and services to reach thousands of local users</p>
        </div>
        <button
          onClick={handleOpenPromote}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'campaigns' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          My Campaigns
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'transactions' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Payment History
        </button>
      </div>

      {activeTab === 'campaigns' ? (
        <>
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Impressions', value: totalImpressions.toLocaleString(), desc: 'Views on search & lists', color: 'text-cyan-400 bg-cyan-500/5' },
              { label: 'Clicks', value: totalClicks.toLocaleString(), desc: 'Details page clicks', color: 'text-blue-400 bg-blue-500/5' },
              { label: 'Avg. CTR', value: ctr, desc: 'Click-through rate', color: 'text-emerald-400 bg-emerald-500/5' },
              { label: 'Total Invested', value: `₹${totalSpent.toLocaleString()}`, desc: 'Total payments made', color: 'text-amber-400 bg-amber-500/5' }
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
                Active Promotions
              </h2>
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
                  No promotions found. Create your first campaign above!
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left">
                      <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500">Listing</th>
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
        </>
      ) : (
        /* Transactions Tab */
        <div className="glass-card rounded-3xl overflow-hidden border border-white/[0.06]">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt size={16} className="text-cyan-400" />
              Transaction Logs & Receipts
            </h2>
          </div>
          <div className="overflow-x-auto">
            {transactionsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                <p className="text-xs text-gray-400">Loading transaction history...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm">
                <Receipt size={32} className="mx-auto mb-3 opacity-30" />
                No payment history found.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04] text-left">
                    <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500">Order ID</th>
                    <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500">Payment ID</th>
                    <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500">Target Listing</th>
                    <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center">Amount</th>
                    <th className="px-3 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center">Validity</th>
                    <th className="px-6 py-3 text-[10px] uppercase font-bold tracking-wider text-gray-500 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {transactions.map(tx => {
                    const createdDate = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('en-IN') : 'Recent';
                    const endDateStr = tx.endDate?.toDate ? tx.endDate.toDate().toLocaleDateString('en-IN') : 'Ongoing';
                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.01] transition-all text-xs">
                        <td className="px-6 py-4 font-mono text-[11px] text-gray-400">{tx.orderId}</td>
                        <td className="px-3 py-4 font-mono text-[11px] text-gray-450">{tx.paymentId}</td>
                        <td className="px-3 py-4">
                          <p className="font-semibold text-white truncate max-w-xs">{tx.title}</p>
                          <p className="text-[10px] text-gray-500 capitalize">{tx.placement}</p>
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-emerald-400">₹{tx.amount}</td>
                        <td className="px-3 py-4 text-center text-gray-400 font-medium">
                          {createdDate} to {endDateStr}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

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
                {paymentMessage && (
                  <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{paymentMessage}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-semibold">1. Promotion Target Type</label>
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
                  <label className="text-xs text-gray-400 block mb-1.5 font-semibold">2. Select Listing to Boost *</label>
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
                  <label className="text-xs text-gray-400 block mb-1.5 font-semibold">3. Select Promotion Plan (from DB)</label>
                  {adPlansLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 size={16} className="animate-spin text-cyan-400" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {adPlans.map(plan => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${
                            selectedPlanId === plan.id
                              ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400'
                              : 'bg-white/[0.01] border-white/[0.06] text-gray-400 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex-1">
                            <span className="text-xs font-bold text-white block">{plan.name}</span>
                            <span className="text-[10px] text-gray-500 mt-0.5">{plan.description} ({plan.days} days validity)</span>
                          </div>
                          <span className="text-sm font-black text-cyan-400 shrink-0">₹{plan.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/[0.05] flex justify-end">
                  <button
                    disabled={isProcessing || !selectedItemId}
                    onClick={handleProceedPayment}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-semibold text-white hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {isProcessing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CreditCard size={14} />
                    )}
                    {isProcessing ? 'Initializing Checkout...' : `Proceed to Pay ₹${currentPlan?.price || 100}`}
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 'processing' && (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                <h4 className="font-bold text-sm text-white">{paymentMessage || 'Authorizing Secure Transaction...'}</h4>
                <p className="text-xs text-gray-500 max-w-xs">Simulating payment gateway validation. Do not close or refresh this window.</p>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
                  <ShieldCheck size={28} />
                </div>
                <h4 className="font-black text-white text-base">Payment Authorized Successfully!</h4>
                <p className="text-xs text-gray-400 max-w-xs">Your listing has been boosted. It will now rank at the top of search listings and user recommendation feeds.</p>
                <button
                  onClick={() => {
                    setIsPromoteModalOpen(false);
                    window.location.reload();
                  }}
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
