'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// ============================================================
// HELPERS
// ============================================================

/** Convert Firestore Timestamp fields to JS Date for safe serialisation */
function normaliseTimestamps<T extends DocumentData>(data: T): T {
  const result: DocumentData = { ...data };
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Timestamp) {
      result[key] = (result[key] as Timestamp).toDate();
    }
  }
  return result as T;
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
      [where('status', '==', 'active')],
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
    totalRevenue };
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
      getCount('applications', [where('companyId', '==', companyId)]),
      getCount('applications', [
        where('companyId', '==', companyId),
        where('status', '==', 'shortlisted'),
      ]),
      getCount('interviews', [where('companyId', '==', companyId)]),
      getCount('applications', [
        where('companyId', '==', companyId),
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
    profileViews };
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
    getCount('applications', [where('seekerId', '==', seekerId)]),
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
  }

  return fetchCollection<DocumentData>('jobs', constraints);
}

export async function getJobById(jobId: string) {
  return fetchDocument<DocumentData>('jobs', jobId);
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
    constraints.push(where('seekerId', '==', filters.seekerId));
  }
  if (filters?.companyId) {
    constraints.push(where('companyId', '==', filters.companyId));
  }
  if (filters?.jobId) {
    constraints.push(where('jobId', '==', filters.jobId));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  return fetchCollection<DocumentData>('applications', constraints);
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
  resumeUrl?: string;
  resumeName?: string;
  coverLetter?: string;
}) {
  // 1. Fetch full seeker profile to embed all details
  let seekerProfile: any = {};
  try {
    const profSnap = await getDoc(doc(db, 'seekerProfiles', data.seekerId));
    if (profSnap.exists()) {
      seekerProfile = profSnap.data();
    }
  } catch (e) {
    console.error('Error fetching seeker profile for application:', e);
  }

  const phone = data.seekerPhone || seekerProfile.phone || '';
  const email = data.seekerEmail || seekerProfile.email || '';
  const district = seekerProfile.district || 'Theni';
  const skills = seekerProfile.skills || [];
  const education = seekerProfile.education || [];
  const experience = seekerProfile.experience || [];
  const summary = seekerProfile.summary || '';
  const resumeUrl = data.resumeUrl || seekerProfile.resumeUrl || seekerProfile.resumes?.[0]?.url || '';
  const idCardUrl = `/portfolio/seeker/${data.seekerId}`; // ID Card / Portfolio URL
  const portfolioUrl = `/portfolio/seeker/${data.seekerId}`;

  // Check for duplicate application (prevents multiple duplicate application docs)
  try {
    const qExisting = query(
      collection(db, 'applications'),
      where('jobId', '==', data.jobId),
      where('seekerId', '==', data.seekerId),
      limit(1)
    );
    const snapExisting = await getDocs(qExisting);
    if (!snapExisting.empty) {
      const existingId = snapExisting.docs[0].id;
      await updateDoc(doc(db, 'applications', existingId), {
        ...data,
        seekerPhone: phone,
        seekerEmail: email,
        resumeUrl,
        updatedAt: serverTimestamp(),
      });
      return existingId;
    }
  } catch (e) {
    console.warn('Duplicate application check error:', e);
  }

  // 2. Create Application Document
  const docRef = await addDoc(collection(db, 'applications'), {
    ...data,
    seekerPhone: phone,
    seekerEmail: email,
    district,
    summary,
    skills,
    education,
    experience,
    resumeUrl,
    resumeName: data.resumeName || 'Resume.pdf',
    idCardUrl,
    portfolioUrl,
    status: 'applied',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const applicationId = docRef.id;
  const chatId = `conv_${applicationId}`;

  // 3. Automatically Create Instant Application-Specific Chat Thread (Expires in 90 days)
  const expiresAtDate = new Date();
  expiresAtDate.setDate(expiresAtDate.getDate() + 90); // 3 months expiry policy

  try {
    await setDoc(doc(db, 'conversations', chatId), {
      id: chatId,
      applicationId,
      jobId: data.jobId,
      jobTitle: data.jobTitle || 'Job Application',
      companyId: data.companyId,
      companyName: data.companyName || 'Employer',
      seekerId: data.seekerId,
      seekerName: data.seekerName,
      seekerPhone: phone,
      participants: [data.seekerId, data.companyId],
      lastMessage: `Application submitted for ${data.jobTitle || 'Job'}`,
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      expiresAt: expiresAtDate,
    }, { merge: true });

    // Initial system message in subcollection
    await addDoc(collection(db, 'conversations', chatId, 'messages'), {
      senderId: 'system',
      text: `Application submitted for ${data.jobTitle || 'Job'}. Employer & Applicant can now chat directly!`,
      createdAt: serverTimestamp(),
    });

    // Update application with chatId
    await updateDoc(doc(db, 'applications', applicationId), { chatId });
  } catch (chatErr) {
    console.error('Error creating automatic application chat:', chatErr);
  }

  // 4. Log activity
  await logActivity({
    userId: data.seekerId,
    userName: data.seekerName,
    action: 'Applied to job',
    target: data.jobTitle || data.jobId,
    targetId: data.jobId,
  });

  // 5. Create notification for employer
  await createNotification({
    userId: data.companyId,
    type: 'application_update',
    title: 'New Job Application Received! 📄',
    message: `${data.seekerName} applied for "${data.jobTitle || 'your job posting'}". Tap to view applicant details & chat.`,
    actionUrl: `/employer/candidates`,
  });

  return applicationId;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  note?: string,
) {
  await updateDoc(doc(db, 'applications', applicationId), {
    status,
    ...(note ? { employerNote: note } : {}),
    updatedAt: serverTimestamp() });
}

// ============================================================
// SAVED JOBS
// ============================================================

export async function saveJob(userId: string, jobId: string) {
  await addDoc(collection(db, 'savedJobs'), {
    userId,
    jobId,
    createdAt: serverTimestamp() });
}

export async function unsaveJob(userId: string, jobId: string) {
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
  return fetchCollection<DocumentData>('leads', constraints);
}

export async function updateLeadStatus(leadId: string, status: string, notes?: string) {
  await updateDoc(doc(db, 'leads', leadId), {
    status,
    ...(notes ? { notes } : {}),
    updatedAt: serverTimestamp() });
}

// ============================================================
// REVIEWS
// ============================================================

export async function getReviews(targetId?: string) {
  const constraints: QueryConstraint[] = [];
  if (targetId) {
    constraints.push(where('targetId', '==', targetId));
  }
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
  return addDoc(collection(db, 'notifications'), {
    ...data,
    read: false,
    createdAt: serverTimestamp() });
}

export async function getNotifications(userId: string) {
  return fetchCollection<DocumentData>('notifications', [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  ]);
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string) {
  const notifications = await fetchCollection<{ id: string }>('notifications', [
    where('userId', '==', userId),
    where('read', '==', false),
  ]);
  await Promise.all(
    notifications.map((n) =>
      updateDoc(doc(db, 'notifications', n.id), { read: true }),
    ),
  );
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

export async function approveCompany(companyId: string, adminId: string) {
  await updateDoc(doc(db, 'companies', companyId), {
    verificationStatus: 'verified',
    isVerified: true,
    isActive: true,
    updatedAt: serverTimestamp() });

  const company = await fetchDocument<{ ownerId?: string; name?: string }>(
    'companies',
    companyId,
  );

  if (company?.ownerId) {
    try {
      await updateDoc(doc(db, 'users', company.ownerId), {
        role: 'employer',
        isEmployer: true,
        companyId: companyId,
        canPostJobs: true,
        'employerApplication.status': 'verified',
        updatedAt: serverTimestamp(),
      });
    } catch { /* ignore if user doc does not exist yet */ }

    await createNotification({
      userId: company.ownerId,
      type: 'system',
      title: 'Business & Employer Access Approved! 🎉',
      message: `Your company "${company.name}" has been approved. You can now post jobs and access the Employer Dashboard.`,
      actionUrl: `/employer/dashboard` });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business approved',
    target: company?.name || companyId,
    targetId: companyId });
}

export async function rejectCompany(
  companyId: string,
  adminId: string,
  reason?: string,
) {
  await updateDoc(doc(db, 'companies', companyId), {
    verificationStatus: 'rejected',
    isVerified: false,
    isActive: false,
    rejectionReason: reason || '',
    updatedAt: serverTimestamp() });

  const company = await fetchDocument<{ ownerId?: string; name?: string }>(
    'companies',
    companyId,
  );

  if (company?.ownerId) {
    try {
      await updateDoc(doc(db, 'users', company.ownerId), {
        'employerApplication.status': 'rejected',
        'employerApplication.rejectionReason': reason || '',
        updatedAt: serverTimestamp(),
      });
    } catch { /* ignore */ }

    await createNotification({
      userId: company.ownerId,
      type: 'system',
      title: 'Employer Application Requires Update',
      message: `Your business application "${company.name}" was not approved: ${reason || 'Please update your business details.'}`,
      actionUrl: `/seeker/become-employer` });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business rejected',
    target: company?.name || companyId,
    targetId: companyId });
}

export async function featureCompany(companyId: string, isFeatured: boolean) {
  await updateDoc(doc(db, 'companies', companyId), {
    isFeatured,
    updatedAt: serverTimestamp() });
}

export async function verifyCompany(companyId: string) {
  await updateDoc(doc(db, 'companies', companyId), {
    'verificationBadges.businessVerified': true,
    updatedAt: serverTimestamp() });
}

export async function deleteCompany(companyId: string, adminId = 'admin'): Promise<void> {
  const company = await fetchDocument<{ name?: string }>('companies', companyId);
  await deleteDoc(doc(db, 'companies', companyId));
  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business deleted',
    target: company?.name || companyId,
    targetId: companyId
  });
}

