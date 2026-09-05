import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

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
/**
 * PERF-4 — keep what we have already fetched.
 *
 * This was `getFirestore(app)`, which gives Firestore's MEMORY-only cache: emptied on every
 * page load, so nothing was ever reused between visits or sessions and each one paid a fresh
 * round trip before it had anything to show. Measured on a cold /jobs load, on localhost,
 * against three jobs: DOM ready at 83ms, last Firestore response at 414ms.
 *
 * `persistentLocalCache` keeps those documents in IndexedDB, so a returning visitor renders
 * from disk while the SDK revalidates behind them — stale-while-revalidate, taken from the SDK
 * rather than hand-rolled, and applying to every read in the app rather than the ones somebody
 * remembered to wrap.
 *
 * Three things this has to get right, and each is the reason for a line below.
 *
 *  1. `initializeFirestore` must run BEFORE anything calls `getFirestore`, and exactly once.
 *     This module is the only place that constructs the instance, and `db` is what the rest of
 *     the app imports, so that ordering holds by construction rather than by convention.
 *
 *  2. There is no IndexedDB in Node, and the production build collects page data there. So the
 *     server path keeps the plain instance; asking for persistence during a build would fail
 *     the build.
 *
 *  3. Persistence can legitimately be refused — private browsing, blocked site data, an
 *     unsupported browser. That is a reason to lose the cache, never a reason to lose Firestore,
 *     so it falls back to exactly the behaviour this file had before.
 *
 * `persistentMultipleTabManager` lets several tabs share one cache instead of the first tab
 * claiming an exclusive lock and later ones silently failing to enable persistence at all.
 */
function createFirestore(): Firestore {
  if (typeof window === 'undefined') return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (err) {
    console.warn('[firebase] Persistent Firestore cache unavailable, using memory only:', err);
    return getFirestore(app);
  }
}

export const db: Firestore = createFirestore();
export const storage: FirebaseStorage = getStorage(app);
// SEC-3: the Realtime Database client was constructed here on every page load and exported
// through getFirebaseRtdb(), and nothing in src/ ever used either. Its SDK was shipping in
// the shared chunk that every page downloads. NEXT_PUBLIC_FIREBASE_DATABASE_URL is left in
// the environment on purpose: removing an env key is the owner's, and nothing here should
// break while it is still set.

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
