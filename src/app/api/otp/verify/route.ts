import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import adminApp, { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { phone, sessionId, otp } = await request.json();
    if (!phone || !sessionId || !otp) {
      return NextResponse.json({ error: 'Phone, sessionId, and OTP are required' }, { status: 400 });
    }

    // Normalize phone number
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const apiKey = 'c97e4a9d-65fa-11f1-8f15-0200cd936042';

    // 1. Verify OTP with 2factor.in
    const response = await fetch(`https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`, {
      method: 'GET',
    });
    const data = await response.json();

    if (data.Status !== 'Success' || data.Details !== 'OTP Matched') {
      console.error('[OTP Verify Error] 2Factor Response:', data);
      return NextResponse.json({ error: data.Details || 'Invalid OTP' }, { status: 400 });
    }

    // 2. OTP is verified! Manage Firebase Authentication
    const auth = getAuth(adminApp);
    const phoneNumberWithCode = `+91${cleanPhone}`;

    let userRecord;
    let isNewUser = false;

    try {
      userRecord = await auth.getUserByPhoneNumber(phoneNumberWithCode);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Create new user in Firebase Auth
        userRecord = await auth.createUser({
          phoneNumber: phoneNumberWithCode,
          displayName: 'User',
        });
        isNewUser = true;
      } else {
        console.error('[Auth Error Search By Phone]:', err);
        return NextResponse.json({ error: 'Failed to query user records' }, { status: 500 });
      }
    }

    const uid = userRecord.uid;
    const userRef = adminDb.doc(`users/${uid}`);
    const userSnap = await userRef.get();

    let userRole = 'job_seeker';
    
    if (userSnap.exists) {
      const userData = userSnap.data();
      userRole = userData?.role || 'job_seeker';
      
      // Update last login
      await userRef.update({
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Create user doc if it doesn't exist
      await userRef.set({
        phone: phoneNumberWithCode,
        mobileNumber: phoneNumberWithCode, // Supported for OTP sign in
        email: '',
        displayName: 'User',
        photoURL: '',
        role: 'job_seeker',
        isVerified: true,
        emailVerified: false,
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      isNewUser = true;
    }

    // Create seeker profile & free subscription if it's a new user or profile doesn't exist
    if (isNewUser) {
      const seekerRef = adminDb.doc(`seekerProfiles/${uid}`);
      const seekerSnap = await seekerRef.get();
      if (!seekerSnap.exists) {
        await seekerRef.set({
          uid,
          name: 'User',
          phone: phoneNumberWithCode,
          email: '',
          photoUrl: '',
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
          name: 'User',
          role: 'job_seeker',
          photoUrl: '',
          skills: [],
          district: '',
          isOpenToWork: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const subRef = adminDb.doc(`subscriptions/${uid}_free`);
      const subSnap = await subRef.get();
      if (!subSnap.exists) {
        const now = new Date();
        const oneYear = new Date();
        oneYear.setFullYear(now.getFullYear() + 1);

        await subRef.set({
          userId: uid,
          audience: 'seeker',
          userName: 'User',
          email: '',
          mobile: phoneNumberWithCode,
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
    }

    // 3. Generate Firebase custom token for clients to sign in
    const customToken = await auth.createCustomToken(uid, { role: userRole });

    return NextResponse.json({
      success: true,
      customToken,
      uid,
      role: userRole,
      isNewUser,
    });
  } catch (err: any) {
    console.error('[OTP Verify Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
