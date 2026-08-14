'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateLeadStatus } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import {
  TrendingUp, Search, ChevronDown, Phone, Mail, Loader2, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

interface LeadDoc {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  service?: string;
  message?: string;
  status: LeadStatus;
  createdAt: any;
  notes?: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; dot: string }> = {
  new: { label: 'New', bg: 'bg-blue-100', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  contacted: { label: 'Contacted', bg: 'bg-amber-100', text: 'text-amber-400', dot: 'bg-amber-400' },
  qualified: { label: 'Qualified', bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-400' },
  converted: { label: 'Converted', bg: 'bg-emerald-100', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  lost: { label: 'Lost', bg: 'bg-red-100', text: 'text-rose-400', dot: 'bg-rose-400' } };

export default function EmployerLeadsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch leads
  const { data: leads, loading: leadsLoading } = useCollection<LeadDoc>('leads', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    setActionLoading(leadId);
    try {
      await updateLeadStatus(leadId, status);
      toast.success(`Lead status updated to ${status}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lead status');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = leads.filter((lead) => {
    const matchesSearch = lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (lead.service || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.message || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'LD';
  };

  const getWhatsAppNumber = (phone?: string) => {
    const digits = phone?.replace(/\D/g, '') || '';
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const loading = companyLoading || leadsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <TrendingUp size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view and manage customer leads.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-gray-900">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-outfit">Lead Inbox / Request Quote</h1>
        <p className="text-sm text-slate-500 mt-1">Company page-ல் வரும் Send Inquiry, Request Quote, WhatsApp leads அனைத்தையும் manage செய்யலாம்.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading leads...</p>
        </div>
      ) : (
        <>
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none transition-all cursor-pointer bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Leads list */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <TrendingUp size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">இன்னும் quote / inquiry leads வரவில்லை.</p>
              </div>
            ) : (
              filtered.map((lead) => {
                const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                return (
                  <div key={lead.id} className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-gray-900">{getInitials(lead.customerName)}</span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-gray-900">{lead.customerName}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </div>
                        
                        {lead.service && (
                          <p className="text-xs text-cyan-400 font-medium">Interested in: {lead.service}</p>
                        )}
                        
                        {lead.message && (
                          <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] whitespace-pre-wrap">{lead.message}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          {lead.customerPhone && (
                            <span className="flex items-center gap-1"><Phone size={12} className="text-cyan-500" /> {lead.customerPhone}</span>
                          )}
                          {lead.customerEmail && (
                            <span className="flex items-center gap-1"><Mail size={12} className="text-cyan-500" /> {lead.customerEmail}</span>
                          )}
                          <span>Received: {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Recent'}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {lead.customerPhone && (
                            <a
                              href={`tel:${lead.customerPhone}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-200 hover:border-cyan-400/30 hover:text-cyan-200"
                            >
                              <Phone size={12} /> Call
                            </a>
                          )}
                          {getWhatsAppNumber(lead.customerPhone) && (
                            <a
                              href={`https://wa.me/${getWhatsAppNumber(lead.customerPhone)}?text=${encodeURIComponent(`Hi ${lead.customerName}, we received your THENIJOBS enquiry.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/15"
                            >
                              <MessageSquare size={12} /> WhatsApp
                            </a>
                          )}
                          {lead.customerEmail && (
                            <a
                              href={`mailto:${lead.customerEmail}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-200 hover:border-cyan-400/30 hover:text-cyan-200"
                            >
                              <Mail size={12} /> Email
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {actionLoading === lead.id ? (
                          <Loader2 size={16} className="text-blue-600 animate-spin" />
                        ) : (
                          <>
                            <div className="relative">
                              <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-300 outline-none focus:border-blue-500 cursor-pointer bg-[#0e0e22]"
                              >
                                <option value="new">Mark New</option>
                                <option value="contacted">Mark Contacted</option>
                                <option value="qualified">Mark Qualified</option>
                                <option value="converted">Mark Converted</option>
                                <option value="lost">Mark Lost</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
