'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  KeyRound, ShieldCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  Phone, MessageSquare, ExternalLink, Copy, Check, Search, Filter,
  RefreshCw, Loader2, Building2, Send, ArrowRight, UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import {
  PageShell, PageHeader, StatGrid, Stat, Card, CardHeader,
  CardBody, DataTable, Pill, ActionMenu, type Column, type ActionItem, type PillTone
} from '@/components/dashboard';
import { auth } from '@/lib/firebase/config';

interface RecoveryRequest {
  id: string;
  businessId: string;
  businessName: string;
  businessTaluk?: string;
  requesterMobile: string;
  registeredMobile: string;
  registeredEmail?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'rejected_mismatch';
  createdAt?: any;
  reviewedAt?: any;
  completedAt?: any;
  adminId?: string | null;
  rejectionReason?: string;
  resetUrl?: string;
  actualCompany?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    taluk?: string;
    ownerId?: string;
  };
}

export default function AdminBusinessRecoveryPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approvalModalData, setApprovalModalData] = useState<{
    requestId: string;
    businessName: string;
    resetUrl: string;
    contactMobile: string;
  } | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<RecoveryRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchRequests = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/business-recovery/list', {
        headers: {
          Authorization: `Bearer ${idToken || ''}`,
        },
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (data.success && Array.isArray(data.requests)) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to load recovery requests:', err);
      toast.error('Error', 'Could not load business recovery requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleApprove = async (req: RecoveryRequest) => {
    setActionLoading(req.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/business-recovery/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken || ''}`,
        },
        body: JSON.stringify({ requestId: req.id }),
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (data.success) {
        toast.success('Approved', `Generated single-use 1-hour recovery link for ${req.businessName}`);
        setApprovalModalData({
          requestId: req.id,
          businessName: req.businessName,
          resetUrl: data.resetUrl,
          contactMobile: req.registeredMobile || req.requesterMobile,
        });
        fetchRequests();
      } else {
        toast.error('Approval Failed', data.error || 'Could not approve recovery request.');
      }
    } catch (err) {
      console.error('Approval error:', err);
      toast.error('Error', 'Server error while approving recovery request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalReq) return;
    setActionLoading(rejectModalReq.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/business-recovery/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken || ''}`,
        },
        body: JSON.stringify({
          requestId: rejectModalReq.id,
          reason: rejectionReason.trim() || 'Identity could not be verified by administrator.',
        }),
      });
      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (data.success) {
        toast.success('Rejected', `Recovery request for ${rejectModalReq.businessName} has been rejected.`);
        setRejectModalReq(null);
        setRejectionReason('');
        fetchRequests();
      } else {
        toast.error('Rejection Failed', data.error || 'Could not reject request.');
      }
    } catch (err) {
      console.error('Rejection error:', err);
      toast.error('Error', 'Server error while rejecting request.');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      completed: requests.filter((r) => r.status === 'completed').length,
      rejected: requests.filter((r) => r.status === 'rejected' || r.status === 'rejected_mismatch').length,
    };
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = r.businessName?.toLowerCase().includes(q);
        const matchesId = r.id?.toLowerCase().includes(q);
        const matchesReqMobile = r.requesterMobile?.includes(q);
        const matchesRegMobile = r.registeredMobile?.includes(q);
        if (!matchesName && !matchesId && !matchesReqMobile && !matchesRegMobile) return false;
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  const getStatusPill = (status: RecoveryRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Pill tone="warning" dot>Pending Review</Pill>;
      case 'approved':
        return <Pill tone="info" dot>Approved (Link Active)</Pill>;
      case 'completed':
        return <Pill tone="success" dot>Password Reset Done</Pill>;
      case 'rejected':
      case 'rejected_mismatch':
        return <Pill tone="danger" dot>Rejected</Pill>;
      default:
        return <Pill tone="neutral">{status}</Pill>;
    }
  };

  const columns: Column<RecoveryRequest>[] = [
    {
      key: 'businessName',
      header: 'Business & Request ID',
      card: 'title',
      sortValue: (r) => r.businessName,
      render: (r) => (
        <div className="flex flex-col py-1">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
            <Building2 size={15} className="text-blue-600 shrink-0" />
            <span>{r.businessName}</span>
          </div>
          <span className="font-mono text-[11px] text-gray-400 font-semibold">{r.id}</span>
          {r.businessTaluk && (
            <span className="text-[11px] text-slate-500 font-medium">{r.businessTaluk} Taluk</span>
          )}
        </div>
      ),
    },
    {
      key: 'requesterMobile',
      header: 'Requester Contact',
      render: (r) => (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-1.5">
            <Phone size={13} className="text-gray-400" />
            <a
              href={`tel:+91${r.requesterMobile}`}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              +91 {r.requesterMobile}
            </a>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`https://wa.me/91${r.requesterMobile}?text=${encodeURIComponent(
                `Hello, this is THENIJOBS Administrator regarding your account recovery request (${r.id}) for ${r.businessName}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100"
            >
              <MessageSquare size={11} /> WhatsApp Requester
            </a>
          </div>
        </div>
      ),
    },
    {
      key: 'registeredMobile',
      header: 'Database Registered Record',
      render: (r) => {
        const actualPhone = r.actualCompany?.phone || r.registeredMobile;
        const actualEmail = r.actualCompany?.email || r.registeredEmail;
        return (
          <div className="flex flex-col gap-0.5 py-1 text-xs">
            <div className="flex items-center gap-1 text-slate-700">
              <span className="text-slate-400 font-medium">Reg Phone:</span>
              <strong className="text-slate-900">+91 {actualPhone || '—'}</strong>
            </div>
            {actualEmail && (
              <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                <span className="text-slate-400">Reg Email:</span>
                <span className="truncate max-w-[170px]" title={actualEmail}>{actualEmail}</span>
              </div>
            )}
            {r.actualCompany?.phone && (
              <a
                href={`https://wa.me/91${r.actualCompany.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hello ${r.businessName}, this is THENIJOBS Administrator. A password recovery request (${r.id}) was submitted for your business account. Please confirm if this was initiated by you.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-blue-600 mt-0.5"
              >
                Verify with Registered Owner →
              </a>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      card: 'field',
      sortValue: (r) => r.status,
      render: (r) => (
        <div className="flex flex-col gap-1 py-1">
          {getStatusPill(r.status)}
          {r.rejectionReason && (
            <span className="text-[10px] text-rose-600 max-w-[150px] truncate" title={r.rejectionReason}>
              Reason: {r.rejectionReason}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => {
        const isActionable = r.status === 'pending';
        return (
          <div className="flex items-center gap-2 py-1">
            {isActionable ? (
              <>
                <button
                  type="button"
                  disabled={actionLoading === r.id}
                  onClick={() => handleApprove(r)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === r.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Approve &amp; Reset
                </button>
                <button
                  type="button"
                  disabled={actionLoading === r.id}
                  onClick={() => setRejectModalReq(r)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200 cursor-pointer disabled:opacity-50"
                >
                  <XCircle size={13} />
                  Reject
                </button>
              </>
            ) : r.status === 'approved' && r.resetUrl ? (
              <button
                type="button"
                onClick={() => {
                  setApprovalModalData({
                    requestId: r.id,
                    businessName: r.businessName,
                    resetUrl: r.resetUrl!,
                    contactMobile: r.registeredMobile,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <KeyRound size={13} /> View Reset Link
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium">No actions</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Business Account Recovery Requests"
        description="Review, verify identity against database records, and generate secure single-use password reset links for the 8 partner businesses."
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : 'text-gray-500'} />
            Refresh
          </button>
        }
      />

      {/* KPI Stats */}
      <StatGrid columns={4}>
        <Stat
          label="Total Requests"
          value={stats.total}
          icon={KeyRound}
          tone="blue"
        />
        <Stat
          label="Pending Verification"
          value={stats.pending}
          icon={Clock}
          tone="amber"
        />
        <Stat
          label="Approved / Active Links"
          value={stats.approved}
          icon={CheckCircle2}
          tone="emerald"
        />
        <Stat
          label="Completed Resets"
          value={stats.completed}
          icon={ShieldCheck}
          tone="violet"
        />
      </StatGrid>

      {/* Filters & Search */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by business name, request ID, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">All ({stats.total})</option>
                <option value="pending">Pending ({stats.pending})</option>
                <option value="approved">Approved ({stats.approved})</option>
                <option value="completed">Completed ({stats.completed})</option>
                <option value="rejected">Rejected ({stats.rejected})</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader
          title={`Recovery Queue (${filtered.length})`}
          description="Manage partner business recovery and password reset verification"
        />
        <CardBody className="p-0">
          <DataTable<RecoveryRequest>
            rows={filtered}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            emptyTitle="No Recovery Requests"
            emptyDescription="No business account recovery requests found matching your filter."
          />
        </CardBody>
      </Card>

      {/* Approval & Reset Link Delivery Modal */}
      {approvalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 size={24} />
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalData(null)}
                className="text-gray-400 hover:text-gray-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Recovery Approved for {approvalModalData.businessName}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                A single-use, 1-hour time-limited password reset link has been generated. Deliver this link to the verified business contact.
              </p>
            </div>

            {/* Generated Reset Link */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Secure Password Reset Link (Expires in 1 Hour)</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(approvalModalData.resetUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copiedLink ? 'Copied Link' : 'Copy Link'}
                </button>
              </div>
              <p className="text-xs font-mono font-bold text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                {approvalModalData.resetUrl}
              </p>
            </div>

            {/* 1-Click WhatsApp Dispatch to Verified Contact */}
            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/91${approvalModalData.contactMobile.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hello ${approvalModalData.businessName},\n\nYour THENIJOBS business account recovery request has been verified and approved.\n\nPlease use this secure single-use link to set your new password (valid for 1 hour):\n${approvalModalData.resetUrl}\n\nDo not share this link with anyone.\n— THENIJOBS Team`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={16} /> Send Reset Link via WhatsApp to +91 {approvalModalData.contactMobile}
              </a>

              <button
                type="button"
                onClick={() => setApprovalModalData(null)}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <XCircle size={24} />
              </div>
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="text-gray-400 hover:text-gray-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Reject Recovery Request
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Reject recovery for <strong>{rejectModalReq.businessName}</strong> ({rejectModalReq.id}).
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Rejection Reason (Audit Log)
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Requester phone could not be verified with registered business owner."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading === rejectModalReq.id}
                onClick={handleRejectConfirm}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {actionLoading === rejectModalReq.id ? <Loader2 size={13} className="animate-spin" /> : null}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
