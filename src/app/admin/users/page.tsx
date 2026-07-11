'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, ChevronLeft, ChevronRight,
  Eye, ShieldCheck, Ban, Trash2, UserCheck, Clock, Loader2,
  CheckCircle, XCircle, Download, Save, X, Briefcase, Globe,
  Phone, Mail, MapPin, Crown, Package
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Select } from '@/components/ui/Select';
import {
  updateDocument,
  deleteDocument,
  verifyUser,
  updateUserRole,
} from '@/lib/firebase/firestoreService';
import { useLocations } from '@/hooks/useLocations';
import { toDate } from '@/lib/subscriptions';

// ===== TYPES =====
interface UserDoc {
  id: string;
  displayName?: string;
  name?: string; // fallback
  email: string;
  role: UserRole;
  district?: string;
  status?: 'active' | 'suspended' | 'pending';
  isVerified?: boolean;
  createdAt?: any;
  phone?: string;
}

type UserRole = 'job_seeker' | 'employer' | 'business_owner' | 'admin' | 'super_admin' | 'supplier' | 'service_provider';

// ===== CONSTANTS =====
const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string }> = {
  job_seeker: { label: 'Job Seeker', bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  employer: { label: 'Employer', bg: 'bg-violet-500/15', text: 'text-violet-400' },
  business_owner: { label: 'Business Owner', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  admin: { label: 'Admin', bg: 'bg-rose-500/15', text: 'text-rose-400' },
  super_admin: { label: 'Super Admin', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  supplier: { label: 'Supplier', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  service_provider: { label: 'Service Provider', bg: 'bg-blue-500/15', text: 'text-blue-400' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  suspended: { label: 'Suspended', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400' },
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
};



const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'job_seeker', label: 'Job Seeker' },
  { value: 'employer', label: 'Employer' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'service_provider', label: 'Service Provider' },
];

const EDITABLE_ROLE_OPTIONS = [
  { value: 'job_seeker', label: 'Job Seeker' },
  { value: 'employer', label: 'Employer' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'service_provider', label: 'Service Provider' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];



const colorMap: Record<string, { bg: string; text: string; border: string; glow: string; iconBg: string }> = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', glow: 'shadow-violet-500/20', iconBg: 'bg-violet-500/10' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/20', iconBg: 'bg-cyan-500/10' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20', iconBg: 'bg-emerald-500/10' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/20', iconBg: 'bg-amber-500/10' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-rose-500/20', iconBg: 'bg-rose-500/10' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/20', iconBg: 'bg-purple-500/10' },
};

// ===== USER PROFILE MODAL =====
function UserProfileModal({ user, onClose }: { user: UserDoc; onClose: () => void }) {
  const { data: companies } = useCollection<any>('companies', [], { skip: false });
  const { data: jobs } = useCollection<any>('jobs', [], { skip: false });
  const { data: services } = useCollection<any>('services', [], { skip: false });
  const { data: subscriptions } = useCollection<any>('subscriptions', [], { skip: false });

  const userCompany = companies.find(c => c.ownerId === user.id);
  const userJobs = jobs.filter(j => j.postedBy === user.id || j.companyId === userCompany?.id);
  const userServices = services.filter(s => s.providerId === user.id || s.companyId === userCompany?.id);
  const userSub = subscriptions.find(s => s.userId === user.id || s.companyId === userCompany?.id);

  const roleConfig = ROLE_CONFIG[user.role] || { label: user.role, bg: 'bg-gray-500/15', text: 'text-gray-400' };

  const formatDate = (val?: any) => {
    const d = toDate(val);
    return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
  };

  const remainingDays = userSub?.expiresAt ? Math.max(0, Math.ceil((toDate(userSub.expiresAt)!.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-card rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-nav flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(user.displayName || user.name || 'U').substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-outfit">{user.displayName || user.name || 'Unnamed'}</h2>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${roleConfig.bg} ${roleConfig.text}`}>{roleConfig.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Contact Details */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Information</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Mail, label: 'Email', value: user.email || 'N/A' },
                { icon: Phone, label: 'Mobile', value: (user as any).phone || (user as any).mobileNumber || 'N/A' },
                { icon: MapPin, label: 'District', value: user.district || 'N/A' },
                { icon: MapPin, label: 'Address', value: (user as any).address || 'N/A' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <item.icon size={14} className="text-gray-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500">{item.label}</p>
                    <p className="text-sm text-white font-medium truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Details */}
          {userCompany && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Company Details</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Briefcase, label: 'Company Name', value: userCompany.name || 'N/A' },
                  { icon: Globe, label: 'Website', value: userCompany.website || 'N/A' },
                  { icon: MapPin, label: 'Company Address', value: userCompany.address || userCompany.district || 'N/A' },
                  { icon: Phone, label: 'Company Phone', value: userCompany.phone || 'N/A' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <item.icon size={14} className="text-gray-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500">{item.label}</p>
                      <p className="text-sm text-white font-medium truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription</p>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Crown size={16} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{userSub?.plan || 'Free Plan'}</p>
                {userSub ? (
                  <p className="text-xs text-gray-400">
                    Expires: {formatDate(userSub.expiresAt)}
                    {remainingDays !== null && (
                      <span className={`ml-2 font-semibold ${remainingDays <= 7 ? 'text-rose-400' : remainingDays <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ({remainingDays} days left)
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">No active subscription</p>
                )}
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Briefcase, label: 'Jobs Posted', value: userJobs.length, color: 'text-violet-400' },
                { icon: Package, label: 'Services', value: userServices.length, color: 'text-cyan-400' },
                { icon: Clock, label: 'Joined', value: formatDate(user.createdAt), color: 'text-gray-400' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <s.icon size={16} className={`${s.color} mx-auto mb-1.5`} />
                  <p className="text-sm font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Jobs */}
          {userJobs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Jobs ({userJobs.length})</p>
              <div className="space-y-2">
                {userJobs.slice(0, 5).map(j => (
                  <div key={j.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-white truncate">{j.title || 'Untitled'}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ j.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{j.status || 'pending'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { allAreas } = useLocations();
  const districtOptions = useMemo(() => {
    return [{ value: 'All Areas', label: 'All Areas' }, ...allAreas.map(d => ({ value: d, label: d }))];
  }, [allAreas]);
  const { data: users = [], loading, error } = useCollection<UserDoc>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('All Areas');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Staged role changes: userId -> pendingRole (not saved until Save button clicked)
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});
  // Profile modal
  const [profileUser, setProfileUser] = useState<UserDoc | null>(null);

  const getInitials = (name?: string, email?: string) => {
    const text = name || email || 'User';
    return text.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredUsers = users.filter((user) => {
    const nameStr = user.displayName || user.name || '';
    const emailStr = user.email || '';
    const matchSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    
    const status = user.status || 'active';
    const matchStatus = statusFilter === 'all' || status === statusFilter;
    
    const district = user.district || 'Theni';
    const matchDistrict = districtFilter === 'All Areas' || district === districtFilter;
    
    return matchSearch && matchRole && matchStatus && matchDistrict;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, districtFilter]);

  const toggleSelectAll = () => {
    const pageIds = paginatedUsers.map((u) => u.id);
    const allPageSelected = pageIds.every((id) => selectedUsers.includes(id));
    if (allPageSelected) {
      setSelectedUsers((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedUsers((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleVerify = async (userId: string) => {
    setActionLoading(userId);
    try {
      await verifyUser(userId, currentUser?.uid || 'admin');
    } catch (err) {
      console.error('Verify user error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionLoading(userId);
    try {
      await updateUserRole(userId, newRole, currentUser?.uid || 'admin');
      // Clear pending after save
      setPendingRoles(prev => { const n = { ...prev }; delete n[userId]; return n; });
    } catch (err) {
      console.error('Update user role error:', err);
      alert('Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendToggle = async (userId: string, currentStatus?: string) => {
    setActionLoading(userId);
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDocument('users', userId, { status: newStatus });
    } catch (err) {
      console.error('Suspend user error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(userId);
    try {
      await deleteDocument('users', userId);
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error('Delete user error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Actions
  const handleBulkVerify = async () => {
    setActionLoading('bulk');
    try {
      await Promise.all(selectedUsers.map((id) => verifyUser(id, currentUser?.uid || 'admin')));
      setSelectedUsers([]);
    } catch (err) {
      console.error('Bulk verify error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkSuspend = async () => {
    setActionLoading('bulk');
    try {
      await Promise.all(selectedUsers.map((id) => updateDocument('users', id, { status: 'suspended' })));
      setSelectedUsers([]);
    } catch (err) {
      console.error('Bulk suspend error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
    setActionLoading('bulk');
    try {
      await Promise.all(selectedUsers.map((id) => deleteDocument('users', id)));
      setSelectedUsers([]);
    } catch (err) {
      console.error('Bulk delete error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Role', 'Phone', 'District', 'Address', 'Status', 'Verified', 'Joined Date'];
    const rows = filteredUsers.map((u) => [
      u.displayName || u.name || '',
      u.email || '',
      u.role || '',
      (u as any).phone || (u as any).mobileNumber || '',
      u.district || '',
      (u as any).address || '',
      u.status || 'active',
      u.isVerified ? 'Yes' : 'No',
      toDate(u.createdAt)?.toLocaleDateString('en-IN') || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thenijobs-users-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => (u.status || 'active') === 'active').length;
  const suspendedUsers = users.filter((u) => u.status === 'suspended').length;
  const pendingUsers = users.filter((u) => !u.isVerified).length;

  const userStats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'violet', trend: 'Live' },
    { label: 'Active Users', value: activeUsers, icon: UserCheck, color: 'emerald', trend: 'Live' },
    { label: 'Suspended', value: suspendedUsers, icon: Ban, color: 'rose', trend: 'Live' },
    { label: 'Pending Verification', value: pendingUsers, icon: Clock, color: 'amber', trend: 'Live' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Profile Modal */}
      {profileUser && <UserProfileModal user={profileUser} onClose={() => setProfileUser(null)} />}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage all platform users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Mini-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {userStats.map((stat) => {
          const colors = colorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                  <Icon size={18} className={colors.text} />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
                  {stat.trend}
                </span>
              </div>
              <p className="text-xl font-bold text-white mt-3 font-outfit">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              options={ROLE_OPTIONS}
              placeholder="All Roles"
              className="w-48"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              placeholder="All Status"
              className="w-40"
            />
            <Select
              value={districtFilter}
              onChange={setDistrictFilter}
              options={districtOptions}
              placeholder="All Areas"
              className="w-48"
            />
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedUsers.length > 0 && (
        <div className="glass-card rounded-2xl p-3 flex items-center justify-between border-violet-500/20 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white font-medium">{selectedUsers.length} user(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            {actionLoading === 'bulk' ? (
              <Loader2 size={16} className="text-violet-400 animate-spin mr-2" />
            ) : (
              <>
                <button
                  onClick={handleBulkVerify}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <ShieldCheck size={14} /> Verify
                </button>
                <button
                  onClick={handleBulkSuspend}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                >
                  <Ban size={14} /> Suspend
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading users from Firestore...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3.5 w-12">
                    <input
                      type="checkbox"
                      checked={paginatedUsers.length > 0 && paginatedUsers.every((user) => selectedUsers.includes(user.id))}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-violet-500"
                    />
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">District</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Verified</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Join Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paginatedUsers.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role] || { label: user.role, bg: 'bg-gray-500/15', text: 'text-gray-400' };
                  const userStatus = user.status || 'active';
                  const statusConfig = STATUS_CONFIG[userStatus] || { label: userStatus, bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' };
                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-violet-500"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{getInitials(user.displayName || user.name, user.email)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.displayName || user.name || 'Unnamed User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={pendingRoles[user.id] ?? user.role}
                            onChange={(e) => setPendingRoles(prev => ({ ...prev, [user.id]: e.target.value as UserRole }))}
                            disabled={actionLoading === user.id}
                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-transparent border outline-none cursor-pointer transition-all ${
                              pendingRoles[user.id] && pendingRoles[user.id] !== user.role
                                ? 'border-amber-500/50 text-amber-300'
                                : `border-white/10 ${roleConfig.text} ${roleConfig.bg}`
                            }`}
                          >
                            {EDITABLE_ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-[#0F172A] text-white uppercase text-[10px]">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {/* Save button — only shows when pending change exists */}
                          {pendingRoles[user.id] && pendingRoles[user.id] !== user.role && (
                            <button
                              onClick={() => handleRoleChange(user.id, pendingRoles[user.id])}
                              disabled={actionLoading === user.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold hover:bg-amber-500/25 transition-all"
                              title="Save role change"
                            >
                              {actionLoading === user.id ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                              Save
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-gray-300">{user.district || 'Theni'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {user.isVerified ? (
                           <CheckCircle size={18} className="text-emerald-400" />
                        ) : (
                           <XCircle size={18} className="text-gray-500" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="text-sm text-gray-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === user.id ? (
                            <Loader2 size={16} className="text-violet-400 animate-spin" />
                          ) : (
                            <>
                              {/* View Profile */}
                              <button
                                onClick={() => setProfileUser(user)}
                                className="p-2 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                                title="View Full Profile"
                              >
                                <Eye size={15} />
                              </button>
                              {!user.isVerified && (
                                <button
                                  onClick={() => handleVerify(user.id)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                  title="Verify User"
                                >
                                  <ShieldCheck size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => handleSuspendToggle(user.id, userStatus)}
                                className={`p-2 rounded-lg text-gray-400 transition-all ${
                                  userStatus === 'suspended'
                                    ? 'hover:text-emerald-400 hover:bg-emerald-500/10'
                                    : 'hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                                title={userStatus === 'suspended' ? 'Activate User' : 'Suspend User'}
                              >
                                <Ban size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                  title="Delete User"
                                >
                                  <Trash2 size={15} />
                                </button>
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

        {/* Empty State */}
        {!loading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <Users size={28} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-400">No users found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      {!loading && filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
