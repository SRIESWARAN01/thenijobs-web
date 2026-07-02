'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { trackProductOrServiceAnalytics } from '@/lib/firebase/firestoreService';
import {
  MapPin, Phone, Mail, MessageCircle, Share2, Calendar,
  ArrowLeft, CheckCircle2, Copy, Check, Briefcase, Building2,
  Clock, ShieldCheck
} from 'lucide-react';

interface ServiceDetailPageClientProps {
  service: any;
  company: any;
  relatedServices: any[];
}

export default function ServiceDetailPageClient({
  service,
  company,
  relatedServices
}: ServiceDetailPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // 1. Track Service View on Load (Once)
  useEffect(() => {
    if (service?.id) {
      const customerData = user ? {
        name: user.displayName || (user as any).fullName || 'Anonymous Seeker',
        phone: user.phone || '',
        email: user.email || ''
      } : undefined;

      trackProductOrServiceAnalytics(
        service.id,
        'service',
        company?.id || '',
        'view',
        customerData
      );
    }
  }, [service?.id, company?.id, user]);

  // 2. Click Handlers with analytics and lead triggers
  const handleServiceAction = async (eventType: 'whatsapp' | 'call' | 'email' | 'booking') => {
    try {
      const customerData = {
        name: user?.displayName || (user as any)?.fullName || 'Anonymous Guest',
        phone: user?.phone || '',
        email: user?.email || '',
      };

      await trackProductOrServiceAnalytics(
        service.id,
        'service',
        company?.id || '',
        eventType,
        customerData
      );
    } catch (err) {
      console.error('Error tracking service action:', err);
    }

    if (eventType === 'whatsapp') {
      const priceStr = service.price ? `₹${service.price}` : 'Price on request';
      const serviceUrl = typeof window !== 'undefined'
        ? window.location.href
        : `https://thenijobs.com/services/${service.id}`;
      
      const text = `Hello, I'm interested in your service.

Service: ${service.name}
Price: ${priceStr}
Service Link: ${serviceUrl}
Company: ${company?.name || 'Verified Business'}

Please share more details.`;
      
      const rawNum = company?.whatsapp || company?.phone || '917094826586';
      const cleanPhone = String(rawNum).replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
    } else if (eventType === 'call') {
      window.location.href = `tel:${company?.phone || ''}`;
    } else if (eventType === 'email') {
      window.location.href = `mailto:${company?.email || ''}?subject=Enquiry regarding ${encodeURIComponent(service.name)}`;
    } else if (eventType === 'booking') {
      router.push(`/services/book?companyId=${company?.id || ''}&serviceName=${encodeURIComponent(service.name)}`);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({
          title: service.name,
          text: service.description,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
      
      // Increment share analytics count
      const customerData = user ? {
        name: user.displayName || (user as any).fullName || 'Anonymous Seeker',
        phone: user.phone || '',
        email: user.email || ''
      } : undefined;

      trackProductOrServiceAnalytics(
        service.id,
        'service',
        company?.id || '',
        'share',
        customerData
      );
    } catch (err) {
      console.error(err);
    }
  };

  const priceText = service.price ? `₹${Number(service.price).toLocaleString('en-IN')}` : 'Price on request';
  const availability = service.availability || 'Available';
  
  // Format features list if present
  const featuresList = Array.isArray(service.features)
    ? service.features
    : typeof service.features === 'string'
      ? service.features.split(/[,\n]/).map((f: string) => f.trim()).filter(Boolean)
      : [];

  return (
    <main className="min-h-screen bg-[#070715] text-slate-100 font-sans pb-20">
      <Header />

      <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Back Button */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} /> Back to Listings
          </button>
        </div>

        {/* Main Details Panel */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Service Details Main Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 space-y-6">
              
              {/* Image and Header Row */}
              <div className="flex flex-col sm:flex-row gap-6">
                {service.imageUrl ? (
                  <div className="relative w-full sm:w-40 aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                    <img src={service.imageUrl} alt={service.name} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-full sm:w-40 aspect-video sm:aspect-square rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 shrink-0">
                    <Briefcase size={48} className="text-slate-500" />
                  </div>
                )}
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                      {service.category || 'Professional Services'}
                    </span>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-full hover:bg-white/5 border border-white/10 text-gray-450 hover:text-white transition-colors"
                      title="Share Service Link"
                    >
                      {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                    </button>
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {service.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-rose-500" /> {service.location || 'Theni'}, Tamil Nadu
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Clock size={13} /> {availability}
                    </span>
                  </div>

                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-sm text-gray-500 font-medium">Starting Price:</span>
                    <span className="text-2xl font-black text-emerald-400">{priceText}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-white/5 pt-6 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Service Overview</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line text-justify">
                  {service.description}
                </p>
              </div>

              {/* Features List */}
              {featuresList.length > 0 && (
                <div className="border-t border-white/5 pt-6 space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">What is included</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {featuresList.map((feature: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related Services */}
            {relatedServices.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={15} className="text-rose-400" /> Other Services from this business
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {relatedServices.map((svc: any) => (
                    <Link
                      key={svc.id}
                      href={`/services/${svc.id}`}
                      className="p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all flex gap-4"
                    >
                      {svc.imageUrl ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                          <img src={svc.imageUrl} alt={svc.name} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl shrink-0 bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500">
                          <Briefcase size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{svc.name}</h4>
                        <span className="text-[8px] text-slate-500 uppercase font-bold mt-1 inline-block">
                          {svc.category || 'General'}
                        </span>
                        <div className="text-[10px] font-black text-emerald-400 mt-1">
                          ₹{svc.price || 'Request Price'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Contact and Business Profile Card */}
          <div className="space-y-6">
            
            {/* Quick Booking / Contact Card */}
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Book or Enquire</h3>
              
              <button
                onClick={() => handleServiceAction('booking')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-650 hover:opacity-90 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar size={14} /> Book Appointment
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleServiceAction('call')}
                  className="py-3 rounded-xl border border-white/10 hover:border-rose-500/20 text-xs font-bold uppercase text-slate-300 hover:text-rose-300 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone size={13} /> Call
                </button>
                <button
                  onClick={() => handleServiceAction('whatsapp')}
                  className="py-3 rounded-xl text-xs font-bold uppercase text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                >
                  <MessageCircle size={13} /> WhatsApp
                </button>
              </div>

              <button
                onClick={() => handleServiceAction('email')}
                className="w-full py-3 rounded-xl border border-white/10 hover:border-rose-500/20 text-xs font-bold uppercase text-slate-300 hover:text-rose-300 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-1.5"
              >
                <Mail size={13} /> Send Email
              </button>
            </div>

            {/* Business Information Card */}
            {company && (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4 shadow-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Service Provider</span>
                
                <div className="flex gap-3.5 items-center pb-4 border-b border-white/5">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-[#070714] shrink-0 flex items-center justify-center">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="object-cover w-full h-full" />
                    ) : (
                      <Building2 size={20} className="text-rose-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate leading-tight">{company.name}</h4>
                    <p className="text-[10px] text-rose-400 font-semibold truncate mt-0.5">{company.category || 'Verified Partner'}</p>
                    <span className="text-[9px] text-gray-500 font-mono mt-1 block">
                      TNI-BUS-{company.id ? company.id.slice(0, 8).toUpperCase() : 'XXXX'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Response Speed</span>
                    <span className="text-white flex items-center gap-1"><Clock size={12} className="text-rose-400" /> {company.responseTime || 'Same Day'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Trust Score</span>
                    <span className="text-white flex items-center gap-1"><ShieldCheck size={12} className="text-rose-400" /> {company.trustScore || '80'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Area / Location</span>
                    <span className="text-white flex items-center gap-1"><MapPin size={12} className="text-rose-400" /> {company.location || 'Theni'}</span>
                  </div>
                </div>

                <Link
                  href={`/company/${company.slug}`}
                  className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-[11px] font-bold text-white flex items-center justify-center gap-1 transition-colors text-center block"
                >
                  Visit Company Portfolio <ArrowLeft size={12} className="rotate-180" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
