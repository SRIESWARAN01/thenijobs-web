'use client';

import { useState } from 'react';
import {
  MapPin, Plus, Pencil, Trash2, Search, Loader2, Users, Building2, CreditCard, ShieldCheck, ChevronDown
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { TN_DISTRICTS, type Franchise } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { orderBy } from 'firebase/firestore';

export default function FranchisesPage() {
  const { data: franchises, loading } = useCollection<Franchise>('franchises', [
    orderBy('createdAt', 'desc')
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [district, setDistrict] = useState(TN_DISTRICTS[0]);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerId, setManagerId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending'>('pending');
  const [revenue, setRevenue] = useState(0);
  const [businesses, setBusinesses] = useState(0);
  const [users, setUsers] = useState(0);

  const filtered = franchises.filter((f) => {
    const dist = f.district || '';
    const name = f.managerName || '';
    return (
      dist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleOpenAdd = () => {
    setEditingFranchise(null);
    setDistrict(TN_DISTRICTS[0]);
    setManagerName('');
    setManagerPhone('');
    setManagerId('');
    setStatus('pending');
    setRevenue(0);
    setBusinesses(0);
    setUsers(0);
    setModalOpen(true);
  };

  const handleOpenEdit = (f: Franchise) => {
    setEditingFranchise(f);
    setDistrict(f.district as any);
    setManagerName(f.managerName || '');
    setManagerPhone(f.managerPhone || '');
    setManagerId(f.managerId || '');
    setStatus(f.status || 'pending');
    setRevenue(f.revenue || 0);
    setBusinesses(f.businesses || 0);
    setUsers(f.users || 0);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerName || !managerPhone) {
      alert('Please fill in the manager name and phone.');
      return;
    }

    setActionLoading('submit');
    try {
      const data = {
        district,
        managerName,
        managerPhone,
        managerId: managerId || 'system_assigned',
        status,
        revenue: Number(revenue),
        businesses: Number(businesses),
        users: Number(users),
        updatedAt: new Date(),
      };

      if (editingFranchise) {
        await updateDocument('franchises', editingFranchise.id, data);
      } else {
        await createDocument('franchises', {
          ...data,
          createdAt: new Date(),
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Save franchise error:', err);
      alert('Failed to save franchise information.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this franchise?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('franchises', id);
    } catch (err) {
      console.error('Delete franchise error:', err);
      alert('Failed to delete franchise.');
    } finally {
      setActionLoading(null);
    }
  };

  // Stats calculations
  const activeCount = franchises.filter((f) => f.status === 'active').length;
  const totalRevenue = franchises.reduce((sum, f) => sum + (f.revenue || 0), 0);
  const totalBusinesses = franchises.reduce((sum, f) => sum + (f.businesses || 0), 0);
  const totalUsers = franchises.reduce((sum, f) => sum + (f.users || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Franchise Management</h1>
          <p className="text-sm text-gray-400 mt-1">Configure and monitor district franchise managers and performance</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-gradient flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          Add Franchise
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Franchises"
          value={activeCount}
          icon={ShieldCheck}
          color="purple"
          loading={loading}
        />
        <StatsCard
          title="Total Revenue"
          value={totalRevenue}
          prefix="₹"
          icon={CreditCard}
          color="emerald"
          loading={loading}
        />
        <StatsCard
          title="Total Businesses"
          value={totalBusinesses}
          icon={Building2}
          color="cyan"
          loading={loading}
        />
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-sm font-semibold text-white">District Franchises</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by district or manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input pl-9 pr-4 py-2 text-sm w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
              <p className="text-sm text-gray-400">Loading franchises data...</p>
            </div>
          ) : filtered.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">District</th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Manager Details</th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 text-center">Businesses</th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 text-center">Users</th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 text-center">Revenue</th>
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 text-center">Status</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-violet-400" />
                        <span className="text-sm font-semibold text-white">{f.district}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm font-medium text-white">{f.managerName}</p>
                      <p className="text-[10px] text-gray-500">Ph: {f.managerPhone} | ID: {f.managerId}</p>
                    </td>
                    <td className="px-3 py-3.5 text-center text-sm text-gray-300">
                      {f.businesses ? f.businesses.toLocaleString() : 0}
                    </td>
                    <td className="px-3 py-3.5 text-center text-sm text-gray-300">
                      {f.users ? f.users.toLocaleString() : 0}
                    </td>
                    <td className="px-3 py-3.5 text-center text-sm text-emerald-400 font-medium">
                      ₹{f.revenue ? f.revenue.toLocaleString() : 0}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <StatusBadge status={f.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {actionLoading === f.id ? (
                          <Loader2 size={14} className="text-violet-400 animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(f)}
                              className="p-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08]"
                              title="Edit Franchise"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(f.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                              title="Delete Franchise"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                <MapPin size={28} className="text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-400">No franchises found</p>
              <p className="text-xs text-gray-600 mt-1">Create a new franchise connection using the button above</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFranchise ? 'Edit Franchise Manager' : 'Add New Franchise Manager'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* District Select */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Select TN District</label>
            <div className="relative">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as any)}
                className="appearance-none w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer"
              >
                {TN_DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-[#0f0f24]">
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Manager Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Manager Name</label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Full Name"
              className="search-input w-full px-3.5 py-2.5 text-sm"
              required
            />
          </div>

          {/* Manager Phone */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Manager Phone</label>
            <input
              type="tel"
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="search-input w-full px-3.5 py-2.5 text-sm"
              required
            />
          </div>

          {/* Manager User ID */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Manager Firebase User ID (Optional)</label>
            <input
              type="text"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="Auth UID if associated with user profile"
              className="search-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="appearance-none w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-gray-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer"
              >
                <option value="pending" className="bg-[#0f0f24]">Pending</option>
                <option value="active" className="bg-[#0f0f24]">Active</option>
                <option value="inactive" className="bg-[#0f0f24]">Inactive</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Businesses</label>
              <input
                type="number"
                value={businesses}
                onChange={(e) => setBusinesses(Number(e.target.value))}
                className="search-input w-full px-3.5 py-2.5 text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Users</label>
              <input
                type="number"
                value={users}
                onChange={(e) => setUsers(Number(e.target.value))}
                className="search-input w-full px-3.5 py-2.5 text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Revenue (₹)</label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="search-input w-full px-3.5 py-2.5 text-sm"
                min="0"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'submit'}
              className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              {actionLoading === 'submit' && <Loader2 size={14} className="animate-spin" />}
              {editingFranchise ? 'Save Changes' : 'Create Franchise'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
