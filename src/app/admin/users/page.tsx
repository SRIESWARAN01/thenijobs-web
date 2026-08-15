'use client';

import { useState } from 'react';
import {
  Users, Search, Download, ShieldCheck, Ban, Trash2,
  UserCheck, AlertCircle, Loader2, CheckCircle, XCircle,
  Plus, X, Phone, Mail, MapPin, Shield, Check, Clock
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
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

  const toggleSelectAll = () => setSelectedUsers(selectedUsers.length === filtered.length && filtered.length > 0 ? [] : filtered.map(u => u.id));
  const toggleSelect = (id: string) => setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

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
      setSelectedUsers(p => p.filter(x => x !== id));
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
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
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
          >
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Users Content (Responsive Cards on Mobile + Table on Desktop) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading users database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs">
          <Users size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">No users match this criteria</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filtered.map(u => {
              const roleStyle = ROLE_STYLES[u.role] || { bg: '#F9FAFB', color: '#6B7280', label: u.role };
              const userStatus = u.status || 'active';
              const statusStyle = STATUS_STYLES[userStatus] || STATUS_STYLES.active;

              return (
                <div key={u.id} className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
                        {(u.displayName || u.name || u.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{u.displayName || u.name || 'User'}</h4>
                        <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>

                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Role:</span>
                      <span className="font-bold" style={{ color: roleStyle.color }}>{roleStyle.label}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">District:</span>
                      <span className="font-bold text-gray-800">{u.district || 'Theni'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
                    {!u.isVerified && (
                      <button
                        type="button"
                        onClick={() => doVerify(u.id)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"
                      >
                        Verify User
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => doSuspend(u.id, u.status)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold border ${
                        u.status === 'suspended' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                    </button>
                    <button
                      type="button"
                      onClick={() => doDelete(u.id)}
                      className="p-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (hidden md:block) */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">District</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Verification</th>
                    <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(u => {
                    const roleStyle = ROLE_STYLES[u.role] || { bg: '#F9FAFB', color: '#6B7280', label: u.role };
                    const userStatus = u.status || 'active';
                    const statusStyle = STATUS_STYLES[userStatus] || STATUS_STYLES.active;

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                              {(u.displayName || u.name || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{u.displayName || u.name || 'User'}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                            {roleStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-gray-700">
                          {u.district || 'Theni'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold">
                              <CheckCircle size={14} /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-bold">
                              <Clock size={14} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {!u.isVerified && (
                              <button
                                type="button"
                                onClick={() => doVerify(u.id)}
                                className="p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                                title="Verify User"
                              >
                                <ShieldCheck size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => doSuspend(u.id, u.status)}
                              className="p-2 rounded-xl text-gray-500 hover:text-amber-700 hover:bg-amber-50 transition-all cursor-pointer"
                              title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            >
                              <Ban size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => doDelete(u.id)}
                              className="p-2 rounded-xl text-gray-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-outfit" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Create New Platform User</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
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
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newUser.displayName}
                  onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 93605 19460"
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="job_seeker">Job Seeker</option>
                    <option value="employer">Employer</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">District</label>
                  <select
                    value={newUser.district}
                    onChange={e => setNewUser({ ...newUser, district: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 outline-none"
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
