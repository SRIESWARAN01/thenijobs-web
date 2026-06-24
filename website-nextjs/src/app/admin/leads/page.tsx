'use client';

import { useState } from 'react';
import {
  TrendingUp, Search, ChevronDown, Phone, Mail,
  MessageSquare, Download, User, Building2, Wrench,
  ArrowRight, Clock, CheckCircle, ChevronRight,
  Calendar, Loader2
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateLeadStatus } from '@/lib/firebase/firestoreService';
import { Select } from '@/components/ui/Select';

// ===== TYPES =====
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

// ===== CONSTANTS =====
const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; dot: string; borderColor: string }> = {
  new: { label: 'New', bg: 'bg-cyan-500/15', text: 'text-cyan-400', dot: 'bg-cyan-400', borderColor: 'border-cyan-500/30' },
  contacted: { label: 'Contacted', bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400', borderColor: 'border-violet-500/30' },
  qualified: { label: 'Qualified', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', borderColor: 'border-amber-500/30' },
  converted: { label: 'Converted', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', borderColor: 'border-emerald-500/30' },
  lost: { label: 'Lost', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400', borderColor: 'border-rose-500/30' },
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof User; bg: string; text: string }> = {
  candidate: { label: 'Candidate', icon: User, bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  business: { label: 'Business', icon: Building2, bg: 'bg-violet-500/10', text: 'text-violet-400' },
  service: { label: 'Service', icon: Wrench, bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

const PIPELINE_STAGES: { status: LeadStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'qualified', label: 'Qualified' },
  { status: 'converted', label: 'Converted' },
  { status: 'lost', label: 'Lost' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'candidate', label: 'Candidate' },
  { value: 'business', label: 'Business' },
  { value: 'service', label: 'Service' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

export default function LeadsPage() {
  const { data: leads, loading } = useCollection<LeadDoc>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const contactName = lead.contactName || '';
    const company = lead.company || '';
    const matchSearch = contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.toLowerCase().includes(searchQuery.toLowerCase());
    
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
    } catch (err) {
      console.error('Update lead status error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic pipeline stats
  const totalCount = leads.length;
  const newCount = leads.filter((l) => (l.status || 'new') === 'new').length;
  const contactedCount = leads.filter((l) => l.status === 'contacted').length;
  const qualifiedCount = leads.filter((l) => l.status === 'qualified').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;

  const stats = [
    { label: 'Total Leads', value: totalCount, icon: TrendingUp, color: 'violet' },
    { label: 'New', value: newCount, icon: Clock, color: 'cyan' },
    { label: 'Contacted', value: contactedCount, icon: Phone, color: 'violet' },
    { label: 'Qualified', value: qualifiedCount, icon: CheckCircle, color: 'amber' },
    { label: 'Converted', value: convertedCount, icon: TrendingUp, color: 'emerald' },
  ];

  const statColorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Lead Management</h1>
          <p className="text-sm text-gray-400 mt-1">Track and manage potential customers through your pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const colors = statColorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/[0.15] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon size={18} className={colors.text} />
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-outfit">{stat.value}</p>
                  <p className="text-[10px] text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Visual */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Lead Pipeline</h2>
        <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const cfg = STATUS_CONFIG[stage.status];
            const count = leads.filter((l) => (l.status || 'new') === stage.status).length;
            return (
              <div key={stage.status} className="flex items-center gap-2 flex-1 min-w-[120px]">
                <div className={`flex-1 rounded-xl p-4 ${cfg.bg} border ${cfg.borderColor} text-center`}>
                  <p className={`text-2xl font-bold ${cfg.text} font-outfit`}>{count}</p>
                  <p className="text-xs text-gray-400 mt-1">{stage.label}</p>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight size={16} className="text-gray-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search leads by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTIONS}
            placeholder="All Types"
            className="w-40"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="All Status"
            className="w-40"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading leads from Firestore...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Company / Source</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Assigned To</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLeads.map((lead) => {
                  const leadStatus = lead.status || 'new';
                  const statusCfg = STATUS_CONFIG[leadStatus];
                  const leadType = lead.type || 'candidate';
                  const typeCfg = TYPE_CONFIG[leadType] || TYPE_CONFIG.candidate;
                  const TypeIcon = typeCfg.icon;
                  const isExpanded = expandedLead === lead.id;

                  return (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setExpandedLead(isExpanded ? null : lead.id)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${typeCfg.bg} flex items-center justify-center flex-shrink-0`}>
                            <TypeIcon size={16} className={typeCfg.text} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{lead.contactName}</p>
                            <p className="text-xs text-gray-500 truncate">{lead.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-sm text-gray-300">{lead.company || 'Personal'}</p>
                        <p className="text-[10px] text-gray-600">via {lead.source || 'Website'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeCfg.bg} ${typeCfg.text}`}>
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {actionLoading === lead.id ? (
                          <Loader2 size={14} className="text-violet-400 animate-spin" />
                        ) : (
                          <div className="relative">
                            <select
                              value={leadStatus}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                              className={`pl-2 pr-7 py-1 rounded-lg text-xs font-semibold ${statusCfg.bg} ${statusCfg.text} outline-none cursor-pointer border border-transparent hover:border-white/10`}
                            >
                              <option value="new" className="bg-black text-white">New</option>
                              <option value="contacted" className="bg-black text-white">Contacted</option>
                              <option value="qualified" className="bg-black text-white">Qualified</option>
                              <option value="converted" className="bg-black text-white">Converted</option>
                              <option value="lost" className="bg-black text-white">Lost</option>
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-gray-300">{lead.assignedTo || 'Unassigned'}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="text-sm text-gray-400">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <a href={`tel:${lead.phone}`} className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Call" onClick={(e) => e.stopPropagation()}>
                            <Phone size={15} />
                          </a>
                          <a href={`mailto:${lead.email}`} className="p-2 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all" title="Email" onClick={(e) => e.stopPropagation()}>
                            <Mail size={15} />
                          </a>
                          <ChevronRight size={15} className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <TrendingUp size={28} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400">No leads found</p>
            <p className="text-xs text-gray-600 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
