'use client';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Notify the admin team about a platform event.
 *
 * RULES-1 (2026-09-04): the previous implementation queried `users` for every admin and wrote one
 * notification per admin. Under default-deny rules a non-admin cannot read `users`, so this now
 * writes a single notification addressed to the pseudo-recipient `admin`. Admin sessions subscribe
 * to that inbox in NotificationContext; the rule allows any signed-in user to create it.
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
    await addDoc(collection(db, 'notifications'), {
      userId: 'admin',
      type: 'system',
      title,
      message,
      ...(actionUrl ? { actionUrl } : {}),
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[notifyAllAdmins] Failed to notify admins:', err);
    // Non-critical — don't throw so it doesn't block the caller
  }
}
