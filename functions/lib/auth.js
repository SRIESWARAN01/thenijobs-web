"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserWriteSync = exports.deleteCompanyAccount = exports.syncMobileVerification = void 0;
const https_1 = require("firebase-functions/v2/https");
const functions = __importStar(require("firebase-functions/v1"));
const firestore_1 = require("firebase-admin/firestore");
const config_1 = require("./config");
const auth_1 = require("firebase-admin/auth");
const helpers = __importStar(require("./helpers"));
const { requireUid, requireAdmin, getString } = helpers;
exports.syncMobileVerification = (0, https_1.onCall)({ region: config_1.REGION, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request);
    const targetUid = getString(request.data?.userId) || uid;
    // If target is different, require admin privileges
    if (targetUid !== uid) {
        await requireAdmin(request);
    }
    // 1. Fetch user auth details to retrieve verified mobile number
    let authUser;
    try {
        authUser = await (0, auth_1.getAuth)().getUser(targetUid);
    }
    catch (err) {
        throw new https_1.HttpsError('not-found', 'User auth record not found.');
    }
    const phoneNumber = authUser.phoneNumber;
    if (!phoneNumber) {
        throw new https_1.HttpsError('failed-precondition', 'User does not have a verified mobile number in Auth system.');
    }
    // 2. Fetch the target user doc in Firestore
    const userRef = config_1.db.doc(`users/${targetUid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('not-found', 'User profile document not found.');
    }
    const userData = userSnap.data() || {};
    // 3. Update the Firestore user document
    await userRef.update({
        phone: phoneNumber,
        isVerified: true,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // 4. Update the seeker profile document if it exists
    const seekerRef = config_1.db.doc(`seekerProfiles/${targetUid}`);
    const seekerSnap = await seekerRef.get();
    if (seekerSnap.exists) {
        await seekerRef.update({
            phone: phoneNumber,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    // 5. Update the company document if this user is the owner of a company
    const companyId = getString(userData.companyId);
    let companyUpdated = false;
    if (companyId) {
        const companyRef = config_1.db.doc(`companies/${companyId}`);
        const companySnap = await companyRef.get();
        if (companySnap.exists) {
            const companyData = companySnap.data() || {};
            if (companyData.ownerId === targetUid) {
                await companyRef.update({
                    phone: phoneNumber,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
                companyUpdated = true;
            }
        }
    }
    // 6. Log audit entry
    await config_1.db.collection('activityLogs').add({
        userId: uid,
        action: 'sync_mobile_verification',
        target: `User: ${targetUid}`,
        targetId: targetUid,
        targetType: 'user',
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return {
        success: true,
        phoneNumber,
        companyUpdated,
    };
});
// Helper to delete all documents returned by a query
async function deleteQueryDocs(query) {
    const snap = await query.get();
    if (snap.empty)
        return;
    const batch = config_1.db.batch();
    snap.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
exports.deleteCompanyAccount = (0, https_1.onCall)({ region: config_1.REGION, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request);
    // 1. Fetch user to confirm existence and get companyId
    const userRef = config_1.db.doc(`users/${uid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('not-found', 'User profile document not found.');
    }
    const userData = userSnap.data() || {};
    const companyId = getString(userData.companyId);
    // 2. Fetch all companies owned by this user
    const companiesSnap = await config_1.db.collection('companies').where('ownerId', '==', uid).get();
    const companyIds = new Set();
    if (companyId) {
        companyIds.add(companyId);
    }
    companiesSnap.docs.forEach(doc => {
        companyIds.add(doc.id);
    });
    // 3. Delete Firebase Storage files (Logo, cover, resumes, products, services images)
    try {
        const { getStorage } = await Promise.resolve().then(() => __importStar(require('firebase-admin/storage')));
        const bucket = getStorage().bucket();
        // Delete user/company specific files
        await bucket.deleteFiles({ prefix: `companies/${uid}/` }).catch(() => { });
        await bucket.deleteFiles({ prefix: `seekers/${uid}/` }).catch(() => { });
        await bucket.deleteFiles({ prefix: `resumes/${uid}/` }).catch(() => { });
        for (const cId of companyIds) {
            await bucket.deleteFiles({ prefix: `products/${cId}/` }).catch(() => { });
            await bucket.deleteFiles({ prefix: `services/${cId}/` }).catch(() => { });
        }
    }
    catch (storageErr) {
        console.error('Storage deletion warning:', storageErr);
        // Log storage failure but continue with database cleanup
    }
    // 4. Delete Firestore records
    // Delete company profile, jobs, applications, products, reviews, settings, etc.
    for (const cId of companyIds) {
        // Jobs & Applications
        const jobsSnap = await config_1.db.collection('jobs').where('companyId', '==', cId).get();
        for (const jobDoc of jobsSnap.docs) {
            await deleteQueryDocs(config_1.db.collection('jobApplications').where('jobId', '==', jobDoc.id));
            await jobDoc.ref.delete();
        }
        await deleteQueryDocs(config_1.db.collection('jobApplications').where('companyId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('products').where('companyId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('services').where('companyId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('reviews').where('companyId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('companyFollows').where('companyId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('enquiries').where('companyId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('analyticsEvents').where('companyId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('subscriptions').where('companyId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('bookings').where('serviceProviderId', '==', cId));
        await deleteQueryDocs(config_1.db.collection('interviews').where('companyId', '==', cId));
        // Delete settings document
        await config_1.db.doc(`employerSettings/${cId}`).delete();
        // Delete the company doc itself
        await config_1.db.doc(`companies/${cId}`).delete();
    }
    // Seeker specific/User specific data deletion
    await deleteQueryDocs(config_1.db.collection('reviews').where('userId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('companyFollows').where('userId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('productLikes').where('userId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('bookings').where('customerId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('savedJobs').where('userId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('interviews').where('seekerId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('notifications').where('userId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('subscriptions').where('userId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('activityLogs').where('userId', '==', uid));
    await deleteQueryDocs(config_1.db.collection('certificates').where('userId', '==', uid));
    // Delete base user documents
    await config_1.db.doc(`seekerProfiles/${uid}`).delete();
    await config_1.db.doc(`publicProfiles/${uid}`).delete();
    await userRef.delete();
    // 5. Delete the Firebase Authentication user account
    await (0, auth_1.getAuth)().deleteUser(uid);
    return {
        success: true
    };
});
exports.onUserWriteSync = functions.region('us-central1').firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;
    // A. DELETION CASE (User document deleted)
    if (!afterData) {
        console.log(`User ${userId} deleted. Triggering cascade deletion.`);
        // 1. Fetch all companies owned by this user
        const companiesSnap = await config_1.db.collection('companies').where('ownerId', '==', userId).get();
        const companyIds = new Set();
        const userData = beforeData || {};
        const companyId = userData.companyId;
        if (companyId) {
            companyIds.add(companyId);
        }
        companiesSnap.docs.forEach(doc => {
            companyIds.add(doc.id);
        });
        // 2. Cascade delete Firestore company-related data
        for (const cId of companyIds) {
            // Jobs & Job Applications
            const jobsSnap = await config_1.db.collection('jobs').where('companyId', '==', cId).get();
            for (const jobDoc of jobsSnap.docs) {
                await deleteQueryDocs(config_1.db.collection('jobApplications').where('jobId', '==', jobDoc.id));
                await jobDoc.ref.delete();
            }
            await deleteQueryDocs(config_1.db.collection('jobApplications').where('companyId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('products').where('companyId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('services').where('companyId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('reviews').where('companyId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('companyFollows').where('companyId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('enquiries').where('companyId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('analyticsEvents').where('companyId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('subscriptions').where('companyId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('bookings').where('serviceProviderId', '==', cId));
            await deleteQueryDocs(config_1.db.collection('interviews').where('companyId', '==', cId));
            await config_1.db.doc(`employerSettings/${cId}`).delete();
            await config_1.db.doc(`companies/${cId}`).delete();
        }
        // Delete seeker & user-related tables
        await deleteQueryDocs(config_1.db.collection('reviews').where('userId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('companyFollows').where('userId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('productLikes').where('userId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('bookings').where('customerId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('savedJobs').where('userId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('interviews').where('seekerId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('notifications').where('userId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('subscriptions').where('userId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('activityLogs').where('userId', '==', userId));
        await deleteQueryDocs(config_1.db.collection('certificates').where('userId', '==', userId));
        await config_1.db.doc(`seekerProfiles/${userId}`).delete();
        await config_1.db.doc(`publicProfiles/${userId}`).delete();
        // Delete Firebase Storage files
        try {
            const { getStorage } = await Promise.resolve().then(() => __importStar(require('firebase-admin/storage')));
            const bucket = getStorage().bucket();
            await bucket.deleteFiles({ prefix: `companies/${userId}/` }).catch(() => { });
            await bucket.deleteFiles({ prefix: `seekers/${userId}/` }).catch(() => { });
            await bucket.deleteFiles({ prefix: `resumes/${userId}/` }).catch(() => { });
            for (const cId of companyIds) {
                await bucket.deleteFiles({ prefix: `products/${cId}/` }).catch(() => { });
                await bucket.deleteFiles({ prefix: `services/${cId}/` }).catch(() => { });
            }
        }
        catch (storageErr) {
            console.error('Storage deletion error:', storageErr);
        }
        console.log(`Cascade deletion completed for User ${userId}`);
        return;
    }
    // B. SUSPENSION CASE
    const wasSuspendedBefore = beforeData && beforeData.status === 'suspended';
    const isSuspendedNow = afterData.status === 'suspended';
    if (!wasSuspendedBefore && isSuspendedNow) {
        console.log(`User ${userId} suspended. Propagating suspension.`);
        // 1. Fetch user's companies
        const companiesSnap = await config_1.db.collection('companies').where('ownerId', '==', userId).get();
        const companyIds = new Set();
        if (afterData.companyId) {
            companyIds.add(afterData.companyId);
        }
        companiesSnap.docs.forEach(doc => {
            companyIds.add(doc.id);
        });
        // 2. Suspend companies and jobs
        for (const cId of companyIds) {
            await config_1.db.doc(`companies/${cId}`).update({
                status: 'suspended',
                isActive: false,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            // Suspend jobs
            const jobsSnap = await config_1.db.collection('jobs').where('companyId', '==', cId).get();
            const batch = config_1.db.batch();
            jobsSnap.docs.forEach(doc => {
                batch.update(doc.ref, {
                    isActive: false,
                    status: 'suspended',
                    suspendedByAdmin: true, // track that it was admin suspended
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
            });
            await batch.commit();
        }
        return;
    }
    // C. ACTIVATION / RESTORATION CASE
    const isActiveNow = afterData.status === 'active' || afterData.status === 'approved' || !afterData.status;
    if (wasSuspendedBefore && isActiveNow) {
        console.log(`User ${userId} activated. Restoring company & jobs.`);
        // 1. Fetch user's companies
        const companiesSnap = await config_1.db.collection('companies').where('ownerId', '==', userId).get();
        const companyIds = new Set();
        if (afterData.companyId) {
            companyIds.add(afterData.companyId);
        }
        companiesSnap.docs.forEach(doc => {
            companyIds.add(doc.id);
        });
        // 2. Restore companies and jobs
        for (const cId of companyIds) {
            await config_1.db.doc(`companies/${cId}`).update({
                status: 'approved',
                isActive: true,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            // Restore jobs that were suspended by admin
            const jobsSnap = await config_1.db.collection('jobs')
                .where('companyId', '==', cId)
                .where('status', '==', 'suspended')
                .where('suspendedByAdmin', '==', true)
                .get();
            const batch = config_1.db.batch();
            jobsSnap.docs.forEach(doc => {
                batch.update(doc.ref, {
                    isActive: true,
                    status: 'active',
                    suspendedByAdmin: firestore_1.FieldValue.delete(),
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
            });
            await batch.commit();
        }
        return;
    }
});
//# sourceMappingURL=auth.js.map