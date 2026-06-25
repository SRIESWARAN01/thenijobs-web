'use client';

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  getCountFromServer,
  increment,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config';
import { normaliseTimestamps } from './serializers';
import { getJobExpiryDate, getJobPlanLimit, isActiveJobSlot, isPublicJobVisible } from '@/lib/jobPolicy';
import { normalizePlanSlug, selectBestSubscription } from '@/lib/subscriptions';

// ============================================================
// HELPERS
// ============================================================

function deterministicId(...parts: string[]) {
  return parts
    .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, '_'))
    .join('_');
}

/** Fetch documents from a collection with optional constraints */
async function fetchCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...normaliseTimestamps(d.data()) }) as unknown as T,
  );
}

/** Fetch a single document by ID */
async function fetchDocument<T>(
  collectionName: string,
  docId: string,
): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...normaliseTimestamps(snap.data()) } as unknown as T;
}

/** Get count of documents matching constraints */
async function getCount(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<number> {
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

async function runSideEffect(label: string, effect: () => Promise<unknown>) {
  try {
    await effect();
  } catch (err) {
    console.error(`[firestoreService] ${label} failed:`, err);
  }
}

// ============================================================
// PLATFORM STATS (Admin Dashboard)
// ============================================================

export interface PlatformStats {
  totalUsers: number;
  totalBusinesses: number;
  activeJobs: number;
  totalApplications: number;
  totalLeads: number;
  totalRevenue: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    totalUsers,
    totalBusinesses,
    activeJobs,
    totalApplications,
    totalLeads,
  ] = await Promise.all([
    getCount('users'),
    getCount('companies', [where('verificationStatus', '==', 'verified')]),
    getCount('jobs', [where('isActive', '==', true)]),
    getCount('applications'),
    getCount('leads'),
  ]);

  // Revenue: sum active subscriptions
  let totalRevenue = 0;
  try {
    const subs = await fetchCollection<{ amount: number; status: string }>(
      'subscriptions',
      [where('status', '==', 'active'), limit(500)],
    );
    totalRevenue = subs.reduce((sum, s) => sum + (s.amount || 0), 0);
  } catch {
    // subscriptions collection may not exist yet
  }

  return {
    totalUsers,
    totalBusinesses,
    activeJobs,
    totalApplications,
    totalLeads,
    totalRevenue,
  };
}

// ============================================================
// EMPLOYER STATS
// ============================================================

export interface EmployerStats {
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
  profileViews: number;
}

export async function getEmployerStats(
  companyId: string,
): Promise<EmployerStats> {
  const [activeJobs, totalApplications, shortlisted, interviews, hired] =
    await Promise.all([
      getCount('jobs', [
        where('companyId', '==', companyId),
        where('isActive', '==', true),
      ]),
      getCount('jobApplications', [where('employerId', '==', companyId)]),
      getCount('jobApplications', [
        where('employerId', '==', companyId),
        where('status', '==', 'shortlisted'),
      ]),
      getCount('interviews', [where('companyId', '==', companyId)]),
      getCount('jobApplications', [
        where('employerId', '==', companyId),
        where('status', '==', 'selected'),
      ]),
    ]);

  // Profile views from company document
  let profileViews = 0;
  try {
    const company = await fetchDocument<{ viewCount?: number }>(
      'companies',
      companyId,
    );
    profileViews = company?.viewCount || 0;
  } catch {
    // ignore
  }

  return {
    activeJobs,
    totalApplications,
    shortlisted,
    interviews,
    hired,
    profileViews,
  };
}

// ============================================================
// SEEKER STATS
// ============================================================

export interface SeekerStats {
  appliedJobs: number;
  savedJobs: number;
  interviews: number;
  profileViews: number;
}

export async function getSeekerStats(seekerId: string): Promise<SeekerStats> {
  const [appliedJobs, savedJobs, interviews] = await Promise.all([
    getCount('jobApplications', [where('applicantId', '==', seekerId)]),
    getCount('savedJobs', [where('userId', '==', seekerId)]),
    getCount('interviews', [where('seekerId', '==', seekerId)]),
  ]);

  let profileViews = 0;
  try {
    const profile = await fetchDocument<{ viewCount?: number }>(
      'seekerProfiles',
      seekerId,
    );
    profileViews = profile?.viewCount || 0;
  } catch {
    // ignore
  }

  return { appliedJobs, savedJobs, interviews, profileViews };
}

// ============================================================
// COMPANIES
// ============================================================

export async function getCompanies(filters?: {
  status?: string;
  category?: string;
  district?: string;
  isFeatured?: boolean;
  search?: string;
  limitCount?: number;
}) {
  const constraints: QueryConstraint[] = [];

  if (filters?.status) {
    constraints.push(where('verificationStatus', '==', filters.status));
  }
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters?.district) {
    constraints.push(where('district', '==', filters.district));
  }
  if (filters?.isFeatured !== undefined) {
    constraints.push(where('isFeatured', '==', filters.isFeatured));
  }
  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  return fetchCollection<DocumentData>('companies', constraints);
}

