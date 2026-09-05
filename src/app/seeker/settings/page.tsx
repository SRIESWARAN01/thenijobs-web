'use client';

import { useState } from 'react';
import { Bell, CheckCircle, Mail, MessageCircle, Save, Shield, Smartphone, User } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  Button, Card, CardHeader, PageHeader, PageShell, Stat, StatGrid, Switch,
} from '@/components/dashboard';

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

/** Thin wrapper so the existing call sites keep their shape. */
function Toggle({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return <Switch checked={checked} onChange={onClick} label={label} />;
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
    <PageShell className="max-w-4xl">
      <PageHeader
        title="Account & notification settings"
        description="Communication channels, privacy preferences and delivery options."
        actions={
          <Button
            onClick={handleSave}
            className="border-0 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saved ? 'Changes saved' : 'Save preferences'}
          </Button>
        }
      />

      <StatGrid columns={3}>
        <Stat label="Profile visibility" value="Open to work" icon={User} tone="emerald" />
        <Stat label="Active alerts" value={`${enabledCount} channels`} icon={Bell} tone="blue" />
        <Stat label="Privacy mode" value="Verified employers" icon={Shield} tone="violet" />
      </StatGrid>

      {/* Notification Matrix Card */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Communication & alert matrix"
          description="Choose how you receive application updates and interview calls"
          action={<Bell size={16} className="text-slate-400" aria-hidden />}
        />

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
                      label={`${event.label} via ${channel.label}`}
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
                          label={`${event.label} via ${channel.label}`}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
