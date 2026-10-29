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
  runTransaction,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { generateJobSlug } from '@/lib/seo/jobSlug';

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
    getCount('jobs', [where('status', '==', 'active')]),   // RULES-1: matches the jobs read rule (status), not isActive
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

  // The employer's Firebase Auth uid — NOT the company document id. Both
  // `conversations.participants` and `notifications.userId` are keyed on the auth uid
  // (see employer/messages and NotificationContext), so addressing either with
  // `companyId` makes the chat thread and the alert invisible to the employer who owns
  // the company. A verified company document is publicly readable, so this resolves for
  // any company a seeker can actually apply to.
  let employerUid = '';
  try {
    const companySnap = await getDoc(doc(db, 'companies', data.companyId));
    if (companySnap.exists()) employerUid = (companySnap.data() as any).ownerId || '';
  } catch (e) {
    console.error('Error resolving the company owner for application:', e);
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
      participants: [data.seekerId, employerUid].filter(Boolean),
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

  // 5. Create notification for the employer, addressed to their auth uid.
  if (employerUid) {
    await createNotification({
      userId: employerUid,
      type: 'application_update',
      title: 'New Job Application Received! 📄',
      message: `${data.seekerName} applied for "${data.jobTitle || 'your job posting'}". Tap to view applicant details & chat.`,
      actionUrl: `/employer/candidates`,
      companyId: data.companyId,
      applicationId,
    });
  } else {
    // Better a missing alert than one addressed to an id no inbox ever queries.
    console.error('[applyToJob] Company owner uid unresolved; employer notification not created for company', data.companyId);
  }

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

export async function createLead(data: {
  companyId: string;
  name?: string;
  customerName?: string;
  contactName?: string;
  customerPhone?: string;
  phone?: string;
  service?: string;
  message: string;
  status?: string;
  source?: string;
  itemId?: string;
  itemType?: string;
  [key: string]: any;
}) {
  const resolvedName = (data.customerName || data.name || data.contactName || 'WhatsApp Visitor').trim();
  const resolvedPhone = (data.customerPhone || data.phone || '').trim();

  return addDoc(collection(db, 'leads'), {
    companyId: data.companyId,
    name: resolvedName,
    customerName: resolvedName,
    contactName: resolvedName,
    ...(resolvedPhone ? { phone: resolvedPhone, customerPhone: resolvedPhone } : {}),
    message: (data.message || 'Marketplace WhatsApp Inquiry').trim(),
    service: data.service || 'Marketplace Item',
    status: data.status || 'new',
    source: data.source || 'marketplace',
    ...(data.itemId ? { itemId: data.itemId } : {}),
    ...(data.itemType ? { itemType: data.itemType } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

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
  /**
   * Set when the notification is addressed to a company owner. Under the default-deny
   * rules a signed-in user may only create a notification for themselves or for the
   * pseudo-recipient 'admin', so a seeker notifying an employer needs a rule that can
   * check `userId == companies/{companyId}.ownerId` — which requires this field to be
   * on the document. Carrying it now keeps that rule expressible.
   */
  companyId?: string;
  /**
   * Set alongside companyId when a seeker notifies a company owner. The rule verifies the
   * claim against this application document rather than trusting the request, so the alert
   * cannot be forged for a company the sender never applied to.
   */
  applicationId?: string;
  /** SEEKER-4: carried on a job_match notification so it can be traced back to its job. */
  jobId?: string;
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
  const now = new Date();
  const trialEndDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // exactly 15-day free trial

  await updateDoc(doc(db, 'companies', companyId), {
    verificationStatus: 'verified',
    isVerified: true,
    isActive: true,
    accountStatus: 'trial_active',
    subscriptionStatus: 'trial_active',
    subscriptionPlan: 'standard', // 15-day free trial applies ONLY to Standard plan
    websiteStatus: 'active',
    paymentStatus: 'unpaid',
    trialStartDate: now,
    trialEndDate: trialEndDate,
    adminApprovedAt: now,
    approvedBy: adminId,
    updatedAt: serverTimestamp(),
  });

  const company = await fetchDocument<{ ownerId?: string; name?: string; phone?: string; district?: string }>(
    'companies',
    companyId,
  );

  if (company?.ownerId) {
    try {
      const userDoc = await fetchDocument<{ role?: string }>('users', company.ownerId);
      const existingRole = userDoc?.role;
      const preservedRole = (existingRole === 'business_owner' || existingRole === 'supplier' || existingRole === 'service_provider')
        ? existingRole
        : 'employer';

      await updateDoc(doc(db, 'users', company.ownerId), {
        role: preservedRole,
        isEmployer: true,
        companyId: companyId,
        canPostJobs: true,
        accountStatus: 'trial_active',
        subscriptionStatus: 'trial_active',
        subscriptionPlan: 'standard',
        paymentStatus: 'unpaid',
        trialStartDate: now,
        trialEndDate: trialEndDate,
        adminApprovedAt: now,
        approvedBy: adminId,
        'employerApplication.status': 'verified',
        updatedAt: serverTimestamp(),
      });
    } catch { /* ignore if user doc does not exist yet */ }

    // Create official trial record in subscriptions collection
    try {
      await addDoc(collection(db, 'subscriptions'), {
        userId: company.ownerId,
        companyId,
        businessName: company.name || '',
        companyName: company.name || '',
        plan: 'standard',
        status: 'trial',
        amount: 0,
        paymentStatus: 'unpaid',
        startDate: now,
        endDate: trialEndDate,
        trialStartDate: now,
        trialEndDate: trialEndDate,
        autoRenew: false,
        paymentMethod: 'FREE_TRIAL_15_DAYS',
        adminApprovedAt: now,
        approvedBy: adminId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (subErr) {
      console.warn('[approveCompany] Failed to add subscription trial record:', subErr);
    }

    await createNotification({
      userId: company.ownerId,
      type: 'system',
      title: 'Business Approved & 15-Day Free Trial Started! 🎉',
      message: `Your business "${company.name}" is approved! Your 15-day Standard free trial has started. Build your company website, post jobs, and manage candidates.`,
      actionUrl: `/employer/dashboard`,
    });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business approved & 15-day trial started',
    target: company?.name || companyId,
    targetId: companyId,
    details: `Trial valid until ${trialEndDate.toLocaleDateString('en-IN')}`,
  });
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
    accountStatus: 'suspended',
    websiteStatus: 'suspended',
    subscriptionStatus: 'suspended',
    rejectionReason: reason || '',
    updatedAt: serverTimestamp(),
  });

  const company = await fetchDocument<{ ownerId?: string; name?: string }>(
    'companies',
    companyId,
  );

  if (company?.ownerId) {
    try {
      await updateDoc(doc(db, 'users', company.ownerId), {
        'employerApplication.status': 'rejected',
        'employerApplication.rejectionReason': reason || '',
        accountStatus: 'suspended',
        updatedAt: serverTimestamp(),
      });
    } catch { /* ignore */ }

    await createNotification({
      userId: company.ownerId,
      type: 'system',
      title: 'Business Registration Review Update',
      message: `Your business registration for "${company.name}" could not be approved. Reason: ${reason || 'Incomplete details'}. Please contact support.`,
      actionUrl: `/contact`,
    });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business rejected',
    target: company?.name || companyId,
    targetId: companyId });
}

export async function approveBusinessOwner(userId: string, adminId: string) {
  const now = new Date();
  const userDoc = await fetchDocument<any>('users', userId);

  const isTrial = userDoc?.selectedPlan === 'trial' || userDoc?.trialRequested;
  const isPaid = userDoc?.paymentStatus === 'paid';
  const selectedPlan = userDoc?.selectedPlan || userDoc?.subscriptionPlan || 'standard';
  const targetCompanyId = userDoc?.companyId || userDoc?.employerApplication?.companyId;

  const userUpdates: Record<string, any> = {
    role: 'business_owner',
    approvalStatus: 'approved',
    accountStatus: 'active',
    isEmployer: true,
    canPostJobs: true,
    approvedAt: serverTimestamp(),
    adminApprovedAt: now,
    approvedBy: adminId,
    rejectionReason: '',
    updatedAt: serverTimestamp(),
  };

  if (targetCompanyId && !userDoc?.companyId) {
    userUpdates.companyId = targetCompanyId;
  }

  if (userDoc?.employerApplication) {
    userUpdates['employerApplication.status'] = 'approved';
    userUpdates['employerApplication.approvedAt'] = now;
  }

  let trialStartDate = now;
  let trialEndDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  if (isTrial && !isPaid) {
    // 15-Day Free Trial: preserve existing valid trial dates or initialize 15 days
    const existingEnd = userDoc?.trialEndDate?.seconds
      ? new Date(userDoc.trialEndDate.seconds * 1000)
      : (userDoc?.trialEndDate ? new Date(userDoc.trialEndDate) : null);
    const existingStart = userDoc?.trialStartDate?.seconds
      ? new Date(userDoc.trialStartDate.seconds * 1000)
      : (userDoc?.trialStartDate ? new Date(userDoc.trialStartDate) : null);

    if (existingEnd && existingEnd > now) {
      trialEndDate = existingEnd;
    }
    if (existingStart) {
      trialStartDate = existingStart;
    }

    const trialDurationDays = 15;
    userUpdates.subscriptionStatus = 'trial';
    userUpdates.selectedPlan = 'trial';
    userUpdates.trialEligible = false;
    userUpdates.hasUsedFreeTrial = true;
    userUpdates.trialStartedAt = trialStartDate;
    userUpdates.trialStartDate = trialStartDate;
    userUpdates.trialEndsAt = trialEndDate;
    userUpdates.trialEndDate = trialEndDate;
    userUpdates.trialDurationDays = trialDurationDays;
    userUpdates.trialActivatedBy = adminId;
    userUpdates.trialActivatedAt = now;
  } else if (isPaid) {
    // Paid Annual Subscription activated starting exactly from Admin Approval time
    const planEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    userUpdates.subscriptionStatus = 'active';
    userUpdates.subscriptionPlan = selectedPlan;
    userUpdates.planStartDate = now;
    userUpdates.planEndDate = planEndDate;
    userUpdates.subscriptionStartDate = now;
    userUpdates.subscriptionEndDate = planEndDate;
    userUpdates.isPremium = true;
  } else {
    // Default fallback: activate 15-day trial if no paid plan was purchased
    const trialDurationDays = 15;
    const trialEndDate = new Date(now.getTime() + trialDurationDays * 24 * 60 * 60 * 1000);
    userUpdates.subscriptionStatus = 'trial';
    userUpdates.selectedPlan = 'trial';
    userUpdates.trialEligible = false;
    userUpdates.hasUsedFreeTrial = true;
    userUpdates.trialStartedAt = now;
    userUpdates.trialStartDate = now;
    userUpdates.trialEndsAt = trialEndDate;
    userUpdates.trialEndDate = trialEndDate;
    userUpdates.trialDurationDays = trialDurationDays;
    userUpdates.trialActivatedBy = adminId;
    userUpdates.trialActivatedAt = now;
  }

  await updateDoc(doc(db, 'users', userId), userUpdates);

  // If user already has a company, also mark verified, active, and sync plan
  if (targetCompanyId) {
    try {
      const companyUpdates: Record<string, any> = {
        verificationStatus: 'verified',
        isVerified: true,
        isActive: true,
        accountStatus: 'active',
        adminApprovedAt: now,
        approvedBy: adminId,
        updatedAt: serverTimestamp(),
      };

      if (isTrial && !isPaid) {
        companyUpdates.trialStartDate = trialStartDate;
        companyUpdates.trialEndDate = trialEndDate;
        companyUpdates.subscriptionStatus = 'trial';
        companyUpdates.subscriptionPlan = 'standard';
      } else if (isPaid) {
        const planEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        companyUpdates.subscriptionPlan = selectedPlan;
        companyUpdates.subscriptionStatus = 'active';
        companyUpdates.subscriptionStartDate = now;
        companyUpdates.subscriptionEndDate = planEndDate;
        companyUpdates.isPremium = true;
      }

      await updateDoc(doc(db, 'companies', targetCompanyId), companyUpdates);
    } catch (cErr) {
      console.warn('[approveBusinessOwner] Note updating company:', cErr);
    }
  }

  await createNotification({
    userId,
    type: 'system',
    title: isTrial && !isPaid ? '15-Day Free Trial Approved & Activated! 🎉' : 'Business Account Approved! 🎉',
    message: isTrial && !isPaid
      ? 'Your 15-day Free Trial has been approved and activated by THENIJOBS Admin. You now have full access to your Business Owner Dashboard, job postings, and company tools.'
      : `Your ${selectedPlan.toUpperCase()} Business Owner account has been approved by admin. You now have full access to your Business Owner Dashboard.`,
    actionUrl: '/employer/dashboard',
  });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: isTrial && !isPaid ? 'Business Owner trial activated' : 'Business Owner paid plan approved',
    target: userDoc?.displayName || userDoc?.email || userId,
    targetId: userId,
  });
}

export async function rejectBusinessOwner(userId: string, adminId: string, reason: string) {
  const trimmedReason = reason?.trim() || 'Registration details could not be verified.';
  const userDoc = await fetchDocument<any>('users', userId);

  const updates: Record<string, any> = {
    approvalStatus: 'rejected',
    accountStatus: 'rejected',
    canPostJobs: false,
    rejectedAt: serverTimestamp(),
    rejectedBy: adminId,
    rejectionReason: trimmedReason,
    updatedAt: serverTimestamp(),
  };

  if (userDoc?.employerApplication) {
    updates['employerApplication.status'] = 'rejected';
    updates['employerApplication.rejectedAt'] = serverTimestamp();
    updates['employerApplication.rejectionReason'] = trimmedReason;
  }

  await updateDoc(doc(db, 'users', userId), updates);

  await createNotification({
    userId,
    type: 'system',
    title: 'Business Account Registration Not Approved',
    message: `Your Business Owner registration was not approved. Reason: ${trimmedReason}. Please contact support or update your information.`,
    actionUrl: '/register-business',
  });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business Owner rejected',
    target: userDoc?.displayName || userDoc?.email || userId,
    targetId: userId,
    details: `Reason: ${trimmedReason}`,
  });
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

