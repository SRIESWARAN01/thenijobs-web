'use client';

import { useState, useMemo } from 'react';
import {
  Building2, CheckCircle, Clock, Loader2, MapPin, MessageCircle, Phone, TrendingUp, User, Wrench, BarChart2, Filter, ExternalLink, ArrowRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateLeadStatus } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import type { FirestoreTime } from '@/lib/firestoreTime';
import {
  Card, EmptyState, FilterSelect, PageHeader, PageShell, Pill, Stat, StatGrid, Toolbar, Tabs,
  type PillTone,
} from '@/components/dashboard';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

interface LeadDoc {
  id: string;
  contactName: string;
  phone: string;
  email: string;
  company?: string;
  companyId?: string;
  source?: string;
  type: 'candidate' | 'business' | 'service';
  status: LeadStatus;
  assignedTo?: string;
  createdAt?: FirestoreTime;
  notes?: string;
  district?: string;
}

interface CompanyDoc {
  id: string;
  name: string;
  district?: string;
  callClicks?: number;
  whatsappClicks?: number;
  enquiryCount?: number;
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

const TABS = ['All Enquiries', 'Company Lead Analytics'] as const;

export default function LeadsPage() {
  const toast = useToast();
  const { data: leads, loading: leadsLoading } = useCollection<LeadDoc>('leads');
  const { data: companies, loading: companiesLoading } = useCollection<CompanyDoc>('companies');

  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All Enquiries');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loading = leadsLoading || companiesLoading;

  // Company analytics aggregation
  const companyAnalytics = useMemo(() => {
    const map = new Map<string, {
      name: string;
      companyId?: string;
      totalEnquiries: number;
      callCount: number;
      whatsappCount: number;
      followedUp: number;
      converted: number;
      district?: string;
    }>();

    // Seed with known companies
    companies.forEach((comp) => {
      const key = comp.name.toLowerCase().trim();
      map.set(key, {
        name: comp.name,
        companyId: comp.id,
        totalEnquiries: 0,
        callCount: Number(comp.callClicks || 0),
        whatsappCount: Number(comp.whatsappClicks || 0),
        followedUp: 0,
        converted: 0,
        district: comp.district || 'Theni',
      });
    });

    // Populate from leads
    leads.forEach((l) => {
      const cName = (l.company || 'Direct Platform Lead').trim();
      const key = cName.toLowerCase();
      let record = map.get(key);
      if (!record) {
        record = {
          name: cName,
          companyId: l.companyId,
          totalEnquiries: 0,
          callCount: 0,
          whatsappCount: 0,
          followedUp: 0,
          converted: 0,
          district: l.district || 'Theni',
        };
        map.set(key, record);
      }

      record.totalEnquiries += 1;
      if (l.source === 'call' || (l.notes && l.notes.toLowerCase().includes('call'))) {
        record.callCount += 1;
      }
      if (l.source === 'whatsapp' || (l.notes && l.notes.toLowerCase().includes('whatsapp'))) {
        record.whatsappCount += 1;
      }
      if (l.status === 'contacted' || l.status === 'qualified') {
        record.followedUp += 1;
      }
      if (l.status === 'converted') {
        record.converted += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalEnquiries - a.totalEnquiries);
  }, [companies, leads]);

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

    const matchCompany = companyFilter === 'all' || company.toLowerCase() === companyFilter.toLowerCase();

    return matchSearch && matchType && matchStatus && matchCompany;
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
        description="Company-level lead tracking, Call and WhatsApp clicks, customer enquiries, and conversion analytics."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Leads' }]}
      />

      <StatGrid columns={5}>
        <Stat label="Total enquiries" value={totalCount} icon={TrendingUp} tone="blue" loading={loading} />
        <Stat label="New leads" value={newCount} icon={Clock} tone="blue" loading={loading} />
        <Stat label="In discussion" value={contactedCount} icon={Phone} tone="violet" loading={loading} />
        <Stat label="Qualified" value={qualifiedCount} icon={CheckCircle} tone="amber" loading={loading} />
        <Stat label="Onboarded" value={convertedCount} icon={TrendingUp} tone="emerald" loading={loading} />
      </StatGrid>

      <Tabs
        label="Leads View"
        tabs={TABS.map(t => ({ id: t, label: t }))}
        value={activeTab}
        onChange={(id) => setActiveTab(id as typeof TABS[number])}
      />

      {activeTab === 'Company Lead Analytics' ? (
        <div className="space-y-4">
          <Card>
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 size={18} className="text-blue-600" />
                  Company-Wise Lead Tracking &amp; Conversion Analytics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Breakdown of Call button clicks, WhatsApp enquiries, follow-ups, and conversions per business.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-3 text-center">📞 Call Clicks</th>
                    <th className="py-3 px-3 text-center">💬 WhatsApp Clicks</th>
                    <th className="py-3 px-3 text-center">Enquiries</th>
                    <th className="py-3 px-3 text-center">Follow-ups</th>
                    <th className="py-3 px-3 text-center">Converted</th>
                    <th className="py-3 px-3 text-center">Conversion Rate</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {companyAnalytics.map((ca, idx) => {
                    const total = ca.totalEnquiries + ca.callCount + ca.whatsappCount;
                    const convRate = total > 0 ? ((ca.converted / total) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-blue-600 shrink-0" />
                            <div>
                              <strong className="text-slate-900 block text-xs sm:text-sm">{ca.name}</strong>
                              <span className="text-[10px] text-slate-400">{ca.district}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                            <Phone size={10} /> {ca.callCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                            <MessageCircle size={10} /> {ca.whatsappCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                          {ca.totalEnquiries}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold">
                            {ca.followedUp}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                            {ca.converted}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                          {convRate}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setCompanyFilter(ca.name);
                              setActiveTab('All Enquiries');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-blue-600 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <span>Filter Leads</span>
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <>
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
                {companyFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setCompanyFilter('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold hover:bg-blue-200 transition-colors"
                  >
                    <span>Filtered: {companyFilter} (Clear)</span>
                  </button>
                )}
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
              description="Clear the type, status, or company filter to see every enquiry."
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
                          className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-2.5 text-base sm:text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
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
        </>
      )}
    </PageShell>
  );
}
