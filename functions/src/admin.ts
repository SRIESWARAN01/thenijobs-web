import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, REGION, JOB_VALIDITY_DAYS } from './config';
import { SubscriptionStatus } from './types';
import { getAuth } from 'firebase-admin/auth';
import * as helpers from './helpers';

// Helper aliases to keep code identical
const {
  requireAdmin, requireSuperAdmin,
  serverCreateNotification, createAuditLog, checkRateLimit,
  getPlanConfigs, resolveCompanyPlan, countOpenJobs, isUnlimited,
  getRequiredString, getString, getBoolean,
  addDays, getStringArray, normalizePlanSlug
} = helpers;

// ============================================================
// C1: APPROVE / REJECT COMPANY
// ============================================================

export const approveCompany = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ companyId?: unknown; reason?: unknown }>) => {
    const adminId = await requireAdmin(request);
    const companyId = getRequiredString(request.data?.companyId, 'companyId');

    const companyRef = db.doc(`companies/${companyId}`);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Company not found.');
    }

    const company = companySnap.data()!;
    const ownerId = getString(company.ownerId);

    // Update company status
    await companyRef.update({
      status: 'approved',
      verificationStatus: 'verified',
      isVerified: true,
      isActive: true,
      approvedBy: adminId,
      approvedAt: FieldValue.serverTimestamp(),
      rejectionReason: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Mark employer as verified
    if (ownerId) {
      await db.doc(`users/${ownerId}`).set({
        employerVerified: true,
        companyVerified: true,
        companyId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // Audit log
    await createAuditLog({
      action: 'Company approved',
      adminId,
      targetId: companyId,
      targetType: 'company',
      changes: { status: { from: getString(company.verificationStatus, 'pending'), to: 'verified' } },
      reason: getString(request.data?.reason),
    });

    // Notify owner
    if (ownerId) {
      await serverCreateNotification({
        userId: ownerId,
        type: 'system',
        title: 'Business Approved!',
        message: `Your business "${getString(company.name)}" has been approved and is now live on THENIJOBS.`,
        actionUrl: '/employer/company-profile',
      });
    }

    logger.info('Company approved.', { companyId, adminId });
    return { success: true, companyId };
  },
);

export const rejectCompany = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ companyId?: unknown; reason?: unknown }>) => {
    const adminId = await requireAdmin(request);
    const companyId = getRequiredString(request.data?.companyId, 'companyId');
    const reason = getString(request.data?.reason);

    const companyRef = db.doc(`companies/${companyId}`);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Company not found.');
    }

    const company = companySnap.data()!;
    const ownerId = getString(company.ownerId);

    await companyRef.update({
      status: 'rejected',
      verificationStatus: 'rejected',
      isVerified: false,
      isActive: false,
      rejectionReason: reason || '',
      rejectedBy: adminId,
      rejectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Audit log
    await createAuditLog({
      action: 'Company rejected',
      adminId,
      targetId: companyId,
      targetType: 'company',
      reason,
    });

    // Notify owner
    if (ownerId) {
      await serverCreateNotification({
        userId: ownerId,
        type: 'system',
        title: 'Business Review Update',
        message: `Your business "${getString(company.name)}" requires changes. ${reason}`.trim(),
        actionUrl: '/employer/company-profile',
      });
    }

    logger.info('Company rejected.', { companyId, adminId, reason });
    return { success: true, companyId };
  },
);

// ============================================================
// C1 EXTRA: FEATURE COMPANY
// ============================================================

export const adminFeatureCompany = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ companyId?: unknown; isFeatured?: unknown }>) => {
    const adminId = await requireAdmin(request);
    const companyId = getRequiredString(request.data?.companyId, 'companyId');
    const isFeatured = getBoolean(request.data?.isFeatured);

    const companyRef = db.doc(`companies/${companyId}`);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Company not found.');
    }

    await companyRef.update({
      isFeatured,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await createAuditLog({
      action: isFeatured ? 'Company featured' : 'Company unfeatured',
      adminId,
      targetId: companyId,
      targetType: 'company',
    });

    return { success: true, companyId, isFeatured };
  },
);

