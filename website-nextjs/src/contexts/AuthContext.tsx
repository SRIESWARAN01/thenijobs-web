'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence,
  updateProfile,
  signInWithCustomToken,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { User, UserRole } from '@/lib/types';
import { buildPublicSeekerProfile } from '@/lib/publicProfile';
import { getYearlySubscriptionEndDate } from '@/lib/subscriptions';
import { isBusinessRole } from '@/lib/access';
import { mapAuthError } from '@/lib/firebase/authErrors';


// ───────────────────────────── Types ─────────────────────────────

export interface AuthState {
  /** Firebase auth user object */
  firebaseUser: FirebaseUser | null;
  /** THENIJOBS user profile from Firestore */
  user: User | null;
  /** True while initial auth check or Firestore fetch is in progress */
  loading: boolean;
  /** Latest auth-related error message */
  error: string | null;
}

export interface AuthActions {
  /** Email + password sign-in */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Google account sign-in */
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  /** Create a new account (email + password) and seed Firestore user doc */
  createAccount: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    phone?: string,
  ) => Promise<string>;
  /** Sign out of Firebase */
  logout: () => Promise<void>;
  /** Sign in with Custom Token (OTP verification) */
  loginWithCustomToken: (token: string) => Promise<void>;
  /** Clear the current error */
  clearError: () => void;
}

export interface AuthHelpers {
  /** True if the current user has an admin or super_admin role */
  isAdmin: boolean;
  /** True if the current user has a business role or legacy business roles */
  isBusiness: boolean;
  /** True if the current user is a job_seeker */
  isSeeker: boolean;
}

export type AuthContextValue = AuthState & AuthActions & AuthHelpers;

// ───────────────────────────── Context ─────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ───────────────────────────── Provider ─────────────────────────────

function getSubscriptionAudience(role: UserRole) {
  if (role === 'job_seeker') return 'seeker';
  // All business roles (including legacy employer, supplier, service_provider) → 'business'
  if (isBusinessRole(role)) return 'business';
  return 'business';
}

