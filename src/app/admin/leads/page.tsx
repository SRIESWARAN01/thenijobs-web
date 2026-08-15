'use client';

import { useState } from 'react';
import {
  TrendingUp, Search, ChevronDown, Phone, Mail,
  Download, User, Building2, Wrench,
  ArrowRight, Clock, CheckCircle, ChevronRight,
  Loader2, MessageCircle, MapPin
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateLeadStatus } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';

interface LeadDoc {
  id: string;
  contactName: string;
  phone: string;
  email: string;
  company?: string;
  source?: string;
  type: 'candidate' | 'business' | 'service';
  status: LeadStatus;
  assignedTo?: string;
  createdAt?: any;
  notes?: string;
  district?: string;
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; dot: string }> = {
  new:       { label: 'New Lead', bg: '#EFF6FF', text: '#2563EB', dot: '#2563EB' },
  contacted: { label: 'Contacted', bg: '#F5F3FF', text: '#7C3AED', dot: '#7C3AED' },
  qualified: { label: 'Qualified', bg: '#FFFBEB', text: '#D97706', dot: '#D97706' },
  converted: { label: 'Converted', bg: '#ECFDF5', text: '#059669', dot: '#059669' },
  lost:      { label: 'Lost', bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof User; bg: string; text: string }> = {
  candidate: { label: 'Candidate', icon: User, bg: '#EFF6FF', text: '#2563EB' },
  business:  { label: 'Business', icon: Building2, bg: '#F5F3FF', text: '#7C3AED' },
  service:   { label: 'Service', icon: Wrench, bg: '#FFFBEB', text: '#D97706' },
};

const PIPELINE_STAGES: { status: LeadStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'qualified', label: 'Qualified' },
  { status: 'converted', label: 'Converted' },
  { status: 'lost', label: 'Lost' },
];

export default function LeadsPage() {
  const toast = useToast();
  const { data: leads, loading } = useCollection<LeadDoc>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const contactName = lead.contactName || '';
    const company = lead.company || '';
    const matchSearch = contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone || '').includes(searchQuery);
    
    const leadType = lead.type || 'candidate';
    const matchType = typeFilter === 'all' || leadType === typeFilter;
    
    const leadStatus = lead.status || 'new';
    const matchStatus = statusFilter === 'all' || leadStatus === statusFilter;
    
    return matchSearch && matchType && matchStatus;
  });

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setActionLoading(leadId);
    try {
      await updateLeadStatus(leadId, newStatus);
      toast.success(`Lead moved to ${newStatus}`);
    } catch (err: any) {
      console.error('Update lead status error:', err);
      toast.error('Failed to update lead status');
    } finally {
      setActionLoading(null);
    }
  };

  const totalCount = leads.length;
  const newCount = leads.filter((l) => (l.status || 'new') === 'new').length;
  const contactedCount = leads.filter((l) => l.status === 'contacted').length;
  const qualifiedCount = leads.filter((l) => l.status === 'qualified').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;

  const stats = [
    { label: 'Total Inquiries', value: totalCount, icon: TrendingUp, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'New Leads', value: newCount, icon: Clock, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'In Discussions', value: contactedCount, icon: Phone, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Qualified', value: qualifiedCount, icon: CheckCircle, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Onboarded', value: convertedCount, icon: TrendingUp, bg: '#ECFDF5', color: '#059669' },
  ];

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">Lead &amp; Marketplace Enquiries</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track customer inquiries, supplier requests, and franchise onboarding leads</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: stat.bg }}>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 font-bold">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads by contact name, phone, or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="candidate">Candidate</option>
            <option value="business">Business</option>
            <option value="service">Service</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Content List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading inquiries...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs">
          <TrendingUp size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">No leads found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const typeCfg = TYPE_CONFIG[lead.type || 'candidate'] || TYPE_CONFIG.candidate;
            const statusCfg = STATUS_CONFIG[lead.status || 'new'] || STATUS_CONFIG.new;
            const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');
            const cleanWa = cleanPhone.replace(/[^0-9]/g, '');

            return (
              <div
                key={lead.id}
                className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: typeCfg.bg, color: typeCfg.text }}
                    >
                      {typeCfg.label}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1"
                      style={{ background: statusCfg.bg, color: statusCfg.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{lead.contactName}</h3>
                    {lead.company && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 font-medium">
                        <Building2 size={13} className="text-blue-600 shrink-0" /> {lead.company}
                      </p>
                    )}
                    {lead.district && (
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} /> {lead.district}
                      </p>
                    )}
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 leading-relaxed line-clamp-3">
                      {lead.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-1.5">
                    {cleanPhone ? (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="py-2 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
                      >
                        <Phone size={13} /> Call
                      </a>
                    ) : null}

                    {cleanWa ? (
                      <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${lead.contactName}, this is THENIJOBS regarding your inquiry.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                        style={{ background: '#25D366' }}
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    ) : null}
                  </div>

                  {/* Move stage dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400">Move:</span>
                    <select
                      value={lead.status || 'new'}
                      onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 text-xs font-bold text-gray-800 outline-none"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.status} value={s.status}>{s.label}</option>
                      ))}
                    </select>
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
