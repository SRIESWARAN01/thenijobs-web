import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { db, REGION } from './config';

export const healthCheck = onCall({ region: REGION }, () => {
  logger.info('Functions health check called.');
  return {
    ok: true,
    service: 'thenijobs-functions',
    functions: [
      'approveCompany', 'rejectCompany', 'adminFeatureCompany', 'adminVerifyCompany',
      'approveJob', 'rejectJob',
      'adminUpdateUserRole', 'adminVerifyUser',
      'sendBroadcastNotification',
      'adminUpdateSubscription',
      'serverApplyToJob', 'serverUpdateApplicationStatus',
      'createJobPosting', 'validateSubscriptionAccess', 'createNotification',
      'syncMobileVerification',
    ],
  };
});

// ============================================================
// EXISTING: createJobPosting (preserved)
// ============================================================


export const seedDemoAccounts = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<unknown>) => {
    // Allow seeding if running in emulator OR if a valid secret is provided
    const secret = (request.data as any)?.secret;
    const allowedSecret = process.env.SEED_SECRET || 'theni_seeding_2026';
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    if (!isEmulator && (!allowedSecret || secret !== allowedSecret)) {
      throw new HttpsError('permission-denied', 'Unauthorized seeding request.');
    }

    const demoUsers = [
      {
        email: 'seeker@thenijobs.com',
        password: 'demo@123',
        displayName: 'Demo Job Seeker',
        role: 'job_seeker' as const,
      },
      {
        email: 'employer@thenijobs.com',
        password: 'demo@123',
        displayName: 'Demo Employer / HR',
        role: 'employer' as const,
      },
      {
        email: 'business@thenijobs.com',
        password: 'demo@123',
        displayName: 'Demo Business Owner',
        role: 'business_owner' as const,
      },
      {
        email: 'supplier@thenijobs.com',
        password: 'demo@123',
        displayName: 'Demo Supplier / B2B',
        role: 'supplier' as const,
      },
      {
        email: 'service@thenijobs.com',
        password: 'demo@123',
        displayName: 'Demo Service Provider',
        role: 'service_provider' as const,
      },
      {
        email: 'admin@thenijobs.com',
        password: 'admin@123',
        displayName: 'Platform Admin',
        role: 'admin' as const,
      },
    ];

    const results = [];

    for (const u of demoUsers) {
      let uid = '';
      try {
        // 1. Check if user already exists in Auth
        const existingUser = await getAuth().getUserByEmail(u.email);
        uid = existingUser.uid;
        // Reset password just in case
        await getAuth().updateUser(uid, {
          password: u.password,
          displayName: u.displayName,
          emailVerified: true,
        });
        results.push({ email: u.email, status: 'updated', uid });
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          // Create new user in Auth
          const newUser = await getAuth().createUser({
            email: u.email,
            password: u.password,
            displayName: u.displayName,
            emailVerified: true,
          });
          uid = newUser.uid;
          results.push({ email: u.email, status: 'created', uid });
        } else {
          logger.error('Failed to handle auth for ' + u.email, err);
          results.push({ email: u.email, status: 'failed', error: err.message });
          continue;
        }
      }

      // 2. Set Custom User Claims
      await getAuth().setCustomUserClaims(uid, { role: u.role });

      // 3. Write /users/{uid}
      const companyId = (u.role === 'employer' || u.role === 'business_owner') ? `company_${u.role}` : undefined;
      await db.doc(`users/${uid}`).set({
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        isVerified: true,
        setupCompleted: true,
        emailVerified: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(companyId ? { companyId } : {}),
      }, { merge: true });

      // 4. Seeker profile seeding
      if (u.role === 'job_seeker') {
        const seekerProfile = {
          uid: uid,
          name: u.displayName,
          phone: '9876543210',
          email: u.email,
          address: '123 Main Street',
          district: 'Theni',
          state: 'Tamil Nadu',
          skills: ['Communication', 'Basic Computer Skills', 'Customer Support'],
          experience: [],
          education: [],
          jobTypePreference: ['full_time'],
          isOpenToWork: true,
          profileStrength: 80,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await db.doc(`seekerProfiles/${uid}`).set(seekerProfile, { merge: true });

        const publicProfile = {
          uid: uid,
          name: u.displayName,
          displayName: u.displayName,
          type: 'job_seeker',
          district: 'Theni',
          state: 'Tamil Nadu',
          skills: ['Communication', 'Basic Computer Skills', 'Customer Support'],
          experience: [],
          education: [],
          isOpenToWork: true,
          profileStrength: 80,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await db.doc(`publicProfiles/${uid}`).set(publicProfile, { merge: true });
      }

      // 5. Company profile seeding
      if (companyId) {
        await db.doc(`companies/${companyId}`).set({
          id: companyId,
          slug: `demo-${u.role}`,
          ownerId: uid,
          name: u.role === 'employer' ? 'Demo HR Agency' : 'Demo Local Business',
          category: u.role === 'employer' ? 'IT & Software' : 'Retail',
          description: 'This is a pre-seeded demo company for testing.',
          phone: '9876543210',
          email: u.email,
          address: 'Theni Main Road',
          district: 'Theni',
          state: 'Tamil Nadu',
          country: 'India',
          verificationStatus: 'verified',
          verificationBadges: {
            emailVerified: true,
            gstVerified: true,
            businessVerified: true,
          },
          isActive: true,
          isFeatured: true,
          isPremium: true,
          viewCount: 100,
          enquiryCount: 5,
          rating: 5,
          reviewCount: 1,
          galleryImages: [],
          galleryVideos: [],
          services: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }, { merge: true });
      }

      // 6. Free subscription seeding
      const subRef = db.doc(`subscriptions/${uid}_free`);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() + 1);

      await subRef.set({
        userId: uid,
        audience: u.role === 'job_seeker' ? 'seeker' : 'employer',
        userName: u.displayName,
        email: u.email,
        mobile: '9876543210',
        companyName: u.role === 'employer' ? 'Demo HR Agency' : (u.role === 'business_owner' ? 'Demo Local Business' : ''),
        plan: 'free',
        planName: 'Free Plan',
        amount: 0,
        period: 'year',
        status: 'active',
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        paymentDate: null,
        autoRenew: false,
        paymentMethod: 'free',
        expiryReminderDaysSent: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(companyId ? { companyId } : {}),
      }, { merge: true });
    }

    return { success: true, results };
  }
);
