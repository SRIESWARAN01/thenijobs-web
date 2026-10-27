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
  signInWithPopup,
  signInWithPhoneNumber,
  signOut,
  GoogleAuthProvider,
  RecaptchaVerifier,
  updateProfile,
  linkWithCredential,
  type User as FirebaseUser,
  type ConfirmationResult,
  type AuthCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { User, UserRole } from '@/lib/types';

// ───────────────────────────── Types ─────────────────────────────

export interface GoogleSignInResult {
  /** True if the user profile document did not exist prior to this sign-in */
  isNewUser: boolean;
  /** The resulting user profile from Firestore, or null if pending role selection */
  user: User | null;
  /** True if brand-new Google user has not selected their role yet */
  needRoleSelection?: boolean;
}

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
  /** Google OAuth sign-in (popup) with optional pre-selected role */
  signInWithGoogle: (
    targetRole?: 'job_seeker' | 'business_owner'
  ) => Promise<GoogleSignInResult | void>;
  /** Link an existing email/password account with Google */
  linkGoogleAccount: (
    email: string,
    password: string,
    pendingCredential?: AuthCredential | null
  ) => Promise<void>;
  /** Assign user role for a freshly authenticated Google user */
  assignUserRole: (
    role: 'job_seeker' | 'business_owner'
  ) => Promise<User>;
  /** Send OTP to phone number – returns ConfirmationResult for verification */
  sendPhoneOTP: (
    phoneNumber: string,
    recaptchaContainerId: string,
  ) => Promise<ConfirmationResult>;
  /** Verify phone OTP and complete sign-in */
  verifyPhoneOTP: (
    confirmationResult: ConfirmationResult,
    otp: string,
  ) => Promise<void>;
  /** Create a new account (email + password) and seed Firestore user doc. Returns the new user's UID. */
  createAccount: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    phone?: string,
  ) => Promise<string>;
  /** Force refetch user profile from Firestore */
  refreshUserProfile: () => Promise<void>;
  /** Sign out of Firebase */
  logout: () => Promise<void>;
  /** Clear the current error */
  clearError: () => void;
}

export interface AuthHelpers {
  /** True if the current user has an admin or super_admin role */
  isAdmin: boolean;
  /** True if the current user has employer or business_owner role */
  isEmployer: boolean;
  /** True if the current user is an employee / staff */
  isEmployee: boolean;
  /** True if the current user is a job_seeker */
  isSeeker: boolean;
}

export type AuthContextValue = AuthState & AuthActions & AuthHelpers;

