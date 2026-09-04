'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2, Search, CheckCircle, XCircle,
  Star, Crown, MapPin, BadgeCheck, Clock, Loader2, Download,
  Phone, MessageCircle, AlertCircle, X, Send, Eye, RefreshCw,
  Globe, Mail, ShieldCheck, User, ExternalLink, FileText, Check,
  FileSpreadsheet, Upload, Edit3, Save, Trash2, Copy
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { approveCompany, rejectCompany, featureCompany, updateDocument, deleteCompany } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import { exportCompaniesToExcel } from '@/lib/excel/companyExcelService';
import { slugifyCompany } from '@/lib/companySlug';
import {
  ActionMenu, DataTable, Pill, ViewToggle, useViewMode,
  type ActionItem, type Column, type PillTone,
} from '@/components/dashboard';

const STATUS_TONE: Record<string, PillTone> = {
  pending: 'warning',
  under_review: 'info',
  verified: 'success',
  rejected: 'danger',
};

interface BusinessDoc {
  id: string;
  name: string;
  category?: string;
  district?: string;
  address?: string;
  ownerName?: string;
  contactPerson?: string;
  designation?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  /** Canonical banner field in Firestore. `bannerUrl` is the legacy alias still read by
      CompanyProfileClient; new writes go to coverUrl. */
  coverUrl?: string;
  bannerUrl?: string;
  slug?: string;
  establishedYear?: string;
  googleMapsUrl?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
  services?: string[];
  employeeCount?: string;
  verificationStatus?: 'pending' | 'under_review' | 'verified' | 'rejected';
  rejectionReason?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  createdAt?: any;
  description?: string;
  tagline?: string;
  proofType?: string;
  proofNumber?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:      { bg: '#FFFBEB', text: '#D97706', label: 'Pending Verification' },
  under_review: { bg: '#EFF6FF', text: '#2563EB', label: 'Under Review' },
  verified:     { bg: '#ECFDF5', text: '#059669', label: 'Verified & Active' },
  rejected:     { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected / Needs Revision' },
};

const TABS = ['All', 'Pending', 'Verified', 'Rejected', 'Featured', 'Duplicates'] as const;
const CATEGORIES = ['All Categories', 'Agriculture & Farming', 'Automobile & Transport', 'Banking & Finance', 'Construction & Real Estate', 'Education & Training', 'Healthcare & Hospital', 'Hotel, Food & Restaurant', 'IT, Software & Digital', 'Manufacturing & Industry', 'Retail, Shop & Supermarket', 'Textiles & Garments', 'Security & Facility', 'Professional & Business Services', 'General Business'];
const DISTRICTS = ['All Districts', 'Theni', 'Periyakulam', 'Cumbum', 'Bodinayakanur', 'Chinnamanur', 'Andipatti', 'Uthamapalayam', 'Madurai', 'Dindigul', 'Chennai', 'Coimbatore'];

const BG_PALETTE = ['#EFF6FF','#ECFDF5','#FFFBEB','#F5F3FF','#FFF1F2','#F0F9FF'];
const COLOR_PALETTE = ['#2563EB','#059669','#D97706','#7C3AED','#E11D48','#0284C7'];

const QUICK_REJECTION_REASONS = [
  'Please provide a valid shop/office address in Theni district.',
  'Phone number was unreachable during verification check.',
  'Please submit MSME/Udyam or Shop License proof number.',
  'Duplicate company profile already exists.',
  'Business details and category are incomplete.'
];

export default function BusinessesPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { data: businesses, loading } = useCollection<BusinessDoc>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [view, setView] = useViewMode('admin-businesses', 'table');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Preview Modal State
  const [previewBiz, setPreviewBiz] = useState<BusinessDoc | null>(null);

