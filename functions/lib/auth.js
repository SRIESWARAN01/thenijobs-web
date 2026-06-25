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
exports.syncMobileVerification = void 0;
const https_1 = require("firebase-functions/v2/https");
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
//# sourceMappingURL=auth.js.map