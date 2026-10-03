/**
 * Shared server-side admin authentication helper for API routes.
 *
 * Verifies the Firebase ID token from the Authorization header and checks
 * that the user has 'admin' or 'super_admin' role in Firestore.
 *
 * Usage:
 *   const authResult = await verifyAdminAuth(req);
 *   if (!authResult.authorized) return authResult.response;
 *   // proceed with admin-only logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

export interface AdminAuthResult {
  authorized: true;
  uid: string;
  role: string;
}

export interface AdminAuthFailure {
  authorized: false;
  response: NextResponse;
}

export async function verifyAdminAuth(
  req: NextRequest
): Promise<AdminAuthResult | AdminAuthFailure> {
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';

  if (!idToken) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  // Verify token via Firebase Identity Toolkit
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: 'Server configuration error.' },
          { status: 500 }
        ),
      };
    }

    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    const verifyData = await verifyRes.json().catch(() => null);
    if (!verifyRes.ok || !verifyData?.users?.length) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: 'Session expired. Please sign in again.' },
          { status: 401 }
        ),
      };
    }

    const uid = verifyData.users[0].localId as string;

    // Check role in Firestore
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const role = userDoc.data()?.role as string;

    if (role !== 'admin' && role !== 'super_admin') {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: 'Admin access required.' },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, uid, role };
  } catch (err: any) {
    console.error('[Admin Auth] Verification error:', err);
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication verification failed.' },
        { status: 500 }
      ),
    };
  }
}