export async function getPublicCompanies(): Promise<any[]> {
  const snapshot = await getDocs(
    query(
      collection(db, 'companies'),
      where('isActive', '!=', false),
      limit(200),
    ),
  );

  return snapshot.docs
    .filter((companyDoc) => {
      const data = companyDoc.data();
      return (
        data.verificationStatus === 'verified' ||
        data.status === 'approved' ||
        data.isVerified === true
      );
    })
    .map((companyDoc) => ({ id: companyDoc.id, ...companyDoc.data() }));
}

export async function getCompanyBySlug(slug: string) {
  const results = await fetchCollection<DocumentData>('companies', [
    where('slug', '==', slug),
    limit(1),
  ]);
  return results[0] || null;
}

// ============================================================
// JOBS
// ============================================================

export async function getJobs(filters?: {
  isActive?: boolean;
  companyId?: string;
  category?: string;
  district?: string;
  jobType?: string;
  isFeatured?: boolean;
  isUrgent?: boolean;
  limitCount?: number;
}) {
  const constraints: QueryConstraint[] = [];

  if (filters?.isActive !== undefined) {
    constraints.push(where('isActive', '==', filters.isActive));
  }
  if (filters?.companyId) {
    constraints.push(where('companyId', '==', filters.companyId));
  }
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters?.district) {
    constraints.push(where('district', '==', filters.district));
  }
  if (filters?.jobType) {
    constraints.push(where('jobType', '==', filters.jobType));
  }
  if (filters?.isFeatured !== undefined) {
    constraints.push(where('isFeatured', '==', filters.isFeatured));
  }
  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  } else {
    constraints.push(limit(24));
  }

  return fetchCollection<DocumentData>('jobs', constraints);
}

export async function getJobById(jobId: string) {
  return fetchDocument<DocumentData>('jobs', jobId);
}

export async function createJobPosting(data: DocumentData) {
  const callable = httpsCallable<DocumentData, {
    jobId: string;
    plan: string;
    remainingJobSlots: number | null;
  }>(functions, 'createJobPosting');
  const result = await callable(data);
  return result.data;
}

// ============================================================
// APPLICATIONS
// ============================================================