export async function approveJob(jobId: string, adminId: string) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isActive: true,
    status: 'active',
    // The admin list reads `approvalStatus` first (admin/jobs/page.tsx getStatus/isActive),
    // so leaving it at 'pending' kept every approved job showing as "Pending Review" with
    // "Active & Live: 0" forever — even though the job was already live on the public site.
    approvalStatus: 'approved',
    approvedBy: adminId,
    approvedAt: serverTimestamp(),
    rejectionReason: '',
    updatedAt: serverTimestamp() });

  const job = await fetchDocument<{ postedBy?: string; title?: string }>(
    'jobs',
    jobId,
  );

  if (job?.postedBy) {
    await createNotification({
      userId: job.postedBy,
      type: 'system',
      title: 'Job Approved! ✅',
      message: `Your job posting "${job.title}" is now live.`,
      actionUrl: `/employer/jobs` });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Job approved',
    target: job?.title || jobId,
    targetId: jobId });
}

export async function rejectJob(jobId: string, adminId: string, reason?: string) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isActive: false,
    status: 'rejected',
    // Same contract as approveJob — the admin list keys off approvalStatus.
    approvalStatus: 'rejected',
    rejectedBy: adminId,
    rejectedAt: serverTimestamp(),
    rejectionReason: reason || '',
    updatedAt: serverTimestamp() });

  const job = await fetchDocument<{ postedBy?: string; title?: string }>(
    'jobs',
    jobId,
  );

  if (job?.postedBy) {
    await createNotification({
      userId: job.postedBy,
      type: 'system',
      title: 'Job Posting Needs Changes',
      message: reason
        ? `Your job "${job.title}" was not approved. Reason: ${reason}. Please update and resubmit.`
        : `Your job posting "${job.title}" requires changes before it can go live.`,
      actionUrl: `/employer/jobs` });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Job rejected',
    target: job?.title || jobId,
    targetId: jobId });
}

