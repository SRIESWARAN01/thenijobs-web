'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, writeBatch, where, orderBy } from 'firebase/firestore';
import { Bell, Check, Eye, Calendar, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'interview' | 'alert' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: any;
}

const typeIcons = {
  application: { icon: Eye, color: 'text-cyan-400 bg-blue-100 border-blue-200' },
  interview: { icon: Calendar, color: 'text-amber-400 bg-amber-100 border-amber-200' },
  alert: { icon: Bell, color: 'text-emerald-400 bg-emerald-100 border-emerald-200' },
  system: { icon: Star, color: 'text-violet-400 bg-violet-500/10 border-violet-200' } };

export default function SeekerNotificationsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  // 1. Fetch real notifications in real-time
  const { data: notifications, loading } = useCollection<NotificationItem>('notifications', [
    where('userId', '==', uid || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !uid });

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const toast = useToast();

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-gray-900">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading notifications...</p>
      </div>
    );
  }

  const displayed = filter === 'all' ? notifications : notifications.filter(n => !n.isRead);

  return (
    <div className="animate-fade-in-up space-y-6 max-w-3xl mx-auto font-outfit text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-outfit font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Updates on your applications, interviews, and job alerts</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-405 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            filter === 'all'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-white/[0.02] text-gray-400 border border-white/[0.04] hover:bg-white'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            filter === 'unread'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-white/[0.02] text-gray-400 border border-white/[0.04] hover:bg-white'
          }`}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-500">
              <Bell size={24} />
            </div>
            <h2 className="text-base font-semibold text-gray-900">All caught up!</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-505">
              {filter === 'unread' ? "You don't have any unread notifications." : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          displayed.map((item) => {
            const dateStr = item.createdAt
              ? new Date(item.createdAt.seconds * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : 'Recently';
            
            const config = typeIcons[item.type] || typeIcons.system;
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                className={`glass-card rounded-2xl p-4 transition-all flex items-start gap-4 border cursor-pointer ${
                  item.isRead ? 'opacity-70 bg-white/[0.01] border-white/[0.04]' : 'border-emerald-500/10 hover:border-emerald-200 bg-emerald-500/[0.01]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${config.color} border flex items-center justify-center shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
                    <span className="text-[10px] text-gray-500 shrink-0">{dateStr}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.message}</p>
                  
                  {item.link && (
                    <div className="mt-3">
                      <Link
                        href={item.link}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  )}
                </div>
                {!item.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 self-center" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