  // Reject Modal State
  const [rejectingBiz, setRejectingBiz] = useState<BusinessDoc | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Delete Modal State
  const [deletingBiz, setDeletingBiz] = useState<BusinessDoc | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteCompany = async () => {
    if (!deletingBiz) return;
    setDeleteLoading(true);
    try {
      await deleteCompany(deletingBiz.id, currentUser?.uid || 'admin');
      toast.success('Business Deleted', `${deletingBiz.name} was successfully removed.`);
      if (previewBiz?.id === deletingBiz.id) setPreviewBiz(null);
      if (editingBiz?.id === deletingBiz.id) setEditingBiz(null);
      setDeletingBiz(null);
    } catch (e: any) {
      console.error('Delete company error:', e);
      toast.error('Deletion Failed', e.message || 'Could not delete business.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Auto-Clean All Duplicates
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  const handleAutoCleanDuplicates = async () => {
    if (!confirm('This will keep the verified or most complete copy for each business and permanently delete all duplicate company entries from Firestore. Proceed?')) return;

    setCleaningDuplicates(true);
    try {
      const groups = new Map<string, BusinessDoc[]>();
      businesses.forEach(b => {
        const p = (b.phone || '').replace(/\D/g, '');
        const key = p.length === 10 ? `phone_${p}` : `name_${(b.name || '').trim().toLowerCase()}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(b);
      });

      let removedCount = 0;
      for (const [, list] of groups.entries()) {
        if (list.length > 1) {
          list.sort((a, b) => {
            if (a.verificationStatus === 'verified' && b.verificationStatus !== 'verified') return -1;
            if (b.verificationStatus === 'verified' && a.verificationStatus !== 'verified') return 1;
            return (b.address?.length || 0) - (a.address?.length || 0);
          });
          const toDelete = list.slice(1);
          for (const item of toDelete) {
            await deleteCompany(item.id, currentUser?.uid || 'admin');
            removedCount++;
          }
        }
      }
      toast.success('Duplicates Cleaned! 🧹', `Successfully removed ${removedCount} duplicate company profiles.`);
    } catch (err: any) {
      toast.error('Clean duplicates failed: ' + err.message);
    } finally {
      setCleaningDuplicates(false);
    }
  };


  // Edit Business Modal State
  const [editingBiz, setEditingBiz] = useState<BusinessDoc | null>(null);
  const [editBizForm, setEditBizForm] = useState({
    name: '',
    category: 'Retail, Shop & Supermarket',
    district: 'Theni',
    address: '',
    ownerName: '',
    contactPerson: '',
    designation: 'Proprietor / MD',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    tagline: '',
    description: '',
    proofType: 'MSME / Udyam Registration',
    proofNumber: '',
    verificationStatus: 'verified' as 'pending' | 'under_review' | 'verified' | 'rejected',
    isFeatured: false,
    isPremium: false,
    employeeCount: '1-10',
    logoUrl: '',
    coverUrl: '',
    establishedYear: '',
    googleMapsUrl: '',
    instagram: '',
    facebook: '',
    youtube: '',
    linkedin: '',
  });
  const [editBizLoading, setEditBizLoading] = useState(false);
  const [editBizError, setEditBizError] = useState('');

  const openEditBizModal = (biz: BusinessDoc) => {
    setEditingBiz(biz);
    setEditBizForm({
      name: biz.name || '',
      category: biz.category || 'Retail, Shop & Supermarket',
      district: biz.district || 'Theni',
      address: biz.address || '',
      ownerName: biz.ownerName || '',
      contactPerson: biz.contactPerson || '',
      designation: biz.designation || 'Proprietor / MD',
      phone: biz.phone || '',
      whatsapp: biz.whatsapp || biz.phone || '',
      email: biz.email || '',
      website: biz.website || '',
      tagline: biz.tagline || '',
      description: biz.description || '',
      proofType: biz.proofType || 'MSME / Udyam Registration',
      proofNumber: biz.proofNumber || '',
      verificationStatus: (biz.verificationStatus as any) || 'pending',
      isFeatured: !!biz.isFeatured,
      isPremium: !!biz.isPremium,
      employeeCount: biz.employeeCount || '1-10',
      logoUrl: biz.logoUrl || '',
      coverUrl: biz.coverUrl || biz.bannerUrl || '',
      establishedYear: biz.establishedYear || '',
      googleMapsUrl: biz.googleMapsUrl || '',
      instagram: biz.instagram || '',
      facebook: biz.facebook || '',
      youtube: biz.youtube || '',
      linkedin: biz.linkedin || '',
    });
    setEditBizError('');
  };

  const handleSaveBizEdit = async () => {
    if (!editingBiz) return;
    if (!editBizForm.name.trim() || !editBizForm.phone.trim()) {
      setEditBizError('Company Name and Phone Number are required.');
      return;
    }
    setEditBizLoading(true);
    setEditBizError('');
    try {
      const trimmedName = editBizForm.name.trim();
      // Always (re)write the slug. A company saved without one is unreachable at
      // /company/<slug> even though the directory card links there — that is how
      // "sarvesh super market" ended up rendering as a different business entirely.
      const derivedSlug = editingBiz.slug || slugifyCompany(trimmedName);

      await updateDocument('companies', editingBiz.id, {
        name: trimmedName,
        slug: derivedSlug,
        slugLower: derivedSlug.toLowerCase(),
        category: editBizForm.category,
        district: editBizForm.district,
        address: editBizForm.address.trim(),
        ownerName: editBizForm.ownerName.trim(),
        contactPerson: editBizForm.contactPerson.trim(),
        designation: editBizForm.designation.trim(),
        phone: editBizForm.phone.trim(),
        whatsapp: editBizForm.whatsapp.trim(),
        email: editBizForm.email.trim(),
        website: editBizForm.website.trim(),
        tagline: editBizForm.tagline.trim(),
        description: editBizForm.description.trim(),
        proofType: editBizForm.proofType,
        proofNumber: editBizForm.proofNumber.trim(),
        verificationStatus: editBizForm.verificationStatus,
        isVerified: editBizForm.verificationStatus === 'verified',
        isActive: editBizForm.verificationStatus === 'verified',
        isFeatured: editBizForm.isFeatured,
        isPremium: editBizForm.isPremium,
        employeeCount: editBizForm.employeeCount,
        logoUrl: editBizForm.logoUrl.trim(),
        // coverUrl is the field the directory cards and profile page actually read.
        coverUrl: editBizForm.coverUrl.trim(),
        establishedYear: editBizForm.establishedYear.trim(),
        googleMapsUrl: editBizForm.googleMapsUrl.trim(),
        instagram: editBizForm.instagram.trim(),
        facebook: editBizForm.facebook.trim(),
        youtube: editBizForm.youtube.trim(),
        linkedin: editBizForm.linkedin.trim(),
        updatedAt: new Date(),
      });
      toast.success('Business Profile & Verification details updated!');
      if (previewBiz?.id === editingBiz.id) {
        setPreviewBiz({ ...previewBiz, ...editBizForm, id: editingBiz.id });
      }
      setEditingBiz(null);
    } catch (e: any) {
      console.error('Error updating business:', e);
      setEditBizError(e.message || 'Failed to update business.');
    } finally {
      setEditBizLoading(false);
    }
  };

  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO';
  const getColors = (name?: string) => {
    const idx = (name?.charCodeAt(0) || 0) % BG_PALETTE.length;
    return { bg: BG_PALETTE[idx], color: COLOR_PALETTE[idx] };
  };

  // Duplicate Detection Map (by normalized phone or lowercase name)
  const duplicatePhoneMap = new Map<string, number>();
  const duplicateNameMap = new Map<string, number>();
  businesses.forEach(b => {
    const p = (b.phone || '').replace(/\D/g, '');
    if (p.length === 10) {
      duplicatePhoneMap.set(p, (duplicatePhoneMap.get(p) || 0) + 1);
    }
    const n = (b.name || '').trim().toLowerCase();
    if (n) {
      duplicateNameMap.set(n, (duplicateNameMap.get(n) || 0) + 1);
    }
  });

  const isDuplicateBiz = (biz: BusinessDoc) => {
    const p = (biz.phone || '').replace(/\D/g, '');
    const n = (biz.name || '').trim().toLowerCase();
    return (p.length === 10 && (duplicatePhoneMap.get(p) || 0) > 1) || (n.length > 2 && (duplicateNameMap.get(n) || 0) > 1);
  };

  const pendingCount = businesses.filter(b => (b.verificationStatus || 'pending') === 'pending').length;
  const verifiedCount = businesses.filter(b => b.verificationStatus === 'verified').length;
  const premiumCount = businesses.filter(b => b.isPremium || b.isFeatured).length;
  const duplicateCount = businesses.filter(b => isDuplicateBiz(b)).length;

  const filtered = businesses.filter(biz => {
    const matchSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (biz.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (biz.contactPerson || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (biz.phone || '').includes(searchQuery);
    const status = biz.verificationStatus || 'pending';
    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') matchTab = !!biz.isFeatured;
    else if (activeTab === 'Verified') matchTab = status === 'verified';
    else if (activeTab === 'Duplicates') matchTab = isDuplicateBiz(biz);
    else if (activeTab !== 'All') matchTab = status === activeTab.toLowerCase();
    const matchCategory = categoryFilter === 'All Categories' || biz.category === categoryFilter;
    const matchDistrict = districtFilter === 'All Districts' || biz.district === districtFilter;
    return matchSearch && matchTab && matchCategory && matchDistrict;
  });

  const doApprove = async (biz: BusinessDoc) => {
    setActionLoading(biz.id);
    try {
      await approveCompany(biz.id, currentUser?.uid || 'admin');
      toast.success('Business Approved! 🎉', `${biz.name} is now verified. Employer access enabled.`);

      // Optional WhatsApp congratulatory trigger
      const cleanWa = (biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '');
      if (cleanWa) {
        const msg = `🎉 *CONGRATULATIONS FROM THENIJOBS!*\n\nYour business *"${biz.name}"* has been approved and verified.\n\nYou can now post jobs and manage applicants on https://thenijobs.com/employer/dashboard`;
        window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      if (previewBiz?.id === biz.id) {
        setPreviewBiz({ ...previewBiz, verificationStatus: 'verified' });
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Approval failed', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (biz: BusinessDoc) => {
    setRejectingBiz(biz);
    setRejectionReason(QUICK_REJECTION_REASONS[0]);
  };

  const handleConfirmReject = async (sendOnWhatsApp = false) => {
    if (!rejectingBiz) return;
    if (!rejectionReason.trim()) {
      toast.warning('Please enter a rejection reason.');
      return;
    }

    setActionLoading(rejectingBiz.id);
    try {
      await rejectCompany(rejectingBiz.id, currentUser?.uid || 'admin', rejectionReason.trim());
      toast.info('Application Rejected', `Reason saved for ${rejectingBiz.name}`);

      if (sendOnWhatsApp) {
        const cleanWa = (rejectingBiz.whatsapp || rejectingBiz.phone || '').replace(/[^0-9]/g, '');
        if (cleanWa) {
          const msg = `⚠️ *THENIJOBS Business Verification Update*\n\nRegarding your registration for *"${rejectingBiz.name}"*:\n\n*Status:* Requires Revision\n*Reason:* ${rejectionReason.trim()}\n\nPlease update your details and resubmit on https://thenijobs.com/seeker/become-employer`;
          window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }

      if (previewBiz?.id === rejectingBiz.id) {
        setPreviewBiz({ ...previewBiz, verificationStatus: 'rejected', rejectionReason: rejectionReason.trim() });
      }

      setRejectingBiz(null);
      setRejectionReason('');
    } catch (e: any) {
      console.error(e);
      toast.error('Rejection failed', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const doToggleFeatured = async (id: string, cur?: boolean) => {
    setActionLoading(id);
    try {
      await featureCompany(id, !cur);
      toast.success(cur ? 'Removed from Featured' : 'Marked as Featured');
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const doTogglePremium = async (id: string, cur?: boolean) => {
    setActionLoading(id);
    try {
      await updateDocument('companies', id, { isPremium: !cur });
      toast.success(cur ? 'Removed Premium' : 'Marked as Premium Business');
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const businessColumns: Column<BusinessDoc>[] = [
    {
      key: 'name',
      header: 'Business',
      card: 'title',
      sortValue: biz => biz.name ?? '',
      render: biz => {
        const { bg, color } = getColors(biz.name);
        const bizStatus = biz.verificationStatus || 'pending';
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
              style={{ background: bg, color }}
            >
              {getInitials(biz.name)}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate font-semibold text-slate-900">{biz.name}</span>
                {bizStatus === 'verified' && <BadgeCheck size={14} className="shrink-0 text-emerald-600" aria-label="Verified" />}
                {biz.isPremium && <Crown size={14} className="shrink-0 text-amber-500" aria-label="Premium" />}
                {isDuplicateBiz(biz) && (
                  <span className="shrink-0 rounded-md border border-violet-200 bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-800">
                    Duplicate
                  </span>
                )}
              </span>
              <span className="block truncate text-xs text-slate-500">{biz.category || 'General'}</span>
            </span>
          </div>
        );
      },
    },
    {
      key: 'district',
      header: 'District',
      hideBelow: 'lg',
      sortValue: biz => biz.district ?? '',
      render: biz => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <MapPin size={11} className="text-slate-400" aria-hidden /> {biz.district || 'Theni'}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      sortValue: biz => biz.contactPerson || biz.ownerName || '',
      render: biz => biz.contactPerson || biz.ownerName || <span className="text-slate-300">&mdash;</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      sortValue: biz => biz.phone ?? '',
      render: biz => biz.phone
        ? <span className="whitespace-nowrap font-mono text-xs tabular-nums">{biz.phone}</span>
        : <span className="text-slate-300">&mdash;</span>,
    },
    {
      key: 'proof',
      header: 'Govt proof',
      hideBelow: 'xl',
      sortValue: biz => biz.proofNumber ?? '',
      render: biz => biz.proofNumber
        ? (
          <span className="block">
            <span className="block text-[10px] uppercase tracking-wide text-slate-400">{biz.proofType || 'Proof'}</span>
            <span className="font-mono text-xs text-blue-700">{biz.proofNumber}</span>
          </span>
        )
        : <span className="text-slate-300">&mdash;</span>,
    },
    {
      key: 'verificationStatus',
      header: 'Status',
      align: 'center',
      sortValue: biz => biz.verificationStatus ?? 'pending',
      render: biz => {
        const bizStatus = biz.verificationStatus || 'pending';
        const st = STATUS_STYLES[bizStatus] || STATUS_STYLES.pending;
        return <Pill tone={STATUS_TONE[bizStatus] ?? 'warning'} dot>{st.label}</Pill>;
      },
    },
  ];

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Business &amp; Employer Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review employer applications, verify registrations, make calls &amp; WhatsApp verification
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              exportCompaniesToExcel(filtered.length ? filtered : businesses, 'THENIJOBS_Businesses_Export');
              toast.success('Export Ready', `Exported ${filtered.length || businesses.length} companies to Excel (.xlsx)`);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download size={14} className="text-gray-500" />
            Export to Excel
          </button>
          
          <Link
            href="/admin/businesses/import"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Upload size={14} />
            Bulk Import (Excel)
          </Link>
        </div>
      </div>

      {/* KPI stats matching Dashboard standard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Businesses', value: businesses.length, icon: Building2, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Pending Review', value: pendingCount, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Verified & Active', value: verifiedCount, icon: BadgeCheck, bg: '#ECFDF5', color: '#059669' },
          { label: 'Premium / Featured', value: premiumCount, icon: Crown, bg: '#F5F3FF', color: '#7C3AED' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: s.bg }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 overflow-x-auto no-scrollbar w-fit max-w-full">
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-white text-[9px] font-black bg-amber-500">
                {pendingCount}
              </span>
            )}
            {tab === 'Duplicates' && duplicateCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-white text-[9px] font-black bg-purple-600 animate-pulse">
                {duplicateCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Select Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by business name, phone, or contact person..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Duplicate Companies Action Banner */}
      {activeTab === 'Duplicates' && duplicateCount > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              {duplicateCount}
            </div>
            <div>
              <h3 className="text-sm font-black text-purple-950">
                Duplicate Company Profiles Detected
              </h3>
              <p className="text-xs text-purple-700 mt-0.5">
                We detected {duplicateCount} company records sharing matching phone numbers or names.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoCleanDuplicates}
            disabled={cleaningDuplicates}
            className="px-4 py-2.5 rounded-2xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 disabled:opacity-50 flex items-center gap-2 shrink-0 transition-all shadow-xs"
          >
            {cleaningDuplicates ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Auto-Clean All Duplicate Records
          </button>
        </div>
      )}

      {/* Business directory — table by default, tiles on request */}
      <DataTable
        label="Business and employer directory"
        loading={loading}
        view={view}
        gridColumns={3}
        columns={businessColumns}
        rows={filtered}
        getRowId={biz => biz.id}
        emptyIcon={Building2}
        emptyTitle="No businesses match your filter"
        emptyDescription="Clear the tab, category or district filter to see the full directory."
        rowActions={biz => {
          const bizStatus = biz.verificationStatus || 'pending';
          const cleanPhone = (biz.phone || '').replace(/[^0-9+]/g, '');
          const cleanWa = (biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '');
          if (actionLoading === biz.id) {
            return <Loader2 size={16} className="animate-spin text-blue-600" aria-label="Saving" />;
          }
          const items: ActionItem[] = [
            { label: 'View details', icon: Eye, onClick: () => setPreviewBiz(biz) },
            { label: 'Edit business', icon: Edit3, onClick: () => openEditBizModal(biz) },
          ];
          if (cleanPhone) {
            items.push({ label: `Call ${biz.phone}`, icon: Phone, href: `tel:${cleanPhone}` });
          }
          if (cleanWa) {
            items.push({
              label: 'WhatsApp',
              icon: MessageCircle,
              external: true,
              href: `https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${biz.name}, this is THENIJOBS Admin regarding your business verification request.`)}`,
            });
          }
          if (bizStatus !== 'verified') {
            items.push({ label: 'Approve', icon: CheckCircle, tone: 'success', separatorBefore: true, onClick: () => doApprove(biz) });
          }
          if (bizStatus !== 'rejected') {
            items.push({
              label: 'Reject',
              icon: XCircle,
              tone: 'danger',
              separatorBefore: bizStatus === 'verified',
              onClick: () => openRejectModal(biz),
            });
          }
          items.push({
            label: biz.isFeatured ? 'Remove featured' : 'Feature business',
            icon: Star,
            separatorBefore: true,
            onClick: () => doToggleFeatured(biz.id, biz.isFeatured),
          });
          items.push({
            label: biz.isPremium ? 'Remove premium' : 'Make premium',
            icon: Crown,
            onClick: () => doTogglePremium(biz.id, biz.isPremium),
          });
          items.push({
            label: 'Delete listing',
            icon: Trash2,
            tone: 'danger',
            separatorBefore: true,
            onClick: () => setDeletingBiz(biz),
          });
          return <ActionMenu label={`Actions for ${biz.name}`} items={items} />;
        }}
      />

      {/* FULL BUSINESS PREVIEW MODAL */}
      {previewBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-outfit" onClick={() => setPreviewBiz(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 sm:p-8 space-y-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-100">
                  {getInitials(previewBiz.name)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">{previewBiz.name}</h2>
                  <p className="text-xs text-gray-500">{previewBiz.category} • {previewBiz.district}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = previewBiz;
                    setPreviewBiz(null);
                    openEditBizModal(b);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button onClick={() => setPreviewBiz(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Banner preview if available */}
            {previewBiz.bannerUrl && (
              <div className="w-full h-36 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                <img src={previewBiz.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-gray-400 font-bold block">Contact Person</span>
                <span className="font-bold text-gray-900 text-sm">{previewBiz.contactPerson || previewBiz.ownerName || '—'}</span>
                <span className="text-[11px] text-gray-500 block">{previewBiz.designation || 'Owner / Representative'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-gray-400 font-bold block">Calling &amp; WhatsApp</span>
                <span className="font-mono font-bold text-gray-900 text-sm">{previewBiz.phone || '—'}</span>
                <span className="text-[11px] text-gray-500 block">WA: {previewBiz.whatsapp || previewBiz.phone || '—'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1 sm:col-span-2">
                <span className="text-gray-400 font-bold block">Office Address</span>
                <span className="font-semibold text-gray-900">{previewBiz.address || '—'}</span>
              </div>
              {previewBiz.website && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1 sm:col-span-2">
                  <span className="text-gray-400 font-bold block">Website / Domain URL</span>
                  <a href={previewBiz.website.startsWith('http') ? previewBiz.website : `https://${previewBiz.website}`} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
                    {previewBiz.website} <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {previewBiz.proofNumber && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1 sm:col-span-2 text-blue-900">
                  <span className="text-blue-600 font-bold block">Government Verification Proof ({previewBiz.proofType})</span>
                  <span className="font-mono font-bold text-blue-950 text-sm">{previewBiz.proofNumber}</span>
                </div>
              )}
            </div>

            {/* Description & Services */}
            {previewBiz.description && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-700">About Business</span>
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
                  {previewBiz.description}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {previewBiz.phone && (
                  <a
                    href={`tel:${previewBiz.phone}`}
                    className="py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1"
                  >
                    <Phone size={13} /> Call
                  </a>
                )}
                {previewBiz.phone && (
                  <a
                    href={`https://wa.me/${previewBiz.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                    style={{ background: '#25D366' }}
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {previewBiz.verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    onClick={() => doApprove(previewBiz)}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle size={14} /> Approve Business
                  </button>
                )}
                {previewBiz.verificationStatus !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => { setPreviewBiz(null); openRejectModal(previewBiz); }}
                    className="py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle size={14} /> Reject Application
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const b = previewBiz;
                    setPreviewBiz(null);
                    setDeletingBiz(b);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Delete Company Listing"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BUSINESS MODAL */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-outfit" onClick={() => setEditingBiz(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 sm:p-8 space-y-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-100">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Edit Business Details</h2>
                  <p className="text-xs text-gray-500">Update company profile, contact, website &amp; verification</p>
                </div>
              </div>
              <button onClick={() => setEditingBiz(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {editBizError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {editBizError}
              </div>
            )}

            <div className="space-y-4">
              {/* Row 1: Company Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Company / Business Name *</label>
                  <input
                    type="text"
                    value={editBizForm.name}
                    onChange={e => setEditBizForm({ ...editBizForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    placeholder="e.g. Royal Grand Hospital"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Business Category *</label>
                  <select
                    value={editBizForm.category}
                    onChange={e => setEditBizForm({ ...editBizForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 outline-none"
                  >
                    {CATEGORIES.filter(c => c !== 'All Categories').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: District & Full Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">District / Town *</label>
                  <select
                    value={editBizForm.district}
                    onChange={e => setEditBizForm({ ...editBizForm, district: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 outline-none"
                  >
                    {DISTRICTS.filter(d => d !== 'All Districts').map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Office / Shop Address</label>
                  <input
                    type="text"
                    value={editBizForm.address}
                    onChange={e => setEditBizForm({ ...editBizForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    placeholder="e.g. 45, Main Bazaar, Theni"
                  />
                </div>
              </div>

              {/* Row 3: Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Contact Person / Owner</label>
                  <input
                    type="text"
                    value={editBizForm.contactPerson}
                    onChange={e => setEditBizForm({ ...editBizForm, contactPerson: e.target.value, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    placeholder="e.g. K. Suresh"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={editBizForm.phone}
                    onChange={e => setEditBizForm({ ...editBizForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={editBizForm.whatsapp}
                    onChange={e => setEditBizForm({ ...editBizForm, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              {/* Row 4: Email & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={editBizForm.email}
                    onChange={e => setEditBizForm({ ...editBizForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Website / Domain URL</label>
                  <input
                    type="url"
                    value={editBizForm.website}
                    onChange={e => setEditBizForm({ ...editBizForm, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    placeholder="https://mycompany.com"
                  />
                </div>
              </div>

              {/* Row 5: Proof & Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Verification Proof Type</label>
                  <select
                    value={editBizForm.proofType}
                    onChange={e => setEditBizForm({ ...editBizForm, proofType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="MSME / Udyam Registration">MSME / Udyam</option>
                    <option value="GST Registration Certificate">GST Certificate</option>
                    <option value="Shop & Establishment Act License">Shop License</option>
                    <option value="FSSAI Food License">FSSAI License</option>
                    <option value="Trade License / Gram Panchayat Proof">Trade License</option>
                    <option value="Domain / Website Verification">Domain Verification</option>
                    <option value="Aadhaar / Recruiter ID Proof">Aadhaar Proof</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Proof / License / GST Number</label>
                  <input
                    type="text"
                    value={editBizForm.proofNumber}
                    onChange={e => setEditBizForm({ ...editBizForm, proofNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 font-mono"
                    placeholder="e.g. 33AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Verification Status</label>
                  <select
                    value={editBizForm.verificationStatus}
                    onChange={e => setEditBizForm({ ...editBizForm, verificationStatus: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="verified">Verified &amp; Active</option>
                    <option value="pending">Pending Verification</option>
                    <option value="under_review">Under Review</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Row 5b: Branding & media — the fields that decide what the directory card,
                  the profile header and the browser tab icon actually show. */}
              <div className="rounded-xl border border-gray-200 p-3.5 space-y-3">
                <p className="text-xs font-bold text-gray-900">Branding &amp; Media</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Logo Image URL</label>
                    <input
                      type="url"
                      value={editBizForm.logoUrl}
                      onChange={e => setEditBizForm({ ...editBizForm, logoUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                      placeholder="https://…/logo.png"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Banner / Cover Image URL</label>
                    <input
                      type="url"
                      value={editBizForm.coverUrl}
                      onChange={e => setEditBizForm({ ...editBizForm, coverUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                      placeholder="https://…/banner.jpg"
                    />
                  </div>
                </div>
                {(editBizForm.logoUrl || editBizForm.coverUrl) && (
                  <div className="flex items-center gap-3">
                    {editBizForm.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editBizForm.coverUrl} alt="Banner preview" className="h-14 flex-1 min-w-0 rounded-lg object-cover border border-gray-200 bg-gray-50" />
                    )}
                    {editBizForm.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editBizForm.logoUrl} alt="Logo preview" className="w-14 h-14 shrink-0 rounded-full object-cover border border-gray-200 bg-white" />
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Established Year</label>
                    <input
                      type="text"
                      value={editBizForm.establishedYear}
                      onChange={e => setEditBizForm({ ...editBizForm, establishedYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                      placeholder="e.g. 2015"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Google Maps URL</label>
                    <input
                      type="url"
                      value={editBizForm.googleMapsUrl}
                      onChange={e => setEditBizForm({ ...editBizForm, googleMapsUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                      placeholder="https://maps.google.com/…"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    ['instagram', 'Instagram'],
                    ['facebook', 'Facebook'],
                    ['youtube', 'YouTube'],
                    ['linkedin', 'LinkedIn'],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs font-bold text-gray-700 block mb-1">{label}</label>
                      <input
                        type="url"
                        value={editBizForm[key]}
                        onChange={e => setEditBizForm({ ...editBizForm, [key]: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                        placeholder="https://…"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 6: Tagline & Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Tagline / Short Slogan</label>
                <input
                  type="text"
                  value={editBizForm.tagline}
                  onChange={e => setEditBizForm({ ...editBizForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                  placeholder="e.g. Leading IT & Cloud Solutions in Theni"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Company Overview / Description</label>
                <textarea
                  rows={3}
                  value={editBizForm.description}
                  onChange={e => setEditBizForm({ ...editBizForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 resize-none"
                  placeholder="Describe company history, products, and services..."
                />
              </div>

              {/* Row 7: Toggles */}
              <div className="flex items-center gap-6 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={editBizForm.isFeatured}
                    onChange={e => setEditBizForm({ ...editBizForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span>⭐ Featured Business</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={editBizForm.isPremium}
                    onChange={e => setEditBizForm({ ...editBizForm, isPremium: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600"
                  />
                  <span>👑 Premium Tier</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingBiz(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBizEdit}
                disabled={editBizLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {editBizLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Business Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL WITH WHATSAPP NOTIFY */}
      {rejectingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-outfit" onClick={() => setRejectingBiz(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 p-6 space-y-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <h3 className="font-bold text-gray-900 text-base">Reject Business Application</h3>
              </div>
              <button onClick={() => setRejectingBiz(null)} className="p-1 rounded-xl text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs text-gray-600">
                Rejecting application for <strong className="text-gray-900">{rejectingBiz.name}</strong> ({rejectingBiz.phone}). Please specify why this application cannot be verified:
              </p>
            </div>

            {/* Quick Reason Suggestions */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-gray-500 uppercase">Quick Reason Suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REJECTION_REASONS.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRejectionReason(r)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-left border border-gray-200 transition-colors cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Custom Rejection Reason / Instructions *</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain what details need to be updated..."
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none focus:bg-white focus:border-red-400 resize-none font-medium"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleConfirmReject(false)}
                className="py-2.5 px-3 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
              >
                Save &amp; Reject Only
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(true)}
                className="py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={13} /> Reject &amp; WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-outfit" onClick={() => setDeletingBiz(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 p-6 space-y-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Delete Company</h3>
                  <p className="text-[11px] text-gray-500">Permanently delete listing &amp; data</p>
                </div>
              </div>
              <button onClick={() => setDeletingBiz(null)} className="p-1 rounded-xl text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-gray-900">{deletingBiz.name}</strong>?
              </p>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700 space-y-1">
                <p><strong>Category:</strong> {deletingBiz.category || 'General'}</p>
                <p><strong>District:</strong> {deletingBiz.district || 'Theni'}</p>
                <p><strong>Phone:</strong> {deletingBiz.phone || '—'}</p>
              </div>
              <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
                ⚠️ Warning: This will remove the company from search results, SEO portfolio, and employer directory. This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingBiz(null)}
                className="py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                disabled={deleteLoading}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Delete Company</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