export async function getApplications(filters?: {
  seekerId?: string;
  companyId?: string;
  jobId?: string;
  status?: string;
}) {
  const constraints: QueryConstraint[] = [];

  if (filters?.seekerId) {
    constraints.push(where('applicantId', '==', filters.seekerId));
  }
  if (filters?.companyId) {
    constraints.push(where('employerId', '==', filters.companyId));
  }
  if (filters?.jobId) {
    constraints.push(where('jobId', '==', filters.jobId));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(limit(100));

  return fetchCollection<DocumentData>('jobApplications', constraints);
}

export async function applyToJob(data: {
  jobId: string;
  jobTitle?: string;
  companyId: string;
  companyName?: string;
  seekerId: string;
  seekerName: string;
  seekerEmail?: string;
  seekerPhone?: string;
  applicationType?: 'job' | 'walk_in';
  walkIn?: {
    date?: string;
    time?: string;
    venue?: string;
    contactPerson?: string;
    contactMobile?: string;
  };
  currentRole?: string;
  district?: string;
  location?: string;
  photoUrl?: string;
  skills?: string[];
  experience?: DocumentData[];
  education?: DocumentData[];
  portfolio?: string[];
  profileStrength?: number;
  resumeUrl?: string;
  resumeName?: string;
  coverLetter?: string;
  seekerDob?: string;
  seekerGender?: string;
  expectedSalary?: string;
  linkedin?: string;
  website?: string;
}) {
  const callable = httpsCallable<
    typeof data,
    { success: boolean; applicationId: string; alreadyApplied?: boolean }
  >(functions, 'serverApplyToJob');
  const result = await callable(data);
  return result.data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  note?: string,
) {
  const appRef = doc(db, 'jobApplications', applicationId);
  const updates: any = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (note !== undefined) {
    updates.employerNote = note;
  }
  await updateDoc(appRef, updates);
  return { success: true };
}

// ============================================================
// SAVED JOBS
// ============================================================

export async function saveJob(
  userId: string,
  jobId: string,
  metadata: DocumentData = {},
) {
  const savedJobId = deterministicId(userId, jobId);
  const savedJobRef = doc(db, 'savedJobs', savedJobId);
  const existing = await getDoc(savedJobRef);
  if (existing.exists()) return savedJobId;

  await setDoc(savedJobRef, {
    ...metadata,
    userId,
    jobId,
    savedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return savedJobId;
}

export async function unsaveJob(userId: string, jobId: string) {
  const savedJobId = deterministicId(userId, jobId);
  await deleteDoc(doc(db, 'savedJobs', savedJobId)).catch(() => undefined);

  // Clean up old duplicate documents created before deterministic IDs.
  const results = await fetchCollection<{ id: string }>('savedJobs', [
    where('userId', '==', userId),
    where('jobId', '==', jobId),
  ]);
  for (const result of results) {
    await deleteDoc(doc(db, 'savedJobs', result.id));
  }
}

export async function getSavedJobs(userId: string) {
  return fetchCollection<DocumentData>('savedJobs', [
    where('userId', '==', userId),
  ]);
}

// ============================================================
// LEADS
// ============================================================

export async function getLeads(filters?: {
  companyId?: string;
  status?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.companyId) {
    constraints.push(where('companyId', '==', filters.companyId));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  constraints.push(limit(100));
  return fetchCollection<DocumentData>('leads', constraints);
}

export async function updateLeadStatus(leadId: string, status: string, notes?: string) {
  await updateDoc(doc(db, 'leads', leadId), {
    status,
    ...(notes ? { notes } : {}),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// REVIEWS
// ============================================================

export async function getReviews(targetId?: string) {
  const constraints: QueryConstraint[] = [];
  if (targetId) {
    constraints.push(where('targetId', '==', targetId));
  }
  constraints.push(limit(100));
  return fetchCollection<DocumentData>('reviews', constraints);
}

// ============================================================
// INTERVIEWS
// ============================================================

export async function getInterviews(filters?: {
  seekerId?: string;
  employerId?: string;
  companyId?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.seekerId) {
    constraints.push(where('seekerId', '==', filters.seekerId));
  }
  if (filters?.employerId) {
    constraints.push(where('employerId', '==', filters.employerId));
  }
  if (filters?.companyId) {
    constraints.push(where('companyId', '==', filters.companyId));
  }
  constraints.push(limit(100));
  return fetchCollection<DocumentData>('interviews', constraints);
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  const callable = httpsCallable<typeof data, {
    ok: boolean;
    notificationId: string;
  }>(functions, 'createNotification');
  const result = await callable(data);
  return result.data;
}

export async function getNotifications(userId: string) {
  return fetchCollection<DocumentData>('notifications', [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  ]);
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
    isRead: true,
  });
}

export async function markAllNotificationsRead(userId: string) {
  const notifications = await fetchCollection<{ id: string }>('notifications', [
    where('userId', '==', userId),
    where('read', '==', false),
  ]);
  for (let i = 0; i < notifications.length; i += 450) {
    const batch = writeBatch(db);
    notifications.slice(i, i + 450).forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), {
        read: true,
        isRead: true,
      });
    });
    await batch.commit();
  }
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

export async function approveCompany(companyId: string, adminId: string) {
  await updateDoc(doc(db, 'companies', companyId), {
    status: 'approved',
    verificationStatus: 'verified',
    isVerified: true,
    isActive: true,
    approvedBy: adminId,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const company = await fetchDocument<{ ownerId?: string; name?: string }>(
    'companies',
    companyId,
  );

  const ownerId = company?.ownerId;
  if (ownerId) {
    await setDoc(doc(db, 'users', ownerId), {
      employerVerified: true,
      companyId,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    await runSideEffect('create company approval notification', () =>
      createNotification({
        userId: ownerId,
        type: 'system',
        title: 'Business Approved!',
        message: `Your business "${company.name}" has been approved and is now live on THENIJOBS.`,
        actionUrl: `/employer/company-profile`,
      }),
    );
  }

  await runSideEffect('log company approval activity', () =>
    logActivity({
      userId: adminId,
      userName: 'Admin',
      action: 'Business approved',
      target: company?.name || companyId,
      targetId: companyId,
    }),
  );
}

export async function rejectCompany(
  companyId: string,
  adminId: string,
  reason?: string,
) {
  await updateDoc(doc(db, 'companies', companyId), {
    status: 'rejected',
    verificationStatus: 'rejected',
    isVerified: false,
    isActive: false,
    rejectionReason: reason || '',
    updatedAt: serverTimestamp(),
  });

  const company = await fetchDocument<{ ownerId?: string; name?: string }>(
    'companies',
    companyId,
  );

  const ownerId = company?.ownerId;
  if (ownerId) {
    await runSideEffect('create company rejection notification', () =>
      createNotification({
        userId: ownerId,
        type: 'system',
        title: 'Business Review Update',
        message: `Your business "${company.name}" requires changes. ${reason || ''}`,
        actionUrl: `/employer/company-profile`,
      }),
    );
  }

  await runSideEffect('log company rejection activity', () =>
    logActivity({
      userId: adminId,
      userName: 'Admin',
      action: 'Business rejected',
      target: company?.name || companyId,
      targetId: companyId,
    }),
  );
}

export async function featureCompany(companyId: string, isFeatured: boolean) {
  await updateDoc(doc(db, 'companies', companyId), {
    isFeatured,
    updatedAt: serverTimestamp(),
  });
}

export async function verifyCompany(companyId: string) {
  await updateDoc(doc(db, 'companies', companyId), {
    'verificationBadges.businessVerified': true,
    updatedAt: serverTimestamp(),
  });
}

export async function approveJob(jobId: string, adminId: string) {
  const job = await fetchDocument<DocumentData>('jobs', jobId);
  const company = job?.companyId
    ? await fetchDocument<DocumentData>('companies', String(job.companyId))
    : null;

  if (!job) {
    throw new Error('Job not found.');
  }
  if (company && (company.isActive === false || company.deleted === true || company.status === 'deleted')) {
    throw new Error('Jobs from deleted or inactive companies cannot be approved.');
  }

  if (job.companyId) {
    const [companyJobs, subscriptions] = await Promise.all([
      fetchCollection<DocumentData>('jobs', [where('companyId', '==', String(job.companyId))]),
      fetchCollection<DocumentData>('subscriptions', [where('companyId', '==', String(job.companyId))]),
    ]);
    const activeSubscription = selectBestSubscription(subscriptions);
    const plan = normalizePlanSlug(activeSubscription?.plan || company?.subscriptionPlan || (company?.isPremium ? 'premium' : 'free'));
    const limit = getJobPlanLimit(plan);
    const activeCount = companyJobs.filter((item) => item.id !== jobId && isActiveJobSlot(item)).length;
    if (Number.isFinite(limit) && activeCount >= limit) {
      throw new Error(`${plan.toUpperCase()} plan limit reached. Upgrade the plan before approving another active job.`);
    }
  }

  const activatedAt = new Date();
  const expiresAt = getJobExpiryDate(activatedAt);

  await updateDoc(doc(db, 'jobs', jobId), {
    isActive: true,
    status: 'active',
    approvedBy: adminId,
    approvedAt: serverTimestamp(),
    activatedAt: Timestamp.fromDate(activatedAt),
    expiresAt: Timestamp.fromDate(expiresAt),
    expiryReminderDaysSent: [],
    reportReason: null,
    updatedAt: serverTimestamp(),
  });

  const postedBy = job?.postedBy;
  if (postedBy) {
    await runSideEffect('create job approval notification', () =>
      createNotification({
        userId: postedBy,
        type: 'system',
        title: 'Job Approved!',
        message: `Your job posting "${job.title}" is now live.`,
        actionUrl: `/employer/jobs`,
      }),
    );
  }

  await runSideEffect('log job approval activity', () =>
    logActivity({
      userId: adminId,
      userName: 'Admin',
      action: 'Job approved',
      target: job?.title || jobId,
      targetId: jobId,
    }),
  );
}

export async function rejectJob(jobId: string, adminId: string) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isActive: false,
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });

  await runSideEffect('log job rejection activity', () =>
    logActivity({
      userId: adminId,
      userName: 'Admin',
      action: 'Job rejected',
      target: jobId,
      targetId: jobId,
    }),
  );
}

export async function updateUserRole(
  uid: string,
  role: string,
  adminId: string,
) {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  });

  await runSideEffect('log user role update activity', () =>
    logActivity({
      userId: adminId,
      userName: 'Admin',
      action: `User role updated to ${role}`,
      target: uid,
      targetId: uid,
    }),
  );
}

export async function verifyUser(uid: string, adminId: string) {
  await updateDoc(doc(db, 'users', uid), {
    isVerified: true,
    updatedAt: serverTimestamp(),
  });

  await runSideEffect('create user verification notification', () =>
    createNotification({
      userId: uid,
      type: 'system',
      title: 'Account Verified!',
      message: 'Your account has been verified by the THENIJOBS team.',
    }),
  );

  await runSideEffect('log user verification activity', () =>
    logActivity({
      userId: adminId,
      userName: 'Admin',
      action: 'User verified',
      target: uid,
      targetId: uid,
    }),
  );
}

// ============================================================
// USERS
// ============================================================

export async function getUsers(filters?: {
  role?: string;
  isVerified?: boolean;
  limitCount?: number;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.role) {
    constraints.push(where('role', '==', filters.role));
  }
  if (filters?.isVerified !== undefined) {
    constraints.push(where('isVerified', '==', filters.isVerified));
  }
  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }
  return fetchCollection<DocumentData>('users', constraints);
}

