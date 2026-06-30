import * as functions from 'firebase-functions/v1';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './config';

export const onCompanyWriteSync = functions.region('us-central1').firestore
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
      const jobsSnap = await db.collection('jobs').where('companyId', '==', companyId).get();
      const batch = db.batch();
      jobsSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          isActive: false,
          status: 'suspended',
          suspendedByCompany: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    } else if (!wasActiveBefore && isActiveNow) {
      console.log(`Company ${companyId} activated/approved. Restoring all company-suspended jobs.`);
      // Restore jobs suspended because of company deactivation
      const jobsSnap = await db.collection('jobs')
        .where('companyId', '==', companyId)
        .where('status', '==', 'suspended')
        .where('suspendedByCompany', '==', true)
        .get();
      const batch = db.batch();
      jobsSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          isActive: true,
          status: 'active',
          suspendedByCompany: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
  });
