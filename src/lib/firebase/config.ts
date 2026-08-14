import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';

/**
 * Firebase configuration with environment variable support.
 * Falls back to hardcoded values for development convenience.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAAXHgdvKXi4pFPNGciMbZE8lPITN9Hsug",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "thenijobs-9f01d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "thenijobs-9f01d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "thenijobs-9f01d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1057136000588",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1057136000588:web:12506f87f1f502596a7ee9",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-T21WC74YFY",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://thenijobs-9f01d-default-rtdb.asia-southeast1.firebasedatabase.app" };

/** Firebase app instance (singleton) */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/** Firebase Authentication */
export const auth = getAuth(app);

/** Cloud Firestore */
export const db = getFirestore(app);

/** Cloud Storage */
export const storage = getStorage(app);

/** Realtime Database */
export const rtdb = getDatabase(app);

/**
 * Firebase Analytics (lazy, client-only).
 * Returns null on the server or if analytics is unsupported.
 */
export const analytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
