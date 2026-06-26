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
exports.onJobCreated = exports.createNotification = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("./config");
const firestore_1 = require("firebase-admin/firestore");
const helpers = __importStar(require("./helpers"));
const { requireUid, isAdminRequest, canNotifyRelatedUser, getRequiredString, getString } = helpers;
exports.createNotification = (0, https_1.onCall)({ region: config_1.REGION, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request);
    const data = request.data ?? {};
    const userId = getRequiredString(data.userId, 'userId');
    const type = getString(data.type, 'system').slice(0, 50);
    const title = getRequiredString(data.title, 'title').slice(0, 140);
    const message = getRequiredString(data.message, 'message').slice(0, 600);
    const actionUrl = getString(data.actionUrl).slice(0, 300);
    const allowed = userId === uid ||
        await isAdminRequest(request) ||
        await canNotifyRelatedUser(uid, userId);
    if (!allowed) {
        throw new https_1.HttpsError('permission-denied', 'You do not have permission to notify this user.');
    }
    const notificationRef = await config_1.db.collection('notifications').add({
        userId,
        type,
        title,
        message,
        ...(actionUrl ? { actionUrl } : {}),
        read: false,
        isRead: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    // Send push notification via FCM if user has a registered token
    try {
        const { getMessaging } = await Promise.resolve().then(() => __importStar(require('firebase-admin/messaging')));
        const userSnap = await config_1.db.collection('seekerProfiles').doc(userId).get();
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
    }
    catch (fcmErr) {
        console.warn(`[FCM] Failed to send push notification to user ${userId}:`, fcmErr);
    }
    return { ok: true, notificationId: notificationRef.id };
});
// ============================================================
// EXISTING: Scheduled Functions (preserved)
// ============================================================
const firestore_2 = require("firebase-functions/v2/firestore");
exports.onJobCreated = (0, firestore_2.onDocumentCreated)({
    document: 'jobs/{jobId}',
    region: config_1.REGION,
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log('No data snapshot for job event.');
        return;
    }
    const jobData = snapshot.data();
    const jobId = event.params.jobId;
    // Only notify if job is active/published
    if (jobData.status !== 'active' && jobData.status !== 'approved' && jobData.isActive !== true) {
        console.log(`Job ${jobId} is not active. Status: ${jobData.status}, isActive: ${jobData.isActive}. Skipping notification.`);
        return;
    }
    console.log(`Processing notifications for new job: ${jobData.title} at ${jobData.companyName || 'Company'}`);
    const notifiedSeekers = new Set();
    // 1. Process match from Job Alerts collection
    try {
        const alertsSnap = await config_1.db.collection('jobAlerts').where('status', '==', 'active').get();
        console.log(`Fetched ${alertsSnap.size} active job alerts to check matching.`);
        for (const alertDoc of alertsSnap.docs) {
            const alert = alertDoc.data();
            const userId = alert.userId;
            if (!userId)
                continue;
            // Check matching parameters:
            // Alert Category matching Job Category (case-insensitive)
            const matchCategory = !alert.category || alert.category.toLowerCase() === (jobData.category || '').toLowerCase();
            // Alert Location matching Job location/district (case-insensitive)
            const matchLocation = !alert.district ||
                alert.district.toLowerCase() === (jobData.location || '').toLowerCase() ||
                alert.district.toLowerCase() === (jobData.district || '').toLowerCase();
            // Alert JobType matching Job jobType
            const matchJobType = !alert.jobType ||
                (jobData.jobType && alert.jobType.toLowerCase().replace(/[^a-z]/g, '') === jobData.jobType.toLowerCase().replace(/[^a-z]/g, ''));
            if (matchCategory && matchLocation && matchJobType) {
                notifiedSeekers.add(userId);
            }
        }
    }
    catch (err) {
        console.error('Error matching active job alerts:', err);
    }
    // 2. Process match from Seeker Profiles preferences
    try {
        const seekersSnap = await config_1.db.collection('seekerProfiles').where('isOpenToWork', '==', true).get();
        console.log(`Fetched ${seekersSnap.size} open-to-work seeker profiles to check matching.`);
        for (const seekerDoc of seekersSnap.docs) {
            const seeker = seekerDoc.data();
            const userId = seekerDoc.id; // Seeker document ID is the userId
            if (notifiedSeekers.has(userId))
                continue;
            const prefs = seeker.preferences || {};
            // Match preferred Categories
            let matchCategory = true;
            if (prefs.categories && prefs.categories.length > 0) {
                matchCategory = prefs.categories.some((cat) => cat.toLowerCase() === (jobData.category || '').toLowerCase());
            }
            // Match preferred Locations (towns)
            let matchLocation = true;
            if (prefs.locations && prefs.locations.length > 0) {
                matchLocation = prefs.locations.some((loc) => loc.toLowerCase() === (jobData.location || '').toLowerCase() ||
                    loc.toLowerCase() === (jobData.district || '').toLowerCase());
            }
            // Match preferred Job Types
            let matchJobType = true;
            if (prefs.jobTypes && prefs.jobTypes.length > 0) {
                matchJobType = prefs.jobTypes.some((type) => jobData.jobType && type.toLowerCase().replace(/[^a-z]/g, '') === jobData.jobType.toLowerCase().replace(/[^a-z]/g, ''));
            }
            // Match expected salary (job max salary must be >= seeker preferred min salary)
            let matchSalary = true;
            if (prefs.salaryMin && jobData.salaryMax) {
                const minPref = parseFloat(prefs.salaryMin);
                const maxJob = parseFloat(jobData.salaryMax);
                if (!isNaN(minPref) && !isNaN(maxJob) && maxJob < minPref) {
                    matchSalary = false;
                }
            }
            // Match skills (at least one overlapping skill)
            let matchSkills = true;
            if (jobData.skills && jobData.skills.length > 0 && seeker.skills && seeker.skills.length > 0) {
                const jobSkillsLower = jobData.skills.map((s) => s.toLowerCase().trim());
                const seekerSkillsLower = seeker.skills.map((s) => s.toLowerCase().trim());
                matchSkills = seekerSkillsLower.some((s) => jobSkillsLower.includes(s));
            }
            if (matchCategory && matchLocation && matchJobType && matchSalary && matchSkills) {
                notifiedSeekers.add(userId);
            }
        }
    }
    catch (err) {
        console.error('Error matching seeker profiles preferences:', err);
    }
    console.log(`Sending notifications to ${notifiedSeekers.size} matched seekers.`);
    // 3. Deliver notifications
    const title = `Matching Job Posted!`;
    const salaryStr = jobData.salaryMin ? `₹${Number(jobData.salaryMin).toLocaleString('en-IN')} - ₹${Number(jobData.salaryMax).toLocaleString('en-IN')}/month` : '';
    const message = `${jobData.companyName || 'A company'} is hiring for ${jobData.title} in ${jobData.location || jobData.district || 'Theni'}.${salaryStr ? ` Salary: ${salaryStr}` : ''}`;
    const actionUrl = `/jobs/${jobId}`;
    const batch = config_1.db.batch();
    for (const userId of notifiedSeekers) {
        // Add In-App notification doc
        const notificationRef = config_1.db.collection('notifications').doc();
        batch.set(notificationRef, {
            userId,
            type: 'job_alert',
            title: `${jobData.title} at ${jobData.companyName || 'Hiring Company'}`,
            message,
            link: actionUrl,
            actionUrl,
            read: false,
            isRead: false,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            // Structured fields for UI display:
            jobId,
            jobTitle: jobData.title,
            companyName: jobData.companyName || 'Company',
            location: jobData.location || jobData.district || 'Theni',
            salary: salaryStr || null
        });
        // Send Push Notification asynchronously
        sendPushNotificationSafe(userId, title, `${jobData.title} at ${jobData.companyName || 'Hiring Company'}`, actionUrl);
    }
    if (notifiedSeekers.size > 0) {
        await batch.commit();
        console.log(`Successfully committed batch notification writes for ${notifiedSeekers.size} users.`);
    }
});
// Helper function to send push notification safely without blocking or throwing function errors
async function sendPushNotificationSafe(userId, title, body, actionUrl) {
    try {
        const userSnap = await config_1.db.collection('seekerProfiles').doc(userId).get();
        const fcmToken = userSnap.data()?.fcmToken;
        if (fcmToken) {
            const { getMessaging } = await Promise.resolve().then(() => __importStar(require('firebase-admin/messaging')));
            await getMessaging().send({
                token: fcmToken,
                notification: {
                    title,
                    body,
                },
                data: {
                    type: 'job_alert',
                    actionUrl,
                },
            });
            console.log(`[FCM Push] Sent successfully to user ${userId}`);
        }
    }
    catch (err) {
        console.warn(`[FCM Push] Failed to send to user ${userId}:`, err);
    }
}
//# sourceMappingURL=notifications.js.map