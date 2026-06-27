import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import adminApp, { adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

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

    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) {
      console.error('[OTP Verify] TWOFACTOR_API_KEY environment variable is not set');
      return NextResponse.json({ error: 'OTP service is not configured' }, { status: 500 });
    }
    const phoneNumberWithCode = `+91${cleanPhone}`;

    // 1. Verify OTP with 2factor.in
    const response = await fetch(`https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`, {
      method: 'GET',
    });
    const data = await response.json();

    if (data.Status !== 'Success' || data.Details !== 'OTP Matched') {
      console.error('[OTP Verify Error] 2Factor Response:', data);
      return NextResponse.json({ error: data.Details || 'Invalid OTP' }, { status: 400 });
    }

    // 2. OTP is verified! Search for existing user mapping in Firestore
    const auth = getAuth(adminApp);
    let resolvedUid: string | null = null;
    let userRole: string | null = null;
    let isNewUser = false;

    // Search Firestore by phone or mobileNumber to support mapping Google accounts with same phone
    const userQueryByPhone = await adminDb.collection('users')
      .where('phone', '==', phoneNumberWithCode)
      .get();

    let userQueryByMobile = { empty: true, docs: [] as any[] };
    if (userQueryByPhone.empty) {
      userQueryByMobile = await adminDb.collection('users')
        .where('mobileNumber', '==', phoneNumberWithCode)
        .get();
    }

    const matchedDoc = !userQueryByPhone.empty 
      ? userQueryByPhone.docs[0] 
      : (!userQueryByMobile.empty ? userQueryByMobile.docs[0] : null);

    if (matchedDoc) {
      resolvedUid = matchedDoc.id;
      const userData = matchedDoc.data();
      userRole = userData.role || null;
      isNewUser = !userRole; // If no role has been chosen yet, they are still considered a new user flow

      // Update login timestamps
      await matchedDoc.ref.update({
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // If not in Firestore, check if they exist in Firebase Auth
      let authUser;
      try {
        authUser = await auth.getUserByPhoneNumber(phoneNumberWithCode);
        resolvedUid = authUser.uid;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          // Create new user in Firebase Auth
          authUser = await auth.createUser({
            phoneNumber: phoneNumberWithCode,
            displayName: 'User',
          });
          resolvedUid = authUser.uid;
        } else {
          console.error('[Auth Error Search By Phone]:', err);
          return NextResponse.json({ error: 'Failed to query user records' }, { status: 500 });
        }
      }

      // Check if a user doc somehow exists for this auth UID
      const userRef = adminDb.doc(`users/${resolvedUid}`);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        const userData = userSnap.data();
        userRole = userData?.role || null;
        isNewUser = !userRole;

        await userRef.update({
          phone: phoneNumberWithCode,
          mobileNumber: phoneNumberWithCode,
          lastLoginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // Create user document with role: null
        await userRef.set({
          phone: phoneNumberWithCode,
          mobileNumber: phoneNumberWithCode,
          email: '',
          displayName: 'User',
          photoURL: '',
          role: null,
          isVerified: true,
          emailVerified: false,
          createdAt: FieldValue.serverTimestamp(),
          lastLoginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        isNewUser = true;
      }
    }

    // 3. Generate custom token for resolvedUid
    const customToken = await auth.createCustomToken(resolvedUid as string, userRole ? { role: userRole } : undefined);

    // 4. Set session cookie
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
      uid: resolvedUid,
      role: userRole,
      isNewUser,
    });
  } catch (err: any) {
    console.error('[OTP Verify Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
