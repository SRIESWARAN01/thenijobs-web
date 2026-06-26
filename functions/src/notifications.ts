import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { db, REGION } from './config';
import { CreateNotificationData } from './types';
import { FieldValue } from 'firebase-admin/firestore';
import * as helpers from './helpers';

const {
  requireUid, isAdminRequest, canNotifyRelatedUser, getRequiredString, getString
} = helpers;

export const createNotification = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<CreateNotificationData>) => {
    const uid = requireUid(request);
    const data = request.data ?? {};
    const userId = getRequiredString(data.userId, 'userId');
    const type = getString(data.type, 'system').slice(0, 50);
    const title = getRequiredString(data.title, 'title').slice(0, 140);
    const message = getRequiredString(data.message, 'message').slice(0, 600);
    const actionUrl = getString(data.actionUrl).slice(0, 300);

    const allowed =
      userId === uid ||
      await isAdminRequest(request) ||
      await canNotifyRelatedUser(uid, userId);

    if (!allowed) {
      throw new HttpsError(
        'permission-denied',
        'You do not have permission to notify this user.',
      );
    }

    const notificationRef = await db.collection('notifications').add({
      userId,
      type,
      title,
      message,
      ...(actionUrl ? { actionUrl } : {}),
      read: false,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send push notification via FCM if user has a registered token
    try {
      const { getMessaging } = await import('firebase-admin/messaging');
      const userSnap = await db.collection('seekerProfiles').doc(userId).get();
      const fcmToken = userSnap.data()?.fcmToken;
      if (fcmToken) {
        await getMessaging().send({
          token: fcmToken,
          notification: {
            title,
            body: message,
          },
          data: {
            type,
            actionUrl: actionUrl || '',
          },
        });
        console.log(`[FCM] Push notification sent successfully to user ${userId}`);
      }
    } catch (fcmErr) {
      console.warn(`[FCM] Failed to send push notification to user ${userId}:`, fcmErr);
    }

    return { ok: true, notificationId: notificationRef.id };
  },
);

// ============================================================
// EXISTING: Scheduled Functions (preserved)
// ============================================================
