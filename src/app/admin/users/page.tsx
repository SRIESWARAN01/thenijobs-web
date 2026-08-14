'use client';

import { useState } from 'react';
import {
  Users, Search, Download, ShieldCheck, Ban, Trash2,
  UserCheck, AlertCircle, Loader2, CheckCircle, XCircle,
  Plus, X
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { updateDocument, deleteDocument, verifyUser } from '@/lib/firebase/firestoreService';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp, collection as fbCollection } from 'firebase/firestore';

interface UserDoc {
  id: string; displayName?: string; name?: string; email: string;
  role: string; district?: string; status?: string; isVerified?: boolean; createdAt?: any; phone?: string;
}

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  job_seeker:       { bg: '#EFF6FF', color: '#2563EB', label: 'Job Seeker' },
  employer:         { bg: '#F5F3FF', color: '#7C3AED', label: 'Employer' },
  business_owner:   { bg: '#FFFBEB', color: '#D97706', label: 'Business' },
  admin:            { bg: '#FEF2F2', color: '#DC2626', label: 'Admin' },
  super_admin:      { bg: '#FDF4FF', color: '#9333EA', label: 'Super Admin' },
  supplier:         { bg: '#ECFDF5', color: '#059669', label: 'Supplier' },
  service_provider: { bg: '#EFF6FF', color: '#0284C7', label: 'Service' } };

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  active:    { bg: '#ECFDF5', color: '#059669', dot: '#059669', label: 'Active' },
  suspended: { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626', label: 'Suspended' },
  pending:   { bg: '#FFFBEB', color: '#D97706', dot: '#D97706', label: 'Pending' } };

const DISTRICTS = ['All Districts','Theni','Madurai','Dindigul','Chennai','Coimbatore','Trichy','Salem','Tirunelveli','Erode','Vellore'];

const selectCls = "px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 outline-none cursor-pointer";

