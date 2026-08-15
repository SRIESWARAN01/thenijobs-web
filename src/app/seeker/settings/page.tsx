'use client';

import { useState } from 'react';
import {
  Bell, CheckCircle, Mail, MessageCircle, Save, Settings,
  Shield, Smartphone, User, Check
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

type Channel = 'push' | 'sms' | 'email' | 'whatsapp';
type EventKey = 'job_alerts' | 'application_updates' | 'interviews' | 'business_updates' | 'promotions';

const channels: { key: Channel; label: string; icon: typeof Bell }[] = [
  { key: 'push', label: 'Push App', icon: Bell },
  { key: 'sms', label: 'SMS Phone', icon: Smartphone },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const events: { key: EventKey; label: string; description: string }[] = [
  { key: 'job_alerts', label: 'Job Alerts', description: 'New jobs matching your saved skills, roles, and locations' },
  { key: 'application_updates', label: 'Application Updates', description: 'Shortlist, interview calls, selection, and status updates' },
  { key: 'interviews', label: 'Interview Reminders', description: '24-hour and 1-hour interview notifications' },
  { key: 'business_updates', label: 'Direct Hiring Messages', description: 'Direct chat messages from verified local employers' },
  { key: 'promotions', label: 'Career Offers & Events', description: 'Resume scoring tips and job fair updates in Theni' },
];

const initialPrefs: Record<EventKey, Record<Channel, boolean>> = {
  job_alerts: { push: true, sms: true, email: true, whatsapp: true },
  application_updates: { push: true, sms: true, email: true, whatsapp: true },
  interviews: { push: true, sms: true, email: true, whatsapp: true },
  business_updates: { push: true, sms: false, email: true, whatsapp: true },
  promotions: { push: false, sms: false, email: true, whatsapp: false },
};

function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`relative h-6 w-11 rounded-full transition-all cursor-pointer ${checked ? 'bg-emerald-600' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-xs ${checked ? 'left-6' : 'left-1'}`}
      />
    </button>
  );
}

export default function SeekerSettingsPage() {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const toggle = (event: EventKey, channel: Channel) => {
    setSaved(false);
    setPrefs((current) => ({
      ...current,
      [event]: {
        ...current[event],
        [channel]: !current[event][channel],
      },
    }));
  };

  const handleSave = () => {
    setSaved(true);
    toast.success('Notification preferences saved!');
  };

  const enabledCount = Object.values(prefs).reduce(
    (count, eventPrefs) => count + Object.values(eventPrefs).filter(Boolean).length,
    0,
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-outfit text-gray-900 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Account &amp; Notification Settings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage communication channels, privacy preferences, and delivery options</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          <span>{saved ? 'Changes Saved' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          { label: 'Profile Visibility', value: 'Open to Work', icon: User, bg: '#ECFDF5', color: '#059669' },
          { label: 'Active Alerts', value: `${enabledCount} Channels`, icon: Bell, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Privacy Mode', value: 'Verified Employers Only', icon: Shield, bg: '#F5F3FF', color: '#7C3AED' },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: metric.bg }}>
                  <Icon size={20} style={{ color: metric.color }} />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-gray-900 truncate">{metric.value}</p>
                  <p className="text-xs text-gray-500 font-bold">{metric.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification Matrix Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900">Communication &amp; Alert Matrix</h2>
            <p className="text-xs text-gray-500">Choose how you receive application updates and interview calls</p>
          </div>
        </div>

        {/* Mobile View: Event Cards (sm:hidden) */}
        <div className="sm:hidden divide-y divide-gray-100 p-4 space-y-4">
          {events.map((event) => (
            <div key={event.key} className="pt-3 space-y-2.5 first:pt-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{event.label}</h3>
                <p className="text-xs text-gray-500">{event.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {channels.map((channel) => (
                  <div key={channel.key} className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-semibold text-gray-700">{channel.label}</span>
                    <Toggle
                      checked={prefs[event.key][channel.key]}
                      onClick={() => toggle(event.key, channel.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Clean Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Alert Type</th>
                {channels.map((ch) => (
                  <th key={ch.key} className="px-4 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {ch.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.key} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-900">{event.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                  </td>
                  {channels.map((channel) => (
                    <td key={channel.key} className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={prefs[event.key][channel.key]}
                          onClick={() => toggle(event.key, channel.key)}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
