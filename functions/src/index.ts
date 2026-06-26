import './config'; // initializes app

export {
  approveCompany,
  rejectCompany,
  adminFeatureCompany,
  adminVerifyCompany,
  approveJob,
  rejectJob,
  adminUpdateUserRole,
  adminVerifyUser,
  sendBroadcastNotification,
  adminUpdateSubscription
} from './admin';

export { syncMobileVerification } from './auth';

export { healthCheck, seedDemoAccounts } from './dev';

export {
  serverApplyToJob,
  serverUpdateApplicationStatus,
  createJobPosting,
  processJobAutomation,
  serverTalentSearch,
  serverGetCandidateContact
} from './jobs';

export { createNotification, onJobCreated } from './notifications';

export {
  validateSubscriptionAccess,
  processSubscriptionAutomation,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createAdOrder,
  verifyAdPayment
} from './subscriptions';

export {
  createSocialPost,
  toggleSocialLike,
  addSocialComment,
  deleteSocialPost,
  submitBusinessReview
} from './social';
