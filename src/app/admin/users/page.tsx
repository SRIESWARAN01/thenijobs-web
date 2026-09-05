'use client';

import { useState } from 'react';
import {
  Users, Search, Download, ShieldCheck, Ban, Trash2,
  UserCheck, AlertCircle, Loader2, CheckCircle, XCircle,
  Plus, X, Phone, Mail, MapPin, Shield, Clock,
  Edit3, Key, Eye, EyeOff
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import {
  ActionMenu, DataTable, Pill, ViewToggle, useViewMode,
  type ActionItem, type Column,
} from '@/components/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { updateDocument, deleteDocument, verifyUser } from '@/lib/firebase/firestoreService';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp, collection as fbCollection } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';

interface UserDoc {
  id: string;
  displayName?: string;
  name?: string;
  email: string;
  role: string;
  district?: string;
  status?: string;
  isVerified?: boolean;
  createdAt?: any;
  phone?: string;
  tempPassword?: string;
}

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  job_seeker:       { bg: '#EFF6FF', color: '#2563EB', label: 'Job Seeker' },
  employer:         { bg: '#F5F3FF', color: '#7C3AED', label: 'Employer' },
  business_owner:   { bg: '#FFFBEB', color: '#D97706', label: 'Business Owner' },
  admin:            { bg: '#FEF2F2', color: '#DC2626', label: 'Admin' },
  super_admin:      { bg: '#FDF4FF', color: '#9333EA', label: 'Super Admin' },
  supplier:         { bg: '#ECFDF5', color: '#059669', label: 'Supplier' },
  service_provider: { bg: '#EFF6FF', color: '#0284C7', label: 'Service Provider' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  active:    { bg: '#ECFDF5', color: '#059669', dot: '#059669', label: 'Active' },
  suspended: { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626', label: 'Suspended' },
  pending:   { bg: '#FFFBEB', color: '#D97706', dot: '#D97706', label: 'Pending Verification' },
};

const DISTRICTS = ['All Districts', 'Theni', 'Madurai', 'Dindigul', 'Chennai', 'Coimbatore', 'Trichy', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { data: users, loading } = useCollection<UserDoc>('users');
  const [view, setView] = useViewMode('admin-users', 'table');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create User modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newUser, setNewUser] = useState({
    displayName: '',
    email: '',
    phone: '',
    role: 'job_seeker',
    district: 'Theni',
    status: 'active',
  });

  // Edit User modal
  const [editingUser, setEditingUser] = useState<UserDoc | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    role: 'job_seeker',
    district: 'Theni',
    status: 'active',
    newPassword: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const openEditModal = (u: UserDoc) => {
    setEditingUser(u);
    setEditForm({
      displayName: u.displayName || u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'job_seeker',
      district: u.district || 'Theni',
      status: u.status || 'active',
      newPassword: u.tempPassword || '',
    });
    setEditError('');
    setShowPassword(false);
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    if (!editForm.displayName.trim() || !editForm.email.trim()) {
      setEditError('Name and email are required.');
      return;
    }
    if (editForm.newPassword && editForm.newPassword.length < 6) {
      setEditError('Password must be at least 6 characters.');
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      const updatePayload: any = {
        displayName: editForm.displayName.trim(),
        name: editForm.displayName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        district: editForm.district,
        status: editForm.status,
        updatedAt: serverTimestamp(),
      };
      if (editForm.newPassword.trim()) {
        updatePayload.tempPassword = editForm.newPassword.trim();
      }
      await updateDocument('users', editingUser.id, updatePayload);
      toast.success('User profile & credentials updated successfully!');
      setEditingUser(null);
    } catch (e: any) {
      console.error('Error updating user:', e);
      setEditError(e.message || 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewUser({ displayName: '', email: '', phone: '', role: 'job_seeker', district: 'Theni', status: 'active' });
    setCreateError('');
  };

  const handleCreateUser = async () => {
    if (!newUser.displayName.trim() || !newUser.email.trim()) {
      setCreateError('Name and email are required.');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      const newDocRef = doc(fbCollection(db, 'users'));
      await setDoc(newDocRef, {
        displayName: newUser.displayName.trim(),
        email: newUser.email.trim().toLowerCase(),
        phone: newUser.phone.trim(),
        role: newUser.role,
        district: newUser.district,
        status: newUser.status,
        isVerified: false,
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid || 'admin',
        source: 'admin_manual',
      });
      toast.success('User created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
    } catch (e: any) {
      console.error('Error creating user:', e);
      setCreateError(e.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const name = u.displayName || u.name || '';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.phone || '').includes(searchQuery);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
    const matchDistrict = districtFilter === 'All Districts' || (u.district || '') === districtFilter;
    return matchSearch && matchRole && matchStatus && matchDistrict;
  });


  const doVerify = async (id: string) => {
    setActionLoading(id);
    try {
      await verifyUser(id, currentUser?.uid || 'admin');
      toast.success('User verified!');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const doSuspend = async (id: string, cur?: string) => {
    setActionLoading(id);
    try {
      const next = cur === 'suspended' ? 'active' : 'suspended';
      await updateDocument('users', id, { status: next });
      toast.info(next === 'suspended' ? 'User account suspended' : 'User account reactivated');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async (id: string) => {
    if (!confirm('Permanently delete this user?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('users', id);
      toast.info('User removed.');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const totalCount = users.length;
  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const pendingCount = users.filter(u => !u.isVerified).length;

  const userColumns: Column<UserDoc>[] = [
    {
      key: 'user',
      header: 'User',
      card: 'title',
      sortValue: u => u.displayName || u.name || u.email || '',
      render: u => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#EFF6FF] text-xs font-bold text-[#1E40AF]">
            {(u.displayName || u.name || u.email || 'U')[0].toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-900">{u.displayName || u.name || 'User'}</span>
            <span className="block truncate text-xs text-slate-500">{u.email}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: u => u.role ?? '',
      render: u => {
        const r = ROLE_STYLES[u.role];
        return (
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: r?.bg ?? '#F1F5F9', color: r?.color ?? '#475569' }}
          >
            {r?.label ?? u.role ?? 'Unknown'}
          </span>
        );
      },
    },
    {
      key: 'district',
      header: 'District',
      hideBelow: 'lg',
      sortValue: u => u.district ?? '',
      render: u => u.district || 'Theni',
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: u => u.status ?? 'active',
      render: u => {
        const st = STATUS_STYLES[u.status || 'active'] || STATUS_STYLES.active;
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: st.bg, color: st.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
            {st.label}
          </span>
        );
      },
    },
    {
      key: 'isVerified',
      header: 'Verification',
      align: 'center',
      hideBelow: 'xl',
      sortValue: u => (u.isVerified ? 1 : 0),
      render: u => u.isVerified
        ? <Pill tone="success"><CheckCircle size={11} /> Verified</Pill>
        : <Pill tone="warning"><Clock size={11} /> Pending</Pill>,
    },
  ];

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">User Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage all job seekers, employers, businesses, and staff roles</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} /> Create User
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Users', count: totalCount, icon: Users, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Active Users', count: activeCount, icon: UserCheck, bg: '#ECFDF5', color: '#059669' },
          { label: 'Suspended', count: suspendedCount, icon: Ban, bg: '#FEF2F2', color: '#DC2626' },
          { label: 'Pending Verification', count: pendingCount, icon: AlertCircle, bg: '#FFFBEB', color: '#D97706' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: s.bg }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{s.count}</p>
                  <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-base sm:text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-base sm:text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="job_seeker">Job Seeker</option>
            <option value="employer">Employer</option>
            <option value="business_owner">Business Owner</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-base sm:text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-base sm:text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Users directory */}
      <DataTable
        label="User directory"
        loading={loading}
        view={view}
        gridColumns={3}
        columns={userColumns}
        rows={filtered}
        getRowId={u => u.id}
        emptyIcon={Users}
        emptyTitle="No users match this criteria"
        emptyDescription="Clear the role, status or district filter to see every account."
        rowActions={u => {
          if (actionLoading === u.id) {
            return <Loader2 size={16} className="animate-spin text-blue-600" aria-label="Saving" />;
          }
          const items: ActionItem[] = [
            { label: 'Edit user & credentials', icon: Edit3, onClick: () => openEditModal(u) },
          ];
          if (!u.isVerified) {
            items.push({ label: 'Verify user', icon: ShieldCheck, tone: 'success', onClick: () => doVerify(u.id) });
          }
          items.push({
            label: u.status === 'suspended' ? 'Reactivate account' : 'Suspend account',
            icon: Ban,
            separatorBefore: true,
            onClick: () => doSuspend(u.id, u.status),
          });
          items.push({
            label: 'Delete user',
            icon: Trash2,
            tone: 'danger',
            separatorBefore: true,
            onClick: () => doDelete(u.id),
          });
          return <ActionMenu label={`Actions for ${u.displayName || u.name || u.email}`} items={items} />;
        }}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-outfit" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit User &amp; Credentials</h3>
                  <p className="text-[11px] text-gray-500">Update account email, password, role &amp; details</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg text-slate-500 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {editError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="admin-users-full-name-contact-person" className="text-xs font-bold text-gray-700 block mb-1">Full Name / Contact Person *</label>
                <input id="admin-users-full-name-contact-person"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={editForm.displayName}
                  onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="admin-users-login-email-address-user-id" className="text-xs font-bold text-gray-700 block mb-1">Login Email Address (User ID) *</label>
                <input id="admin-users-login-email-address-user-id"
                  type="email"
                  placeholder="user@example.com"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="admin-users-phone-number" className="text-xs font-bold text-gray-700 block mb-1">Phone Number</label>
                <input id="admin-users-phone-number"
                  type="tel"
                  placeholder="+91 93605 19460"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="admin-users-account-password-temp-password-setshowpa" className="text-xs font-bold text-gray-700">Account Password / Temp Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 chars)..."
                    value={editForm.newPassword}
                    onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Set a temporary or updated password for this user.</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Role</label>
                  <select id="admin-users-account-password-temp-password-setshowpa"
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="job_seeker">Job Seeker</option>
                    <option value="employer">Employer</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="supplier">Supplier</option>
                    <option value="service_provider">Service Provider</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-users-status" className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                  <select id="admin-users-status"
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-users-district" className="text-xs font-bold text-gray-700 block mb-1">District</label>
                  <select id="admin-users-district"
                    value={editForm.district}
                    onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs font-bold text-gray-700 outline-none"
                  >
                    {DISTRICTS.filter(d => d !== 'All Districts').map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserEdit}
                disabled={editLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {editLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-outfit" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Create New Platform User</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-500 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {createError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="admin-users-full-name" className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                <input id="admin-users-full-name"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newUser.displayName}
                  onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="admin-users-email-address" className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                <input id="admin-users-email-address"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="admin-users-phone-number-2" className="text-xs font-bold text-gray-700 block mb-1">Phone Number</label>
                <input id="admin-users-phone-number-2"
                  type="tel"
                  placeholder="+91 93605 19460"
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-users-role" className="text-xs font-bold text-gray-700 block mb-1">Role</label>
                  <select id="admin-users-role"
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="job_seeker">Job Seeker</option>
                    <option value="employer">Employer</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-users-district-2" className="text-xs font-bold text-gray-700 block mb-1">District</label>
                  <select id="admin-users-district-2"
                    value={newUser.district}
                    onChange={e => setNewUser({ ...newUser, district: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs font-bold text-gray-700 outline-none"
                  >
                    {DISTRICTS.filter(d => d !== 'All Districts').map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={createLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
              >
                {createLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Create User</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
