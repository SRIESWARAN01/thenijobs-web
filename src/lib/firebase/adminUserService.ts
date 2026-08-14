'use client';

/**
 * Admin User Creation Service
 * Uses a secondary Firebase App instance to create users without
 * signing out the currently logged-in admin.
 */

import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import type { UserRole } from '@/lib/types';

// Firebase config (same project, secondary app instance)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAAXHgdvKXi4pFPNGciMbZE8lPITN9Hsug",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "thenijobs-9f01d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "thenijobs-9f01d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "thenijobs-9f01d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1057136000588",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1057136000588:web:12506f87f1f502596a7ee9",
};

export interface AdminCreateUserParams {
  displayName: string;
  email: string;
  password: string;
  phone?: string;
  district?: string;
  role: UserRole;
  companyName?: string; // for employer/business_owner
}

export interface AdminCreateUserResult {
  success: boolean;
  uid?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  error?: string;
}

/**
 * Generate a random secure password
 */
export function generatePassword(length = 12): string {
  const charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

/**
 * Create a new user via a secondary Firebase Auth instance.
 * This prevents signing out the admin who is currently logged in.
 */
export async function adminCreateUser(
  params: AdminCreateUserParams
): Promise<AdminCreateUserResult> {
  // Create a temporary secondary Firebase app
  const secondaryAppName = `admin_create_${Date.now()}`;
  let secondaryApp;

  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    // 1. Create the user in Firebase Auth
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      params.email,
      params.password
    );
    const newUser = cred.user;

    // Update display name
    await updateProfile(newUser, { displayName: params.displayName });

    // Sign out from secondary app immediately
    await signOut(secondaryAuth);

    // 2. Create Firestore user document (using main db instance)
    await setDoc(doc(db, 'users', newUser.uid), {
      email: params.email,
      displayName: params.displayName,
      phone: params.phone || '',
      district: params.district || '',
      role: params.role,
      isVerified: false,
      createdByAdmin: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Create role-specific profile document
    if (params.role === 'job_seeker') {
      await setDoc(doc(db, 'seekerProfiles', newUser.uid), {
        uid: newUser.uid,
        name: params.displayName,
        email: params.email,
        phone: params.phone || '',
        district: params.district || '',
        state: 'Tamil Nadu',
        address: '',
        skills: [],
        experience: [],
        education: [],
        jobTypePreference: [],
        isOpenToWork: true,
        profileStrength: 15,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (
      params.role === 'employer' ||
      params.role === 'business_owner'
    ) {
      // Create skeleton company document
      const companySlug = (params.companyName || params.displayName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const companyRef = doc(db, 'companies', `company_${newUser.uid}`);
      await setDoc(companyRef, {
        ownerId: newUser.uid,
        name: params.companyName || params.displayName,
        slug: companySlug,
        category: '',
        description: '',
        phone: params.phone || '',
        email: params.email,
        address: '',
        district: params.district || 'Theni',
        state: 'Tamil Nadu',
        country: 'India',
        galleryImages: [],
        galleryVideos: [],
        verificationStatus: 'pending',
        verificationBadges: {
          mobileVerified: false,
          emailVerified: false,
          gstVerified: false,
          businessVerified: false,
        },
        isActive: false,
        isFeatured: false,
        isPremium: false,
        viewCount: 0,
        enquiryCount: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Link company to user
      await setDoc(doc(db, 'users', newUser.uid), {
        companyId: companyRef.id,
      }, { merge: true });
    }

    return {
      success: true,
      uid: newUser.uid,
      email: params.email,
      password: params.password,
      role: params.role,
    };
  } catch (err: any) {
    console.error('[AdminCreateUser Error]:', err);
    return {
      success: false,
      error: err.message || 'Failed to create user',
    };
  } finally {
    // Clean up secondary app
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
