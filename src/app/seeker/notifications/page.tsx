'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, writeBatch, where, orderBy } from 'firebase/firestore';
import { Bell, Check, Eye, Calendar, Star, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

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
  createdAt: any;
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
    <div className="space-y-6 max-w-4xl mx-auto font-outfit text-gray-900 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Notifications &amp; Alerts</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track updates on job applications, interview calls, and hiring messages</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-2xs"
          >
            <CheckCircle2 size={14} /> Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 overflow-x-auto no-scrollbar w-fit max-w-full">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'unread' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Bell size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">All caught up!</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {filter === 'unread' ? "You don't have any unread notifications." : "You have no notifications yet."}
            </p>
          </div>
        ) : (
          displayed.map((item) => {
            const isRead = item.isRead || item.read;
            const config = typeIcons[item.type] || typeIcons.system;
            const Icon = config.icon;
            const actionTarget = item.actionUrl || item.link;

            const dateStr = item.createdAt
              ? (item.createdAt.seconds
                  ? new Date(item.createdAt.seconds * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'Recently')
              : 'Recently';

            return (
              <div
                key={item.id}
                onClick={() => !isRead && handleMarkAsRead(item.id)}
                className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs transition-all flex items-start gap-3.5 ${
                  !isRead ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                  style={{ background: config.bg }}
                >
                  <Icon size={18} style={{ color: config.color }} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{item.title}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap shrink-0">{dateStr}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.message}</p>

                  {actionTarget && (
                    <div className="pt-2">
                      <Link
                        href={actionTarget}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <span>View Details</span>
                        <span>→</span>
                      </Link>
                    </div>
                  )}
                </div>

                {!isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
