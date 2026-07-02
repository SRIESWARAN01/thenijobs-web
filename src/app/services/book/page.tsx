'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Phone, User, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { createBooking, createNotification } from '@/lib/firebase/firestoreService';

function BookServiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const { user } = useAuth();
  const uid = user?.uid;

  // Load provider company details
  const { data: company, loading: companyLoading } = useDocument<any>('companies', companyId);

  // Form State
  const [serviceName, setServiceName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [preferredPackage, setPreferredPackage] = useState('Standard');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialServiceName = searchParams.get('serviceName') || '';

  useEffect(() => {
    if (user) {
      setCustomerName(user.displayName || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (initialServiceName) {
      setServiceName(initialServiceName);
    } else if (company?.services && company.services.length > 0) {
      setServiceName(company.services[0]);
    } else if (company?.category) {
      setServiceName(company.category);
    }
  }, [company, initialServiceName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      setError('Please sign in to complete this booking.');
      return;
    }
    if (!companyId) {
      setError('Invalid company reference.');
      return;
    }
    if (!scheduledDate || !scheduledTime || !customerAddress.trim() || !customerPhone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const bookingData = {
        serviceProviderId: companyId,
        customerId: uid,
        customerName: customerName.trim() || user.displayName || user.email || 'Customer',
        customerPhone: customerPhone.trim(),
        customerEmail: user.email || '',
        serviceName,
        scheduledDate,
        scheduledTime,
        customerAddress: customerAddress.trim(),
        customerNotes: customerNotes.trim() || undefined,
        preferredPackage,
        quotedPrice: 0, // initially 0, provider can quote/override
      };

      const bookingId = await createBooking(bookingData);

      // Create notification for service provider
      await createNotification({
        userId: company.ownerId,
        title: 'New Service Booking Request',
        message: `${bookingData.customerName} requested ${serviceName} booking on ${scheduledDate} at ${scheduledTime}.`,
        type: 'booking',
        actionUrl: `/service/bookings?focus=${bookingId}`,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setError(err?.message || 'Unable to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!companyId) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] text-white font-outfit">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <AlertCircle size={48} className="text-gray-500 mb-4" />
          <h2 className="text-lg font-semibold">Missing Company ID</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-sm">Please book service requests directly from a service provider profile page.</p>
          <Link href="/services" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
            Browse Services Directory
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] text-white font-outfit pb-20">
      <Header />
      
      <div className="pt-24 max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {success ? (
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-emerald-500/25 bg-emerald-500/5 text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Booking Request Sent!</h2>
              <p className="text-sm text-gray-400 mt-2">
                Your service request has been sent to **{company?.name || 'the service provider'}**. They will review your notes and contact you to confirm pricing.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/seeker/dashboard" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors">
                Go to Dashboard
              </Link>
              <Link href="/services" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/10 transition-colors">
                Browse More Services
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/[0.08] bg-white/[0.01]">
            <div className="flex items-center gap-3 pb-5 border-b border-white/5 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <Calendar size={24} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Request Service Booking</h2>
                <p className="text-xs text-gray-400 mt-0.5">Booking with {companyLoading ? 'Loading...' : company?.name}</p>
              </div>
            </div>

            {!uid ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle size={40} className="text-amber-400 opacity-80 mb-3" />
                <h3 className="text-sm font-bold">Authentication Required</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Please log in or sign up as a Job Seeker to submit local service booking requests.
                </p>
                <Link href="/login" className="mt-5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all">
                  Sign In to Continue
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs text-gray-400 font-semibold">Select Service</span>
                    <select
                      required
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-violet-500/50"
                    >
                      {company?.services && company.services.length > 0 ? (
                        company.services.map((srv: string) => (
                          <option key={srv} value={srv}>{srv}</option>
                        ))
                      ) : (
                        <option value={company?.category || 'General Service'}>{company?.category || 'General Service'}</option>
                      )}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs text-gray-400 font-semibold">Pricing Preference</span>
                    <select
                      value={preferredPackage}
                      onChange={(e) => setPreferredPackage(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-violet-500/50"
                    >
                      <option value="Basic">Basic Package (Budget)</option>
                      <option value="Standard">Standard Package (Recommended)</option>
                      <option value="Premium">Premium Package (Full Service)</option>
                      <option value="Discuss">Request Custom Quotation</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Calendar size={12} /> Date</span>
                    <input
                      type="date"
                      required
                      min={getTomorrowDateString()}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-violet-500/50 text-gray-300"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Clock size={12} /> Preferred Time</span>
                    <input
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-violet-500/50 text-gray-300"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1"><User size={12} /> Contact Person Name</span>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-violet-500/50 text-gray-200"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Phone size={12} /> Contact Phone</span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-violet-500/50 text-gray-200"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs text-gray-400 font-semibold flex items-center gap-1"><MapPin size={12} /> Service Address / Locality</span>
                  <textarea
                    required
                    rows={2}
                    placeholder="Enter full address where service is required..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-violet-500/50 text-gray-200"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs text-gray-400 font-semibold">Special Instructions (Optional)</span>
                  <textarea
                    rows={2}
                    placeholder="Describe specific problems or requirements..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a0a1a] rounded-xl border border-white/10 text-sm focus:outline-none focus:border-violet-500/50 text-gray-200"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full min-h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Booking Request'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default function BookServicePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0a0a1a] text-white font-outfit">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Loader2 className="animate-spin text-violet-400 mb-3" size={32} />
          <p className="text-sm text-gray-400">Loading booking portal...</p>
        </div>
        <BottomNav />
      </main>
    }>
      <BookServiceContent />
    </Suspense>
  );
}
