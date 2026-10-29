import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth, syncClockSkew } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

async function verifyAdmin(req: NextRequest) {
  await syncClockSkew();
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return { authorized: false, error: 'Unauthorized: missing authorization token', status: 401 };
  }

  const auth = getAdminAuth();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch (err: any) {
    return { authorized: false, error: 'Invalid or expired authentication token', status: 401 };
  }

  const db = getAdminFirestore();
  const userDoc = await db.collection('users').doc(decoded.uid).get();
  const userData = userDoc.data();
  const role = userData?.role || decoded.role;

  if (role !== 'admin' && role !== 'super_admin') {
    return { authorized: false, error: 'Forbidden: Admin access required', status: 403 };
  }

  return { authorized: true, uid: decoded.uid, email: decoded.email, db, auth };
}

export async function GET(req: NextRequest) {
  try {
    const check = await verifyAdmin(req);
    if (!check.authorized || !check.db) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status });
    }

    const { db } = check;

    // Fetch company accounts metadata
    const accountsSnap = await db.collection('companyAccounts').get();
    const accountMetaMap = new Map<string, any>();
    accountsSnap.forEach(doc => {
      accountMetaMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Fetch all companies
    const companiesSnap = await db.collection('companies').get();
    const accounts = [];

    for (const compDoc of companiesSnap.docs) {
      const comp = compDoc.data();
      const companyId = compDoc.id;
      const meta = accountMetaMap.get(companyId) || {};
      const ownerId = comp.ownerId || meta.authUid;

      let userDocData: any = null;
      if (ownerId) {
        const uSnap = await db.collection('users').doc(ownerId).get();
        if (uSnap.exists) {
          userDocData = uSnap.data();
        }
      }

      // Format trial dates
      const trialEndDate = comp.trialEndDate?.toDate ? comp.trialEndDate.toDate() : (comp.trialEndDate ? new Date(comp.trialEndDate) : null);
      const now = new Date();
      let trialDaysRemaining = 0;
      let isTrialActive = false;

      if (trialEndDate && trialEndDate > now) {
        isTrialActive = true;
        trialDaysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      accounts.push({
        companyId,
        companyName: comp.name || meta.companyName || 'Unnamed Company',
        slug: comp.slug || '',
        loginEmail: meta.loginEmail || userDocData?.email || comp.email || '',
        authUid: ownerId || meta.authUid || '',
        phone: comp.phone || comp.contactPhone || meta.phone || userDocData?.mobileNumber || userDocData?.phone || '',
        taluk: comp.taluk || comp.city || meta.taluk || '',
        address: comp.address || comp.location || '',
        subscriptionPlan: comp.subscriptionPlan || userDocData?.subscriptionPlan || 'standard',
        subscriptionStatus: comp.subscriptionStatus || userDocData?.subscriptionStatus || 'trial',
        verificationStatus: comp.verificationStatus || (comp.isVerified ? 'verified' : 'pending'),
        isVerified: comp.isVerified ?? false,
        canPostJobs: userDocData?.canPostJobs ?? (comp.verificationStatus === 'verified'),
        isTrialActive,
        trialDaysRemaining,
        trialEndDate: trialEndDate ? trialEndDate.toISOString() : null,
        lastPasswordResetAt: meta.lastPasswordResetAt?.toDate ? meta.lastPasswordResetAt.toDate().toISOString() : null,
        createdAt: comp.createdAt?.toDate ? comp.createdAt.toDate().toISOString() : null,
      });
    }

    // Sort: partner accounts / verified first, then alphabetical
    accounts.sort((a, b) => {
      if (a.loginEmail && !b.loginEmail) return -1;
      if (!a.loginEmail && b.loginEmail) return 1;
      return a.companyName.localeCompare(b.companyName);
    });

    return NextResponse.json({
      success: true,
      count: accounts.length,
      accounts,
    });
  } catch (error: any) {
    console.error('[API Admin Company Accounts GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch company accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const check = await verifyAdmin(req);
    if (!check.authorized || !check.db || !check.auth) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status });
    }

    const { db, auth, uid: adminUid } = check;
    const body = await req.json();
    const { action, companyId, authUid, newPassword } = body;

    if (action === 'reset-password') {
      if (!authUid || typeof authUid !== 'string') {
        return NextResponse.json({ success: false, error: 'Firebase Auth UID is required' }, { status: 400 });
      }
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      // Update password securely in Firebase Authentication
      await auth.updateUser(authUid, { password: newPassword });

      // Update audit timestamp on companyAccounts document if companyId provided
      if (companyId) {
        await db.collection('companyAccounts').doc(companyId).set(
          {
            lastPasswordResetAt: FieldValue.serverTimestamp(),
            passwordResetBy: adminUid,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Log admin audit activity
      await db.collection('activity_logs').add({
        userId: adminUid,
        userName: 'Admin',
        action: 'Reset Company Account Password',
        target: companyId || authUid,
        targetId: authUid,
        timestamp: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: 'Password has been updated securely in Firebase Authentication.',
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[API Admin Company Accounts POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update company account' }, { status: 500 });
  }
}
