import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { db, REGION } from './config';
import { CreateNotificationData } from './types';
import { FieldValue } from 'firebase-admin/firestore';
import * as helpers from './helpers';

const {
  requireUid, isAdminRequest, canNotifyRelatedUser, getRequiredString, getString
} = helpers;

export const createNotification = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<CreateNotificationData>) => {
    const uid = requireUid(request);
    const data = request.data ?? {};
    const userId = getRequiredString(data.userId, 'userId');
    const type = getString(data.type, 'system').slice(0, 50);
    const title = getRequiredString(data.title, 'title').slice(0, 140);
    const message = getRequiredString(data.message, 'message').slice(0, 600);
    const actionUrl = getString(data.actionUrl).slice(0, 300);

    const allowed =
      userId === uid ||
      await isAdminRequest(request) ||
      await canNotifyRelatedUser(uid, userId);

    if (!allowed) {
      throw new HttpsError(
        'permission-denied',
        'You do not have permission to notify this user.',
      );
    }

    const notificationRef = await db.collection('notifications').add({
      userId,
      type,
      title,
      message,
      ...(actionUrl ? { actionUrl } : {}),
      read: false,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send push notification via FCM if user has a registered token
    try {
      const { getMessaging } = await import('firebase-admin/messaging');
      const userSnap = await db.collection('seekerProfiles').doc(userId).get();
      const fcmToken = userSnap.data()?.fcmToken;
      if (fcmToken) {
        await getMessaging().send({
          token: fcmToken,
          notification: {
            title,
            body: message,
          },
          data: {
            type,
            actionUrl: actionUrl || '',
          },
        });
        console.log(`[FCM] Push notification sent successfully to user ${userId}`);
      }
    } catch (fcmErr) {
      console.warn(`[FCM] Failed to send push notification to user ${userId}:`, fcmErr);
    }

    return { ok: true, notificationId: notificationRef.id };
  },
);

// ============================================================
// EXISTING: Scheduled Functions (preserved)
// ============================================================

import { onDocumentWritten } from 'firebase-functions/v2/firestore';

function matchesEducation(jobEducation: string, seekerEducation: any[]): boolean {
  if (!jobEducation || jobEducation.toLowerCase() === 'not specified' || jobEducation.toLowerCase() === 'any') {
    return true;
  }
  if (!seekerEducation || seekerEducation.length === 0) {
    return false;
  }
  const jobEduLower = jobEducation.toLowerCase();
  
  const hasDegreeKeyword = (keyword: string) => 
    seekerEducation.some(edu => edu.degree && edu.degree.toLowerCase().includes(keyword));

  if (jobEduLower.includes('diploma')) {
    return hasDegreeKeyword('diploma') || hasDegreeKeyword('degree') || hasDegreeKeyword('bachelor') || hasDegreeKeyword('master') || hasDegreeKeyword('b.') || hasDegreeKeyword('m.');
  }
  if (jobEduLower.includes('post graduate') || jobEduLower.includes('master') || jobEduLower.includes('pg')) {
    return hasDegreeKeyword('master') || hasDegreeKeyword('m.') || hasDegreeKeyword('post graduate') || hasDegreeKeyword('mba') || hasDegreeKeyword('mca') || hasDegreeKeyword('msc') || hasDegreeKeyword('mcom') || hasDegreeKeyword('ma');
  }
  if (jobEduLower.includes('graduate') || jobEduLower.includes('degree') || jobEduLower.includes('bachelor') || jobEduLower.includes('ug')) {
    return hasDegreeKeyword('bachelor') || hasDegreeKeyword('degree') || hasDegreeKeyword('b.') || hasDegreeKeyword('m.') || hasDegreeKeyword('master') || hasDegreeKeyword('graduate');
  }
  if (jobEduLower.includes('12') || jobEduLower.includes('hsc')) {
    return hasDegreeKeyword('12') || hasDegreeKeyword('hsc') || hasDegreeKeyword('diploma') || hasDegreeKeyword('bachelor') || hasDegreeKeyword('degree') || hasDegreeKeyword('b.') || hasDegreeKeyword('m.');
  }
  if (jobEduLower.includes('10') || jobEduLower.includes('sslc')) {
    return true;
  }

  // Fallback
  const jobWords = jobEduLower.split(/[^a-z0-9]/).filter(w => w.length > 2);
  for (const edu of seekerEducation) {
    if (!edu.degree) continue;
    const degLower = edu.degree.toLowerCase();
    if (jobWords.some(word => degLower.includes(word))) {
      return true;
    }
  }
  
  return false;
}

function matchesExperience(jobExperience: string, seekerExpLevel: string, seekerExpEntries: any[]): boolean {
  if (!jobExperience || jobExperience.toLowerCase() === 'not specified' || jobExperience.toLowerCase() === 'any') {
    return true;
  }
  
  const jobLower = jobExperience.toLowerCase();
  let minJobYears = 0;
  let maxJobYears = 100;
  
  if (jobLower.includes('fresher')) {
    minJobYears = 0;
    maxJobYears = 0;
  } else {
    const numbers = jobLower.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      if (numbers.length === 1) {
        minJobYears = parseInt(numbers[0]);
        if (jobLower.includes('+') || jobLower.includes('above') || jobLower.includes('more')) {
          maxJobYears = 100;
        } else {
          maxJobYears = minJobYears;
        }
      } else {
        minJobYears = parseInt(numbers[0]);
        maxJobYears = parseInt(numbers[1]);
      }
    }
  }

  let seekerYears = 0;
  if (seekerExpLevel) {
    if (seekerExpLevel.toLowerCase().includes('fresher')) {
      seekerYears = 0;
    } else if (seekerExpLevel.includes('1-2')) {
      seekerYears = 1.5;
    } else if (seekerExpLevel.includes('3-5')) {
      seekerYears = 4;
    } else if (seekerExpLevel.includes('5-10')) {
      seekerYears = 7.5;
    } else if (seekerExpLevel.includes('10+')) {
      seekerYears = 12;
    } else {
      const numbers = seekerExpLevel.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        seekerYears = parseFloat(numbers[0]);
      }
    }
  } else if (seekerExpEntries && seekerExpEntries.length > 0) {
    let totalMs = 0;
    for (const exp of seekerExpEntries) {
      if (!exp.startDate) continue;
      const start = new Date(exp.startDate).getTime();
      const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
      if (!isNaN(start) && !isNaN(end)) {
        totalMs += (end - start);
      }
    }
    seekerYears = totalMs / (1000 * 60 * 60 * 24 * 365.25);
  }

  if (minJobYears === 0 && maxJobYears === 0) {
    return seekerYears < 1.0;
  }
  
  return seekerYears >= minJobYears;
}

