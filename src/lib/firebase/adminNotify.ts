'use client';

import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Notify all admin and super_admin users about a platform event.
 *
 * @param title   – Notification title
 * @param message – Notification body
 * @param actionUrl – Optional deep-link for the admin portal
 */
export async function notifyAllAdmins(
  title: string,
  message: string,
  actionUrl?: string,
): Promise<void> {
  try {
    // 1. Find all admin users
    const adminQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'super_admin']),
    );
    const snapshot = await getDocs(adminQuery);

    if (snapshot.empty) return;

    // 2. Create a notification for each admin
    const promises = snapshot.docs.map((adminDoc) =>
      addDoc(collection(db, 'notifications'), {
        userId: adminDoc.id,
        type: 'system',
        title,
        message,
        ...(actionUrl ? { actionUrl } : {}),
        read: false,
        createdAt: serverTimestamp(),
      }),
    );

    await Promise.all(promises);
  } catch (err) {
    console.error('[notifyAllAdmins] Failed to notify admins:', err);
    // Non-critical — don't throw so it doesn't block the caller
  }
}
