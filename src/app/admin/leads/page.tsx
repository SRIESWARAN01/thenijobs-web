'use client';

import { useState } from 'react';
import {
  Building2, CheckCircle, Clock, Loader2, MapPin, MessageCircle, Phone, TrendingUp, User, Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateLeadStatus } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import type { FirestoreTime } from '@/lib/firestoreTime';
import {
  Card, EmptyState, FilterSelect, PageHeader, PageShell, Pill, Stat, StatGrid, Toolbar,
  type PillTone,
} from '@/components/dashboard';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

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
  createdAt?: FirestoreTime;
  notes?: string;
  district?: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; tone: PillTone }> = {
  new:       { label: 'New lead', tone: 'info' },
  contacted: { label: 'Contacted', tone: 'violet' },
  qualified: { label: 'Qualified', tone: 'warning' },
  converted: { label: 'Converted', tone: 'success' },
  lost:      { label: 'Lost', tone: 'danger' },
};

const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon; tone: PillTone }> = {
  candidate: { label: 'Candidate', icon: User, tone: 'info' },
  business:  { label: 'Business', icon: Building2, tone: 'violet' },
  service:   { label: 'Service', icon: Wrench, tone: 'warning' },
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
    } catch (err) {
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

  return (
    <PageShell>
      <PageHeader
        title="Leads & marketplace enquiries"
        description="Customer enquiries, supplier requests and franchise onboarding leads."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Leads' }]}
      />

      <StatGrid columns={5}>
        <Stat label="Total enquiries" value={totalCount} icon={TrendingUp} tone="blue" loading={loading} />
        <Stat label="New leads" value={newCount} icon={Clock} tone="blue" loading={loading} />
        <Stat label="In discussion" value={contactedCount} icon={Phone} tone="violet" loading={loading} />
        <Stat label="Qualified" value={qualifiedCount} icon={CheckCircle} tone="amber" loading={loading} />
        <Stat label="Onboarded" value={convertedCount} icon={TrendingUp} tone="emerald" loading={loading} />
      </StatGrid>

      <Toolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by contact, phone or company…"
        filters={
          <>
            <FilterSelect
              label="Lead type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { label: 'All types', value: 'all' },
                { label: 'Candidate', value: 'candidate' },
                { label: 'Business', value: 'business' },
                { label: 'Service', value: 'service' },
              ]}
            />
            <FilterSelect
              label="Lead status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All status', value: 'all' },
                ...PIPELINE_STAGES.map(s => ({ label: s.label, value: s.status })),
              ]}
            />
          </>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 size={30} className="animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading enquiries…</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No leads match this filter"
          description="Clear the type or status filter to see every enquiry."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredLeads.map((lead) => {
            const typeCfg = TYPE_CONFIG[lead.type || 'candidate'] || TYPE_CONFIG.candidate;
            const statusCfg = STATUS_CONFIG[lead.status || 'new'] || STATUS_CONFIG.new;
            const TypeIcon = typeCfg.icon;
            const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');
            const cleanWa = cleanPhone.replace(/[^0-9]/g, '');
            const busy = actionLoading === lead.id;

            return (
              <Card key={lead.id} className="flex flex-col justify-between gap-3.5 p-4 transition-shadow hover:shadow-md sm:p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Pill tone={typeCfg.tone}>
                      <TypeIcon size={11} aria-hidden /> {typeCfg.label}
                    </Pill>
                    <Pill tone={statusCfg.tone} dot>{statusCfg.label}</Pill>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold leading-snug text-slate-900">{lead.contactName || 'Unnamed contact'}</h3>
                    {lead.company && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-600">
                        <Building2 size={13} className="shrink-0 text-blue-600" aria-hidden /> {lead.company}
                      </p>
                    )}
                    {lead.district && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} aria-hidden /> {lead.district}
                      </p>
                    )}
                  </div>

                  {lead.notes && (
                    <p className="line-clamp-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600">
                      {lead.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-[#EFF6FF] text-xs font-semibold text-[#1E40AF] transition-colors hover:bg-blue-100"
                      >
                        <Phone size={13} aria-hidden /> Call
                      </a>
                    )}
                    {cleanWa && (
                      <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${lead.contactName}, this is THENIJOBS regarding your inquiry.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-white shadow-sm"
                        style={{ background: '#25D366' }}
                      >
                        <MessageCircle size={13} aria-hidden /> WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor={`stage-${lead.id}`} className="shrink-0 text-xs font-semibold text-slate-500">
                      Stage
                    </label>
                    <select
                      id={`stage-${lead.id}`}
                      value={lead.status || 'new'}
                      disabled={busy}
                      onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.status} value={s.status}>{s.label}</option>
                      ))}
                    </select>
                    {busy && <Loader2 size={14} className="shrink-0 animate-spin text-blue-600" aria-label="Saving" />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