export const onJobCreated = onDocumentWritten(
  {
    document: 'jobs/{jobId}',
  },
  async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!afterData) {
      console.log('Job document was deleted. Skipping notification.');
      return;
    }

    const wasActiveBefore = beforeData && (beforeData.status === 'active' || beforeData.status === 'approved' || beforeData.isActive === true);
    const isActiveNow = afterData.status === 'active' || afterData.status === 'approved' || afterData.isActive === true;

    if (wasActiveBefore || !isActiveNow) {
      console.log(`Job is either already processed as active or not active now. wasActiveBefore: ${wasActiveBefore}, isActiveNow: ${isActiveNow}. Skipping.`);
      return;
    }

    const jobData = afterData;
    const jobId = event.params.jobId;

    console.log(`Processing notifications for new job: ${jobData.title} at ${jobData.companyName || 'Company'}`);

    const notifiedSeekers = new Set<string>();

    // 1. Process match from Job Alerts collection
    try {
      const alertsSnap = await db.collection('jobAlerts').where('status', '==', 'active').get();
      console.log(`Fetched ${alertsSnap.size} active job alerts to check matching.`);
      
      for (const alertDoc of alertsSnap.docs) {
        const alert = alertDoc.data();
        const userId = alert.userId;
        if (!userId) continue;

        // Check matching parameters:
        // Alert Category matching Job Category (case-insensitive)
        const matchCategory = !alert.category || alert.category.toLowerCase() === (jobData.category || '').toLowerCase();
        
        // Alert Location matching Job location/district (case-insensitive)
        const matchLocation = !alert.district || 
          alert.district.toLowerCase() === (jobData.location || '').toLowerCase() || 
          alert.district.toLowerCase() === (jobData.district || '').toLowerCase();
        
        // Alert JobType matching Job jobType
        const matchJobType = !alert.jobType || 
          (jobData.jobType && alert.jobType.toLowerCase().replace(/[^a-z]/g, '') === jobData.jobType.toLowerCase().replace(/[^a-z]/g, ''));

        if (matchCategory && matchLocation && matchJobType) {
          notifiedSeekers.add(userId);
        }
      }
    } catch (err) {
      console.error('Error matching active job alerts:', err);
    }

    // 2. Process match from Seeker Profiles preferences
    try {
      const seekersSnap = await db.collection('seekerProfiles').where('isOpenToWork', '==', true).get();
      console.log(`Fetched ${seekersSnap.size} open-to-work seeker profiles to check matching.`);

      for (const seekerDoc of seekersSnap.docs) {
        const seeker = seekerDoc.data();
        const userId = seekerDoc.id; // Seeker document ID is the userId
        if (notifiedSeekers.has(userId)) continue;

        const prefs = seeker.preferences || {};
        
        // Match preferred Categories
        let matchCategory = true;
        if (prefs.categories && prefs.categories.length > 0) {
          matchCategory = prefs.categories.some((cat: string) => 
            cat.toLowerCase() === (jobData.category || '').toLowerCase()
          );
        }

        // Match preferred Locations (towns)
        let matchLocation = true;
        if (prefs.locations && prefs.locations.length > 0) {
          matchLocation = prefs.locations.some((loc: string) => 
            loc.toLowerCase() === (jobData.location || '').toLowerCase() ||
            loc.toLowerCase() === (jobData.district || '').toLowerCase()
          );
        }

        // Match preferred Job Types
        let matchJobType = true;
        if (prefs.jobTypes && prefs.jobTypes.length > 0) {
          matchJobType = prefs.jobTypes.some((type: string) => 
            jobData.jobType && type.toLowerCase().replace(/[^a-z]/g, '') === jobData.jobType.toLowerCase().replace(/[^a-z]/g, '')
          );
        }

        // Match expected salary (job max salary must be >= seeker preferred min salary)
        let matchSalary = true;
        if (prefs.salaryMin && jobData.salaryMax) {
          const minPref = parseFloat(prefs.salaryMin);
          const maxJob = parseFloat(jobData.salaryMax);
          if (!isNaN(minPref) && !isNaN(maxJob) && maxJob < minPref) {
            matchSalary = false;
          }
        }

        // Match skills (at least one overlapping skill)
        let matchSkills = true;
        if (jobData.skills && jobData.skills.length > 0 && seeker.skills && seeker.skills.length > 0) {
          const jobSkillsLower = jobData.skills.map((s: string) => s.toLowerCase().trim());
          const seekerSkillsLower = seeker.skills.map((s: string) => s.toLowerCase().trim());
          matchSkills = seekerSkillsLower.some((s: string) => jobSkillsLower.includes(s));
        }

        // Match Qualification (Education)
        const matchEducation = matchesEducation(jobData.education || '', seeker.education || []);

        // Match Experience
        const matchExp = matchesExperience(
          jobData.experience || '',
          prefs.experienceLevel || seeker.experienceLevel || '',
          seeker.experience || []
        );

        if (matchCategory && matchLocation && matchJobType && matchSalary && matchSkills && matchEducation && matchExp) {
          notifiedSeekers.add(userId);
        }
      }
    } catch (err) {
      console.error('Error matching seeker profiles preferences:', err);
    }

    console.log(`Sending notifications to ${notifiedSeekers.size} matched seekers.`);

    // 3. Deliver notifications
    const title = `Matching Job Posted!`;
    const salaryStr = jobData.salaryMin ? `₹${Number(jobData.salaryMin).toLocaleString('en-IN')} - ₹${Number(jobData.salaryMax).toLocaleString('en-IN')}/month` : '';
    const message = `${jobData.companyName || 'A company'} is hiring for ${jobData.title} in ${jobData.location || jobData.district || 'Theni'}.${salaryStr ? ` Salary: ${salaryStr}` : ''}`;
    const actionUrl = `/jobs/${jobId}`;

    const batch = db.batch();

    for (const userId of notifiedSeekers) {
      // Add In-App notification doc
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId,
        type: 'job_alert',
        title: `${jobData.title} at ${jobData.companyName || 'Hiring Company'}`,
        message,
        link: actionUrl,
        actionUrl,
        read: false,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
        // Structured fields for UI display:
        jobId,
        jobTitle: jobData.title,
        companyName: jobData.companyName || 'Company',
        location: jobData.location || jobData.district || 'Theni',
        salary: salaryStr || null
      });

      // Send Push Notification asynchronously
      sendPushNotificationSafe(userId, title, `${jobData.title} at ${jobData.companyName || 'Hiring Company'}`, actionUrl);
    }

    if (notifiedSeekers.size > 0) {
      await batch.commit();
      console.log(`Successfully committed batch notification writes for ${notifiedSeekers.size} users.`);
    }
  }
);

// Helper function to send push notification safely without blocking or throwing function errors
async function sendPushNotificationSafe(userId: string, title: string, body: string, actionUrl: string) {
  try {
    const userSnap = await db.collection('seekerProfiles').doc(userId).get();
    const fcmToken = userSnap.data()?.fcmToken;
    if (fcmToken) {
      const { getMessaging } = await import('firebase-admin/messaging');
      await getMessaging().send({
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type: 'job_alert',
          actionUrl,
        },
      });
      console.log(`[FCM Push] Sent successfully to user ${userId}`);
    }
  } catch (err) {
    console.warn(`[FCM Push] Failed to send to user ${userId}:`, err);
  }
}
