'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, Crown, TrendingUp, Users, Eye, MessageCircle, Phone, FileText, Activity } from 'lucide-react';
import { where, orderBy, limit } from 'firebase/firestore';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';

export default function BusinessDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth([
    'business',
    'business_owner',
    'employer',
    'supplier',
    'service_provider',
    'entrepreneur'
  ]);

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || ''),
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const { data: jobs } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true),
  ], { skip: !companyId });

  const { data: leads } = useCollection<any>('leads', [
    where('companyId', '==', companyId || ''),
  ], { skip: !companyId });

  // Query recent analytics events
  const { data: recentEvents } = useCollection<any>('analyticsEvents', [
    where('companyId', '==', companyId || ''),
    orderBy('timestamp', 'desc'),
    limit(10)
  ], { skip: !companyId });

  if (authLoading || companyLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400" />
      </main>
    );
  }

  // Plan Details and visibility settings
  const subscriptionPlan = company?.subscriptionPlan || (company?.isPremium ? 'premium' : 'free');
  const planLabel = subscriptionPlan === 'free' ? 'Free Plan' : subscriptionPlan === 'basic' ? 'Standard Plan (Blue Tick)' : subscriptionPlan === 'premium' ? 'Premium Plan (Yellow Tick)' : 'Pro/Enterprise Plan';
  
  // Stats summary counts
  const visitCount = company?.visitCount || 0;
  const whatsappClicks = company?.whatsappClickCount || 0;
  const callClicks = company?.callClickCount || 0;
  const contactSubmits = company?.contactSubmitCount || 0;
  const conversionRate = visitCount > 0 ? ((contactSubmits / visitCount) * 100).toFixed(1) : '0';

  return (
    <main className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-white sm:px-6 font-outfit">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Welcome Section */}
        <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-300">{planLabel}</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black">{company?.name || 'Business Portal'}</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Manage profile details, catalogue products, track real-time leads, jobs and visibility analytics.
              </p>
            </div>
            <Link href="/business/company-profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-black text-white transition-colors shrink-0">
              <Building2 size={16} /> Edit Profile
            </Link>
          </div>
        </section>

        {/* Real-time Business Analytics Panel */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" /> Real-Time Analytics Insights
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Profile Views', value: visitCount, icon: Eye, tone: 'text-emerald-300' },
              { label: 'WhatsApp Clicks', value: whatsappClicks, icon: MessageCircle, tone: 'text-green-400' },
              { label: 'Phone Call Clicks', value: callClicks, icon: Phone, tone: 'text-cyan-300' },
              { label: 'Contact Submissions', value: contactSubmits, icon: FileText, tone: 'text-amber-300' },
              { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Crown, tone: 'text-violet-300' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/10 transition-colors">
                  <Icon size={18} className={item.tone} />
                  <div className="mt-4 text-2xl font-black text-white">{item.value}</div>
                  <div className="text-xs text-gray-400 mt-1 font-medium">{item.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dashboard Management Navigation */}
        <section className="grid gap-4 lg:grid-cols-4">
          {[
            { label: 'Manage Profile', detail: 'Update logo, descriptions, services, social channels and layout themes.', href: '/business/company-profile', icon: Building2 },
            { label: 'Product Catalogue', detail: 'Showcase products and catalog items directly on your business site.', href: '/business/products', icon: Crown },
            { label: 'Active Openings', detail: 'Publish career options, filter responses and manage candidates.', href: '/business/jobs', icon: Briefcase },
            { label: 'Analytics & RFQ Leads', detail: 'View customer enquiries, call numbers and detailed RFQ logs.', href: '/business/leads', icon: Users },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.05]">
                <Icon size={20} className="text-emerald-300" />
                <h2 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition-colors">{action.label}</h2>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{action.detail}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  Manage <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </section>

        {/* Recent Visitor & Clicks Activity Timeline Log */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Recent Enquiries Box */}
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.01] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={16} className="text-amber-400" /> Recent Customer Leads ({leads?.length || 0})
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
              {leads && leads.length > 0 ? (
                leads.slice(0, 5).map((l: any) => (
                  <div key={l.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{l.customerName}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{l.customerPhone} · {l.service || 'General Inquiry'}</div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                      RFQ
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-8 text-center">No customer leads received yet.</p>
              )}
            </div>
            {leads && leads.length > 5 && (
              <Link href="/business/leads" className="text-xs text-emerald-400 font-bold hover:underline block pt-2">
                View all leads →
              </Link>
            )}
          </div>

          {/* Real-time Visitor Events Stream */}
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.01] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-cyan-400 animate-pulse" /> Live Activity Events Stream
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
              {recentEvents && recentEvents.length > 0 ? (
                recentEvents.map((evt: any) => {
                  let eventDesc = 'Visitor viewed your profile';
                  if (evt.eventType === 'whatsapp_click') {
                    eventDesc = `WhatsApp Click on product: ${evt.targetName || 'Main Page'}`;
                  } else if (evt.eventType === 'call_click') {
                    eventDesc = 'Visitor clicked Phone Call button';
                  } else if (evt.eventType === 'contact_submit') {
                    eventDesc = 'Visitor submitted Enquiry Form';
                  } else if (evt.eventType === 'product_view') {
                    eventDesc = `Viewed product: ${evt.targetName}`;
                  } else if (evt.eventType === 'review_submit') {
                    eventDesc = 'Visitor submitted a review';
                  }
                  
                  return (
                    <div key={evt.id} className="p-3 rounded-xl bg-white/[0.02] flex items-center justify-between text-[11px]">
                      <span className="text-gray-300 font-medium">{eventDesc}</span>
                      <span className="text-[9px] text-gray-500">{evt.dateStr || 'Today'}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 py-8 text-center">No live activity events registered.</p>
              )}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
