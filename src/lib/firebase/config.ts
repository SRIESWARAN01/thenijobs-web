import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase, type Database } from 'firebase/database';

/**
 * Firebase configuration using environment variables.
 * All NEXT_PUBLIC_FIREBASE_* vars must be set in .env.local.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
};

// ─── Real Firebase Singleton Instances ─────────────────────────────────────────

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const rtdb: Database = getDatabase(app);

// ─── Singleton Accessors ───────────────────────────────────────────────────────

export function getFirebaseApp(): FirebaseApp {
  return app;
}

export function getFirebaseAuth(): Auth {
  return auth;
}

export function getFirebaseDb(): Firestore {
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  return storage;
}

export function getFirebaseRtdb(): Database {
  return rtdb;
}

/**
 * Firebase Analytics (lazy, client-only).
 * Returns null on the server or if analytics is unsupported.
 */
export const analytics = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
