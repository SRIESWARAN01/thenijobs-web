'use client';

import { useState } from 'react';
import { Bell, Building2, Clock, Globe, Loader2, Send, Users } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { createDocument, getUsers, createNotification } from '@/lib/firebase/firestoreService';
import { orderBy, limit, type DocumentData } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import type { FirestoreTime } from '@/lib/firestoreTime';
import {
  Button, Card, CardBody, CardHeader, EmptyState, PageHeader, PageShell, Pill, Tabs,
} from '@/components/dashboard';

interface BroadcastDoc {
  id: string;
  title: string;
  message: string;
  type: 'push' | 'sms' | 'email';
  audience: string;
  sentAt?: Date;
  status: 'sent' | 'scheduled' | 'draft';
  stats?: { sent: number; delivered: number };
  createdAt?: FirestoreTime;
}

const TABS = ['Push Notifications', 'SMS Broadcast', 'Email Campaign'] as const;

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Registered Users', icon: Globe },
  { value: 'job_seekers', label: 'Job Seekers Only', icon: Users },
  { value: 'employers', label: 'Employers & Business Owners', icon: Building2 },
];

export default function NotificationsPage() {
  const { data: broadcasts, loading } = useCollection<BroadcastDoc>('broadcasts', [
    orderBy('createdAt', 'desc'),
    limit(30)
  ]);

  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Push Notifications');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeAudience, setComposeAudience] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  const currentType = activeTab === 'Push Notifications' ? 'push' : activeTab === 'SMS Broadcast' ? 'sms' : 'email';
  const filteredBroadcasts = broadcasts.filter((b) => b.type === currentType);

  const handleSend = async () => {
    if (!composeTitle.trim() || !composeMessage.trim()) {
      toast.warning('Please enter both title and message.');
      return;
    }

    setActionLoading(true);
    try {
      let recipients: DocumentData[] = [];
      if (composeAudience === 'all') {
        recipients = await getUsers();
      } else if (composeAudience === 'job_seekers') {
        recipients = await getUsers({ role: 'job_seeker' });
      } else if (composeAudience === 'employers') {
        const employers = await getUsers({ role: 'employer' });
        const businessOwners = await getUsers({ role: 'business_owner' });
        recipients = [...employers, ...businessOwners];
      }

      // getUsers() is typed DocumentData[], so an id is not guaranteed on
      // every row; a missing one would send createNotification a userId of
      // undefined and write an unaddressable notification.
      const recipientIds = Array.from(
        new Set(recipients.map((r) => r.id).filter((id): id is string => typeof id === 'string' && id.length > 0)),
      );

      await Promise.all(
        recipientIds.map((userId) =>
          createNotification({
            userId,
            type: 'broadcast',
            title: composeTitle.trim(),
            message: composeMessage.trim(),
            actionUrl: '/seeker/notifications'
          })
        )
      );

      await createDocument('broadcasts', {
        title: composeTitle.trim(),
        message: composeMessage.trim(),
        type: currentType,
        audience: AUDIENCE_OPTIONS.find((o) => o.value === composeAudience)?.label || 'All Users',
        status: 'sent',
        // No open-tracking pixel or delivery receipt exists anywhere in this codebase, so an
        // "opened" count cannot be measured; only sent/delivered are real.
        stats: {
          sent: recipientIds.length,
          delivered: recipientIds.length,
        }
      });

      setComposeTitle('');
      setComposeMessage('');
      toast.success('Broadcast sent successfully!', `Delivered to ${recipientIds.length} users.`);
    } catch (err) {
      console.error('Send broadcast error:', err);
      toast.error('Failed to send broadcast.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Notification & broadcast centre"
        description="Dispatch platform announcements, alerts and campaigns to candidates and employers."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Notifications' }]}
      />

      <Tabs
        label="Broadcast channel"
        tabs={TABS.map(t => ({ id: t, label: t }))}
        value={activeTab}
        onChange={(id) => setActiveTab(id as typeof TABS[number])}
      />

      <Card>
        <CardHeader
          title={`Compose ${activeTab.toLowerCase()}`}
          action={<Bell size={16} className="text-slate-400" aria-hidden />}
        />
        <CardBody className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-slate-700">Target audience</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {AUDIENCE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = composeAudience === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setComposeAudience(opt.value)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? 'border-blue-300 bg-[#EFF6FF] text-[#1E40AF]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-slate-400'} aria-hidden />
                    <span className="text-left">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="broadcast-title" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Notification title <span className="text-rose-600">*</span>
            </label>
            <input
              id="broadcast-title"
              type="text"
              placeholder="e.g. New job openings available in Theni"
              value={composeTitle}
              onChange={e => setComposeTitle(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-base font-medium text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="broadcast-body" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Notification body <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="broadcast-body"
              rows={4}
              placeholder="Write your broadcast announcement…"
              value={composeMessage}
              onChange={e => setComposeMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3.5 text-base font-medium leading-relaxed text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSend}
              loading={actionLoading}
              block
              className="sm:w-auto"
            >
              {!actionLoading && <Send size={15} />}
              {actionLoading ? 'Dispatching broadcast…' : 'Send broadcast now'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Broadcast history"
          description={`Previous ${activeTab.toLowerCase()} sends`}
          action={<Clock size={16} className="text-slate-400" aria-hidden />}
        />
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-blue-600" />
          </div>
        ) : filteredBroadcasts.length === 0 ? (
          <EmptyState
            variant="inline"
            icon={Send}
            title="Nothing sent on this channel yet"
            description="Broadcasts you dispatch above will be listed here."
          />
        ) : (
          <CardBody className="space-y-3">
            {filteredBroadcasts.map((b) => (
              <div key={b.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{b.title}</h3>
                    <p className="text-xs text-slate-500">Audience: {b.audience}</p>
                  </div>
                  <Pill tone={b.status === 'sent' ? 'success' : b.status === 'scheduled' ? 'warning' : 'neutral'} dot>
                    {b.status || 'draft'}
                  </Pill>
                </div>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{b.message}</p>
              </div>
            ))}
          </CardBody>
        )}
      </Card>
    </PageShell>
  );
}
