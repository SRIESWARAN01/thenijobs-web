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
exports.onCompanyWriteSync = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const firestore_1 = require("firebase-admin/firestore");
const config_1 = require("./config");
exports.onCompanyWriteSync = functions.region('us-central1').firestore
    .document('companies/{companyId}')
    .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const companyId = context.params.companyId;
    if (!afterData) {
        console.log(`Company ${companyId} deleted.`);
        return;
    }
    const wasActiveBefore = beforeData && beforeData.isActive === true && beforeData.status === 'approved';
    const isActiveNow = afterData.isActive === true && (afterData.status === 'approved' || afterData.status === 'active');
    if (wasActiveBefore && !isActiveNow) {
        console.log(`Company ${companyId} deactivated/suspended. Suspending all jobs.`);
        // Suspend all jobs of this company
        const jobsSnap = await config_1.db.collection('jobs').where('companyId', '==', companyId).get();
        const batch = config_1.db.batch();
        jobsSnap.docs.forEach(doc => {
            batch.update(doc.ref, {
                isActive: false,
                status: 'suspended',
                suspendedByCompany: true,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
    }
    else if (!wasActiveBefore && isActiveNow) {
        console.log(`Company ${companyId} activated/approved. Restoring all company-suspended jobs.`);
        // Restore jobs suspended because of company deactivation
        const jobsSnap = await config_1.db.collection('jobs')
            .where('companyId', '==', companyId)
            .where('status', '==', 'suspended')
            .where('suspendedByCompany', '==', true)
            .get();
        const batch = config_1.db.batch();
        jobsSnap.docs.forEach(doc => {
            batch.update(doc.ref, {
                isActive: true,
                status: 'active',
                suspendedByCompany: firestore_1.FieldValue.delete(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
    }
});
//# sourceMappingURL=companySync.js.map