export async function updateUserRole(
  uid: string,
  role: string,
  adminId: string,
) {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp() });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: `User role updated to ${role}`,
    target: uid,
    targetId: uid });
}

export async function verifyUser(uid: string, adminId: string) {
  await updateDoc(doc(db, 'users', uid), {
    isVerified: true,
    updatedAt: serverTimestamp() });

  await createNotification({
    userId: uid,
    type: 'system',
    title: 'Account Verified! ✅',
    message: 'Your account has been verified by the THENIJOBS team.' });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'User verified',
    target: uid,
    targetId: uid });
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
    timestamp: serverTimestamp() });
}

export async function getActivityLogs(limitCount = 20) {
  return fetchCollection<DocumentData>('activityLogs', [
    orderBy('timestamp', 'desc'),
    limit(limitCount),
  ]);
}

// ============================================================
// APPLICATION READ RECEIPTS
// ============================================================

export async function markApplicationViewed(applicationId: string) {
  await updateDoc(doc(db, 'applications', applicationId), {
    viewedByEmployer: true,
    viewedAt: serverTimestamp(),
  });
}

// ============================================================
// COMPANY FOLLOW
// ============================================================

export async function followCompany(userId: string, companyId: string) {
  await addDoc(collection(db, 'companyFollows'), {
    userId,
    companyId,
    createdAt: serverTimestamp(),
  });
}

export async function unfollowCompany(userId: string, companyId: string) {
  const results = await fetchCollection<{ id: string }>('companyFollows', [
    where('userId', '==', userId),
    where('companyId', '==', companyId),
  ]);
  for (const result of results) {
    await deleteDoc(doc(db, 'companyFollows', result.id));
  }
}

export async function isFollowingCompany(
  userId: string,
  companyId: string,
): Promise<boolean> {
  const results = await fetchCollection<{ id: string }>('companyFollows', [
    where('userId', '==', userId),
    where('companyId', '==', companyId),
    limit(1),
  ]);
  return results.length > 0;
}

// ============================================================
// WHATSAPP APPLICATION TRACKING
// ============================================================

export async function trackWhatsAppApplication(data: {
  seekerId: string;
  seekerName: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  phone?: string;
}) {
  const docRef = await addDoc(collection(db, 'whatsappApplications'), {
    ...data,
    appliedVia: 'whatsapp',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ============================================================
// BULK OPERATIONS
// ============================================================

export async function bulkUpdateApplicationStatus(
  applicationIds: string[],
  status: string,
) {
  // Firestore batch writes support up to 500 operations
  const batchSize = 400;
  for (let i = 0; i < applicationIds.length; i += batchSize) {
    const chunk = applicationIds.slice(i, i + batchSize);
    await Promise.all(
      chunk.map((id) =>
        updateDoc(doc(db, 'applications', id), {
          status,
          updatedAt: serverTimestamp(),
        }),
      ),
    );
  }
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
    updatedAt: serverTimestamp() });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>,
) {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp() });
}

export async function deleteDocument(collectionName: string, docId: string) {
  await deleteDoc(doc(db, collectionName, docId));
}

export { fetchCollection, fetchDocument, getCount };