export const adminVerifyCompany = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ companyId?: unknown }>) => {
    const adminId = await requireAdmin(request);
    const companyId = getRequiredString(request.data?.companyId, 'companyId');

    const companyRef = db.doc(`companies/${companyId}`);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError('not-found', 'Company not found.');
    }

    await companyRef.update({
      'verificationBadges.businessVerified': true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await createAuditLog({
      action: 'Company badge verified',
      adminId,
      targetId: companyId,
      targetType: 'company',
    });

    return { success: true, companyId };
  },
);

// ============================================================
// C2: APPROVE / REJECT JOB
// ============================================================

export const approveJob = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ jobId?: unknown; reason?: unknown }>) => {
    const adminId = await requireAdmin(request);
    const jobId = getRequiredString(request.data?.jobId, 'jobId');

    const jobRef = db.doc(`jobs/${jobId}`);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) {
      throw new HttpsError('not-found', 'Job not found.');
    }

    const job = jobSnap.data()!;
    const companyId = getString(job.companyId);

    // Validate company is active
    if (companyId) {
      const companySnap = await db.doc(`companies/${companyId}`).get();
      const company = companySnap.data();
      if (company && (company.isActive === false || company.deleted === true || company.status === 'deleted')) {
        throw new HttpsError('failed-precondition', 'Jobs from deleted or inactive companies cannot be approved.');
      }

      // Check plan limits
      const plans = await getPlanConfigs();
      const plan = company ? await resolveCompanyPlan(companyId, company) : 'free';
      const limits = plans[plan];
      const activeCount = await countOpenJobs(companyId);

      // Exclude this job from count if it was previously active
      const effectiveCount = job.isActive === true ? activeCount - 1 : activeCount;
      if (!isUnlimited(limits.maxActiveJobs) && effectiveCount >= limits.maxActiveJobs) {
        throw new HttpsError(
          'resource-exhausted',
          `${plan.toUpperCase()} plan limit reached (${limits.maxActiveJobs} active jobs). Upgrade the plan first.`,
        );
      }
    }

    const activatedAt = new Date();
    const validityDays = typeof job.validityDays === 'number' ? job.validityDays : JOB_VALIDITY_DAYS;
    const expiresAt = addDays(activatedAt, validityDays);

    await jobRef.update({
      isActive: true,
      status: 'active',
      approvedBy: adminId,
      approvedAt: FieldValue.serverTimestamp(),
      activatedAt: Timestamp.fromDate(activatedAt),
      expiresAt: Timestamp.fromDate(expiresAt),
      expiryReminderDaysSent: [],
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Audit log
    await createAuditLog({
      action: 'Job approved',
      adminId,
      targetId: jobId,
      targetType: 'job',
      reason: getString(request.data?.reason),
    });

    // Notify employer
    const postedBy = getString(job.postedBy);
    if (postedBy) {
      await serverCreateNotification({
        userId: postedBy,
        type: 'system',
        title: 'Job Approved!',
        message: `Your job posting "${getString(job.title)}" is now live.`,
        actionUrl: '/employer/jobs',
      });
    }

    logger.info('Job approved.', { jobId, adminId });
    return { success: true, jobId };
  },
);

export const rejectJob = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ jobId?: unknown; reason?: unknown }>) => {
    const adminId = await requireAdmin(request);
    const jobId = getRequiredString(request.data?.jobId, 'jobId');
    const reason = getString(request.data?.reason);

    const jobRef = db.doc(`jobs/${jobId}`);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) {
      throw new HttpsError('not-found', 'Job not found.');
    }

    const job = jobSnap.data()!;

    await jobRef.update({
      isActive: false,
      status: 'rejected',
      rejectionReason: reason || '',
      rejectedBy: adminId,
      rejectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Audit log
    await createAuditLog({
      action: 'Job rejected',
      adminId,
      targetId: jobId,
      targetType: 'job',
      reason,
    });

    // Notify employer
    const postedBy = getString(job.postedBy);
    if (postedBy) {
      await serverCreateNotification({
        userId: postedBy,
        type: 'system',
        title: 'Job Posting Update',
        message: `Your job posting "${getString(job.title)}" was not approved. ${reason}`.trim(),
        actionUrl: '/employer/jobs',
      });
    }

    logger.info('Job rejected.', { jobId, adminId, reason });
    return { success: true, jobId };
  },
);

// ============================================================
// C3: USER ROLE MANAGEMENT
// ============================================================

