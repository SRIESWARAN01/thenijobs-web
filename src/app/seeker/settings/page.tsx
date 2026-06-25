'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCircle,
  Mail,
  MessageCircle,
  Save,
  Settings,
  Shield,
  Smartphone,
  User,
} from 'lucide-react';

type Channel = 'push' | 'sms' | 'email' | 'whatsapp';
type EventKey = 'job_alerts' | 'application_updates' | 'interviews' | 'business_updates' | 'promotions';

const channels: { key: Channel; label: string; icon: typeof Bell }[] = [
  { key: 'push', label: 'Push', icon: Bell },
  { key: 'sms', label: 'SMS', icon: Smartphone },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const events: { key: EventKey; label: string; description: string }[] = [
  { key: 'job_alerts', label: 'Job alerts', description: 'New jobs matching saved keywords and locations' },
  { key: 'application_updates', label: 'Application updates', description: 'Shortlist, interview, selected, and rejection changes' },
  { key: 'interviews', label: 'Interview reminders', description: '24 hour and 1 hour interview reminders' },
  { key: 'business_updates', label: 'Business updates', description: 'Messages, lead replies, and company responses' },
  { key: 'promotions', label: 'Promotions', description: 'Plan offers, resume boost offers, and platform campaigns' },
];

const initialPrefs: Record<EventKey, Record<Channel, boolean>> = {
  job_alerts: { push: true, sms: true, email: true, whatsapp: true },
  application_updates: { push: true, sms: true, email: true, whatsapp: true },
  interviews: { push: true, sms: true, email: true, whatsapp: true },
  business_updates: { push: true, sms: false, email: true, whatsapp: false },
  promotions: { push: false, sms: false, email: true, whatsapp: false },
};

function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`relative h-8 w-14 rounded-full transition-all ${checked ? 'bg-emerald-500' : 'bg-white/[0.14]'}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`}
      />
    </button>
  );
}

export default function SeekerSettingsPage() {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saved, setSaved] = useState(false);

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

  const enabledCount = Object.values(prefs).reduce(
    (count, eventPrefs) => count + Object.values(eventPrefs).filter(Boolean).length,
    0,
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Preferences</p>
            <h1 className="mt-1 text-2xl font-bold text-white font-outfit">Seeker Settings</h1>
            <p className="mt-1 text-sm text-gray-400">Control profile, privacy, and notification delivery channels.</p>
          </div>
          <button
            type="button"
            onClick={() => setSaved(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { label: 'Profile Visibility', value: 'Open to Work', icon: User, color: 'emerald' },
          { label: 'Enabled Channels', value: enabledCount, icon: Bell, color: 'cyan' },
          { label: 'Privacy Mode', value: 'Employer-only', icon: Shield, color: 'violet' },
        ].map((metric) => {
          const Icon = metric.icon;
          const colorClass = metric.color === 'emerald'
            ? 'bg-emerald-500/15 text-emerald-400'
            : metric.color === 'cyan'
              ? 'bg-cyan-500/15 text-cyan-400'
              : 'bg-violet-500/15 text-violet-400';
          return (
            <div key={metric.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-white font-outfit">{metric.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{metric.label}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Bell size={17} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Notification Matrix</h2>
            <p className="text-[10px] text-gray-500">Per-event delivery controls</p>
          </div>
        </div>

        <div className="space-y-3 p-3 sm:hidden">
          {events.map((event) => (
            <article key={event.key} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div>
                <h3 className="text-sm font-semibold text-white">{event.label}</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">{event.description}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <div key={channel.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-gray-400">
                        <Icon size={13} className="shrink-0" />
                        {channel.label}
                      </span>
                      <Toggle checked={prefs[event.key][channel.key]} onClick={() => toggle(event.key, channel.key)} />
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Event</th>
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <th key={channel.key} className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon size={12} />
                        {channel.label}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {events.map((event) => (
                <tr key={event.key} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{event.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{event.description}</p>
                  </td>
                  {channels.map((channel) => (
                    <td key={channel.key} className="px-4 py-4 text-center">
                      <Toggle checked={prefs[event.key][channel.key]} onClick={() => toggle(event.key, channel.key)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Account Defaults</h2>
              <p className="text-xs text-gray-500">Default resume, profile sharing, and language preferences</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Default resume</span>
              <span className="font-semibold text-white">Software Resume v2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Search visibility</span>
              <span className="font-semibold text-emerald-400">Visible</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Preferred language</span>
              <span className="font-semibold text-white">English + Tamil</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Privacy Guard</h2>
              <p className="text-xs text-gray-500">Phone and WhatsApp access remains opt-in</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['Employers can view resume after application', true],
              ['Talent search can show phone number', false],
              ['WhatsApp direct contact opt-in', true],
            ].map(([label, checked]) => (
              <div key={String(label)} className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-400">{label}</span>
                <Toggle checked={Boolean(checked)} onClick={() => undefined} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
