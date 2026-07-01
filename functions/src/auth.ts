import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import * as functions from 'firebase-functions/v1';
import { FieldValue } from 'firebase-admin/firestore';
import { db, REGION } from './config';
import { getAuth } from 'firebase-admin/auth';
import { SyncMobileVerificationData } from './types';
import * as helpers from './helpers';

const {
  requireUid, requireAdmin, getString
} = helpers;

export const syncMobileVerification = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<SyncMobileVerificationData>) => {
    const uid = requireUid(request);
    const targetUid = getString(request.data?.userId) || uid;

    // If target is different, require admin privileges
    if (targetUid !== uid) {
      await requireAdmin(request);
    }

    // 1. Fetch user auth details to retrieve verified mobile number
    let authUser;
    try {
      authUser = await getAuth().getUser(targetUid);
    } catch (err) {
      throw new HttpsError('not-found', 'User auth record not found.');
    }

    const phoneNumber = authUser.phoneNumber;
    if (!phoneNumber) {
      throw new HttpsError(
        'failed-precondition',
        'User does not have a verified mobile number in Auth system.'
      );
    }

    // 2. Fetch the target user doc in Firestore
    const userRef = db.doc(`users/${targetUid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User profile document not found.');
    }

    const userData = userSnap.data() || {};

    // 3. Update the Firestore user document
    await userRef.update({
      phone: phoneNumber,
      isVerified: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 4. Update the seeker profile document if it exists
    const seekerRef = db.doc(`seekerProfiles/${targetUid}`);
    const seekerSnap = await seekerRef.get();
    if (seekerSnap.exists) {
      await seekerRef.update({
        phone: phoneNumber,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 5. Update the company document if this user is the owner of a company
    const companyId = getString(userData.companyId);
    let companyUpdated = false;
    if (companyId) {
      const companyRef = db.doc(`companies/${companyId}`);
      const companySnap = await companyRef.get();
      if (companySnap.exists) {
        const companyData = companySnap.data() || {};
        if (companyData.ownerId === targetUid) {
          await companyRef.update({
            phone: phoneNumber,
            updatedAt: FieldValue.serverTimestamp(),
          });
          companyUpdated = true;
        }
      }
    }

    // 6. Log audit entry
    await db.collection('activityLogs').add({
      userId: uid,
      action: 'sync_mobile_verification',
      target: `User: ${targetUid}`,
      targetId: targetUid,
      targetType: 'user',
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      phoneNumber,
      companyUpdated,
    };
  }
);

// Helper to delete all documents returned by a query
async function deleteQueryDocs(query: FirebaseFirestore.Query) {
  const snap = await query.get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

export const deleteCompanyAccount = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<void>) => {
    const uid = requireUid(request);

    // 1. Fetch user to confirm existence and get companyId
    const userRef = db.doc(`users/${uid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User profile document not found.');
    }
    const userData = userSnap.data() || {};
    const companyId = getString(userData.companyId);

    // 2. Fetch all companies owned by this user
    const companiesSnap = await db.collection('companies').where('ownerId', '==', uid).get();
    const companyIds = new Set<string>();
    if (companyId) {
      companyIds.add(companyId);
    }
    companiesSnap.docs.forEach(doc => {
      companyIds.add(doc.id);
    });

    // 3. Delete Firebase Storage files (Logo, cover, resumes, products, services images)
    try {
      const { getStorage } = await import('firebase-admin/storage');
      const bucket = getStorage().bucket();
      
      // Delete user/company specific files
      await bucket.deleteFiles({ prefix: `companies/${uid}/` }).catch(() => {});
      await bucket.deleteFiles({ prefix: `seekers/${uid}/` }).catch(() => {});
      await bucket.deleteFiles({ prefix: `resumes/${uid}/` }).catch(() => {});
      
      for (const cId of companyIds) {
        await bucket.deleteFiles({ prefix: `products/${cId}/` }).catch(() => {});
        await bucket.deleteFiles({ prefix: `services/${cId}/` }).catch(() => {});
        await bucket.deleteFiles({ prefix: `gallery/${cId}/` }).catch(() => {});
      }
    } catch (storageErr) {
      console.error('Storage deletion warning:', storageErr);
      // Log storage failure but continue with database cleanup
    }

    // 4. Delete Firestore records
    // Delete company profile, jobs, applications, products, reviews, settings, etc.
    for (const cId of companyIds) {
      // Jobs & Applications
      const jobsSnap = await db.collection('jobs').where('companyId', '==', cId).get();
      for (const jobDoc of jobsSnap.docs) {
        await deleteQueryDocs(db.collection('jobApplications').where('jobId', '==', jobDoc.id));
        await jobDoc.ref.delete();
      }
      
      await deleteQueryDocs(db.collection('jobApplications').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('products').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('services').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('reviews').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('companyFollows').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('enquiries').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('analyticsEvents').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('subscriptions').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('bookings').where('serviceProviderId', '==', cId));
      await deleteQueryDocs(db.collection('interviews').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('socialPosts').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('payments').where('companyId', '==', cId));
      await deleteQueryDocs(db.collection('rfqs').where('companyId', '==', cId));
      
      // Delete settings document
      await db.doc(`employerSettings/${cId}`).delete();
      
      // Delete the company doc itself
      await db.doc(`companies/${cId}`).delete();
    }

    // Seeker specific/User specific data deletion
    await deleteQueryDocs(db.collection('reviews').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('companyFollows').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('productLikes').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('bookings').where('customerId', '==', uid));
    await deleteQueryDocs(db.collection('savedJobs').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('interviews').where('seekerId', '==', uid));
    await deleteQueryDocs(db.collection('notifications').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('subscriptions').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('activityLogs').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('certificates').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('socialPosts').where('userId', '==', uid));
    await deleteQueryDocs(db.collection('payments').where('userId', '==', uid));

    // Delete base user documents
    await db.doc(`seekerProfiles/${uid}`).delete();
    await db.doc(`publicProfiles/${uid}`).delete();
    await userRef.delete();

    // 5. Delete the Firebase Authentication user account
    await getAuth().deleteUser(uid);

    return {
      success: true
    };
  }
);

