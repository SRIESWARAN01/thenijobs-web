/* eslint-disable @typescript-eslint/no-require-imports */
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

initializeApp({
  projectId: 'thenijobs-9f01d'
});

const db = getFirestore();

const demoUsers = [
  {
    email: 'seeker@thenijobs.com',
    password: 'demo@123',
    displayName: 'Demo Job Seeker',
    role: 'job_seeker',
  },
  {
    email: 'employer@thenijobs.com',
    password: 'demo@123',
    displayName: 'Demo Employer / HR',
    role: 'employer',
  },
  {
    email: 'business@thenijobs.com',
    password: 'demo@123',
    displayName: 'Demo Business Owner',
    role: 'business_owner',
  },
  {
    email: 'supplier@thenijobs.com',
    password: 'demo@123',
    displayName: 'Demo Supplier / B2B',
    role: 'supplier',
  },
  {
    email: 'service@thenijobs.com',
    password: 'demo@123',
    displayName: 'Demo Service Provider',
    role: 'service_provider',
  },
  {
    email: 'admin@thenijobs.com',
    password: 'admin@123',
    displayName: 'Platform Admin',
    role: 'admin',
  },
];

async function seed() {
  console.log('Starting seed...');
  for (const u of demoUsers) {
    let uid = '';
    try {
      const existingUser = await getAuth().getUserByEmail(u.email);
      uid = existingUser.uid;
      await getAuth().updateUser(uid, {
        password: u.password,
        displayName: u.displayName,
        emailVerified: true,
      });
      console.log(`Updated auth for user: ${u.email} (${uid})`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        const newUser = await getAuth().createUser({
          email: u.email,
          password: u.password,
          displayName: u.displayName,
          emailVerified: true,
        });
        uid = newUser.uid;
        console.log(`Created auth for user: ${u.email} (${uid})`);
      } else {
        console.error(`Failed to handle auth for ${u.email}:`, err);
        continue;
      }
    }

    await getAuth().setCustomUserClaims(uid, { role: u.role });
    console.log(`Set custom claims for: ${u.email}`);

    const companyId = (u.role === 'employer' || u.role === 'business_owner') ? `company_${u.role}` : null;
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
    console.log(`Set user doc for: ${u.email}`);

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
      console.log(`Set seeker and public profile docs for: ${u.email}`);
    }

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
      console.log(`Set company doc for: ${u.email}`);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    await db.doc(`subscriptions/${uid}_free`).set({
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
    console.log(`Set subscription doc for: ${u.email}`);
  }
  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