// SEEKER-4 — deterministic job-alert matching.
//
// The job-alerts dropdown offers 'Full-time'/'Part-time'/'Contract'/'Freelance'; a real job
// document stores jobType as 'full_time'/'part_time'/'internship'/'remote'/'work_from_home'/
// 'fresher'/'contract' (post-job/page.tsx's own JOB_TYPES). Different casing, different
// separator — an exact-string comparison between the two would never fire. Both sides go
// through this table to a shared canonical form before comparing. 'Freelance' has no
// corresponding job value today; an alert set to it simply never matches, correctly.
const JOB_TYPE_CANONICAL: Record<string, string> = {
  full_time: 'full-time', 'full-time': 'full-time', fulltime: 'full-time', 'full time': 'full-time',
  part_time: 'part-time', 'part-time': 'part-time', parttime: 'part-time', 'part time': 'part-time',
  remote: 'remote', wfh: 'remote', work_from_home: 'remote', 'work from home': 'remote',
  contract: 'contract',
  internship: 'internship',
  fresher: 'fresher',
  freelance: 'freelance',
  walk_in: 'walk-in', 'walk-in': 'walk-in',
};

// Exported for AI-MATCH-1's deterministic job-scoring function (src/lib/ai/jobMatching.ts), which
// needs the exact same job-type normalization as this alert matcher rather than a second copy of
// the lookup table above that could drift out of sync.
export function canonicalJobType(value?: string): string {
  if (!value) return '';
  const key = value.toLowerCase().trim();
  return JOB_TYPE_CANONICAL[key] || key.replace(/[\s_]+/g, '-');
}