export const onUserWriteSync = functions.region('us-central1').firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    // A. DELETION CASE (User document deleted)
    if (!afterData) {
      console.log(`User ${userId} deleted. Triggering cascade deletion.`);
      
      // 1. Fetch all companies owned by this user
      const companiesSnap = await db.collection('companies').where('ownerId', '==', userId).get();
      const companyIds = new Set<string>();
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
        const jobsSnap = await db.collection('jobs').where('companyId', '==', cId).get();
        for (const jobDoc of jobsSnap.docs) {
          await deleteQueryDocs(db.collection('jobApplications').where('jobId', '==', jobDoc.id));
          await jobDoc.ref.delete();
        }
        
        await deleteQueryDocs(db.collection('jobApplications').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('products').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('services').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('reviews').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('companyFollows').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('enquiries').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('analyticsEvents').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('subscriptions').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('bookings').where('serviceProviderId', '==', cId));
        await deleteQueryDocs(db.collection('interviews').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('socialPosts').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('payments').where('companyId', '==', cId));
        await deleteQueryDocs(db.collection('rfqs').where('companyId', '==', cId));
        await db.doc(`employerSettings/${cId}`).delete();
        await db.doc(`companies/${cId}`).delete();
      }

      // Delete seeker & user-related tables
      await deleteQueryDocs(db.collection('reviews').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('companyFollows').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('productLikes').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('bookings').where('customerId', '==', userId));
      await deleteQueryDocs(db.collection('savedJobs').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('interviews').where('seekerId', '==', userId));
      await deleteQueryDocs(db.collection('notifications').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('subscriptions').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('activityLogs').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('certificates').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('socialPosts').where('userId', '==', userId));
      await deleteQueryDocs(db.collection('payments').where('userId', '==', userId));

      await db.doc(`seekerProfiles/${userId}`).delete();
      await db.doc(`publicProfiles/${userId}`).delete();

      // Delete Firebase Storage files
      try {
        const { getStorage } = await import('firebase-admin/storage');
        const bucket = getStorage().bucket();
        await bucket.deleteFiles({ prefix: `companies/${userId}/` }).catch(() => {});
        await bucket.deleteFiles({ prefix: `seekers/${userId}/` }).catch(() => {});
        await bucket.deleteFiles({ prefix: `resumes/${userId}/` }).catch(() => {});
        for (const cId of companyIds) {
          await bucket.deleteFiles({ prefix: `products/${cId}/` }).catch(() => {});
          await bucket.deleteFiles({ prefix: `services/${cId}/` }).catch(() => {});
          await bucket.deleteFiles({ prefix: `gallery/${cId}/` }).catch(() => {});
        }
      } catch (storageErr) {
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
      const companiesSnap = await db.collection('companies').where('ownerId', '==', userId).get();
      const companyIds = new Set<string>();
      if (afterData.companyId) {
        companyIds.add(afterData.companyId);
      }
      companiesSnap.docs.forEach(doc => {
        companyIds.add(doc.id);
      });

      // 2. Suspend companies and jobs
      for (const cId of companyIds) {
        await db.doc(`companies/${cId}`).update({
          status: 'suspended',
          isActive: false,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Suspend jobs
        const jobsSnap = await db.collection('jobs').where('companyId', '==', cId).get();
        const batch = db.batch();
        jobsSnap.docs.forEach(doc => {
          batch.update(doc.ref, {
            isActive: false,
            status: 'suspended',
            suspendedByAdmin: true, // track that it was admin suspended
            updatedAt: FieldValue.serverTimestamp(),
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
      const companiesSnap = await db.collection('companies').where('ownerId', '==', userId).get();
      const companyIds = new Set<string>();
      if (afterData.companyId) {
        companyIds.add(afterData.companyId);
      }
      companiesSnap.docs.forEach(doc => {
        companyIds.add(doc.id);
      });

      // 2. Restore companies and jobs
      for (const cId of companyIds) {
        await db.doc(`companies/${cId}`).update({
          status: 'approved',
          isActive: true,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Restore jobs that were suspended by admin
        const jobsSnap = await db.collection('jobs')
          .where('companyId', '==', cId)
          .where('status', '==', 'suspended')
          .where('suspendedByAdmin', '==', true)
          .get();
        const batch = db.batch();
        jobsSnap.docs.forEach(doc => {
          batch.update(doc.ref, {
            isActive: true,
            status: 'active',
            suspendedByAdmin: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }
      return;
    }
  });

