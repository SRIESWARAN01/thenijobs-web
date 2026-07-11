'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook for managing push notification permissions and FCM token.
 * Handles:
 * - Requesting notification permission
 * - Getting FCM token
 * - Saving token to user doc
 * - Foreground message handling
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setError('Push notifications are not supported in this browser.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Notification permission was denied.');
        return null;
      }

      // Dynamically import Firebase messaging
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
      const app = (await import('@/lib/firebase/config')).default;

      const messaging = getMessaging(app);

      // Register service worker
      let swRegistration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
        serviceWorkerRegistration: swRegistration,
      });

      if (fcmToken) {
        setToken(fcmToken);

        // Save token to user document
        if (user?.uid) {
          const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/config');
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              fcmTokens: arrayUnion(fcmToken),
              pushNotificationsEnabled: true,
              lastTokenUpdate: new Date().toISOString(),
            });
          } catch (err) {
            console.warn('[Push] Failed to save FCM token to user doc:', err);
          }
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('[Push] Foreground message:', payload);

          // Show a browser notification even in foreground
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'Theni Jobs', {
              body: payload.notification?.body || 'You have a new notification',
              icon: '/icon-192.png',
            });
          }
        });

        return fcmToken;
      } else {
        setError('Failed to get FCM token. Check VAPID key configuration.');
        return null;
      }
    } catch (err: any) {
      console.error('[Push] Error setting up push notifications:', err);
      setError(err.message || 'Failed to setup push notifications.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  return {
    permission,
    token,
    loading,
    error,
    requestPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator,
  };
}
