'use client';

import { useState } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import {
  Megaphone, BarChart3, Ticket, Image as ImageIcon,
  TrendingUp, Eye, MousePointerClick, Users,
  Loader2, CheckCircle, XCircle, Calendar
} from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  title: string;
  type: 'banner' | 'featured' | 'promo';
  status: 'active' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  businessId?: string;
  businessName?: string;
  imageUrl?: string;
  createdAt: any;
}

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'banners'>('overview');

  const { data: campaigns, loading: campaignsLoading } = useCollection<Campaign>('campaigns');
  const { data: coupons } = useCollection<any>('coupons');
  const { data: companies } = useCollection<any>('companies');

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
  const activeCoupons = coupons.filter((c: any) => c.isActive);
  const featuredBusinesses = companies.filter((c: any) => c.isFeatured);
  const premiumBusinesses = companies.filter((c: any) => c.isPremium);

  const handleApproveBanner = async (campaignId: string) => {
    await updateDocument('campaigns', campaignId, { status: 'active' });
  };

  const handleRejectBanner = async (campaignId: string) => {
    await updateDocument('campaigns', campaignId, { status: 'expired' });
  };

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone size={22} className="text-orange-400" />
          Marketing Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage campaigns, banners, promotions, and track engagement</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl max-w-md">
        {(['overview', 'campaigns', 'banners'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Campaigns', value: activeCampaigns.length, icon: Megaphone, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: MousePointerClick, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'CTR', value: `${ctr}%`, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/coupons" className="glass-card rounded-xl p-4 hover:border-white/15 transition-all group">
              <Ticket size={20} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-white">{activeCoupons.length} Active Coupons</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Manage discount codes</p>
            </Link>
            <div className="glass-card rounded-xl p-4">
              <Users size={20} className="text-violet-400 mb-2" />
              <p className="text-sm font-bold text-white">{featuredBusinesses.length} Featured</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Featured businesses</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <Users size={20} className="text-amber-400 mb-2" />
              <p className="text-sm font-bold text-white">{premiumBusinesses.length} Premium</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Premium subscribers</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <ImageIcon size={20} className="text-blue-400 mb-2" />
              <p className="text-sm font-bold text-white">{campaigns.filter((c) => c.type === 'banner').length} Banners</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Active banners</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaignsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="text-orange-400 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Megaphone size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No campaigns yet.</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{campaign.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    campaign.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                    campaign.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-gray-500/15 text-gray-400'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {campaign.startDate} — {campaign.endDate}</span>
                  <span className="flex items-center gap-1"><Eye size={10} /> {campaign.impressions || 0} views</span>
                  <span className="flex items-center gap-1"><MousePointerClick size={10} /> {campaign.clicks || 0} clicks</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'banners' && (
        <div className="space-y-4">
          {campaigns.filter((c) => c.type === 'banner').length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <ImageIcon size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No banner submissions yet.</p>
            </div>
          ) : (
            campaigns
              .filter((c) => c.type === 'banner')
              .map((banner) => (
                <div key={banner.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{banner.title}</h3>
                      <p className="text-[10px] text-gray-500">{banner.businessName}</p>
                    </div>
                    {banner.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveBanner(banner.id)}
                          className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => handleRejectBanner(banner.id)}
                          className="p-2 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {banner.imageUrl && (
                    <div className="rounded-xl overflow-hidden bg-black/20 aspect-[4/1]">
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
