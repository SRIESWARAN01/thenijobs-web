'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Settings, Shield, Bell, Save, Loader2, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { upsertDocument } from '@/lib/firebase/firestoreService';

export default function EmployerSettingsPage() {
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Delete account states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type "DELETE" to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const deleteAcc = httpsCallable(functions, 'deleteCompanyAccount');
      await deleteAcc();
      
      // Logout and redirect to login page
      await logout();
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      setDeleteError(err?.message || 'Failed to delete company account.');
    } finally {
      setDeleting(false);
    }
  };

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;
  const { data: remoteSettings } = useDocument<any>('employerSettings', companyId);

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [notifs, setNotifs] = useState({
    applications: true,
    leads: true,
    reviews: true,
    interviews: true,
    system: true
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (remoteSettings?.notifications) {
      setNotifs((prev) => ({ ...prev, ...remoteSettings.notifications }));
    }
  }, [remoteSettings]);

  const handleSave = async (updatedNotifs = notifs) => {
    if (!companyId || !user?.uid) return;
    setSaving(true);
    setSaved(false);
    setAutoSaveStatus('saving');
    try {
      await upsertDocument('employerSettings', companyId, {
        companyId,
        ownerId: user.uid,
        notifications: updatedNotifs,
      });
      setSaved(true);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
    } catch (err) {
      console.error(err);
      setAutoSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifs) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    handleSave(updated);
  };

  const loading = companyLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Settings size={48} className="text-gray-500 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to adjust settings.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Configure your employer portal settings and preferences</p>
        </div>
        {autoSaveStatus !== 'idle' && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${
            autoSaveStatus === 'saving' 
              ? 'text-amber-400' 
              : autoSaveStatus === 'saved' 
              ? 'text-emerald-400' 
              : 'text-rose-400'
          }`}>
            {autoSaveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
            {autoSaveStatus === 'saving' ? 'Saving changes...' : autoSaveStatus === 'saved' ? 'Saved Successfully' : 'Save Error'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading settings...</p>
        </div>
      ) : (
        <div className="max-w-xl space-y-6">
          {/* Notification settings */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell size={16} className="text-cyan-400" />
              Notification Preferences
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">Choose when and how you want to be notified about recruitment updates.</p>
            <div className="space-y-3 pt-2">
              {[
                { key: 'applications', label: 'New Job Applications', desc: 'When a candidate submits their resume to your job' },
                { key: 'leads', label: 'Business Service Leads', desc: 'When a customer submits an enquiry lead' },
                { key: 'reviews', label: 'Reviews & Feedback', desc: 'When a user reviews or ratings your company' },
                { key: 'interviews', label: 'Interviews & Schedules', desc: 'Schedules updates, cancellations and confirmation alerts' },
                { key: 'system', label: 'System Announcements', desc: 'General notifications regarding product updates' }
              ].map((item) => {
                const checked = notifs[item.key as keyof typeof notifs];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleNotif(item.key as keyof typeof notifs)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{item.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{item.desc}</div>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-all ${checked ? 'bg-cyan-500' : 'bg-white/20'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${checked ? 'left-[18px]' : 'left-1'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield size={16} className="text-cyan-400" />
              Portal Security
            </h3>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white">Registered Account Email</p>
                <p className="text-gray-500 mt-0.5">{user?.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1 text-[10px]">
                <CheckCircle size={12} /> Verified
              </span>
            </div>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-rose-500/20 bg-rose-950/5">
            <h3 className="text-sm font-semibold text-rose-450 flex items-center gap-2">
              <Trash2 size={16} className="text-rose-400" />
              Danger Zone
            </h3>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              Once you delete your company account, all associated data, including company profile, jobs, applications, products, reviews, images, subscriptions, and logs, will be permanently removed. This action cannot be undone.
            </p>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="w-full py-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all hover:scale-[1.01]"
            >
              Permanently Delete Company Account
            </button>
          </div>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && (
            <p className="text-center text-xs font-semibold text-emerald-400">
              Settings saved.
            </p>
          )}
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-950 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-white">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will delete your company profile, auth credentials, storage images, and all related database records. 
                <strong> This action is irreversible.</strong>
              </p>
            </div>
            
            <div className="space-y-1.5 pt-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                Type &quot;DELETE&quot; to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-white/[0.02] border border-white/10 px-3.5 py-2.5 text-xs text-white rounded-xl outline-none focus:border-rose-500/50 transition-all font-mono text-center tracking-widest"
              />
            </div>

            {deleteError && (
              <p className="text-[11px] text-rose-450 text-center font-semibold bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                ⚠️ {deleteError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 text-xs font-bold transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-650 hover:brightness-110 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deleting ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
