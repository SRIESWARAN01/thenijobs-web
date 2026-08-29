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

// ─── Lazy Singleton Accessors ──────────────────────────────────────────────────

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _rtdb: Database | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getFirebaseApp());
  }
  return _storage;
}

export function getFirebaseRtdb(): Database {
  if (!_rtdb) {
    _rtdb = getDatabase(getFirebaseApp());
  }
  return _rtdb;
}

// ─── Backward-compatible Proxy Exports ─────────────────────────────────────────
// Allows existing `import { auth, db, storage, rtdb } from '@/lib/firebase/config'`
// without executing heavy constructors until properties are accessed.

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = getFirebaseAuth() as any;
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const instance = getFirebaseDb() as any;
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_target, prop) {
    const instance = getFirebaseStorage() as any;
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const rtdb: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getFirebaseRtdb() as any;
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

/**
 * Firebase Analytics (lazy, client-only).
 * Returns null on the server or if analytics is unsupported.
 */
export const analytics = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getAnalytics(getFirebaseApp());
  }
  return null;
};

export const app: FirebaseApp = new Proxy({} as FirebaseApp, {
  get(_target, prop) {
    const instance = getFirebaseApp() as any;
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export default app;
