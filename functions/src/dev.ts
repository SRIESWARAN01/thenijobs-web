import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { REGION } from './config';

import { db } from './config';
import { FieldValue } from 'firebase-admin/firestore';

export const healthCheck = onCall({ region: REGION }, async () => {
  logger.info('Functions health check called.');
  
  let statsSynced = false;
  let counts = { users: 0, seekers: 0 };
  try {
    const usersCount = await db.collection('users').count().get();
    const seekersCount = await db.collection('users').where('role', '==', 'job_seeker').count().get();
    counts.users = usersCount.data().count;
    counts.seekers = seekersCount.data().count;
    
    await db.doc('systemStats/global').set({
      totalUsers: counts.users,
      totalEmployees: counts.seekers,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    statsSynced = true;
    logger.info(`Stats successfully synced in healthCheck: users=${counts.users}, seekers=${counts.seekers}`);
  } catch (err) {
    logger.error('Failed to sync stats during healthCheck:', err);
  }

  return {
    ok: true,
    service: 'thenijobs-functions',
    statsSynced,
    counts,
    functions: [
      'approveCompany', 'rejectCompany', 'adminFeatureCompany', 'adminVerifyCompany',
      'approveJob', 'rejectJob',
      'adminUpdateUserRole', 'adminVerifyUser',
      'sendBroadcastNotification',
      'adminUpdateSubscription',
      'serverApplyToJob', 'serverUpdateApplicationStatus',
      'createJobPosting', 'validateSubscriptionAccess', 'createNotification',
      'syncMobileVerification',
    ],
  };
});