/**
 * A job matches an alert when every field the seeker actually set on that alert is
 * satisfied — an AND over set fields, not a weighted score, so a match is explainable by
 * reading which condition let it through. `title` is always present (required at alert
 * creation) and is treated as a keyword against the job's own title/category, matching how
 * `category` is also free text in the alert form despite its label ("Keywords" placeholder).
 */
export function jobMatchesAlert(
  job: { title?: string; category?: string; district?: string; jobType?: string; type?: string },
  alert: { title?: string; category?: string; district?: string; jobType?: string },
): boolean {
  const jobTitle = (job.title || '').toLowerCase();
  const jobCategory = (job.category || '').toLowerCase();

  const keyword = (alert.title || '').toLowerCase().trim();
  if (keyword && !jobTitle.includes(keyword) && !jobCategory.includes(keyword)) return false;

  const category = (alert.category || '').toLowerCase().trim();
  if (category && !jobTitle.includes(category) && !jobCategory.includes(category)) return false;

  if (alert.district && alert.district.trim()) {
    if ((job.district || '').toLowerCase().trim() !== alert.district.toLowerCase().trim()) return false;
  }

  if (alert.jobType && alert.jobType.trim()) {
    if (canonicalJobType(job.jobType || job.type) !== canonicalJobType(alert.jobType)) return false;
  }

  return true;
}

