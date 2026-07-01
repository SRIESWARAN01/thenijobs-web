import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { REGION } from './config';

export const healthCheck = onCall({ region: REGION }, () => {
  logger.info('Functions health check called.');
  return {
    ok: true,
    service: 'thenijobs-functions',
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

