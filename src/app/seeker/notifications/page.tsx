'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, writeBatch, where, orderBy } from 'firebase/firestore';
import { Bell, Check, Eye, Calendar, Star, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { formatDateTime, type FirestoreTime } from '@/lib/firestoreTime';
import { Button, Card, EmptyState, PageHeader, PageShell, Tabs } from '@/components/dashboard';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'interview' | 'alert' | 'system' | 'broadcast';
  actionUrl?: string;
  link?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: FirestoreTime;
}

const typeIcons = {
  application: { icon: Eye, bg: '#EFF6FF', color: '#2563EB' },
  interview:   { icon: Calendar, bg: '#FFFBEB', color: '#D97706' },
  alert:       { icon: Bell, bg: '#ECFDF5', color: '#059669' },
  system:      { icon: Star, bg: '#F5F3FF', color: '#7C3AED' },
  broadcast:   { icon: Sparkles, bg: '#EFF6FF', color: '#2563EB' },
};

export default function SeekerNotificationsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const { data: notifications, loading } = useCollection<NotificationItem>('notifications', [
    where('userId', '==', uid || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !uid });

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const toast = useToast();

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true, read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead && !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true, read: true });
      });
      await batch.commit();
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-gray-900 gap-3">
        <Loader2 size={32} className="text-emerald-600 animate-spin" />
        <p className="text-xs text-gray-500 font-semibold">Loading notifications...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;
  const displayed = filter === 'all' ? notifications : notifications.filter(n => !n.isRead && !n.read);

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        title="Notifications & alerts"
        description="Updates on your applications, interview calls and hiring messages."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              onClick={handleMarkAllRead}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCircle2 size={14} /> Mark all as read
            </Button>
          ) : undefined
        }
      />

      <Tabs
        label="Notification filter"
        value={filter}
        onChange={(id) => setFilter(id as 'all' | 'unread')}
        tabs={[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
        ]}
      />

      {displayed.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description={
            filter === 'unread'
              ? "You don't have any unread notifications."
              : 'You have no notifications yet.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {displayed.map((item) => {
            const isRead = item.isRead || item.read;
            const config = typeIcons[item.type] || typeIcons.system;
            const Icon = config.icon;
            const actionTarget = item.actionUrl || item.link;

            return (
              <li key={item.id}>
                <Card
                  className={`flex items-start gap-3.5 p-4 transition-all sm:p-5 ${
                    !isRead ? 'border-emerald-300 bg-emerald-50/30' : ''
                  }`}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: config.bg }}
                  >
                    <Icon size={18} style={{ color: config.color }} aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-900">{item.title}</h2>
                      <span className="shrink-0 whitespace-nowrap text-xs text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">{item.message}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-1.5">
                      {actionTarget && (
                        <Link
                          href={actionTarget}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          View details →
                        </Link>
                      )}
                      {/* Marking read was previously bound to a click anywhere on the
                          card — a div with an onClick, so keyboard users had no way to
                          reach it and screen readers were told nothing was actionable. */}
                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(item.id)}
                          className="tap-target-auto inline-flex items-center gap-1 rounded text-xs font-semibold text-slate-500 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Check size={12} aria-hidden /> Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  {!isRead && (
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"
                      aria-label="Unread"
                    />
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