/**
 * Notifies every seeker whose active job alert matches a newly-approved job. Only ever
 * called once per real approval — approveJob()'s transaction guarantees that — so no
 * per-notification duplicate check is needed here; the idempotency lives at the source.
 * In-app only: no email/WhatsApp/push provider exists anywhere in this repository, so
 * emailEnabled/whatsappEnabled/pushEnabled on the alert are not acted on here.
 */
async function notifyMatchingJobAlerts(
  jobId: string,
  job: { title?: string; category?: string; district?: string; jobType?: string; companyName?: string } | null,
): Promise<void> {
  if (!job) return;
  try {
    const alertsSnap = await getDocs(query(collection(db, 'jobAlerts'), where('status', '==', 'active')));
    for (const alertDoc of alertsSnap.docs) {
      const alert = alertDoc.data() as { userId?: string; title?: string; category?: string; district?: string; jobType?: string };
      if (!alert.userId) continue;
      if (!jobMatchesAlert(job, alert)) continue;

      await createNotification({
        userId: alert.userId,
        type: 'job_match',
        title: 'New Job Match 🎯',
        message: `"${job.title}" at ${job.companyName || 'a company'} matches your "${alert.title}" alert.`,
        actionUrl: `/jobs/${(job as any)?.slug || jobId}`,
        jobId,
      });
    }
  } catch (err) {
    console.error('[notifyMatchingJobAlerts] failed:', err);
  }
}

