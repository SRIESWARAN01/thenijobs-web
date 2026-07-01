import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import adminApp, { adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { idToken, role, phone } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Google ID token is required' }, { status: 400 });
    }

    const auth = getAuth(adminApp);

    // 1. Verify the Google ID Token
    const decodedToken = await auth.verifyIdToken(idToken);
    const email = decodedToken.email?.toLowerCase();
    const uid = decodedToken.uid;

    if (!email) {
      return NextResponse.json({ error: 'Email not provided in Google credential' }, { status: 400 });
    }

    // 2. Query Firestore by email
    const userQuery = await adminDb.collection('users')
      .where('email', '==', email)
      .get();

    let resolvedUid = uid;
    let userRole: string | null = null;
    let isNewUser = false;

    if (!userQuery.empty) {
      // User exists! Link/Map to this existing Firestore user document
      const existingDoc = userQuery.docs[0];
      resolvedUid = existingDoc.id;
      const userData = existingDoc.data();
      userRole = userData.role || null;

      // Update login timestamps and link google details if needed
      await existingDoc.ref.update({
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // New user! Create Firestore user document with role & phone
      const displayName = decodedToken.name || email.split('@')[0] || 'User';
      const photoURL = decodedToken.picture || '';
      const finalRole = (role === 'job_seeker' || role === 'business') ? role : null;
      const normalizedPhone = phone ? `+91${phone.replace(/\D/g, '').slice(-10)}` : null;

      await adminDb.doc(`users/${uid}`).set({
        email,
        displayName,
        photoURL,
        role: finalRole,
        phone: normalizedPhone,
        mobileNumber: normalizedPhone,
        isVerified: true,
        emailVerified: true,
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      resolvedUid = uid;
      userRole = finalRole;
      isNewUser = true;
    }

    // 3. Create Firebase Custom Token for the resolved UID
    const customToken = await auth.createCustomToken(resolvedUid, userRole ? { role: userRole } : undefined);

    // 4. Save session cookie for middleware/session management
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
    console.error('[Google Sign-In API Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
