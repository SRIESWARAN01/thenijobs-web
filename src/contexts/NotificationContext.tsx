'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import {
  markNotificationRead,
  markAllNotificationsRead,
  createNotification
} from '@/lib/firebase/firestoreService';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  isRead?: boolean;
  actionUrl?: string;
  createdAt?: any;
}

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotification: (userId: string, type: string, title: string, message: string, actionUrl?: string) => Promise<any>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !(n.read ?? n.isRead)).length);
        setLoading(false);
      },
      (err) => {
        console.error('[NotificationContext] error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    try {
      await markAllNotificationsRead(user.uid);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleSendNotification = async (
    targetUserId: string,
    type: string,
    title: string,
    message: string,
    actionUrl?: string
  ) => {
    try {
      return await createNotification({
        userId: targetUserId,
        type,
        title,
        message,
        actionUrl,
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        sendNotification: handleSendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
