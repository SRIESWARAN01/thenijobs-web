import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, REGION, JOB_VALIDITY_DAYS, JOB_REMINDER_DAYS } from './config';
import { CreateJobPostingData } from './types';
import { getAuth } from 'firebase-admin/auth';
import * as helpers from './helpers';

const {
  requireUid, checkRateLimit, serverCreateNotification, createAuditLog,
  getRequiredString, getString, getStringArray, getBoolean, getNumber,
  getNullableNumber, getDate, getWalkInPayload,
  addDays, detectSpamFlags, hasDuplicateJob, createJobNotification,
  countOpenJobs, getPlanConfigs, resolveCompanyPlan, isUnlimited,
  hasVerifiedEmployerAccessServer, isPremiumCompanyOwnerServer, slugify,
  isAdminRequest, normaliseDuplicateKey, getNumberArray
} = helpers;

export const serverApplyToJob = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{
    jobId?: unknown;
    companyId?: unknown;
    jobTitle?: unknown;
    companyName?: unknown;
    seekerName?: unknown;
    seekerEmail?: unknown;
    seekerPhone?: unknown;
    applicationType?: unknown;
    walkIn?: unknown;
    currentRole?: unknown;
    district?: unknown;
    location?: unknown;
    photoUrl?: unknown;
    skills?: unknown;
    experience?: unknown;
    education?: unknown;
    portfolio?: unknown;
    profileStrength?: unknown;
    resumeUrl?: unknown;
    resumeName?: unknown;
    coverLetter?: unknown;
    seekerDob?: unknown;
    seekerGender?: unknown;
    expectedSalary?: unknown;
    linkedin?: unknown;
    website?: unknown;
  }>) => {
    const seekerId = requireUid(request);
    const data = request.data ?? {};
    const jobId = getRequiredString(data.jobId, 'jobId');
    const companyId = getRequiredString(data.companyId, 'companyId');

    // Rate limit: max 20 applications per hour
    await checkRateLimit(seekerId, 'apply_job', 20, 60);

    // Verify job exists and is active
    const jobSnap = await db.doc(`jobs/${jobId}`).get();
    if (!jobSnap.exists) {
      throw new HttpsError('not-found', 'Job not found.');
    }
    const job = jobSnap.data()!;
    if (job.isActive !== true || job.status !== 'active') {
      throw new HttpsError('failed-precondition', 'This job is no longer accepting applications.');
    }
    // Check expiry
    const expiresAt = getDate(job.expiresAt);
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      throw new HttpsError('failed-precondition', 'This job has expired.');
    }

    // Deterministic ID prevents duplicates
    const applicationId = `${seekerId}_${jobId}`;
    const applicationRef = db.doc(`jobApplications/${applicationId}`);
    const existing = await applicationRef.get();
    if (existing.exists) {
      // Already applied - return success (idempotent)
      return { success: true, applicationId, alreadyApplied: true };
    }

    const applicationType = getString(data.applicationType, 'job');
    const status = applicationType === 'walk_in' ? 'pending_review' : 'applied';
    const seekerName = getString(data.seekerName, 'Job Seeker');

    // Create application + increment counter atomically
    const batch = db.batch();

    batch.set(applicationRef, {
      jobId,
      employerId: companyId,
      applicantId: seekerId,
      seekerName,
      seekerEmail: getString(data.seekerEmail),
      seekerPhone: getString(data.seekerPhone),
      jobTitle: getString(data.jobTitle),
      companyName: getString(data.companyName),
      applicationType,
      status,
      applicantData: {
        name: seekerName,
        phone: getString(data.seekerPhone),
        email: getString(data.seekerEmail),
        dob: getString(data.seekerDob),
        gender: getString(data.seekerGender),
        photoUrl: getString(data.photoUrl),
        district: getString(data.district),
        currentRole: getString(data.currentRole),
      },
      qualificationData: Array.isArray(data.education) ? data.education : [],
      skills: getStringArray(data.skills),
      experience: Array.isArray(data.experience) ? data.experience : [],
      portfolioData: {
        portfolio: getStringArray(data.portfolio),
        resumeUrl: getString(data.resumeUrl),
        resumeName: getString(data.resumeName),
        linkedin: getString(data.linkedin),
        website: getString(data.website),
      },
      profileCompletion: getNumber(data.profileStrength, 0),
      resumeUrl: getString(data.resumeUrl),
      resumeName: getString(data.resumeName),
      coverLetter: getString(data.coverLetter),
      district: getString(data.district),
      location: getString(data.location),
      expectedSalary: getString(data.expectedSalary),
      appliedDate: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Increment counter atomically
    const counterUpdate: Record<string, unknown> = {
      applicationsCount: FieldValue.increment(1),
      applicationCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (applicationType === 'walk_in') {
      counterUpdate.walkInApplicationsCount = FieldValue.increment(1);
    }
    batch.update(db.doc(`jobs/${jobId}`), counterUpdate);

    // Audit log
    batch.set(db.collection('activityLogs').doc(), {
      userId: seekerId,
      userName: seekerName,
      action: applicationType === 'walk_in' ? 'Submitted walk-in application' : 'Applied to job',
      target: getString(data.jobTitle) || jobId,
      targetId: jobId,
      timestamp: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // Notify employer (non-blocking)
    try {
      const companySnap = await db.doc(`companies/${companyId}`).get();
      const ownerId = getString(companySnap.data()?.ownerId);
      if (ownerId) {
        await serverCreateNotification({
          userId: ownerId,
          type: 'application_update',
          title: applicationType === 'walk_in' ? 'New Walk-In Candidate' : 'New Job Application',
          message: `${seekerName} ${applicationType === 'walk_in' ? 'submitted a walk-in application for' : 'applied to'} ${getString(data.jobTitle) || 'your job posting'}`,
          actionUrl: '/employer/candidates',
        });
      }
    } catch (err) {
      logger.warn('Failed to notify employer about application.', { error: err });
    }

    logger.info('Application created.', { applicationId, jobId, seekerId });
    return { success: true, applicationId, alreadyApplied: false };
  },
);

// ============================================================
// C7: UPDATE APPLICATION STATUS
// ============================================================

export const serverUpdateApplicationStatus = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{
    applicationId?: unknown;
    status?: unknown;
    note?: unknown;
  }>) => {
    const uid = requireUid(request);
    const applicationId = getRequiredString(request.data?.applicationId, 'applicationId');
    const newStatus = getRequiredString(request.data?.status, 'status');
    const note = getString(request.data?.note);

    const validStatuses = ['applied', 'pending_review', 'resume_viewed', 'under_review', 'reviewed', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(newStatus)) {
      throw new HttpsError('invalid-argument', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const applicationRef = db.doc(`jobApplications/${applicationId}`);
    const applicationSnap = await applicationRef.get();
    if (!applicationSnap.exists) {
      throw new HttpsError('not-found', 'Application not found.');
    }

    const application = applicationSnap.data()!;
    const oldStatus = getString(application.status);
    const companyId = getString(application.employerId) || getString(application.companyId);
    const seekerId = getString(application.applicantId) || getString(application.seekerId);

    // Verify caller has permission:
    // - Company owner can update (employer side)
    // - Seeker can only withdraw their own
    // - Admin can do anything
    const isCallerAdmin = await isAdminRequest(request);

    if (!isCallerAdmin) {
      if (uid === seekerId) {
        // Seeker can only withdraw
        if (newStatus !== 'withdrawn') {
          throw new HttpsError('permission-denied', 'Seekers can only withdraw their own applications.');
        }
      } else if (companyId) {
        // Check if caller is company owner
        const companySnap = await db.doc(`companies/${companyId}`).get();
        if (getString(companySnap.data()?.ownerId) !== uid) {
          throw new HttpsError('permission-denied', 'Only the company owner or admin can update this application.');
        }
      } else {
        throw new HttpsError('permission-denied', 'Permission denied.');
      }
    }

    // Valid state transitions
    const validTransitions: Record<string, string[]> = {
      applied: ['resume_viewed', 'under_review', 'reviewed', 'shortlisted', 'rejected', 'withdrawn'],
      pending_review: ['resume_viewed', 'under_review', 'reviewed', 'shortlisted', 'rejected', 'withdrawn'],
      resume_viewed: ['under_review', 'reviewed', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn'],
      under_review: ['reviewed', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn'],
      reviewed: ['shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn'],
      shortlisted: ['interview_scheduled', 'selected', 'rejected', 'withdrawn'],
      interview_scheduled: ['selected', 'rejected', 'withdrawn'],
      selected: ['withdrawn'],
      rejected: [],
      withdrawn: [],
    };

    if (!isCallerAdmin && validTransitions[oldStatus] && !validTransitions[oldStatus].includes(newStatus)) {
      throw new HttpsError('failed-precondition', `Cannot transition from "${oldStatus}" to "${newStatus}".`);
    }

    await applicationRef.update({
      status: newStatus,
      ...(note ? { employerNote: note } : {}),
      updatedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Audit log
    await createAuditLog({
      action: `Application status: ${oldStatus} → ${newStatus}`,
      adminId: uid,
      targetId: applicationId,
      targetType: 'application',
      changes: { status: { from: oldStatus, to: newStatus } },
    });

    // Notify the other party
    if (uid !== seekerId) {
      // Employer/admin changed status → notify seeker
      const statusMessages: Record<string, string> = {
        reviewed: 'Your application is being reviewed.',
        shortlisted: 'Congratulations! You have been shortlisted.',
        interview_scheduled: 'An interview has been scheduled for you.',
        selected: 'Congratulations! You have been selected!',
        rejected: 'Your application was not selected this time.',
      };
      const msg = statusMessages[newStatus] || `Your application status changed to ${newStatus}.`;
      await serverCreateNotification({
        userId: seekerId,
        type: 'application_update',
        title: `Application ${newStatus.replace(/_/g, ' ')}`,
        message: `${msg}${note ? ` Note: ${note}` : ''}`,
        actionUrl: '/seeker/applications',
      });
    } else {
      // Seeker withdrew → notify employer
      if (companyId) {
        try {
          const companySnap = await db.doc(`companies/${companyId}`).get();
          const ownerId = getString(companySnap.data()?.ownerId);
          if (ownerId) {
            await serverCreateNotification({
              userId: ownerId,
              type: 'application_update',
              title: 'Application Withdrawn',
              message: `${getString(application.seekerName, 'A candidate')} withdrew their application.`,
              actionUrl: '/employer/candidates',
            });
          }
        } catch (err) {
          logger.warn('Failed to notify employer about withdrawal.', { error: err });
        }
      }
    }

    logger.info('Application status updated.', { applicationId, oldStatus, newStatus, updatedBy: uid });
    return { success: true, applicationId, oldStatus, newStatus };
  },
);

// ============================================================
// EXISTING: healthCheck
// ============================================================


export const createJobPosting = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<CreateJobPostingData>) => {
    const uid = requireUid(request);
    const authUser = await getAuth().getUser(uid);
    if (!authUser.emailVerified) {
      throw new HttpsError(
        'failed-precondition',
        'Please verify your email address before posting jobs.',
      );
    }

    const userSnap = await db.doc(`users/${uid}`).get();
    const user = userSnap.data();

    if (!user) {
      throw new HttpsError('permission-denied', 'User profile not found.');
    }
    if (!['business', 'employer', 'business_owner', 'supplier', 'service_provider', 'entrepreneur'].includes(String(user.role))) {
      throw new HttpsError('permission-denied', 'Only business accounts can post jobs.');
    }

    const data = request.data;
    const companyId = getRequiredString(data.companyId, 'companyId');
    const companySnap = await db.doc(`companies/${companyId}`).get();
    const company = companySnap.data();

    if (!company) {
      throw new HttpsError('not-found', 'Company profile not found.');
    }
    if (company.ownerId !== uid) {
      throw new HttpsError('permission-denied', 'You can only post jobs for your own company.');
    }
    if (company.deleted === true || company.isActive === false || company.status === 'deleted') {
      throw new HttpsError('failed-precondition', 'Deleted or inactive companies cannot post jobs.');
    }

    const plans = await getPlanConfigs();
    const plan = await resolveCompanyPlan(companyId, company);
    const limits = plans[plan];
    const activeCount = await countOpenJobs(companyId);

    if (!isUnlimited(limits.maxActiveJobs) && activeCount >= limits.maxActiveJobs) {
      throw new HttpsError(
        'resource-exhausted',
        `${limits.slug} plan allows ${limits.maxActiveJobs} open job posting(s).`,
      );
    }

    const isFeatured = getBoolean(data.isFeatured);
    const isUrgent = getBoolean(data.isUrgent);
    const isPremium = getBoolean(data.isPremium);

    if (isFeatured && !limits.canUseFeaturedJobs) {
      throw new HttpsError('failed-precondition', 'Featured jobs are not enabled for this plan.');
    }
    if (isUrgent && !limits.canUseUrgentJobs) {
      throw new HttpsError('failed-precondition', 'Urgent jobs are not enabled for this plan.');
    }
    if (isPremium && !limits.canUsePremiumBadge) {
      throw new HttpsError('failed-precondition', 'Premium job badges are not enabled for this plan.');
    }

    const title = getRequiredString(data.title, 'title');
    const description = getRequiredString(data.description, 'description');
    const district = getRequiredString(data.district, 'district');
    const location = getString(data.location);
    const normalizedTitle = normaliseDuplicateKey(title);
    const duplicate = await hasDuplicateJob(companyId, normalizedTitle, location);
    if (duplicate) {
      throw new HttpsError(
        'already-exists',
        'A matching job is already pending or active for this company and location.',
      );
    }

    let postedAt = new Date();
    const customStartDateStr = getString(data.customStartDate);
    if (customStartDateStr) {
      const parsedStart = new Date(customStartDateStr);
      if (!isNaN(parsedStart.getTime())) {
        postedAt = parsedStart;
      }
    }

    let expiresAt = addDays(postedAt, JOB_VALIDITY_DAYS);
    let validityDays = JOB_VALIDITY_DAYS;

    const durationDaysInput = getNullableNumber(data.durationDays);
    const customEndDateStr = getString(data.customEndDate);

    if (durationDaysInput && [30, 60, 90].includes(durationDaysInput)) {
      validityDays = durationDaysInput;
      expiresAt = addDays(postedAt, durationDaysInput);
    } else if (customEndDateStr) {
      const parsedEnd = new Date(customEndDateStr);
      if (!isNaN(parsedEnd.getTime())) {
        expiresAt = parsedEnd;
        const diffTime = expiresAt.getTime() - postedAt.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        validityDays = diffDays > 0 ? diffDays : JOB_VALIDITY_DAYS;
      }
    }

    const spamFlags = detectSpamFlags({ title, description });
    const isSpam = spamFlags.length > 0;
    const status = isSpam ? 'reported' : 'active';
    const isActive = !isSpam;
    const now = FieldValue.serverTimestamp();
    const jobRef = db.collection('jobs').doc();

    await jobRef.set({
      title,
      normalizedTitle,
      slug: slugify(title),
      category: getString(data.category),
      description,
      jobType: getString(data.jobType, 'full_time'),
      location,
      district,
      openings: Math.max(1, Math.floor(getNumber(data.openings, 1) || 1)),
      experience: getString(data.experience),
      education: getString(data.education),
      skills: getStringArray(data.skills).slice(0, 50),
      salaryMin: getNullableNumber(data.salaryMin),
      salaryMax: getNullableNumber(data.salaryMax),
      salaryType: getString(data.salaryType, 'monthly'),
      isNegotiable: getBoolean(data.isNegotiable),
      benefits: getStringArray(data.benefits).slice(0, 30),
      deadline: getString(data.deadline) || null,
      isWalkIn: getBoolean(data.isWalkIn),
      ...getWalkInPayload(data),
      isPremium,
      isUrgent,
      isFeatured,
      companyId,
      companyName: getString(company.name, 'Verified Employer'),
      companySlug: getString(company.slug),
      companyLogoUrl: getString(company.logoUrl),
      companyIsActive: company.isActive !== false,
      companyDeleted: false,
      companyStatus: getString(company.status),
      companyVerificationStatus: getString(company.verificationStatus),
      postedBy: uid,
      status,
      isActive,
      approvedBy: isActive ? 'auto' : null,
      approvedAt: isActive ? now : null,
      activatedAt: isActive ? Timestamp.fromDate(postedAt) : null,
      viewCount: 0,
      applicationsCount: 0,
      applicationCount: 0,
      walkInApplicationsCount: 0,
      planAtCreation: plan,
      planType: plan,
      validityDays,
      postedAt: Timestamp.fromDate(postedAt),
      expiresAt: Timestamp.fromDate(expiresAt),
      expiryReminderDaysSent: [],
      spamFlags,
      spamFlagged: spamFlags.length > 0,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('activityLogs').add({
      userId: uid,
      userName: getString(user.displayName || user.email, 'Employer'),
      action: 'Posted a job listing',
      target: title,
      targetId: jobRef.id,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Saved Search Alerts notification trigger
    try {
      const categoryVal = getString(data.category);
      const districtVal = district;
      const jobTypeVal = getString(data.jobType, 'full_time');

      const alertsQuery = db.collection('jobAlerts').where('status', '==', 'active');
      const alertsSnapshot = await alertsQuery.get();

      for (const alertDoc of alertsSnapshot.docs) {
        const alertData = alertDoc.data();
        const matchesCategory = !alertData.category || alertData.category === categoryVal;
        const matchesDistrict = !alertData.district || alertData.district === districtVal;
        const matchesJobType = !alertData.jobType || alertData.jobType === jobTypeVal;

        if (matchesCategory && matchesDistrict && matchesJobType) {
          const alertUserId = alertData.userId;
          if (alertUserId && alertUserId !== uid) {
            await serverCreateNotification({
              userId: alertUserId,
              type: 'job_alert',
              title: `New Job Match: ${title} 🔔`,
              message: `A new job matching your saved alert "${alertData.title}" has been posted in ${location || districtVal}.`,
              actionUrl: `/jobs/${jobRef.id}`,
            });

            if (alertData.whatsappEnabled) {
              logger.info(`[WhatsApp Notify] Mocking WhatsApp alert for user ${alertUserId} about job ${jobRef.id}`);
            }
            if (alertData.emailEnabled) {
              logger.info(`[Email Notify] Mocking email alert for user ${alertUserId} about job ${jobRef.id}`);
            }
          }
        }
      }
    } catch (alertErr) {
      logger.error('Failed matching job alerts:', alertErr);
    }

    return {
      jobId: jobRef.id,
      plan,
      remainingJobSlots: isUnlimited(limits.maxActiveJobs)
        ? null
        : Math.max(0, limits.maxActiveJobs - activeCount - 1),
    };
  },
);

// ============================================================
// EXISTING: validateSubscriptionAccess (preserved)
// ============================================================


export const processJobAutomation = onSchedule(
  {
    region: REGION,
    schedule: 'every 24 hours',
    timeZone: 'Asia/Kolkata',
  },
  async () => {
    const now = new Date();
    const snapshot = await db.collection('jobs')
      .where('status', 'in', ['active', 'paused'])
      .get();

    logger.info('Processing job expiry automation.', { count: snapshot.size });

    const companyCache = new Map<string, any>();
    for (const job of snapshot.docs) {
      const data = job.data();
      const companyId = getString(data.companyId);
      if (companyId) {
        let company = companyCache.get(companyId);
        if (company === undefined) {
          const companySnap = await db.doc(`companies/${companyId}`).get();
          company = companySnap.data() || null;
          companyCache.set(companyId, company);
        }
        if (!company || company.deleted === true || company.isActive === false || company.status === 'deleted') {
          await job.ref.set({
            status: 'closed',
            isActive: false,
            companyDeleted: true,
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
          continue;
        }
      }

      const expiry = getDate(data.expiresAt);
      if (!expiry) continue;

      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const reminderDaysSent = getNumberArray(data.expiryReminderDaysSent);

      if (daysUntilExpiry < 0) {
        await job.ref.set({
          status: 'expired',
          isActive: false,
          expiredAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await createJobNotification({
          userId: getString(data.postedBy),
          title: 'Job expired',
          message: `${getString(data.title, 'Your job')} has expired after its validity period and is no longer public.`,
          actionUrl: '/employer/jobs',
        });
        continue;
      }

      let reminderSent = false;
      for (const reminderDay of JOB_REMINDER_DAYS) {
        if (daysUntilExpiry <= reminderDay && daysUntilExpiry >= 0 && !reminderDaysSent.includes(reminderDay)) {
          await createJobNotification({
            userId: getString(data.postedBy),
            title: `Job expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
            message: `${getString(data.title, 'Your job')} expires on ${expiry.toLocaleDateString('en-IN')}. Renew it to keep accepting applications.`,
            actionUrl: '/employer/jobs',
          });
          reminderDaysSent.push(reminderDay);
          reminderSent = true;
        }
      }

      if (reminderSent) {
        await job.ref.set({
          expiryReminderDaysSent: reminderDaysSent,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }
  },
);


export const serverTalentSearch = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<unknown>) => {
    const uid = requireUid(request);
    
    const isAdmin = await isAdminRequest(request);
    if (!isAdmin) {
      const hasAccess = await hasVerifiedEmployerAccessServer(uid);
      if (!hasAccess) {
        throw new HttpsError('permission-denied', 'Verified employer access required.');
      }
    }
    
    const snapshot = await db.collection('publicProfiles')
      .where('type', '==', 'job_seeker')
      .where('isOpenToWork', '==', true)
      .limit(100)
      .get();
      
    const profiles = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: getString(data.name || data.displayName),
        displayName: getString(data.name || data.displayName),
        currentRole: getString(data.currentRole || data.qualification),
        qualification: getString(data.qualification || 'Job Seeker'),
        district: getString(data.district),
        photoUrl: getString(data.photoUrl || data.profilePhotoUrl),
        skills: Array.isArray(data.skills) ? data.skills : [],
        experience: Array.isArray(data.experience) ? data.experience : [],
        education: Array.isArray(data.education) ? data.education : [],
        profileStrength: getNumber(data.profileStrength, 0),
      };
    });
    
    return { success: true, profiles };
  }
);

export const serverGetCandidateContact = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<{ candidateId?: unknown }>) => {
    const uid = requireUid(request);
    const candidateId = getRequiredString(request.data?.candidateId, 'candidateId');
    
    const isAdmin = await isAdminRequest(request);
    const isOwner = uid === candidateId;
    
    if (!isAdmin && !isOwner) {
      const hasAccess = await hasVerifiedEmployerAccessServer(uid);
      const isPremium = await isPremiumCompanyOwnerServer(uid);
      if (!hasAccess || !isPremium) {
        throw new HttpsError('permission-denied', 'Premium employer access required to view candidate contact info.');
      }
    }
    
    const profileSnap = await db.doc(`seekerProfiles/${candidateId}`).get();
    if (!profileSnap.exists) {
      throw new HttpsError('not-found', 'Candidate profile not found.');
    }
    
    const profile = profileSnap.data()!;
    const resumes = Array.isArray(profile.resumes) ? profile.resumes : [];
    
    return {
      success: true,
      phone: getString(profile.phone),
      email: getString(profile.email),
      resumeUrl: getString(profile.resumeUrl),
      resumes,
    };
  }
);
