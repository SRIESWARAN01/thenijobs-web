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
import {
  ActionMenu, Button, DataTable, PageHeader, Pill, ViewToggle, useViewMode, type Column,
} from '@/components/dashboard';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, updateDoc, deleteDoc, where, serverTimestamp } from 'firebase/firestore';
import { TN_DISTRICTS } from '@/lib/types';
import { useToast } from '@/contexts/ToastContext';

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

  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useViewMode('seeker-job-alerts', 'table');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

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
      toast.error('Failed to update alert status.');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job alert?')) return;
    try {
      await deleteDoc(doc(db, 'jobAlerts', id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete job alert.');
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    if (!title.trim()) {
      toast.warning('Please provide a title for the alert.');
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
      toast.error('Failed to create job alert.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-gray-900">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading job alerts...</p>
      </div>
    );
  }

  const alertColumns: Column<JobAlert>[] = [
    {
      key: 'title',
      header: 'Alert',
      card: 'title',
      sortValue: a => a.title ?? '',
      render: a => (
        <div className="min-w-0">
          <span className="block truncate font-semibold text-slate-900">{a.title}</span>
          <span className="block truncate text-xs text-slate-500">
            {[a.category, a.district, a.jobType].filter(Boolean).join(' · ') || 'Any job'}
          </span>
        </div>
      ),
    },
    {
      key: 'channels',
      header: 'Channels',
      sortValue: a => [a.emailEnabled, a.whatsappEnabled, a.pushEnabled].filter(Boolean).length,
      render: a => {
        const on = [
          a.emailEnabled && { label: 'Email', Icon: Mail },
          a.whatsappEnabled && { label: 'WhatsApp', Icon: MessageSquare },
          a.pushEnabled && { label: 'Push', Icon: Smartphone },
        ].filter(Boolean) as { label: string; Icon: typeof Mail }[];
        if (on.length === 0) return <Pill tone="danger">None</Pill>;
        return (
          <span className="flex flex-wrap items-center gap-1.5">
            {on.map(({ label, Icon }) => (
              <Pill key={label} tone="success"><Icon size={10} /> {label}</Pill>
            ))}
          </span>
        );
      },
    },
    {
      key: 'district',
      header: 'District',
      hideBelow: 'xl',
      sortValue: a => a.district ?? '',
      render: a => a.district || 'Any',
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: a => a.status ?? 'active',
      render: a => (
        <Pill tone={a.status === 'active' ? 'success' : 'warning'} dot>{a.status}</Pill>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-6 font-outfit text-gray-900 relative">
      <PageHeader
        title="Job alerts"
        description="Turn skills, locations, categories and channels into automatic job notifications."
        actions={
          <>
            <ViewToggle value={view} onChange={setView} />
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> New alert
            </Button>
          </>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 font-outfit">{alerts.filter(a => a.status === 'active').length}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Active Alerts</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <Bell size={18} className="text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 font-outfit">Realtime</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Scan Status</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <Clock size={18} className="text-amber-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 font-outfit">Active</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Push Notifications</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
              <Smartphone size={18} className="text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 font-outfit">Instant</p>
              <p className="mt-1 text-xs font-medium text-slate-500">WhatsApp Alert Sync</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <MessageSquare size={18} className="text-[#25D366]" />
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Alert Simulation & Quick Test Box */}
      <div className="rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center font-black shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personalized WhatsApp Job Alerts</h3>
              <p className="text-xs text-slate-500">Receive verified jobs directly in your WhatsApp chat matching your skills &amp; town.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const text = `🔔 *THENIJOBS — Daily Job Alert Preview*\n\n💼 *Role:* Accounts Assistant / Senior Billing\n🏢 *Company:* Theni Commercial Hub\n📍 *Location:* Theni Town, Tamil Nadu\n💰 *Salary:* ₹18,000 - ₹25,000 / month\n\n⚡ *1-Click Apply:* https://thenijobs.com/jobs/demo\n\n_You are subscribed to Daily Alerts on THENIJOBS._`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              toast.success('WhatsApp alert preview opened!');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:opacity-90 flex items-center gap-1.5 self-start sm:self-auto transition-all shadow-xs"
          >
            <MessageSquare size={14} /> Send Sample WhatsApp Alert
          </button>
        </div>

        {/* Simulated Chat Bubble */}
        <div className="p-4 rounded-2xl bg-[#ECE5DD] border border-[#d1c8be] max-w-lg space-y-1.5 shadow-2xs font-sans text-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
            <span className="text-emerald-800 font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> THENIJOBS Verified Bot
            </span>
            <span>9:00 AM</span>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-xs text-slate-800 space-y-1 leading-relaxed">
            <p className="font-extrabold text-emerald-900 text-[13px]">🔔 New Verified Job in Theni District!</p>
            <p><strong>Role:</strong> Accounts &amp; Billing Specialist</p>
            <p><strong>Town:</strong> Theni / Cumbum</p>
            <p><strong>Pay:</strong> ₹18,000 - ₹25,000 / Month</p>
            <p className="text-blue-600 font-mono text-[11px] pt-1">👉 thenijobs.com/jobs/demo</p>
          </div>
        </div>
      </div>


      {/* Alerts list */}
      <DataTable
        label="Job alerts"
        view={view}
        gridColumns={2}
        columns={alertColumns}
        rows={alerts}
        getRowId={a => a.id}
        emptyIcon={Bell}
        emptyTitle="No alerts set up"
        emptyDescription="Create a job alert to be notified as soon as a matching job is posted."
        emptyAction={
          <Button variant="primary" onClick={() => setModalOpen(true)}>Set new alert</Button>
        }
        rowActions={item => (
          <ActionMenu
            label={`Actions for ${item.title}`}
            items={[
              {
                label: item.status === 'active' ? 'Pause alert' : 'Resume alert',
                icon: item.status === 'active' ? ToggleLeft : ToggleRight,
                onClick: () => handleToggleStatus(item),
              },
              {
                label: 'Delete alert',
                icon: Trash2,
                tone: 'danger',
                separatorBefore: true,
                onClick: () => handleDeleteAlert(item.id),
              },
            ]}
          />
        )}
      />

      {/* Create Alert Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-2xl w-full max-w-lg overflow-hidden border border-emerald-200 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white transition-colors"
            >
              <X size={18} />
            </button>
            <form onSubmit={handleCreateAlert} className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Create Job Alert</h3>
              <p className="text-xs text-slate-500">Define search criteria for matches and specify delivery channels.</p>

              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">Alert Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Alert name"
                  className="search-input w-full px-3 py-2.5 text-base sm:text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1.5 font-medium">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Keywords"
                    className="search-input w-full px-3 py-2.5 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1.5 font-medium">District</label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="search-input w-full px-3 py-2.5 text-base sm:text-sm"
                  >
                    <option value="">Any District</option>
                    {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-medium">Job Type</label>
                <select
                  value={jobType}
                  onChange={e => setJobType(e.target.value)}
                  className="search-input w-full px-3 py-2.5 text-base sm:text-sm"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              {/* Notification Channels */}
              <div className="space-y-2.5 border-t border-gray-100 pt-4">
                <label className="text-xs text-slate-500 block font-medium">Notification Channels</label>
                
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white">
                  <span className="flex items-center gap-2 text-xs text-slate-500">
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

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white">
                  <span className="flex items-center gap-2 text-xs text-slate-500">
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

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white">
                  <span className="flex items-center gap-2 text-xs text-slate-500">
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
    </div>
  );
}
