'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Settings, Shield, Bell, Save, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { upsertDocument } from '@/lib/firebase/firestoreService';

export default function EmployerSettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;
  const { data: remoteSettings } = useDocument<any>('employerSettings', companyId);

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

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      if (!companyId || !user?.uid) throw new Error('Missing company profile.');
      await upsertDocument('employerSettings', companyId, {
        companyId,
        ownerId: user.uid,
        notifications: notifs,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs(p => ({ ...p, [key]: !p[key] }));
  };

  const loading = companyLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Settings size={48} className="text-gray-600 mb-4" />
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
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure your employer portal settings and preferences</p>
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

          <button
            onClick={handleSave}
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
    </div>
  );
}
