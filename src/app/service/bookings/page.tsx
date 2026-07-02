'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import {
  Calendar, Clock, MapPin, Phone, Loader2,
  CheckCircle2, ChevronDown, MessageSquare, AlertCircle, Search
} from 'lucide-react';
import Link from 'next/link';
import { updateBookingStatus, createNotification } from '@/lib/firebase/firestoreService';

type BookingStatus = 'pending' | 'quoted' | 'confirmed' | 'declined' | 'completed';

interface BookingDoc {
  id: string;
  serviceProviderId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime?: string;
  customerAddress: string;
  customerNotes?: string;
  preferredPackage?: string;
  quotedPrice?: number;
  bookingStatus: BookingStatus;
  createdAt: any;
  serviceDate?: string;
  serviceTime?: string;
  serviceLocation?: string;
  serviceDescription?: string;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Needs Quote', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  quoted: { label: 'Price Quoted', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  declined: { label: 'Declined', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  completed: { label: 'Completed', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
};

export default function ServiceBookingsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Quote pricing state
  const [quotePriceInput, setQuotePriceInput] = useState<number>(0);
  const [quoteNotesInput, setQuoteNotesInput] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingDoc | null>(null);

  // 1. Fetch service provider's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch bookings
  const { data: rawBookings, loading: bookingsLoading } = useCollection<any>('bookings', [
    where('serviceProviderId', '==', companyId || '')
  ], { skip: !companyId });

  // Map backward compatibility fields
  const bookings: BookingDoc[] = rawBookings.map((b: any) => ({
    ...b,
    serviceName: b.serviceName || b.serviceDescription || 'General Service',
    scheduledDate: b.scheduledDate || b.serviceDate || '',
    scheduledTime: b.scheduledTime || b.serviceTime || '',
    customerAddress: b.customerAddress || b.serviceLocation || '',
    customerNotes: b.customerNotes || b.serviceDescription || '',
  }));

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, status);
      alert(`Booking status updated to ${status}`);
    } catch (err) {
      console.error(err);
      alert('Failed to update booking status');
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    if (quotePriceInput <= 0) return alert('Please enter a valid price');

    setActionLoading(selectedBooking.id);
    try {
      await updateBookingStatus(selectedBooking.id, 'quoted', quoteNotesInput, quotePriceInput);
      
      // Create notification for seeker
      await createNotification({
        userId: selectedBooking.customerId,
        title: 'New Price Quote Received',
        message: `${company?.name || 'Service Provider'} sent a quote of ₹${quotePriceInput} for ${selectedBooking.serviceName}.`,
        type: 'booking',
        actionUrl: `/seeker/bookings?focus=${selectedBooking.id}`,
      });

      alert('Quote submitted successfully');
      setSelectedBooking(null);
      setQuotePriceInput(0);
      setQuoteNotesInput('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit quote');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = bookings.filter((booking) => {
    const sName = booking.serviceName || '';
    const cName = booking.customerName || '';
    const loc = booking.customerAddress || '';
    const desc = booking.customerNotes || '';
    
    const matchesSearch = sName.toLowerCase().includes(search.toLowerCase()) ||
      cName.toLowerCase().includes(search.toLowerCase()) ||
      loc.toLowerCase().includes(search.toLowerCase()) ||
      desc.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.bookingStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'BK';
  };

  const getWhatsAppNumber = (phone?: string) => {
    const digits = phone?.replace(/\D/g, '') || '';
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const loading = companyLoading || bookingsLoading;

  // Stats calculations
  const totalEarnings = bookings
    .filter(b => b.bookingStatus === 'completed' || b.bookingStatus === 'confirmed')
    .reduce((sum, b) => sum + (b.quotedPrice || 0), 0);
  
  const activeJobs = bookings.filter(b => b.bookingStatus === 'confirmed').length;
  const newRequests = bookings.filter(b => b.bookingStatus === 'pending').length;
  const completedJobs = bookings.filter(b => b.bookingStatus === 'completed').length;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Calendar size={48} className="text-gray-500 mb-4" />
        <h2 className="text-lg font-semibold">No Service Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view and manage customer bookings.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold hover:opacity-90">
          Setup Portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit">Bookings & Appointments</h1>
          <p className="text-sm text-gray-400 mt-1">Manage scheduling requests, quotes, and customer visits.</p>
        </div>
        
        {/* View Mode Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${viewMode === 'list' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-rose-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading bookings...</p>
        </div>
      ) : (
        <>
          {/* Dashboard Stats */}
          <div className="glass-card rounded-3xl p-6 border border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-pink-500/5 mb-6">
            <h2 className="text-xl font-bold font-outfit mb-4">{company?.name || 'AC Services Theni'}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Earnings', value: `₹${totalEarnings.toLocaleString()}` },
                { label: 'Active Jobs', value: activeJobs },
                { label: 'New Requests', value: newRequests },
                { label: 'Completed Jobs', value: completedJobs }
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {viewMode === 'calendar' ? (
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 mb-2">
                <div>SUN</div>
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => {
                  const dayNum = i - 3; // Mocking current month starting day offset
                  const isCurrentMonth = dayNum > 0 && dayNum <= 31;
                  return (
                    <div
                      key={i}
                      className={`aspect-square p-2 border border-white/5 bg-white/[0.01] rounded-xl flex flex-col justify-between min-h-[70px] ${!isCurrentMonth ? 'opacity-25' : ''}`}
                    >
                      <span className="text-xs font-semibold text-gray-500">{isCurrentMonth ? dayNum : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search bookings..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:border-rose-500/40 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-rose-500/40 outline-none transition-all cursor-pointer bg-[#0a0a1a]"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">New Requests</option>
                      <option value="quoted">Quoted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                      <option value="completed">Completed</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-gray-400">All Service Requests</h2>
                  {filtered.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center">
                      <Calendar size={32} className="text-gray-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No booking requests found.</p>
                    </div>
                  ) : (
                    filtered.map((booking) => {
                      const statusCfg = STATUS_CONFIG[booking.bookingStatus] || STATUS_CONFIG.pending;
                      return (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`glass-card rounded-2xl p-5 hover:border-white/15 transition-all cursor-pointer ${selectedBooking?.id === booking.id ? 'border-rose-500/40 bg-white/[0.03]' : ''}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-white">{getInitials(booking.customerName)}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-semibold text-white">{booking.customerName}</h3>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                                  {statusCfg.label}
                                </span>
                              </div>

                              <p className="text-sm font-bold text-rose-300">{booking.serviceName}</p>

                              {booking.customerNotes && (
                                <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] whitespace-pre-wrap">{booking.customerNotes}</p>
                              )}

                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs text-gray-500 pt-1">
                                <span className="flex items-center gap-1"><Calendar size={12} className="text-rose-500" /> Date: {booking.scheduledDate}</span>
                                {booking.scheduledTime && (
                                  <span className="flex items-center gap-1"><Clock size={12} className="text-rose-500" /> Time: {booking.scheduledTime}</span>
                                )}
                                <span className="flex items-center gap-1"><MapPin size={12} className="text-rose-500" /> Area: {booking.customerAddress}</span>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-2">
                                {booking.customerPhone && (
                                  <a
                                    href={`tel:${booking.customerPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-gray-200 hover:border-rose-400/30 hover:text-rose-200"
                                  >
                                    <Phone size={12} /> Call Client
                                  </a>
                                )}
                                {getWhatsAppNumber(booking.customerPhone) && (
                                  <a
                                    href={`https://wa.me/${getWhatsAppNumber(booking.customerPhone)}?text=${encodeURIComponent(`Hi ${booking.customerName}, we received your booking request for our services.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/15"
                                  >
                                    <MessageSquare size={12} /> WhatsApp
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Action Panel */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-2 sm:pt-0" onClick={(e) => e.stopPropagation()}>
                              {actionLoading === booking.id ? (
                                <Loader2 size={16} className="text-rose-400 animate-spin" />
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {booking.bookingStatus === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-semibold hover:opacity-90"
                                      >
                                        Quote & Accept
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(booking.id, 'declined')}
                                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-gray-400 hover:text-rose-400 text-xs font-medium hover:bg-rose-500/10"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {booking.bookingStatus === 'quoted' && (
                                    <button
                                      onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                                    >
                                      <CheckCircle2 size={12} /> Confirm Visit
                                    </button>
                                  )}

                                  {booking.bookingStatus === 'confirmed' && (
                                    <button
                                      onClick={() => handleUpdateStatus(booking.id, 'completed')}
                                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1"
                                    >
                                      <CheckCircle2 size={12} /> Mark Completed
                                    </button>
                                  )}

                                  {booking.bookingStatus === 'completed' && (
                                    <span className="text-xs text-gray-500 font-semibold py-1">Completed</span>
                                  )}

                                  {booking.bookingStatus === 'declined' && (
                                    <span className="text-xs text-gray-500 font-semibold py-1">Declined</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Detail panel on side */}
              <div className="space-y-4">
                {selectedBooking ? (
                  <div className="glass-card rounded-2xl p-6 border border-rose-500/20 bg-white/[0.02] space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">Submit Quotation</h2>
                      <p className="text-xs text-gray-400 mt-1">Provide pricing estimate for the booking request.</p>
                    </div>
                    
                    <div className="text-xs space-y-1 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                      <p className="font-semibold text-white">Client: {selectedBooking.customerName}</p>
                      <p className="text-gray-400">Service: {selectedBooking.serviceName}</p>
                      <p className="text-gray-400">Address: {selectedBooking.customerAddress}</p>
                    </div>

                    <form onSubmit={handleQuoteSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Quote Price (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="e.g. 500"
                            value={quotePriceInput || ''}
                            onChange={(e) => setQuotePriceInput(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-rose-500/40 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Quotation Notes</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Describe what is included..."
                          value={quoteNotesInput}
                          onChange={(e) => setQuoteNotesInput(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white/[0.04] rounded-xl border border-white/[0.08] text-sm text-white focus:border-rose-500/40 outline-none transition-all"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={actionLoading === selectedBooking.id}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === selectedBooking.id && <Loader2 size={12} className="animate-spin" />}
                          Send Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(null);
                            setQuotePriceInput(0);
                            setQuoteNotesInput('');
                          }}
                          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.01] text-center py-12">
                    <AlertCircle size={28} className="text-gray-500 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-white">No Booking Selected</p>
                    <p className="text-[11px] text-gray-500 mt-1">Select a request from the list to view full details and send pricing quotes.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
