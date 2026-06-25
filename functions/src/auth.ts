import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db, REGION } from './config';
import { getAuth } from 'firebase-admin/auth';
import { SyncMobileVerificationData } from './types';
import * as helpers from './helpers';

const {
  requireUid, requireAdmin, getString
} = helpers;

export const syncMobileVerification = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<SyncMobileVerificationData>) => {
    const uid = requireUid(request);
    const targetUid = getString(request.data?.userId) || uid;

    // If target is different, require admin privileges
    if (targetUid !== uid) {
      await requireAdmin(request);
    }

    // 1. Fetch user auth details to retrieve verified mobile number
    let authUser;
    try {
      authUser = await getAuth().getUser(targetUid);
    } catch (err) {
      throw new HttpsError('not-found', 'User auth record not found.');
    }

    const phoneNumber = authUser.phoneNumber;
    if (!phoneNumber) {
      throw new HttpsError(
        'failed-precondition',
        'User does not have a verified mobile number in Auth system.'
      );
    }

    // 2. Fetch the target user doc in Firestore
    const userRef = db.doc(`users/${targetUid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User profile document not found.');
    }

    const userData = userSnap.data() || {};

    // 3. Update the Firestore user document
    await userRef.update({
      phone: phoneNumber,
      isVerified: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 4. Update the seeker profile document if it exists
    const seekerRef = db.doc(`seekerProfiles/${targetUid}`);
    const seekerSnap = await seekerRef.get();
    if (seekerSnap.exists) {
      await seekerRef.update({
        phone: phoneNumber,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 5. Update the company document if this user is the owner of a company
    const companyId = getString(userData.companyId);
    let companyUpdated = false;
    if (companyId) {
      const companyRef = db.doc(`companies/${companyId}`);
      const companySnap = await companyRef.get();
      if (companySnap.exists) {
        const companyData = companySnap.data() || {};
        if (companyData.ownerId === targetUid) {
          await companyRef.update({
            phone: phoneNumber,
            updatedAt: FieldValue.serverTimestamp(),
          });
          companyUpdated = true;
        }
      }
    }

    // 6. Log audit entry
    await db.collection('activityLogs').add({
      userId: uid,
      action: 'sync_mobile_verification',
      target: `User: ${targetUid}`,
      targetId: targetUid,
      targetType: 'user',
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      phoneNumber,
      companyUpdated,
    };
  }
);