function getInitials(name?: string, email?: string) {
  const t = name || email || 'U';
  return t.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, loading } = useCollection<UserDoc>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create User modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);
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
    setCreateSuccess(false);
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
      setCreateSuccess(true);
      setTimeout(() => {
        setShowCreateModal(false);
        resetCreateForm();
      }, 1200);
    } catch (e: any) {
      console.error('Error creating user:', e);
      setCreateError(e.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const name = u.displayName || u.name || '';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
    const matchDistrict = districtFilter === 'All Districts' || (u.district || '') === districtFilter;
    return matchSearch && matchRole && matchStatus && matchDistrict;
  });

  const toggleSelectAll = () => setSelectedUsers(selectedUsers.length === filtered.length && filtered.length > 0 ? [] : filtered.map(u => u.id));
  const toggleSelect = (id: string) => setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const doVerify = async (id: string) => { setActionLoading(id); try { await verifyUser(id, currentUser?.uid || 'admin'); } catch(e){console.error(e);} finally { setActionLoading(null); }};
  const doSuspend = async (id: string, cur?: string) => { setActionLoading(id); try { await updateDocument('users', id, { status: cur === 'suspended' ? 'active' : 'suspended' }); } catch(e){console.error(e);} finally { setActionLoading(null); }};
  const doDelete = async (id: string) => { if (!confirm('Delete this user?')) return; setActionLoading(id); try { await deleteDocument('users', id); setSelectedUsers(p => p.filter(x => x !== id)); } catch(e){console.error(e);} finally { setActionLoading(null); }};
  const doBulkVerify = async () => { setActionLoading('bulk'); try { await Promise.all(selectedUsers.map(id => verifyUser(id, currentUser?.uid || 'admin'))); setSelectedUsers([]); } catch(e){console.error(e);} finally { setActionLoading(null); }};
  const doBulkSuspend = async () => { setActionLoading('bulk'); try { await Promise.all(selectedUsers.map(id => updateDocument('users', id, { status: 'suspended' }))); setSelectedUsers([]); } catch(e){console.error(e);} finally { setActionLoading(null); }};
  const doBulkDelete = async () => { if (!confirm(`Delete ${selectedUsers.length} users?`)) return; setActionLoading('bulk'); try { await Promise.all(selectedUsers.map(id => deleteDocument('users', id))); setSelectedUsers([]); } catch(e){console.error(e);} finally { setActionLoading(null); }};

  const totalCount = users.length;
  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const pendingCount = users.filter(u => !u.isVerified).length;

  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all platform users, roles and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetCreateForm(); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            <Plus size={15} /> <span className="hidden sm:inline">Create User</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
            <Download size={15} /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Users',          count: totalCount,     icon: Users,       bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Active Users',         count: activeCount,    icon: UserCheck,   bg: '#ECFDF5', color: '#059669' },
          { label: 'Suspended',            count: suspendedCount, icon: Ban,         bg: '#FEF2F2', color: '#DC2626' },
          { label: 'Pending Verification', count: pendingCount,   icon: AlertCircle, bg: '#FFFBEB', color: '#D97706' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Live</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search users by name or email..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
              <option value="all">All Roles</option>
              <option value="job_seeker">Job Seeker</option>
              <option value="employer">Employer</option>
              <option value="business_owner">Business Owner</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="supplier">Supplier</option>
              <option value="service_provider">Service Provider</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} className={selectCls}>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-blue-700">{selectedUsers.length} user(s) selected</span>
          <div className="flex items-center gap-2">
            {actionLoading === 'bulk' ? <Loader2 size={16} className="animate-spin text-blue-600" /> : (
              <>
                <button onClick={doBulkVerify} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-all"><ShieldCheck size={13} /> Verify</button>
                <button onClick={doBulkSuspend} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all"><Ban size={13} /> Suspend</button>
                <button onClick={doBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-all"><Trash2 size={13} /> Delete</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th className="px-5 py-3 w-10">
                    <input type="checkbox" checked={selectedUsers.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll} className="w-4 h-4 rounded accent-blue-600" />
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">District</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Verified</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Joined</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center">
                    <Users size={24} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">No users found</p>
                  </td></tr>
                ) : filtered.map(user => {
                  const roleStyle = ROLE_STYLES[user.role] || { bg: '#F9FAFB', color: '#6B7280', label: user.role };
                  const userStatus = user.status || 'active';
                  const statusStyle = STATUS_STYLES[userStatus] || STATUS_STYLES.active;

                  return (
                    <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleSelect(user.id)} className="w-4 h-4 rounded accent-blue-600" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: '#2563EB' }}>
                            {getInitials(user.displayName || user.name, user.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || user.name || 'Unnamed User'}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                          {roleStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500">{user.district || 'Theni'}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {user.isVerified
                          ? <CheckCircle size={17} style={{ color: '#059669' }} />
                          : <XCircle size={17} className="text-gray-300" />}
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell text-xs text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === user.id ? (
                            <Loader2 size={15} className="animate-spin text-blue-500" />
                          ) : (
                            <>
                              {!user.isVerified && (
                                <button onClick={() => doVerify(user.id)} title="Verify" className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all"><ShieldCheck size={15} /></button>
                              )}
                              <button onClick={() => doSuspend(user.id, userStatus)} title={userStatus === 'suspended' ? 'Activate' : 'Suspend'}
                                className={`p-1.5 rounded-lg text-gray-400 transition-all ${userStatus === 'suspended' ? 'hover:text-emerald-500 hover:bg-emerald-50' : 'hover:text-amber-500 hover:bg-amber-50'}`}>
                                <Ban size={15} />
                              </button>
                              <button onClick={() => doDelete(user.id)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={15} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <Plus size={16} style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Create New User</h2>
                  <p className="text-[11px] text-gray-400">Add a user record to the platform</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {createSuccess ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} style={{ color: '#059669' }} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">User Created Successfully</p>
                  <p className="text-xs text-gray-500 mt-1">The user record has been added to the platform.</p>
                </div>
              ) : (
                <>
                  {createError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-600 font-medium">{createError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Display Name *</label>
                    <input type="text" value={newUser.displayName} onChange={e => setNewUser(p => ({ ...p, displayName: e.target.value }))}
                      placeholder="Full name" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address *</label>
                    <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email address" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                    <input type="tel" value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone number" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                      <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className={selectCls + ' w-full'}>
                        <option value="job_seeker">Job Seeker</option>
                        <option value="employer">Employer</option>
                        <option value="business_owner">Business Owner</option>
                        <option value="admin">Admin</option>
                        <option value="supplier">Supplier</option>
                        <option value="service_provider">Service Provider</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">District</label>
                      <select value={newUser.district} onChange={e => setNewUser(p => ({ ...p, district: e.target.value }))} className={selectCls + ' w-full'}>
                        {DISTRICTS.filter(d => d !== 'All Districts').map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                    <select value={newUser.status} onChange={e => setNewUser(p => ({ ...p, status: e.target.value }))} className={selectCls + ' w-full'}>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  <div className="bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
                    <p className="text-[11px] text-amber-700"><strong>Note:</strong> This creates a Firestore user record only. The user will still need to sign up via Firebase Auth to access the platform.</p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!createSuccess && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button onClick={handleCreateUser} disabled={createLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
                  {createLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create User
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
