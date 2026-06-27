import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import adminApp, { adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { uid, role, phone } = await request.json();

    if (!uid || !role) {
      return NextResponse.json({ error: 'UID and role are required' }, { status: 400 });
    }

    if (role !== 'job_seeker' && role !== 'business') {
      return NextResponse.json({ error: 'Invalid role. Must be job_seeker or business.' }, { status: 400 });
    }

    const userRef = adminDb.doc(`users/${uid}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const userData = userSnap.data() || {};
    const normalizedPhone = phone ? `+91${phone.replace(/\D/g, '').slice(-10)}` : (userData.phone || '');

    // 1. Update the role and status in users collection
    await userRef.update({
      role,
      setupCompleted: false,
      phone: normalizedPhone,
      mobileNumber: normalizedPhone,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Initialize default Profiles based on Role
    if (role === 'job_seeker') {
      const seekerRef = adminDb.doc(`seekerProfiles/${uid}`);
      const seekerSnap = await seekerRef.get();
      if (!seekerSnap.exists) {
        await seekerRef.set({
          uid,
          name: userData.displayName || 'User',
          phone: normalizedPhone,
          email: userData.email || '',
          photoUrl: userData.photoURL || '',
          address: '',
          district: '',
          state: 'Tamil Nadu',
          skills: [],
          experience: [],
          education: [],
          jobTypePreference: [],
          isOpenToWork: true,
          profileStrength: 10,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const publicProfileRef = adminDb.doc(`publicProfiles/${uid}`);
      const publicSnap = await publicProfileRef.get();
      if (!publicSnap.exists) {
        await publicProfileRef.set({
          uid,
          name: userData.displayName || 'User',
          role: 'job_seeker',
          photoUrl: userData.photoURL || '',
          skills: [],
          district: '',
          isOpenToWork: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // 3. Initialize Subscription
    const subRef = adminDb.doc(`subscriptions/${uid}_free`);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      const now = new Date();
      const oneYear = new Date();
      oneYear.setFullYear(now.getFullYear() + 1);

      await subRef.set({
        userId: uid,
        audience: role === 'job_seeker' ? 'seeker' : 'business',
        userName: userData.displayName || 'User',
        email: userData.email || '',
        mobile: normalizedPhone,
        companyName: '',
        plan: 'free',
        planName: 'Free Plan',
        amount: 0,
        period: 'year',
        status: 'active',
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(oneYear),
        paymentDate: null,
        autoRenew: false,
        paymentMethod: 'free',
        expiryReminderDaysSent: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 4. Update Custom Claims in Firebase Auth
    const auth = getAuth(adminApp);
    await auth.setCustomUserClaims(uid, { role });

    // 5. Generate a new Custom Token with the claims
    const customToken = await auth.createCustomToken(uid, { role });

    // 6. Refresh the Session Cookie
    const cookieStore = await cookies();
    cookieStore.set('session', customToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json({
      success: true,
      customToken,
    });
  } catch (err: any) {
    console.error('[Select Role Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
