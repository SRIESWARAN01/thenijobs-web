'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { orderBy } from 'firebase/firestore';
import { updateBookingStatus } from '@/lib/firebase/firestoreService';
import {
  Search, Calendar, Clock, MapPin, Phone, Mail, User,
  Loader2, CheckCircle2, XCircle, MessageSquare, ChevronDown,
  Download, Filter
} from 'lucide-react';

type BookingStatus = 'pending' | 'quoted' | 'confirmed' | 'declined' | 'completed';

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  quoted: { label: 'Quoted', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  declined: { label: 'Declined', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  completed: { label: 'Completed', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
};

export default function AdminBookingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: bookings, loading } = useCollection<any>('bookings', [
    orderBy('createdAt', 'desc'),
  ]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.bookingStatus === 'pending').length;
    const confirmed = bookings.filter(b => b.bookingStatus === 'confirmed').length;
    const completed = bookings.filter(b => b.bookingStatus === 'completed').length;
    const declined = bookings.filter(b => b.bookingStatus === 'declined').length;
    return { total, pending, confirmed, completed, declined };
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (b.customerName || '').toLowerCase().includes(q) ||
        (b.serviceName || '').toLowerCase().includes(q) ||
        (b.customerPhone || '').includes(q) ||
        (b.customerEmail || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [bookings, statusFilter, search]);

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
    } catch (err) {
      console.error('Failed to update booking status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Email', 'Service', 'Date', 'Time', 'Status', 'Address'];
    const rows = filtered.map(b => [
      b.customerName || '',
      b.customerPhone || '',
      b.customerEmail || '',
      b.serviceName || '',
      b.scheduledDate || '',
      b.scheduledTime || '',
      b.bookingStatus || '',
      (b.customerAddress || '').replace(/,/g, ' '),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: any) => {
    if (!d) return '—';
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-outfit text-2xl font-black text-white">Service Bookings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage all service booking requests across the platform</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total', value: stats.total, color: 'violet' },
          { label: 'Pending', value: stats.pending, color: 'rose' },
          { label: 'Confirmed', value: stats.confirmed, color: 'emerald' },
          { label: 'Completed', value: stats.completed, color: 'cyan' },
          { label: 'Declined', value: stats.declined, color: 'gray' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border border-${stat.color}-500/20 bg-${stat.color}-500/5 p-4`}>
            <p className={`text-xs font-bold uppercase tracking-wider text-${stat.color}-400`}>{stat.label}</p>
            <p className="mt-1 text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search customer, service, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-cyan-500/40 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-8 text-sm text-white focus:border-cyan-500/40 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="quoted">Quoted</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar size={48} className="text-gray-600 mb-4" />
          <p className="text-gray-400">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => {
            const status = (booking.bookingStatus || 'pending') as BookingStatus;
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            const isProcessing = actionLoading === booking.id;

            return (
              <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Customer & Service Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white truncate">{booking.serviceName || 'Service Request'}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}>
                        {config.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><User size={12} /> {booking.customerName || 'N/A'}</span>
                      {booking.customerPhone && (
                        <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-1 hover:text-cyan-400">
                          <Phone size={12} /> {booking.customerPhone}
                        </a>
                      )}
                      {booking.customerEmail && (
                        <a href={`mailto:${booking.customerEmail}`} className="flex items-center gap-1 hover:text-cyan-400">
                          <Mail size={12} /> {booking.customerEmail}
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {booking.scheduledDate && (
                        <span className="flex items-center gap-1"><Calendar size={12} /> {booking.scheduledDate}</span>
                      )}
                      {booking.scheduledTime && (
                        <span className="flex items-center gap-1"><Clock size={12} /> {booking.scheduledTime}</span>
                      )}
                      {booking.customerAddress && (
                        <span className="flex items-center gap-1"><MapPin size={12} /> {booking.customerAddress}</span>
                      )}
                    </div>

                    {booking.customerNotes && (
                      <p className="text-xs text-gray-500 flex items-start gap-1 mt-1">
                        <MessageSquare size={12} className="mt-0.5 shrink-0" />
                        {booking.customerNotes}
                      </p>
                    )}

                    <p className="text-[10px] text-gray-600">Booked: {formatDate(booking.createdAt)}</p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isProcessing ? (
                      <Loader2 size={16} className="animate-spin text-cyan-400" />
                    ) : (
                      <>
                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <CheckCircle2 size={12} className="inline mr-1" /> Confirm
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'declined')}
                              className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
                            >
                              <XCircle size={12} className="inline mr-1" /> Decline
                            </button>
                          </>
                        )}
                        {status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                          >
                            <CheckCircle2 size={12} className="inline mr-1" /> Complete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
