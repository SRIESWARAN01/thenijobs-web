'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateLeadStatus, updateRFQ } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import {
  TrendingUp, Search, ChevronDown, CheckCircle2, XCircle,
  Clock, Phone, Mail, FileText, User, Loader2, MessageSquare,
  Send, DollarSign, Printer, X, ClipboardList, Check
} from 'lucide-react';
import Link from 'next/link';

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
  new: { label: 'New', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  contacted: { label: 'Contacted', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  qualified: { label: 'Qualified', bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-400' },
  converted: { label: 'Converted', bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  lost: { label: 'Lost', bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
};

const RFQ_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending_quote: { label: 'Needs Quote', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  quoted: { label: 'Quoted', bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-400' },
  accepted: { label: 'Accepted', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
  invoiced: { label: 'Invoiced', bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  paid: { label: 'Paid', bg: 'bg-emerald-600/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
};

export default function BusinessLeadsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'leads' | 'rfqs'>('leads');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // RFQ Drawer State
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [quoteTax, setQuoteTax] = useState<number>(0);
  const [quoteDiscount, setQuoteDiscount] = useState<number>(0);
  const [quoteTerms, setQuoteTerms] = useState<string>('Due on Receipt');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [quoteSaving, setQuoteSaving] = useState<boolean>(false);

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

  // 3. Fetch RFQs
  const { data: rfqs, loading: rfqsLoading } = useCollection<any>('rfqs', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    setActionLoading(leadId);
    try {
      await updateLeadStatus(leadId, status);
      alert(`Lead status updated to ${status}`);
    } catch (err) {
      console.error(err);
      alert('Failed to update lead status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRfq = (rfq: any) => {
    setSelectedRfq(rfq);
    setQuotePrice(rfq.quotedPricePerUnit || 0);
    setQuoteTax(rfq.quotedTaxPercent || 0);
    setQuoteDiscount(rfq.quotedDiscount || 0);
    setQuoteTerms(rfq.paymentTerms || 'Due on Receipt');
    setQuoteNotes(rfq.notes || '');
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;

    setQuoteSaving(true);
    try {
      const subtotal = quotePrice * selectedRfq.quantity;
      const taxAmount = subtotal * (quoteTax / 100);
      const quotedTotal = subtotal + taxAmount - quoteDiscount;

      await updateRFQ(selectedRfq.id, {
        status: 'quoted',
        quotedPricePerUnit: Number(quotePrice),
        quotedTaxPercent: Number(quoteTax),
        quotedDiscount: Number(quoteDiscount),
        quotedTotal,
        paymentTerms: quoteTerms,
        notes: quoteNotes,
      });

      alert('Quotation saved successfully!');
      setSelectedRfq((prev: any) => ({
        ...prev,
        status: 'quoted',
        quotedPricePerUnit: Number(quotePrice),
        quotedTaxPercent: Number(quoteTax),
        quotedDiscount: Number(quoteDiscount),
        quotedTotal,
        paymentTerms: quoteTerms,
        notes: quoteNotes,
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to save quotation.');
    } finally {
      setQuoteSaving(false);
    }
  };

  const handleUpdateRfqStatus = async (rfqId: string, status: string) => {
    setActionLoading(rfqId);
    try {
      await updateRFQ(rfqId, { status });
      alert(`RFQ status updated to ${status}`);
      if (selectedRfq && selectedRfq.id === rfqId) {
        setSelectedRfq((prev: any) => ({ ...prev, status }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update RFQ status');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = (rfq: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const subtotal = rfq.quotedPricePerUnit * rfq.quantity;
    const tax = subtotal * (rfq.quotedTaxPercent / 100);
    const total = subtotal + tax - rfq.quotedDiscount;

    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation / Invoice #${rfq.id.slice(0, 8).toUpperCase()}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .title { font-size: 24px; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .info-box { border: 1px solid #eee; padding: 15px; border-radius: 8px; }
            .info-title { font-weight: bold; margin-bottom: 5px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
            th { background: #f9f9f9; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 12px; }
            .footer { margin-top: 60px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">QUOTATION / INVOICE</div>
              <div style="color: #666; margin-top: 5px;">ID: #${rfq.id.toUpperCase()}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 18px;">${company?.name || 'THENIJOBS Partner'}</div>
              <div>${company?.email || ''}</div>
              <div>${company?.phone || ''}</div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <div class="info-title">Bill To:</div>
              <div style="font-weight: bold;">${rfq.customerName}</div>
              <div>Phone: ${rfq.customerPhone}</div>
              <div>Email: ${rfq.customerEmail || 'N/A'}</div>
            </div>
            <div class="info-box">
              <div class="info-title">Details:</div>
              <div>Date: ${rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : 'N/A'}</div>
              <div>Payment Terms: ${rfq.paymentTerms || 'Due on Receipt'}</div>
              <div>Target Delivery: ${rfq.targetDeliveryDate ? new Date(rfq.targetDeliveryDate).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item / Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${rfq.productName}</strong></td>
                <td>${rfq.quantity}</td>
                <td>₹${rfq.quotedPricePerUnit}</td>
                <td>₹${subtotal}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal}</span>
            </div>
            <div class="total-row">
              <span>Tax (${rfq.quotedTaxPercent}%):</span>
              <span>₹${tax.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Discount:</span>
              <span>-₹${rfq.quotedDiscount}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>₹${total.toFixed(2)}</span>
            </div>
          </div>

          ${rfq.notes ? `
            <div style="margin-top: 40px; padding: 15px; border-left: 4px solid #ccc; background: #f9f9f9;">
              <strong>Terms & Notes:</strong>
              <p style="margin: 5px 0 0 0; color: #555;">${rfq.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            Thank you for your business!<br/>
            Generated via THENIJOBS B2B Marketplace Platform.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShareWhatsApp = (rfq: any) => {
    const subtotal = rfq.quotedPricePerUnit * rfq.quantity;
    const tax = subtotal * (rfq.quotedTaxPercent / 100);
    const total = (subtotal + tax - rfq.quotedDiscount).toFixed(2);
    
    const text = `Hi ${rfq.customerName}! We have generated a quote for your bulk inquiry on "${rfq.productName}" (Quantity: ${rfq.quantity}).\n\n*Quote Summary:*\n- Unit Price: ₹${rfq.quotedPricePerUnit}\n- Tax: ${rfq.quotedTaxPercent}%\n- Discount: ₹${rfq.quotedDiscount}\n- *Grand Total: ₹${total}*\n\nTerms: ${rfq.paymentTerms || 'Due on Receipt'}\n\nPlease let us know if you would like to proceed. Thank you!`;
    const encoded = encodeURIComponent(text);
    
    const digits = rfq.customerPhone.replace(/\D/g, '');
    const phone = digits.length === 10 ? `91${digits}` : digits;
    
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'LD';
  };

  const getWhatsAppNumber = (phone?: string) => {
    const digits = phone?.replace(/\D/g, '') || '';
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (lead.service || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.message || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRfqs = rfqs.filter((rfq) => {
    const matchesSearch = rfq.customerName.toLowerCase().includes(search.toLowerCase()) ||
      rfq.productName.toLowerCase().includes(search.toLowerCase()) ||
      (rfq.message || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const loading = companyLoading || leadsLoading || rfqsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <TrendingUp size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view and manage customer leads.</p>
        <Link href="/business/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  // Calculate live quote subtotal/totals
  const liveSubtotal = quotePrice * (selectedRfq?.quantity || 1);
  const liveTaxAmount = liveSubtotal * (quoteTax / 100);
  const liveTotal = liveSubtotal + liveTaxAmount - quoteDiscount;

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-outfit">Leads & Enquiries</h1>
        <p className="text-sm text-gray-400 mt-1">Manage quote requests and direct inquiries from your public business page.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.06] self-start max-w-sm">
        <button
          onClick={() => { setActiveTab('leads'); setStatusFilter('all'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'leads'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare size={14} />
          Direct Leads
        </button>
        <button
          onClick={() => { setActiveTab('rfqs'); setStatusFilter('all'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'rfqs'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ClipboardList size={14} />
          Product RFQs (B2B)
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading inquiries...</p>
        </div>
      ) : (
        <>
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none transition-all cursor-pointer bg-[#0a0a1a]"
              >
                <option value="all">All Statuses</option>
                {activeTab === 'leads' ? (
                  <>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </>
                ) : (
                  <>
                    <option value="pending_quote">Needs Quote</option>
                    <option value="quoted">Quoted</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Tab 1: Direct Leads */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              {filteredLeads.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <TrendingUp size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No leads or enquiries received yet.</p>
                </div>
              ) : (
                filteredLeads.map((lead) => {
                  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                  return (
                    <div key={lead.id} className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">{getInitials(lead.customerName)}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-white">{lead.customerName}</h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </div>
                          
                          {lead.service && (
                            <p className="text-xs text-emerald-400 font-medium">Interested in: {lead.service}</p>
                          )}
                          
                          {lead.message && (
                            <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] whitespace-pre-wrap">{lead.message}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                            {lead.customerPhone && (
                              <span className="flex items-center gap-1"><Phone size={12} className="text-emerald-500" /> {lead.customerPhone}</span>
                            )}
                            {lead.customerEmail && (
                              <span className="flex items-center gap-1"><Mail size={12} className="text-emerald-500" /> {lead.customerEmail}</span>
                            )}
                            <span>Received: {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {lead.customerPhone && (
                              <a
                                href={`tel:${lead.customerPhone}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-gray-200 hover:border-emerald-400/30 hover:text-emerald-200"
                              >
                                <Phone size={12} /> Call
                              </a>
                            )}
                            {getWhatsAppNumber(lead.customerPhone) && (
                              <a
                                href={`https://wa.me/${getWhatsAppNumber(lead.customerPhone)}?text=${encodeURIComponent(`Hi ${lead.customerName}, we received your inquiry regarding our products/services.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/15"
                              >
                                <MessageSquare size={12} /> WhatsApp
                              </a>
                            )}
                            {lead.customerEmail && (
                              <a
                                href={`mailto:${lead.customerEmail}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-gray-200 hover:border-emerald-400/30 hover:text-emerald-200"
                              >
                                <Mail size={12} /> Email
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {actionLoading === lead.id ? (
                            <Loader2 size={16} className="text-emerald-400 animate-spin" />
                          ) : (
                            <div className="relative">
                              <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 outline-none focus:border-emerald-500/40 cursor-pointer bg-[#0e0e22]"
                              >
                                <option value="new">Mark New</option>
                                <option value="contacted">Mark Contacted</option>
                                <option value="qualified">Mark Qualified</option>
                                <option value="converted">Mark Converted</option>
                                <option value="lost">Mark Lost</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: B2B RFQs */}
          {activeTab === 'rfqs' && (
            <div className="space-y-4">
              {filteredRfqs.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <ClipboardList size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No B2B RFQs received yet.</p>
                </div>
              ) : (
                filteredRfqs.map((rfq) => {
                  const statusCfg = RFQ_STATUS_CONFIG[rfq.status] || RFQ_STATUS_CONFIG.pending_quote;
                  return (
                    <div key={rfq.id} className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">{getInitials(rfq.customerName)}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-white">{rfq.customerName}</h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </div>

                          <div className="text-xs space-y-0.5">
                            <p className="text-gray-400">Product: <span className="text-white font-semibold">{rfq.productName}</span></p>
                            <p className="text-gray-400">Quantity: <span className="text-emerald-400 font-semibold">{rfq.quantity} units</span></p>
                            {rfq.targetDeliveryDate && (
                              <p className="text-gray-400">Target Delivery: <span className="text-white">{new Date(rfq.targetDeliveryDate).toLocaleDateString()}</span></p>
                            )}
                          </div>
                          
                          {rfq.message && (
                            <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] whitespace-pre-wrap">{rfq.message}</p>
                          )}

                          {rfq.quotedTotal && (
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400 flex items-center justify-between max-w-xs">
                              <span>Quoted Total:</span>
                              <span className="font-bold">₹{rfq.quotedTotal.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                            {rfq.customerPhone && (
                              <span className="flex items-center gap-1"><Phone size={12} className="text-emerald-500" /> {rfq.customerPhone}</span>
                            )}
                            {rfq.customerEmail && (
                              <span className="flex items-center gap-1"><Mail size={12} className="text-emerald-500" /> {rfq.customerEmail}</span>
                            )}
                            <span>Received: {rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              onClick={() => handleOpenRfq(rfq)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/[0.08]"
                            >
                              <FileText size={12} />
                              {rfq.status === 'pending_quote' ? 'Prepare Quote' : 'View Quote / Invoice'}
                            </button>
                            {rfq.status === 'quoted' && (
                              <>
                                <button
                                  onClick={() => handleShareWhatsApp(rfq)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/15"
                                >
                                  <MessageSquare size={12} /> Send via WhatsApp
                                </button>
                                <button
                                  onClick={() => handlePrint(rfq)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-gray-200 hover:border-emerald-400/30 hover:text-emerald-200"
                                >
                                  <Printer size={12} /> Print
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {actionLoading === rfq.id ? (
                            <Loader2 size={16} className="text-emerald-400 animate-spin" />
                          ) : (
                            <div className="relative">
                              <select
                                value={rfq.status}
                                onChange={(e) => handleUpdateRfqStatus(rfq.id, e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 outline-none focus:border-emerald-500/40 cursor-pointer bg-[#0e0e22]"
                              >
                                <option value="pending_quote">Needs Quote</option>
                                <option value="quoted">Quoted</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="invoiced">Invoiced</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* RFQ Drawer / Details & Quotation Builder */}
      {selectedRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in font-outfit">
          <div className="bg-[#0e0e22] border-l border-white/[0.08] w-full max-w-lg h-full flex flex-col shadow-2xl animate-slide-in-right">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList size={18} className="text-emerald-400" />
                  RFQ Details
                </h2>
                <p className="text-xs text-gray-500 mt-1">ID: #{selectedRfq.id.toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedRfq(null)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              
              {/* Inquiry Info */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Customer Inquiry</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Customer</span>
                    <span className="font-medium text-white">{selectedRfq.customerName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Phone</span>
                    <span className="font-medium text-white">{selectedRfq.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Email</span>
                    <span className="font-medium text-white">{selectedRfq.customerEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Target Delivery</span>
                    <span className="font-medium text-white">
                      {selectedRfq.targetDeliveryDate ? new Date(selectedRfq.targetDeliveryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 block">Requested Product</span>
                    <span className="font-bold text-white text-base">{selectedRfq.productName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Quantity Requested</span>
                    <span className="font-bold text-emerald-400 text-lg">{selectedRfq.quantity} units</span>
                  </div>
                </div>

                {selectedRfq.message && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <span className="text-xs text-gray-500 block">Customer Message</span>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedRfq.message}</p>
                  </div>
                )}
              </div>

              {/* Quotation Editor */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-400" />
                  Quotation Editor
                </h3>

                <form onSubmit={handleSaveQuotation} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quotePrice" className="text-xs font-semibold text-gray-400 block mb-1">Price per Unit (₹) *</label>
                      <input
                        id="quotePrice"
                        type="number"
                        required
                        min={0}
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="quoteTax" className="text-xs font-semibold text-gray-400 block mb-1">Tax Rate (%)</label>
                      <input
                        id="quoteTax"
                        type="number"
                        min={0}
                        value={quoteTax}
                        onChange={(e) => setQuoteTax(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none"
                        placeholder="E.g. 18"
                      />
                    </div>

                    <div>
                      <label htmlFor="quoteDiscount" className="text-xs font-semibold text-gray-400 block mb-1">Flat Discount (₹)</label>
                      <input
                        id="quoteDiscount"
                        type="number"
                        min={0}
                        value={quoteDiscount}
                        onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none"
                        placeholder="E.g. 100"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-400 block mb-1">Payment Terms</label>
                      <select
                        value={quoteTerms}
                        onChange={(e) => setQuoteTerms(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none bg-[#0e0e22]"
                      >
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="50% Advance / 50% Delivery">50% Advance / 50% Delivery</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Seller Notes / Terms</label>
                    <textarea
                      rows={3}
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="E.g., Quotation valid for 30 days. Shipping charges extra."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none resize-none"
                    />
                  </div>

                  {/* Calculations Preview */}
                  <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-xs space-y-2">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal ({selectedRfq.quantity} units):</span>
                      <span>₹{liveSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>GST / Tax ({quoteTax}%):</span>
                      <span>₹{liveTaxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Discount:</span>
                      <span className="text-rose-400">-₹{quoteDiscount.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/[0.08] my-1" />
                    <div className="flex justify-between text-sm font-bold text-white">
                      <span>Net Quotation Total:</span>
                      <span className="text-emerald-400 text-base">₹{liveTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={quoteSaving}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {quoteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={14} />}
                    {selectedRfq.status === 'pending_quote' ? 'Send Quotation' : 'Update Quotation'}
                  </button>
                </form>
              </div>

              {/* Printable Invoice Block preview inside Drawer */}
              {selectedRfq.status !== 'pending_quote' && (
                <div className="pt-4 border-t border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Quotation / Invoice Preview</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePrint(selectedRfq)}
                        className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-gray-300 hover:text-white"
                        title="Print Quote"
                      >
                        <Printer size={13} />
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(selectedRfq)}
                        className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-300"
                        title="Share on WhatsApp"
                      >
                        <MessageSquare size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white text-slate-800 border border-slate-200 text-xs space-y-4 shadow-inner">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">QUOTATION</h4>
                        <span className="text-[10px] text-slate-500 block">ID: #{selectedRfq.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{company?.name || 'THENIJOBS Partner'}</span>
                        <span className="text-[10px] text-slate-500 block">{company?.phone || ''}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Bill To:</span>
                        <span className="font-bold text-slate-900 block">{selectedRfq.customerName}</span>
                        <span className="text-slate-500 block">{selectedRfq.customerPhone}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Terms:</span>
                        <span className="font-medium text-slate-800 block">{selectedRfq.paymentTerms || 'Due on Receipt'}</span>
                      </div>
                    </div>

                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold">
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-right">Qty</th>
                          <th className="pb-2 text-right">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-slate-700 font-medium">
                          <td className="py-2">{selectedRfq.productName}</td>
                          <td className="py-2 text-right">{selectedRfq.quantity}</td>
                          <td className="py-2 text-right">₹{selectedRfq.quotedPricePerUnit}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="border-t border-slate-100 pt-3 space-y-1.5 max-w-[200px] ml-auto text-right font-medium">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span>₹{(selectedRfq.quotedPricePerUnit * selectedRfq.quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Tax ({selectedRfq.quotedTaxPercent}%):</span>
                        <span>₹{((selectedRfq.quotedPricePerUnit * selectedRfq.quantity) * (selectedRfq.quotedTaxPercent / 100)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-rose-500">
                        <span>Discount:</span>
                        <span>-₹{selectedRfq.quotedDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold text-sm border-t border-slate-200 pt-2">
                        <span>Total:</span>
                        <span>₹{selectedRfq.quotedTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedRfq.notes && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border-l-2 border-slate-300 text-slate-600 text-[10px]">
                        <strong>Seller Terms:</strong> {selectedRfq.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
