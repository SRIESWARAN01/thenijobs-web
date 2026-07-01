"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const config_1 = require("./config");
const config_2 = require("./config");
const firestore_1 = require("firebase-admin/firestore");
exports.healthCheck = (0, https_1.onCall)({ region: config_1.REGION }, async () => {
    firebase_functions_1.logger.info('Functions health check called.');
    let statsSynced = false;
    let counts = { users: 0, seekers: 0 };
    try {
        const usersCount = await config_2.db.collection('users').count().get();
        const seekersCount = await config_2.db.collection('users').where('role', '==', 'job_seeker').count().get();
        counts.users = usersCount.data().count;
        counts.seekers = seekersCount.data().count;
        await config_2.db.doc('systemStats/global').set({
            totalUsers: counts.users,
            totalEmployees: counts.seekers,
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        statsSynced = true;
        firebase_functions_1.logger.info(`Stats successfully synced in healthCheck: users=${counts.users}, seekers=${counts.seekers}`);
    }
    catch (err) {
        firebase_functions_1.logger.error('Failed to sync stats during healthCheck:', err);
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
//# sourceMappingURL=dev.js.map