// ============================================================
// SERVICES
// ============================================================

export async function getServices(filters?: {
  status?: string;
  category?: string;
  district?: string;
  providerId?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters?.district) {
    constraints.push(where('district', '==', filters.district));
  }
  if (filters?.providerId) {
    constraints.push(where('providerId', '==', filters.providerId));
  }
  return fetchCollection<DocumentData>('services', constraints);
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================

export async function getSubscriptions(filters?: {
  userId?: string;
  status?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.userId) {
    constraints.push(where('userId', '==', filters.userId));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  return fetchCollection<DocumentData>('subscriptions', constraints);
}

// ============================================================
// ADVERTISEMENTS
// ============================================================

export async function getAdvertisements(filters?: { status?: string }) {
  const constraints: QueryConstraint[] = [];
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  return fetchCollection<DocumentData>('advertisements', constraints);
}

// ============================================================
// ACTIVITY LOG
// ============================================================

export async function logActivity(data: {
  userId: string;
  userName: string;
  action: string;
  target: string;
  targetId: string;
  details?: string;
}) {
  return addDoc(collection(db, 'activityLogs'), {
    ...data,
    timestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function getActivityLogs(limitCount = 20) {
  return fetchCollection<DocumentData>('activityLogs', [
    orderBy('timestamp', 'desc'),
    limit(limitCount),
  ]);
}

// ============================================================
// GENERIC DOCUMENT OPERATIONS
// ============================================================

export async function createDocument(
  collectionName: string,
  data: DocumentData,
) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function upsertDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>,
) {
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>,
) {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName: string, docId: string) {
  await deleteDoc(doc(db, collectionName, docId));
}

export async function createPaymentRequest(data: {
  userId: string;
  companyId?: string;
  audience: 'employer' | 'seeker';
  plan: string;
  planName: string;
  amount: number;
  period: string;
  businessName?: string;
  companyName?: string;
  requesterName?: string;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
}) {
  return createDocument('paymentRequests', {
    ...data,
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
}

export async function startConversation(data: {
  currentUserId: string;
  otherUserId: string;
  currentUserName: string;
  otherUserName: string;
  contextTitle?: string;
}) {
  const [first, second] = [data.currentUserId, data.otherUserId].sort();
  const conversationId = deterministicId(first, second);
  await setDoc(doc(db, 'conversations', conversationId), {
    participants: [data.currentUserId, data.otherUserId],
    participantIds: [data.currentUserId, data.otherUserId],
    participantNames: {
      [data.currentUserId]: data.currentUserName,
      [data.otherUserId]: data.otherUserName,
    },
    contextTitle: data.contextTitle || '',
    lastMessage: data.contextTitle ? `Conversation about ${data.contextTitle}` : 'Conversation started',
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
  return conversationId;
}

export async function sendBroadcastNotification(data: {
  title: string;
  message: string;
  actionUrl?: string;
  targetRole?: string;
  targetUserIds?: string[];
}) {
  const callable = httpsCallable<typeof data, {
    success: boolean;
    sentCount: number;
  }>(functions, 'sendBroadcastNotification');
  const result = await callable(data);
  return result.data;
}

export async function createBooking(data: any) {
  return createDocument('bookings', {
    ...data,
    bookingStatus: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBookingStatus(
  bookingId: string,
  status: string,
  notes?: string,
  quotedPrice?: number
) {
  const updates: any = {
    bookingStatus: status,
    updatedAt: serverTimestamp(),
  };
  if (notes !== undefined) updates.providerNotes = notes;
  if (quotedPrice !== undefined) updates.quotedPrice = Number(quotedPrice);

  await updateDoc(doc(db, 'bookings', bookingId), updates);
}

export async function createRFQ(data: any) {
  return createDocument('rfqs', {
    ...data,
    status: 'pending_quote',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRFQ(rfqId: string, data: any) {
  await updateDoc(doc(db, 'rfqs', rfqId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export { fetchCollection, fetchDocument, getCount };
