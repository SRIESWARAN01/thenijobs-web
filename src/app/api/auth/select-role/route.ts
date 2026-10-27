import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { resolveAuthRedirect } from '@/lib/authRedirect';

const ALLOWED_PUBLIC_ROLES = ['job_seeker', 'business_owner'] as const;
type AllowedRole = (typeof ALLOWED_PUBLIC_ROLES)[number];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, role, email, displayName, photoURL, phone } = body || {};

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is mandatory.' },
        { status: 400 }
      );
    }

    if (!role || !ALLOWED_PUBLIC_ROLES.includes(role as AllowedRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Only Job Seeker or Business Owner can be selected.' },
        { status: 400 }
      );
    }

    // Security check: strictly prohibit privilege escalation to admin/super_admin
    if (role === 'admin' || role === 'super_admin') {
      return NextResponse.json(
        { error: 'Administrative roles cannot be self-assigned.' },
        { status: 403 }
      );
    }

    const db = getAdminFirestore();
    const userDocRef = db.collection('users').doc(userId);
    const existingSnap = await userDocRef.get();

    let finalUserData: Record<string, any>;

    if (existingSnap.exists) {
      const existing = existingSnap.data() || {};

      // Security check: protect existing admin/super_admin accounts from accidental override
      if (existing.role === 'admin' || existing.role === 'super_admin') {
        return NextResponse.json(
          { error: 'Administrative user role cannot be modified.' },
          { status: 403 }
        );
      }

      const updates: Record<string, any> = {
        role,
        authProvider: existing.authProvider || 'google.com',
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!existing.displayName && displayName) updates.displayName = displayName;
      if (!existing.photoURL && photoURL) updates.photoURL = photoURL;
      if (!existing.phone && phone) updates.phone = phone;

      // Business Owner role invariants: must stay pending admin review unless already approved
      if (role === 'business_owner') {
        if (!existing.approvalStatus) updates.approvalStatus = 'pending';
        if (!existing.accountStatus) updates.accountStatus = 'pending_approval';
        if (!existing.paymentStatus) updates.paymentStatus = 'unpaid';
        updates.isEmployer = true;
        if (existing.canPostJobs === undefined) updates.canPostJobs = false;
      } else if (role === 'job_seeker') {
        if (!existing.approvalStatus) updates.approvalStatus = 'approved';
        if (!existing.accountStatus) updates.accountStatus = 'active';
      }

      await userDocRef.update(updates);
      finalUserData = { ...existing, ...updates };
    } else {
      // Brand new user document
      const isBusiness = role === 'business_owner';
      const newDoc: Record<string, any> = {
        uid: userId,
        email: email || '',
        displayName: displayName || '',
        role,
        isVerified: true,
        authProvider: 'google.com',
        approvalStatus: isBusiness ? 'pending' : 'approved',
        accountStatus: isBusiness ? 'pending_approval' : 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      };

      if (photoURL) newDoc.photoURL = photoURL;
      if (phone) newDoc.phone = phone;

      if (isBusiness) {
        newDoc.paymentStatus = 'unpaid';
        newDoc.isEmployer = true;
        newDoc.canPostJobs = false;
      }

      await userDocRef.set(newDoc);
      finalUserData = newDoc;
    }

    const redirectTo = resolveAuthRedirect(finalUserData as any);

    return NextResponse.json({
      success: true,
      userId,
      role,
      redirectTo,
    });
  } catch (error: any) {
    console.error('[/api/auth/select-role] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to select role.' },
      { status: 500 }
    );
  }
}