export const adminUpdateUserRole = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ userId?: unknown; role?: unknown; reason?: unknown }>) => {
    const adminId = await requireAdmin(request);
    const userId = getRequiredString(request.data?.userId, 'userId');
    const newRole = getRequiredString(request.data?.role, 'role');
    const reason = getString(request.data?.reason);

    const validRoles = ['job_seeker', 'business', 'employer', 'pending_employer', 'business_owner', 'supplier', 'service_provider', 'entrepreneur', 'admin', 'super_admin'];
    if (!validRoles.includes(newRole)) {
      throw new HttpsError('invalid-argument', `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Only super_admin can grant admin/super_admin
    if (newRole === 'admin' || newRole === 'super_admin') {
      await requireSuperAdmin(request);
    }

    // Prevent self-demotion from super_admin
    if (userId === adminId && newRole !== 'super_admin') {
      const adminSnap = await db.doc(`users/${adminId}`).get();
      if (getString(adminSnap.data()?.role) === 'super_admin') {
        throw new HttpsError('failed-precondition', 'Super admins cannot demote themselves.');
      }
    }

    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User not found.');
    }

    const oldRole = getString(userSnap.data()?.role);

    await userRef.update({
      role: newRole,
      roleUpdatedAt: FieldValue.serverTimestamp(),
      roleUpdatedBy: adminId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Sync custom claims for admin roles
    const claims: Record<string, boolean> = {};
    if (newRole === 'admin') claims.admin = true;
    if (newRole === 'super_admin') { claims.admin = true; claims.super_admin = true; }
    await getAuth().setCustomUserClaims(userId, claims);

    // Audit log
    await createAuditLog({
      action: `User role updated: ${oldRole} → ${newRole}`,
      adminId,
      targetId: userId,
      targetType: 'user',
      changes: { role: { from: oldRole, to: newRole } },
      reason,
    });

    // Notify user
    await serverCreateNotification({
      userId,
      type: 'system',
      title: 'Account Role Updated',
      message: `Your account role has been changed to ${newRole}.`,
    });

    logger.info('User role updated.', { userId, oldRole, newRole, adminId });
    return { success: true, userId, oldRole, newRole };
  },
);

export const adminVerifyUser = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ userId?: unknown }>) => {
    const adminId = await requireAdmin(request);
    const userId = getRequiredString(request.data?.userId, 'userId');

    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User not found.');
    }

    await userRef.update({
      isVerified: true,
      verifiedAt: FieldValue.serverTimestamp(),
      verifiedBy: adminId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await createAuditLog({
      action: 'User verified',
      adminId,
      targetId: userId,
      targetType: 'user',
    });

    await serverCreateNotification({
      userId,
      type: 'system',
      title: 'Account Verified!',
      message: 'Your account has been verified by the THENIJOBS team.',
    });

    logger.info('User verified.', { userId, adminId });
    return { success: true, userId };
  },
);

// ============================================================
// C4: BROADCAST NOTIFICATION
// ============================================================

export const sendBroadcastNotification = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{
    title?: unknown;
    message?: unknown;
    actionUrl?: unknown;
    targetRole?: unknown;
    targetUserIds?: unknown;
  }>) => {
    const adminId = await requireAdmin(request);
    const title = getRequiredString(request.data?.title, 'title').slice(0, 140);
    const message = getRequiredString(request.data?.message, 'message').slice(0, 600);
    const actionUrl = getString(request.data?.actionUrl).slice(0, 300);
    const targetRole = getString(request.data?.targetRole);
    const targetUserIds = getStringArray(request.data?.targetUserIds);

    // Rate limit: max 10 broadcasts per hour
    await checkRateLimit(adminId, 'broadcast', 10, 60);

    let userIds: string[] = [];

    if (targetUserIds.length > 0) {
      userIds = targetUserIds.slice(0, 5000); // Cap at 5000
    } else if (targetRole) {
      // Fetch users by role
      const usersSnap = await db.collection('users')
        .where('role', '==', targetRole)
        .select() // ID only
        .limit(5000)
        .get();
      userIds = usersSnap.docs.map((d) => d.id);
    } else {
      // All users
      const usersSnap = await db.collection('users')
        .select()
        .limit(5000)
        .get();
      userIds = usersSnap.docs.map((d) => d.id);
    }

    // Batch create notifications
    let sentCount = 0;
    for (let i = 0; i < userIds.length; i += 450) {
      const batch = db.batch();
      const slice = userIds.slice(i, i + 450);
      for (const userId of slice) {
        const ref = db.collection('notifications').doc();
        batch.set(ref, {
          userId,
          type: 'broadcast',
          title,
          message,
          ...(actionUrl ? { actionUrl } : {}),
          read: false,
          isRead: false,
          createdBy: adminId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      sentCount += slice.length;
    }

    await createAuditLog({
      action: `Broadcast notification sent to ${sentCount} users`,
      adminId,
      targetId: 'broadcast',
      targetType: 'notification',
    });

    logger.info('Broadcast sent.', { adminId, sentCount });
    return { success: true, sentCount };
  },
);

// ============================================================
// C5: SUBSCRIPTION MANAGEMENT
// ============================================================

export const adminUpdateSubscription = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{
    subscriptionId?: unknown;
    userId?: unknown;
    companyId?: unknown;
    plan?: unknown;
    status?: unknown;
    reason?: unknown;
  }>) => {
    const adminId = await requireAdmin(request);
    const subscriptionId = getString(request.data?.subscriptionId);
    const userId = getString(request.data?.userId);
    const companyId = getString(request.data?.companyId);
    const newPlan = getString(request.data?.plan);
    const newStatus = getString(request.data?.status);
    const reason = getString(request.data?.reason);

    if (!subscriptionId && !userId) {
      throw new HttpsError('invalid-argument', 'subscriptionId or userId is required.');
    }

    let subRef: FirebaseFirestore.DocumentReference;
    if (subscriptionId) {
      subRef = db.doc(`subscriptions/${subscriptionId}`);
    } else {
      // Find subscription by userId/companyId
      let q = db.collection('subscriptions').where('userId', '==', userId);
      if (companyId) {
        q = db.collection('subscriptions').where('companyId', '==', companyId);
      }
      const snap = await q.limit(1).get();
      if (snap.empty) {
        throw new HttpsError('not-found', 'Subscription not found.');
      }
      subRef = snap.docs[0].ref;
    }

    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      throw new HttpsError('not-found', 'Subscription not found.');
    }

    const oldData = subSnap.data()!;
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      lastUpdatedBy: adminId,
    };

    if (newPlan) {
      updates.plan = normalizePlanSlug(newPlan);
      updates.planName = `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} Plan`;
    }
    if (newStatus) {
      const validStatuses = ['active', 'pending_renewal', 'expired', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new HttpsError('invalid-argument', `Invalid status. Must be: ${validStatuses.join(', ')}`);
      }
      updates.status = newStatus;
    }

    await subRef.update(updates);

    // Sync to company if applicable
    const subCompanyId = companyId || getString(oldData.companyId);
    if (subCompanyId && (newPlan || newStatus)) {
      const effectiveStatus = (newStatus || getString(oldData.status)) as SubscriptionStatus;
      const effectivePlan = normalizePlanSlug(newPlan || getString(oldData.plan, 'free'));
      const isExpired = effectiveStatus === 'expired' || effectiveStatus === 'cancelled';
      await db.doc(`companies/${subCompanyId}`).set({
        isPremium: !isExpired && (effectivePlan === 'premium' || effectivePlan === 'enterprise'),
        subscriptionStatus: effectiveStatus,
        subscriptionPlan: isExpired ? 'free' : effectivePlan,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await createAuditLog({
      action: 'Subscription updated by admin',
      adminId,
      targetId: subRef.id,
      targetType: 'subscription',
      changes: {
        ...(newPlan ? { plan: { from: getString(oldData.plan), to: newPlan } } : {}),
        ...(newStatus ? { status: { from: getString(oldData.status), to: newStatus } } : {}),
      },
      reason,
    });

    // Notify user
    const subUserId = getString(oldData.userId);
    if (subUserId) {
      await serverCreateNotification({
        userId: subUserId,
        type: 'subscription',
        title: 'Subscription Updated',
        message: `Your subscription has been updated${newPlan ? ` to ${newPlan}` : ''}${newStatus ? ` (${newStatus})` : ''}.`,
        actionUrl: '/employer/billing',
      });
    }

    logger.info('Subscription updated.', { subscriptionId: subRef.id, adminId });
    return { success: true, subscriptionId: subRef.id };
  },
);

// ============================================================
// C6: APPLY TO JOB (Server-Owned)
// ============================================================