async function ensureLocalSessionPersistence() {
  await setPersistence(auth, browserLocalPersistence);
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Wraps the application and provides authentication state + helpers
 * via React context. Place this at the root layout level.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch Firestore user profile ──────────────────────────────
  const fetchUserProfile = useCallback(async (uid: string): Promise<User | null> => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return { uid, ...snap.data() } as User;
      }
      return null;
    } catch (err) {
      console.error('[AuthContext] Failed to fetch user profile:', err);
      return null;
    }
  }, []);

  const ensureSeekerProfile = useCallback(async (profile: {
    uid: string;
    displayName?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    photoURL?: string;
  }) => {
    if (profile.role !== 'job_seeker') return;

    const profileRef = doc(db, 'seekerProfiles', profile.uid);
    const publicProfileRef = doc(db, 'publicProfiles', profile.uid);
    const existing = await getDoc(profileRef);
    if (existing.exists()) {
      try {
        const publicProfile = await getDoc(publicProfileRef);
        if (!publicProfile.exists()) {
          await setDoc(publicProfileRef, {
            ...buildPublicSeekerProfile(profile.uid, existing.data(), profile),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      } catch (err) {
        console.warn('[AuthContext] Failed to sync existing public seeker profile:', err);
      }
      return;
    }

    const seekerProfile = {
      uid: profile.uid,
      name: profile.displayName ?? '',
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      photoUrl: profile.photoURL ?? '',
      address: '',
      district: '',
      state: 'Tamil Nadu',
      skills: [],
      experience: [],
      education: [],
      jobTypePreference: [],
      isOpenToWork: true,
      profileStrength: 10,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(profileRef, seekerProfile);

    try {
      await setDoc(doc(db, 'publicProfiles', profile.uid), {
        ...buildPublicSeekerProfile(profile.uid, seekerProfile, profile),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[AuthContext] Failed to sync public seeker profile:', err);
    }
  }, []);

  // ── Auth state listener ───────────────────────────────────────
  const ensureFreeYearlySubscription = useCallback(async (profile: {
    uid: string;
    displayName?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
  }) => {
    const startDate = new Date();
    const endDate = getYearlySubscriptionEndDate(startDate);

    await setDoc(doc(db, 'subscriptions', `${profile.uid}_free`), {
      userId: profile.uid,
      audience: getSubscriptionAudience(profile.role || 'job_seeker'),
      userName: profile.displayName || profile.email || 'User',
      email: profile.email || '',
      mobile: profile.phone || '',
      companyName: '',
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, []);

  const syncVerifiedUserDocument = useCallback(async (fbUser: FirebaseUser, profile?: User | null) => {
    const dataToSave: any = {
      email: fbUser.email || profile?.email || '',
      displayName: fbUser.displayName || profile?.displayName || fbUser.phoneNumber || 'User',
      photoURL: fbUser.photoURL || profile?.photoURL || '',
      emailVerified: fbUser.emailVerified || false,
      isVerified: fbUser.emailVerified || !!fbUser.phoneNumber || profile?.isVerified || false,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (fbUser.phoneNumber) {
      dataToSave.phone = fbUser.phoneNumber;
      dataToSave.mobileNumber = fbUser.phoneNumber;
    }

    if (!profile) {
      dataToSave.role = 'job_seeker';
      dataToSave.createdAt = serverTimestamp();
    } else {
      if (!profile.role) {
        dataToSave.role = 'job_seeker';
      }
      if (!profile.createdAt) {
        dataToSave.createdAt = serverTimestamp();
      }
    }

    console.log('[AuthContext] Syncing user doc in Firestore:', fbUser.uid, dataToSave);
    await setDoc(doc(db, 'users', fbUser.uid), dataToSave, { merge: true });
  }, []);

  const rejectUnverifiedEmail = useCallback(async (fbUser: FirebaseUser) => {
    // Skip email verification check for phone/custom token OTP users who do not have an email
    if (fbUser.phoneNumber || !fbUser.email) return false;

    await fbUser.reload();
    await fbUser.getIdToken(true).catch(() => undefined);
    if (fbUser.emailVerified || (process.env.NODE_ENV === 'development' && (fbUser.email?.endsWith('@example.com') || fbUser.email?.endsWith('@test.com')))) return false;

    await sendEmailVerification(fbUser).catch((err) => {
      console.warn('[AuthContext] Failed to send verification email:', err);
    });
    await signOut(auth);
    setFirebaseUser(null);
    setUser(null);
    setError('Please verify your email address before using THENIJOBS. We sent a verification link to your inbox.');
    return true;
  }, []);

  useEffect(() => {
    void ensureLocalSessionPersistence().catch((err) => {
      console.warn('[AuthContext] Firebase persistence setup failed:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        const unverified = await rejectUnverifiedEmail(fbUser);
        if (auth.currentUser?.uid !== fbUser.uid) return;
        if (unverified) {
          setLoading(false);
          return;
        }

        setFirebaseUser(fbUser);
        const profile = await fetchUserProfile(fbUser.uid);
        if (auth.currentUser?.uid !== fbUser.uid) return;

        await syncVerifiedUserDocument(fbUser, profile);
        if (auth.currentUser?.uid !== fbUser.uid) return;

        if (profile) {
          const verifiedProfile = {
            ...profile,
            emailVerified: fbUser.emailVerified,
            isVerified: fbUser.emailVerified || profile.isVerified,
            photoURL: fbUser.photoURL || profile.photoURL,
          };
          await ensureSeekerProfile(verifiedProfile);
          if (auth.currentUser?.uid !== fbUser.uid) return;

          setUser(verifiedProfile);
        } else {
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [ensureSeekerProfile, fetchUserProfile, rejectUnverifiedEmail, syncVerifiedUserDocument]);

  // ── Helpers ───────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown, fallback: string) => {
    const message = mapAuthError(err);
    setError(message);
    throw err;
  }, []);

  // ── Sign in with email + password ─────────────────────────────
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        await ensureLocalSessionPersistence();
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const unverified = await rejectUnverifiedEmail(cred.user);
        if (unverified) {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
        handleError(err, 'Failed to sign in with email and password.');
      }
    },
    [handleError, rejectUnverifiedEmail],
  );

  // ── Create account (email + password) ─────────────────────────
  const signInWithGoogle = useCallback(
    async (role: UserRole = 'job_seeker') => {
      setError(null);
      setLoading(true);
      try {
        await ensureLocalSessionPersistence();
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(auth, provider);
        const fbUser = cred.user;
        const unverified = await rejectUnverifiedEmail(fbUser);
        if (unverified) {
          setLoading(false);
          return;
        }

        const existingProfile = await fetchUserProfile(fbUser.uid);
        const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
        const email = fbUser.email || '';
        const phone = fbUser.phoneNumber || undefined;
        let resolvedProfile: User | null = existingProfile;

        if (!existingProfile) {
          const newUser: Omit<User, 'uid'> = {
            email,
            displayName,
            photoURL: fbUser.photoURL || '',
            role,
            isVerified: true,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...(phone ? { phone } : {}),
          };

          await setDoc(doc(db, 'users', fbUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          await ensureFreeYearlySubscription({
            uid: fbUser.uid,
            displayName,
            email,
            phone,
            role,
          });

          await ensureSeekerProfile({
            uid: fbUser.uid,
            displayName,
            email,
            phone,
            role,
          });

          resolvedProfile = { uid: fbUser.uid, ...newUser };
        } else {
          await syncVerifiedUserDocument(fbUser, existingProfile);
          await ensureFreeYearlySubscription({
            uid: fbUser.uid,
            displayName: existingProfile.displayName || displayName,
            email: existingProfile.email || email,
            phone: existingProfile.phone || phone,
            role: existingProfile.role,
          });
          await ensureSeekerProfile({
            uid: fbUser.uid,
            displayName: existingProfile.displayName || displayName,
            email: existingProfile.email || email,
            phone: existingProfile.phone || phone,
            role: existingProfile.role,
          });
        }

        setFirebaseUser(fbUser);
        setUser(resolvedProfile
          ? {
              ...resolvedProfile,
              displayName: resolvedProfile.displayName || displayName,
              email: resolvedProfile.email || email,
              photoURL: fbUser.photoURL || resolvedProfile.photoURL,
              emailVerified: fbUser.emailVerified,
              isVerified: fbUser.emailVerified,
            }
          : null);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        handleError(err, 'Failed to sign in with Google.');
      }
    },
    [
      ensureFreeYearlySubscription,
      ensureSeekerProfile,
      fetchUserProfile,
      handleError,
      rejectUnverifiedEmail,
      syncVerifiedUserDocument,
    ],
  );

  const createAccount = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole,
      phone?: string,
    ) => {
      setError(null);
      setLoading(true);
      try {
        await ensureLocalSessionPersistence();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;

        // Update Firebase Auth display name
        await updateProfile(fbUser, { displayName });

        // Create Firestore user doc
        const newUser: Omit<User, 'uid'> = {
          email,
          displayName,
          role,
          isVerified: false,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(phone ? { phone } : {}),
        };
        await setDoc(doc(db, 'users', fbUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await ensureFreeYearlySubscription({
          uid: fbUser.uid,
          displayName,
          email,
          phone,
          role,
        });

        await ensureSeekerProfile({
          uid: fbUser.uid,
          displayName,
          email,
          phone,
          role,
        });

        await sendEmailVerification(fbUser);
        await signOut(auth);
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);

        return fbUser.uid;
      } catch (err) {
        setLoading(false);
        handleError(err, 'Failed to create account. Please try again.');
        throw err;
      }
    },
    [ensureFreeYearlySubscription, ensureSeekerProfile, handleError],
  );

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      handleError(err, 'Failed to sign out.');
    }
  }, [handleError]);

  // ── Custom Token Login ─────────────────────────────────────────
  const loginWithCustomToken = useCallback(
    async (token: string) => {
      setError(null);
      setLoading(true);
      try {
        await ensureLocalSessionPersistence();
        await signInWithCustomToken(auth, token);
      } catch (err) {
        setLoading(false);
        handleError(err, 'Failed to login with custom token.');
      }
    },
    [handleError],
  );

  // ── Role helpers ──────────────────────────────────────────────
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isBusiness = isBusinessRole(user?.role);
  const isSeeker = user?.role === 'job_seeker';

  // ── Memoised context value ────────────────────────────────────
  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      loading,
      error,
      signInWithEmail,
      signInWithGoogle,
      createAccount,
      logout,
      loginWithCustomToken,
      clearError,
      isAdmin,
      isBusiness,
      isSeeker,
    }),
    [
      firebaseUser,
      user,
      loading,
      error,
      signInWithEmail,
      signInWithGoogle,
      createAccount,
      logout,
      loginWithCustomToken,
      clearError,
      isAdmin,
      isBusiness,
      isSeeker,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ───────────────────────────── Hook ─────────────────────────────

/**
 * Access the current authentication state, actions, and role helpers.
 * Must be used inside `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