// ───────────────────────────── Context ─────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ───────────────────────────── Provider ─────────────────────────────

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
        const profile = { uid, ...snap.data() } as User;
        try { localStorage.setItem('tj_cached_user', JSON.stringify(profile)); } catch {}
        return profile;
      }
      return null;
    } catch (err) {
      console.error('[AuthContext] Failed to fetch user profile:', err);
      return null;
    }
  }, []);

  // ── Auth state listener ────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    // Fast-path: Check cached user on client mount
    try {
      const cached = localStorage.getItem('tj_cached_user');
      if (cached) {
        setUser(JSON.parse(cached));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }

    // AUTH-1: this used to defer subscribing via requestIdleCallback (up to a 2000ms
    // timeout, or a 50ms setTimeout fallback) "so critical render and LCP complete first" —
    // but every page that gates its content on `loading` (every /seeker, /employer, /admin
    // dashboard) shows a spinner regardless, so the defer bought no LCP benefit there, only a
    // real cost: Header.tsx renders its "Sign In" button whenever `!mounted || !user`, so an
    // already-logged-in visitor saw it instead of their own account on every page load, for
    // up to two seconds. Subscribing immediately is what Firebase's own guidance recommends;
    // the listener stays a cheap, stateless subscription and its callback stays async.
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;
        setFirebaseUser(fbUser);

        if (fbUser) {
          const profile = await fetchUserProfile(fbUser.uid);
          if (isMounted) setUser(profile);
        } else {
          if (isMounted) setUser(null);
          try { localStorage.removeItem('tj_cached_user'); } catch {}
        }

        if (isMounted) setLoading(false);
      });
    } catch (err) {
      console.warn('[AuthContext] Auth initialization failed:', err);
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [fetchUserProfile]);


  // ── Helpers ───────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown, fallback: string) => {
    const message =
      err instanceof Error ? err.message : fallback;
    setError(message);
    throw err;
  }, []);

  // ── Sign in with email + password ─────────────────────────────
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setLoading(false);
        handleError(err, 'Failed to sign in with email and password.');
      }
    },
    [handleError],
  );

  // ── Sign in with Google ───────────────────────────────────────
  const signInWithGoogle = useCallback(
    async (targetRole?: 'job_seeker' | 'business_owner'): Promise<GoogleSignInResult> => {
      setError(null);
      setLoading(true);
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;

        // Check if user doc exists
        const userDocRef = doc(db, 'users', fbUser.uid);
        const existingSnap = await getDoc(userDocRef);

        if (existingSnap.exists()) {
          // Existing user - update login metadata only, preserve all roles and moderation states
          const existingData = existingSnap.data() as User;
          const updates: Record<string, any> = {
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            authProvider: 'google.com',
          };
          if (!existingData.photoURL && fbUser.photoURL) {
            updates.photoURL = fbUser.photoURL;
          }
          if (!existingData.displayName && fbUser.displayName) {
            updates.displayName = fbUser.displayName;
          }

          await setDoc(userDocRef, updates, { merge: true });

          const fullProfile = {
            ...existingData,
            ...updates,
            uid: fbUser.uid,
          } as User;

          setUser(fullProfile);
          try {
            localStorage.setItem('tj_cached_user', JSON.stringify(fullProfile));
          } catch {}

          return { isNewUser: false, user: fullProfile, needRoleSelection: false };
        } else {
          // Brand new user
          // Determine target role: explicit argument > sessionStorage fallback > undefined
          let resolvedRole = targetRole;
          if (!resolvedRole && typeof window !== 'undefined') {
            const cachedRole = sessionStorage.getItem('tj_reg_role');
            if (cachedRole === 'job_seeker' || cachedRole === 'business_owner') {
              resolvedRole = cachedRole as 'job_seeker' | 'business_owner';
            }
          }

          if (!resolvedRole) {
            // Role selection needed
            return { isNewUser: true, user: null, needRoleSelection: true };
          }

          // Role is chosen: seed Firestore user profile with strict security safeguards
          const isBusiness = resolvedRole === 'business_owner';
          const newUserDoc: Record<string, any> = {
            uid: fbUser.uid,
            email: fbUser.email ?? '',
            displayName: fbUser.displayName ?? '',
            role: resolvedRole,
            isVerified: true,
            authProvider: 'google.com',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };

          if (fbUser.photoURL) newUserDoc.photoURL = fbUser.photoURL;
          if (fbUser.phoneNumber) newUserDoc.phone = fbUser.phoneNumber;

          if (isBusiness) {
            newUserDoc.approvalStatus = 'pending';
            newUserDoc.accountStatus = 'pending_approval';
            newUserDoc.paymentStatus = 'unpaid';
            newUserDoc.isEmployer = true;
            newUserDoc.canPostJobs = false;
          } else {
            newUserDoc.approvalStatus = 'approved';
            newUserDoc.accountStatus = 'active';
          }

          await setDoc(userDocRef, newUserDoc);

          const fullProfile = {
            ...newUserDoc,
            uid: fbUser.uid,
          } as User;

          setUser(fullProfile);
          try {
            localStorage.setItem('tj_cached_user', JSON.stringify(fullProfile));
          } catch {}

          return { isNewUser: true, user: fullProfile, needRoleSelection: false };
        }
      } catch (err: any) {
        setLoading(false);
        handleError(err, 'Failed to sign in with Google.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  // ── Assign role to newly registered user ──────────────────────
  const assignUserRole = useCallback(
    async (role: 'job_seeker' | 'business_owner'): Promise<User> => {
      const currentFbUser = auth.currentUser || firebaseUser;
      if (!currentFbUser) {
        throw new Error('No authenticated user session found to assign role.');
      }

      setError(null);
      setLoading(true);
      try {
        const res = await fetch('/api/auth/select-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentFbUser.uid,
            role,
            email: currentFbUser.email,
            displayName: currentFbUser.displayName,
            photoURL: currentFbUser.photoURL,
            phone: currentFbUser.phoneNumber,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to assign role.');
        }

        const freshProfile = await fetchUserProfile(currentFbUser.uid);
        if (freshProfile) {
          setUser(freshProfile);
          try {
            localStorage.setItem('tj_cached_user', JSON.stringify(freshProfile));
          } catch {}
          return freshProfile;
        }

        throw new Error('User profile could not be loaded after role assignment.');
      } catch (err: any) {
        setLoading(false);
        handleError(err, 'Failed to update user role.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser, fetchUserProfile, handleError],
  );

  // ── Link existing email/password account with Google ──────────
  const linkGoogleAccount = useCallback(
    async (email: string, password: string, pendingCredential?: AuthCredential | null) => {
      setError(null);
      setLoading(true);
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        if (pendingCredential) {
          await linkWithCredential(userCred.user, pendingCredential);
        }
        await setDoc(
          doc(db, 'users', userCred.user.uid),
          {
            authProvider: 'google.com',
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        );
        const freshProfile = await fetchUserProfile(userCred.user.uid);
        if (freshProfile) {
          setUser(freshProfile);
          try {
            localStorage.setItem('tj_cached_user', JSON.stringify(freshProfile));
          } catch {}
        }
      } catch (err: any) {
        setLoading(false);
        handleError(err, 'Failed to link Google account.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchUserProfile, handleError],
  );



  // ── Phone auth – send OTP ────────────────────────────────────
  const sendPhoneOTP = useCallback(
    async (phoneNumber: string, recaptchaContainerId: string) => {
      setError(null);
      try {
        const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: 'invisible',
        });
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        return confirmation;
      } catch (err) {
        handleError(err, 'Failed to send OTP. Please try again.');
        // handleError always throws so TS knows this is unreachable,
        // but we add a throw for type narrowing safety.
        throw err;
      }
    },
    [handleError],
  );

  // ── Phone auth – verify OTP ──────────────────────────────────
  const verifyPhoneOTP = useCallback(
    async (confirmationResult: ConfirmationResult, otp: string) => {
      setError(null);
      setLoading(true);
      try {
        const result = await confirmationResult.confirm(otp);
        const fbUser = result.user;

        // Seed Firestore doc if first-time phone sign-in
        const existing = await getDoc(doc(db, 'users', fbUser.uid));
        if (!existing.exists()) {
          const newUserDoc: Record<string, any> = {
            email: '',
            displayName: fbUser.phoneNumber ?? '',
            role: 'job_seeker',
            isVerified: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (fbUser.phoneNumber) newUserDoc.phone = fbUser.phoneNumber;

          await setDoc(doc(db, 'users', fbUser.uid), newUserDoc);
        }
      } catch (err) {
        setLoading(false);
        handleError(err, 'Invalid OTP. Please try again.');
      }
    },
    [handleError],
  );

  // ── Create account (email + password) ─────────────────────────
  const createAccount = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole,
      phone?: string,
    ): Promise<string> => {
      setError(null);
      setLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;

        // Update Firebase Auth display name
        await updateProfile(fbUser, { displayName });

        // Create Firestore user doc — only include phone if provided
        const newUserDoc: Record<string, any> = {
          email,
          displayName,
          role,
          isVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (phone) newUserDoc.phone = phone;

        await setDoc(doc(db, 'users', fbUser.uid), newUserDoc);
        return fbUser.uid;
      } catch (err) {
        setLoading(false);
        handleError(err, 'Failed to create account. Please try again.');
        throw err;
      }
    },
    [handleError],
  );

  // ── Refresh user profile from Firestore ───────────────────────
  const refreshUserProfile = useCallback(async () => {
    if (firebaseUser) {
      const profile = await fetchUserProfile(firebaseUser.uid);
      setUser(profile);
    }
  }, [firebaseUser, fetchUserProfile]);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      try { localStorage.removeItem('tj_cached_user'); } catch {}
    } catch (err) {
      handleError(err, 'Failed to sign out.');
    }
  }, [handleError]);


  // ── Role helpers ──────────────────────────────────────────────
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isEmployer = user?.role === 'employer' || user?.role === 'business_owner' || user?.role === 'supplier' || user?.role === 'service_provider';
  const isEmployee = user?.role === 'employee';
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
      assignUserRole,
      linkGoogleAccount,
      sendPhoneOTP,
      verifyPhoneOTP,
      createAccount,
      logout,
      clearError,
      refreshUserProfile,
      isAdmin,
      isEmployer,
      isEmployee,
      isSeeker,
    }),
    [
      firebaseUser,
      user,
      loading,
      error,
      signInWithEmail,
      signInWithGoogle,
      assignUserRole,
      linkGoogleAccount,
      sendPhoneOTP,
      verifyPhoneOTP,
      createAccount,
      logout,
      clearError,
      refreshUserProfile,
      isAdmin,
      isEmployer,
      isEmployee,
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
