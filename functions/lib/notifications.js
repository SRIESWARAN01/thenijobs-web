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
exports.createNotification = void 0;
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
    return { ok: true, notificationId: notificationRef.id };
});
// ============================================================
// EXISTING: Scheduled Functions (preserved)
// ============================================================
//# sourceMappingURL=notifications.js.map