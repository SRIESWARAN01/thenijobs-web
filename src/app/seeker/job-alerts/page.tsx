'use client';

import { useState } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Mail,
  MessageSquare,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, updateDoc, deleteDoc, where, serverTimestamp } from 'firebase/firestore';
import { THENI_LAUNCH_LOCATIONS } from '@/lib/types';
import { getPlanLimit, selectBestSubscription } from '@/lib/subscriptions';

interface JobAlert {
  id: string;
  title: string;
  category: string;
  district: string;
  jobType: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  status: 'active' | 'paused';
}

export default function JobAlertsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  // 1. Fetch real alerts in real-time
  const { data: alerts, loading } = useCollection<JobAlert>('jobAlerts', [
    where('userId', '==', uid || '')
  ], { skip: !uid });
  const { data: subscriptions } = useCollection<any>('subscriptions', [
    where('userId', '==', uid || '')
  ], { skip: !uid });

  const activeSub = selectBestSubscription(subscriptions);
  const activePlan = activeSub?.plan || 'free';
  const maxAlerts = getPlanLimit(activePlan, 'maxJobAlerts');

  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New alert form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleToggleStatus = async (alertItem: JobAlert) => {
    try {
      const newStatus = alertItem.status === 'active' ? 'paused' : 'active';
      await updateDoc(doc(db, 'jobAlerts', alertItem.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update alert status.');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job alert?')) return;
    try {
      await deleteDoc(doc(db, 'jobAlerts', id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete job alert.');
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    if (!title.trim()) {
      alert('Please provide a title for the alert.');
      return;
    }
    if (alerts.length >= maxAlerts) {
      setModalOpen(false);
      setUpgradeOpen(true);
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'jobAlerts'), {
        userId: uid,
        title: title.trim(),
        category,
        district,
        jobType,
        emailEnabled,
        whatsappEnabled,
        pushEnabled,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Reset form
      setTitle('');
      setCategory('');
      setDistrict('');
      setJobType('Full-time');
      setEmailEnabled(true);
      setWhatsappEnabled(false);
      setPushEnabled(true);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create job alert.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading job alerts...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6 font-outfit text-white relative">
      {/* Header */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-semibold">Notification Rules</p>
            <h1 className="mt-1 text-2xl font-bold text-white font-outfit">Job Alerts</h1>
            <p className="mt-1 text-sm text-gray-400">Manage alert preferences that turn skills, locations, categories, and channels into automatic job notifications.</p>
            <p className="mt-2 text-xs text-emerald-300">
              {alerts.length} of {maxAlerts} active plan alert slots used.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 self-start sm:self-auto"
          >
            <Plus size={16} />
            New Alert
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-white font-outfit">{alerts.filter(a => a.status === 'active').length}</p>
              <p className="mt-1 text-xs font-medium text-gray-400">Active Alerts</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <Bell size={18} className="text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-white font-outfit">Realtime</p>
              <p className="mt-1 text-xs font-medium text-gray-400">Scan Status</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <Clock size={18} className="text-amber-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-white font-outfit">Active</p>
              <p className="mt-1 text-xs font-medium text-gray-400">Push Notifications</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
              <Smartphone size={18} className="text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-white font-outfit">Active</p>
              <p className="mt-1 text-xs font-medium text-gray-400">Email Updates</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <Mail size={18} className="text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Bell size={24} className="text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-white">No alerts set up</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">Set up custom job alerts to get notified by email or push as soon as matching jobs are posted.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2 mt-4 text-xs font-semibold text-gray-300 hover:bg-white/[0.08]"
            >
              Set New Alert
            </button>
          </div>
        ) : (
          alerts.map((item) => (
            <div key={item.id} className={`glass-card rounded-2xl p-5 transition-all border ${item.status === 'active' ? 'hover:border-emerald-500/10' : 'opacity-60'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-white">{item.title}</h2>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1.5">
                    {item.category && <span>📂 {item.category}</span>}
                    {item.district && <span>📍 {item.district}</span>}
                    {item.jobType && <span>💼 {item.jobType}</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">📡 Channels:</span>
                    {item.emailEnabled && <span className="flex items-center gap-1 text-emerald-400"><Mail size={12} /> Email</span>}
                    {item.whatsappEnabled && <span className="flex items-center gap-1 text-emerald-400"><MessageSquare size={12} /> WhatsApp</span>}
                    {item.pushEnabled && <span className="flex items-center gap-1 text-emerald-400"><Smartphone size={12} /> Push</span>}
                    {!item.emailEnabled && !item.whatsappEnabled && !item.pushEnabled && <span className="text-rose-400">None</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      item.status === 'active' ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-gray-400 bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}
                    title={item.status === 'active' ? 'Pause Alert' : 'Resume Alert'}
                  >
                    {item.status === 'active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(item.id)}
                    className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Alert Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-2xl w-full max-w-lg overflow-hidden border border-emerald-500/20 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} />
            </button>
            <form onSubmit={handleCreateAlert} className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Create Job Alert</h3>
              <p className="text-xs text-gray-400">Define search criteria for matches and specify delivery channels.</p>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Alert Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Developer jobs in Theni"
                  className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. IT, Driving"
                    className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Area / Town</label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                  >
                    <option value="">Any Area</option>
                    {THENI_LAUNCH_LOCATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Job Type</label>
                <select
                  value={jobType}
                  onChange={e => setJobType(e.target.value)}
                  className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              {/* Notification Channels */}
              <div className="space-y-2.5 border-t border-white/[0.06] pt-4">
                <label className="text-xs text-gray-400 block font-medium">Notification Channels</label>
                
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04]">
                  <span className="flex items-center gap-2 text-xs text-gray-300">
                    <Mail size={14} className="text-violet-400" />
                    Email Alerts
                  </span>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={e => setEmailEnabled(e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04]">
                  <span className="flex items-center gap-2 text-xs text-gray-300">
                    <MessageSquare size={14} className="text-emerald-400" />
                    WhatsApp Messages
                  </span>
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={e => setWhatsappEnabled(e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04]">
                  <span className="flex items-center gap-2 text-xs text-gray-300">
                    <Smartphone size={14} className="text-cyan-400" />
                    Push Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={e => setPushEnabled(e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Creating alert...' : 'Create Alert'}
              </button>
            </form>
          </div>
        </div>
      )}

      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-emerald-500/20 p-6 text-center">
            <Bell size={28} className="mx-auto mb-3 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Upgrade Plan</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Your current plan allows {maxAlerts} job alerts. Upgrade to unlock more yearly alert slots.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setUpgradeOpen(false)}
                className="flex-1 rounded-xl bg-white/[0.06] py-2 text-xs font-semibold text-gray-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpgradeOpen(false);
                  window.location.href = '/seeker/subscription';
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-2 text-xs font-semibold text-white"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
