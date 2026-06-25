'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

// ─────────────────────────────────── Types ───────────────────────────────────

export interface ShopUserProfile {
  fullName: string;
  email: string;
  phone: string;
  role: 'customer' | string;
}

interface UseShopAuthReturn {
  /** Firebase Auth user, or null when signed-out / loading */
  shopUser: User | null;
  /** Firestore user profile document, or null when not loaded */
  shopUserProfile: ShopUserProfile | null;
  /** True while the initial auth-state check or Firestore fetch is in progress */
  loading: boolean;
  /** Sign in with email and password */
  login: (email: string, password: string) => Promise<void>;
  /**
   * Register a new customer account.
   * Creates a Firebase Auth user, updates the display name, and writes a
   * Firestore document to the `users` collection with role: 'customer'.
   */
  register: (
    fullName: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<void>;
  /** Sign out the current user */
  logout: () => Promise<void>;
  /** Convenience flag — true when any Firebase Auth user is signed in */
  isCustomer: boolean;
}

// ─────────────────────────────────── Hook ────────────────────────────────────

/**
 * `useShopAuth` — a self-contained Firebase auth hook for the shop module.
 *
 * Keeps its own state so shop pages stay decoupled from the main site
 * `AuthContext`. It listens to `onAuthStateChanged` and hydrates a lightweight
 * `shopUserProfile` from Firestore on every session start.
 */
export function useShopAuth(): UseShopAuthReturn {
  const [shopUser, setShopUser] = useState<User | null>(null);
  const [shopUserProfile, setShopUserProfile] = useState<ShopUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch Firestore profile ─────────────────────────────────────────────
  const fetchProfile = useCallback(async (uid: string): Promise<ShopUserProfile | null> => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        fullName: data.displayName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        role: data.role ?? 'customer',
      };
    } catch (err) {
      console.error('[useShopAuth] Failed to fetch user profile:', err);
      return null;
    }
  }, []);

  // ── Auth state listener ─────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setShopUser(fbUser);
        const profile = await fetchProfile(fbUser.uid);
        setShopUserProfile(profile);
      } else {
        setShopUser(null);
        setShopUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  // ── login ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will update state automatically
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  // ── register ────────────────────────────────────────────────────────────
  const register = useCallback(
    async (
      fullName: string,
      email: string,
      phone: string,
      password: string,
    ): Promise<void> => {
      setLoading(true);
      try {
        // 1. Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;

        // 2. Set display name on the Auth profile
        await updateProfile(fbUser, { displayName: fullName });

        // 3. Write Firestore document
        await setDoc(doc(db, 'users', fbUser.uid), {
          uid: fbUser.uid,
          email,
          displayName: fullName,
          phone,
          role: 'customer',
          createdAt: serverTimestamp(),
          isVerified: false,
        });

        // onAuthStateChanged will pick up the new user and fetch the profile
      } catch (err) {
        setLoading(false);
        throw err;
      }
    },
    [],
  );

  // ── logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth);
      // onAuthStateChanged will clear state
    } catch (err) {
      throw err;
    }
  }, []);

  // ── isCustomer ──────────────────────────────────────────────────────────
  const isCustomer = shopUser !== null;

  return {
    shopUser,
    shopUserProfile,
    loading,
    login,
    register,
    logout,
    isCustomer,
  };
}