export async function approveJob(jobId: string, adminId: string) {
  const jobRef = doc(db, 'jobs', jobId);

  // SEEKER-4: the whole approval transition runs inside a transaction so two near-simultaneous
  // approve calls (a double-click, or two admin tabs on the same job) can never both pass —
  // only the call that wins the transaction proceeds to notify anyone. A plain read-then-write
  // (the previous shape) cannot guarantee this: both calls could read "not yet active" before
  // either one writes.
  const alreadyApproved = await runTransaction(db, async (tx) => {
    const snap = await tx.get(jobRef);
    if (snap.exists() && (snap.data() as any).status === 'active') {
      return true;
    }
    const d = snap.data() as any;
    const updates: Record<string, any> = {
      isActive: true,
      status: 'active',
      approvalStatus: 'approved',
      approval_status: 'approved',
      approvedBy: adminId,
      approved_by: adminId,
      approvedAt: serverTimestamp(),
      approved_at: serverTimestamp(),
      publishedAt: serverTimestamp(),
      published_at: serverTimestamp(),
      rejectionReason: '',
      rejection_reason: '',
      updatedAt: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    if (!d?.slug && d?.title) {
      updates.slug = generateJobSlug(d.title, d.companyName || 'Company', d.district || d.location || 'Theni');
    }
    tx.update(jobRef, updates);
    return false;
  });

  if (alreadyApproved) return;

  const job = await fetchDocument<{ postedBy?: string; title?: string; category?: string; district?: string; jobType?: string; companyName?: string }>(
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

  await notifyMatchingJobAlerts(jobId, job ?? null);

  // Best-effort Google Indexing notification for newly approved job
  try {
    const jobSlug = (job as any)?.slug || jobId;
    if (typeof window !== 'undefined') {
      fetch('/api/seo/index-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, slug: jobSlug, type: 'URL_UPDATED' }),
      }).catch((e) => console.warn('[Indexing API Background Call]:', e));
    }
  } catch (idxErr) {
    console.warn('[Indexing Call Exception]:', idxErr);
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
    approval_status: 'rejected',
    rejectedBy: adminId,
    rejected_by: adminId,
    rejectedAt: serverTimestamp(),
    rejected_at: serverTimestamp(),
    rejectionReason: reason || '',
    rejection_reason: reason || '',
    updatedAt: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

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
  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.exists() ? userSnap.data() : null;
  const isBusinessOwner = userData?.role === 'business_owner';

  const updatePayload: Record<string, any> = {
    isVerified: true,
    updatedAt: serverTimestamp(),
  };

  if (isBusinessOwner) {
    updatePayload.approvalStatus = 'approved';
    updatePayload.accountStatus = 'active';
    updatePayload.adminApprovedAt = serverTimestamp();
    updatePayload.approvedBy = adminId;
  }

  await updateDoc(doc(db, 'users', uid), updatePayload);

  await createNotification({
    userId: uid,
    type: 'system',
    title: isBusinessOwner ? 'Business Owner Registration Approved! 🎉' : 'Account Verified! ✅',
    message: isBusinessOwner
      ? 'Your Business Owner registration has been verified and approved by THENIJOBS Admin. Full dashboard access is now unlocked.'
      : 'Your account has been verified by the THENIJOBS team.',
    actionUrl: isBusinessOwner ? '/employer/dashboard' : '/seeker/dashboard',
  });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: isBusinessOwner ? 'Business Owner verified & approved' : 'User verified',
    target: uid,
    targetId: uid,
  });
}

export async function rejectUser(uid: string, adminId: string, reason?: string) {
  const finalReason = reason?.trim() || 'Registration details could not be verified.';

  await updateDoc(doc(db, 'users', uid), {
    approvalStatus: 'rejected',
    accountStatus: 'rejected',
    rejectionReason: finalReason,
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    userId: uid,
    type: 'system',
    title: 'Registration Review Update',
    message: `Your registration requires revision: ${finalReason}`,
    actionUrl: '/contact',
  });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business Owner registration rejected',
    target: uid,
    targetId: uid,
    details: finalReason,
  });
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
