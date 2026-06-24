"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_REMINDER_DAYS = exports.JOB_VALIDITY_DAYS = exports.REMINDER_DAYS = exports.PLAN_RANK = exports.DEFAULT_PLANS = exports.auth = exports.db = exports.REGION = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
(0, app_1.initializeApp)();
exports.REGION = 'asia-south1';
exports.db = (0, firestore_1.getFirestore)();
exports.auth = (0, auth_1.getAuth)();
exports.DEFAULT_PLANS = {
    free: {
        slug: 'free',
        maxActiveJobs: 1,
        maxGalleryImages: 2,
        maxJobAlerts: 2,
        aiRequestsPerMonth: 3,
        canUseFeaturedJobs: false,
        canUseUrgentJobs: false,
        canUsePremiumBadge: false,
        canUseAdvancedCandidateSearch: false,
        canUseLeadDashboard: false,
    },
    basic: {
        slug: 'basic',
        maxActiveJobs: 2,
        maxGalleryImages: 5,
        maxJobAlerts: 10,
        aiRequestsPerMonth: 15,
        canUseFeaturedJobs: false,
        canUseUrgentJobs: false,
        canUsePremiumBadge: false,
        canUseAdvancedCandidateSearch: true,
        canUseLeadDashboard: false,
    },
    premium: {
        slug: 'premium',
        maxActiveJobs: 5,
        maxGalleryImages: 20,
        maxJobAlerts: 50,
        aiRequestsPerMonth: 100,
        canUseFeaturedJobs: true,
        canUseUrgentJobs: true,
        canUsePremiumBadge: true,
        canUseAdvancedCandidateSearch: true,
        canUseLeadDashboard: true,
    },
    enterprise: {
        slug: 'enterprise',
        maxActiveJobs: -1,
        maxGalleryImages: -1,
        maxJobAlerts: -1,
        aiRequestsPerMonth: -1,
        canUseFeaturedJobs: true,
        canUseUrgentJobs: true,
        canUsePremiumBadge: true,
        canUseAdvancedCandidateSearch: true,
        canUseLeadDashboard: true,
    },
};
exports.PLAN_RANK = {
    free: 0,
    basic: 1,
    premium: 2,
    enterprise: 3,
};
exports.REMINDER_DAYS = [30, 7, 1];
exports.JOB_VALIDITY_DAYS = 30;
exports.JOB_REMINDER_DAYS = [7, 3, 1];
//# sourceMappingURL=config.js.map